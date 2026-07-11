import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase-server";
import { verifyPayment } from "@/lib/verify-payment";
import { verifyPaymentSchema } from "@/lib/schemas";
import { TOKENS, type TokenSymbol, getServiceBySlug } from "@/lib/services";
import { sendOrderConfirmationEmail, sendAdminNotificationEmail } from "@/lib/email";

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

  // Already paid?
  if (["paid", "in_progress", "awaiting_client", "ready_for_review", "delivered", "completed"].includes(order.status)) {
    return NextResponse.json({ ok: true, alreadyVerified: true, message: "This order has already been paid.", publicOrderId, txHash });
  }

  if (["expired", "cancelled"].includes(order.status)) {
    return NextResponse.json({ error: `Order is ${order.status}.` }, { status: 400 });
  }

  if (!["awaiting_payment", "payment_submitted", "pending"].includes(order.status)) {
    return NextResponse.json({ error: `Order is not eligible for payment from status ${order.status}.` }, { status: 400 });
  }

  if (order.payment_expires_at && new Date(order.payment_expires_at).getTime() < Date.now()) {
    await sb.from("orders").update({ status: "expired", updated_at: new Date().toISOString() }).eq("id", order.id);
    await sb.from("questpay_order_events").insert({ order_id: order.id, event_type: "order_expired", from_status: order.status, to_status: "expired", metadata: { payment_expires_at: order.payment_expires_at } });
    return NextResponse.json({ ok: false, reason: "Payment window expired. Create a new quote before paying." }, { status: 400 });
  }

  // ── Derive expected context from the order (NOT from the client) ──
  const tokenSymbol = order.token_symbol as TokenSymbol;
  const token = TOKENS[tokenSymbol];
  if (!token) {
    return NextResponse.json({ error: "Order token misconfigured." }, { status: 500 });
  }

  // ── Check if tx hash is already used by another order ──
  const { data: existingPayment } = await sb
    .from("payments")
    .select("id, order_id")
    .eq("chain_id", 137)
    .ilike("tx_hash", txHash)
    .maybeSingle();

  if (existingPayment && existingPayment.order_id !== order.id) {
    return NextResponse.json({
      ok: false,
      reason: "This transaction hash is already associated with a different order.",
    }, { status: 409 });
  }

  // ── Verify on-chain ──
  const result = await verifyPayment(txHash, {
    receiveAddress: order.receive_address,
    token: { ...token, address: order.token_address ? order.token_address as `0x${string}` : token.address },
    amountHuman: order.amount_human,
  });

  if (!result.ok) {
    return NextResponse.json(result, { status: 200 });
  }

  // ── Atomically persist payment + update order + insert event ──
  // Preferred path: database RPC wraps insert/update/event in one transaction.
  const paymentPayload = {
    p_order_id: order.id,
    p_chain_id: 137,
    p_tx_hash: txHash,
    p_from_address: result.from || "",
    p_to_address: result.to || "",
    p_token_symbol: tokenSymbol,
    p_token_address: order.token_address || null,
    p_amount_raw: result.amountRaw || "",
    p_amount_human: result.amountHuman || "",
    p_block_number: result.blockNumber ? Number(result.blockNumber) : 0,
    p_block_timestamp: result.blockTimestamp ? new Date(result.blockTimestamp * 1000).toISOString() : new Date().toISOString(),
    p_confirmations: result.confirmations || 0,
    p_raw_receipt: result,
  };
  const { error: rpcErr } = await sb.rpc("record_verified_payment", paymentPayload);
  if (rpcErr) {
    // Compatibility fallback for environments not migrated yet. Still keeps tx uniqueness guard above.
    const { error: payInsertErr } = await sb.from("payments").insert({
      order_id: order.id,
      chain_id: 137,
      tx_hash: txHash.toLowerCase(),
      from_address: result.from,
      to_address: result.to,
      token_symbol: tokenSymbol,
      token_address: order.token_address || null,
      amount_raw: result.amountRaw || "",
      amount_human: result.amountHuman || "",
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
    await sb.from("questpay_order_events").insert({ order_id: order.id, event_type: "payment_verified", from_status: order.status, to_status: "paid", metadata: { tx_hash: txHash.toLowerCase(), token: tokenSymbol, amount: result.amountHuman, rpc_fallback: true } });
  }

  // ── Send emails (after persistence, non-blocking but awaited) ──
  const service = getServiceBySlug(order.slug);
  if (service) {
    const emailOrder = {
      publicOrderId,
      service,
      tokenSymbol,
      amountHuman: result.amountHuman || order.amount_human,
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
    amountHuman: result.amountHuman,
    blockNumber: result.blockNumber ? Number(result.blockNumber) : undefined,
    blockTimestamp: result.blockTimestamp,
    confirmations: result.confirmations,
    explorer: result.explorer,
  });
}
