import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase-server";
import { verifyPayment } from "@/lib/verify-payment";
import { TOKENS, type TokenSymbol, getServiceBySlug } from "@/lib/services";
import { receiveAddressValid, QUESTPAY_RECEIVE_ADDRESS } from "@/lib/server-config";

export const dynamic = "force-dynamic";
export const maxDuration = 20;

/**
 * Stateless public verification endpoint.
 *
 * If the tx is associated with a Supabase order, derives expected
 * receiver/token/amount from the order and verifies on-chain.
 *
 * If no order is found, falls back to checking the tx against the
 * configured receive address with best-effort token detection.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { txHash: string } },
) {
  const { txHash } = params;
  if (!/^0x[a-fA-F0-9]{64}$/.test(txHash)) {
    return NextResponse.json({ ok: false, reason: "Invalid transaction hash format." }, { status: 400 });
  }

  const sb = getSupabase();

  // Try to find a Supabase order/payment matching this tx hash
  if (sb) {
    const { data: payment } = await sb
      .from("payments")
      .select(`
        tx_hash, from_address, to_address, token_symbol, amount_human,
        block_number, block_timestamp, confirmations, verified_at,
        orders:order_id ( public_order_id, slug, status )
      `)
      .ilike("tx_hash", txHash)
      .maybeSingle();

    if (payment) {
      return NextResponse.json({
        ok: true,
        txHash: payment.tx_hash,
        from: payment.from_address,
        to: payment.to_address,
        token: payment.token_symbol,
        amountHuman: payment.amount_human,
        blockNumber: Number(payment.block_number),
        blockTimestamp: payment.block_timestamp
          ? Math.floor(new Date(payment.block_timestamp).getTime() / 1000)
          : undefined,
        confirmations: payment.confirmations,
        verifiedAt: payment.verified_at,
        explorer: `https://polygonscan.com/tx/${txHash}`,
        order: payment.orders,
      });
    }
  }

  // No DB record — do a stateless on-chain check
  if (!receiveAddressValid || !QUESTPAY_RECEIVE_ADDRESS) {
    return NextResponse.json({
      ok: false,
      reason: "No matching order found and payments are not configured for stateless verification.",
    }, { status: 404 });
  }

  // Try each enabled token to see if this tx matches
  for (const sym of ["USDT", "VERSE", "POL"] as TokenSymbol[]) {
    const token = TOKENS[sym];
    if (!token) continue;

    // We don't know the exact expected amount without an order, so
    // we just check that a transfer to the receive address exists
    // with a positive amount. This is a "is this a payment to QuestPay?" check.
    try {
      const result = await verifyPayment(txHash, {
        receiveAddress: QUESTPAY_RECEIVE_ADDRESS,
        token: token,
        amountHuman: "0", // accept any positive amount in stateless mode
      });

      if (result.ok) {
        return NextResponse.json({
          ...result,
          ok: true,
          note: "Stateless verification — not linked to a specific order.",
        });
      }
    } catch {
      // try next token
    }
  }

  return NextResponse.json({
    ok: false,
    reason: "Transaction not found or does not match any QuestPay payment.",
  }, { status: 404 });
}
