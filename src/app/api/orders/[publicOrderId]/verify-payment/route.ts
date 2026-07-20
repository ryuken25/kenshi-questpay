import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase-server";
import { verifyPayment } from "@/lib/verify-payment";
import { verifyPaymentSchema } from "@/lib/schemas";
import { getTokenConfig, chainKeyFromId, type TokenSymbol, getServiceBySlug } from "@/lib/services";
import { sendOrderConfirmationEmail, sendAdminNotificationEmail } from "@/lib/email";
import { cancelOrderIfPaymentExpired } from "@/lib/payments/order-expiry";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(
  req: NextRequest,
  { params }: { params: { publicOrderId: string } },
) {
  const sb = getSupabase();
  if (!sb) {
    return NextResponse.json({ error: "Order system is not configured." }, { status: 503 });
  }

  const { publicOrderId } = params;
  if (!publicOrderId || !publicOrderId.startsWith("qp-")) {
    return NextResponse.json({ error: "Invalid order ID." }, { status: 400 });
  }

  // ── Parse body ──
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = verifyPaymentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid tx hash.", details: parsed.error.issues }, { status: 400 });
  }

  const { txHash } = parsed.data;

  // ── Fetch the order from Supabase (source of truth) ──
  const { data: order, error: orderErr } = await sb
    .from("orders")
    .select("*")
    .eq("public_order_id", publicOrderId)
    .single();

  if (orderErr || !order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  // Already paid / past payment stage?
  if (["paid", "work_submitted", "in_progress", "awaiting_client", "ready_for_review", "reviewing", "accepted", "delivered", "released", "completed"].includes(order.status)) {
    return NextResponse.json({ ok: true, alreadyVerified: true, message: "This order has already been paid.", publicOrderId, txHash });
  }

  if (["expired", "cancelled", "refunded", "disputed"].includes(order.status)) {
    return NextResponse.json({ error: `Order is ${order.status}.` }, { status: 400 });
  }

  // Auto-cancel if payment window elapsed (on-access / on-verify enforcement).
  const expiry = await cancelOrderIfPaymentExpired(sb, {
    id: order.id,
    status: order.status,
    payment_expires_at: order.payment_expires_at,
  });
  if (expiry.expired) {
    return NextResponse.json({
      ok: false,
      reason: "Payment window expired. This order is cancelled. Create a new order before paying.",
      status: "cancelled",
      paymentExpiresAt: order.payment_expires_at,
    }, { status: 400 });
  }

  if (!["awaiting_payment", "payment_submitted", "pending"].includes(order.status)) {
    return NextResponse.json({ error: `Order is not eligible for payment from status ${order.status}.` }, { status: 400 });
  }

  // ── Derive expected context from the order (NOT from the client) ──
  const chainKey = chainKeyFromId(order.chain_id);
  const tokenSymbol = order.token_symbol as TokenSymbol;
  const token = getTokenConfig(chainKey, tokenSymbol);
  if (!token) {
    return NextResponse.json({ error: "Order token misconfigured." }, { status: 500 });
  }

  if (!order.amount_raw || !order.amount_human) {
    return NextResponse.json({ error: "Order amount is incomplete." }, { status: 500 });
  }

  // ── Check if tx hash is already used by another order (scoped to this chain) ──
  const { data: existingPayment } = await sb
    .from("payments")
    .select("id, order_id")
    .eq("chain_id", order.chain_id)
    .ilike("tx_hash", txHash)
    .maybeSingle();

  if (existingPayment && existingPayment.order_id !== order.id) {
    return NextResponse.json({
      ok: false,
      reason: "This transaction hash is already associated with a different order.",
    }, { status: 409 });
  }

  // ── Verify on-chain (exact amount_raw + token + chain + receiver from order) ──
  const result = await verifyPayment(txHash, {
    chainKey,
    receiveAddress: order.receive_address,
    token: { ...token, address: order.token_address ? order.token_address as `0x${string}` : token.address },
    amountHuman: String(order.amount_human),
    amountRaw: String(order.amount_raw),
  });

  if (!result.ok) {
    return NextResponse.json(result, { status: 200 });
  }

  // Defense-in-depth: exact amount_raw must match order before persistence.
  if (String(result.amountRaw || "") !== String(order.amount_raw)) {
    return NextResponse.json({
      ok: false,
      reason: "Verified amount does not exactly match the order amount.",
    }, { status: 400 });
  }
  if (result.token && result.token !== tokenSymbol) {
    return NextResponse.json({
      ok: false,
      reason: "Verified token does not match the order token.",
    }, { status: 400 });
  }

  // ── Atomically persist payment + update order + insert event ──
  // Preferred path: database RPC wraps insert/update/event in one transaction
  // and re-checks exact amount/token/chain/window/status server-side.
  const paymentPayload = {
    p_order_id: order.id,
    p_chain_id: order.chain_id,
    p_tx_hash: txHash,
    p_from_address: result.from || "",
    p_to_address: result.to || "",
    p_token_symbol: tokenSymbol,
    p_token_address: order.token_address || null,
    // Persist the order's exact expected amount (server-authoritative).
    p_amount_raw: order.amount_raw,
    p_amount_human: order.amount_human,
    p_block_number: result.blockNumber ? Number(result.blockNumber) : 0,
    p_block_timestamp: result.blockTimestamp ? new Date(result.blockTimestamp * 1000).toISOString() : new Date().toISOString(),
    p_confirmations: result.confirmations || 0,
    p_raw_receipt: result,
  };
  const { error: rpcErr } = await sb.rpc("record_verified_payment", paymentPayload);
  if (rpcErr) {
    const msg = rpcErr.message || "";
    if (/payment_window_expired/i.test(msg)) {
      return NextResponse.json({
        ok: false,
        reason: "Payment window expired. This order is cancelled. Create a new order before paying.",
        status: "cancelled",
      }, { status: 400 });
    }
    if (/amount_mismatch|token_mismatch|chain_mismatch|receiver_mismatch/i.test(msg)) {
      return NextResponse.json({
        ok: false,
        reason: "Payment does not exactly match order amount, token, chain, or receiver.",
      }, { status: 400 });
    }
    if (/invalid_order_status/i.test(msg)) {
      return NextResponse.json({
        ok: false,
        reason: "Order is not eligible for payment.",
      }, { status: 400 });
    }

    // Compatibility fallback for environments not migrated yet. Still keeps tx uniqueness guard above.
    const { error: payInsertErr } = await sb.from("payments").insert({
      order_id: order.id,
      chain_id: order.chain_id,
      tx_hash: txHash.toLowerCase(),
      from_address: result.from,
      to_address: result.to,
      token_symbol: tokenSymbol,
      token_address: order.token_address || null,
      amount_raw: String(order.amount_raw),
      amount_human: String(order.amount_human),
      block_number: result.blockNumber ? Number(result.blockNumber) : 0,
      block_timestamp: result.blockTimestamp ? new Date(result.blockTimestamp * 1000).toISOString() : new Date().toISOString(),
      confirmations: result.confirmations || 0,
      raw_receipt: result,
    });
    if (payInsertErr) {
      if (payInsertErr.code === "23505") return NextResponse.json({ ok: false, reason: "This transaction hash is already associated with a payment." }, { status: 409 });
      return NextResponse.json({ ok: false, reason: "Failed to record payment: " + payInsertErr.message }, { status: 500 });
    }
    await sb.from("orders").update({ status: "paid", paid_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", order.id);
    await sb.from("questpay_order_events").insert({
      order_id: order.id,
      event_type: "payment_verified",
      from_status: order.status,
      to_status: "paid",
      metadata: {
        tx_hash: txHash.toLowerCase(),
        token: tokenSymbol,
        amount: order.amount_human,
        amount_raw: order.amount_raw,
        unique_amount_suffix: order.unique_amount_suffix || null,
        amount_suffix: order.amount_suffix ?? null,
        exact_match: true,
        rpc_fallback: true,
      },
    });
  }

  // ── Send emails (after persistence, non-blocking but awaited) ──
  const service = getServiceBySlug(order.slug);
  if (service) {
    const emailOrder = {
      publicOrderId,
      service,
      tokenSymbol,
      amountHuman: String(order.amount_human),
      receiveAddress: order.receive_address,
      txHash,
      fromAddress: result.from || "",
      customerName: order.customer_name || undefined,
      contactMethod: order.contact_method || undefined,
      contactValue: order.contact_value || undefined,
      brief: order.brief || undefined,
    };
    // Fire and forget — don't block the response on email
    Promise.allSettled([
      sendOrderConfirmationEmail(emailOrder),
      sendAdminNotificationEmail(emailOrder),
    ]).catch(() => {});
  }

  // ── Return sanitized receipt ──
  return NextResponse.json({
    ok: true,
    publicOrderId,
    txHash,
    from: result.from,
    to: result.to,
    token: result.token,
    amountHuman: order.amount_human,
    amountRaw: order.amount_raw,
    uniqueAmountSuffix: order.unique_amount_suffix || null,
    amountSuffix: order.amount_suffix ?? null,
    blockNumber: result.blockNumber ? Number(result.blockNumber) : undefined,
    blockTimestamp: result.blockTimestamp,
    confirmations: result.confirmations,
    explorer: result.explorer,
  });
}
