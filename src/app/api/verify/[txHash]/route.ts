import { NextRequest, NextResponse } from "next/server";
import { queryOneOptional, hasDatabase } from "@/lib/db";
import { verifyPayment } from "@/lib/verify-payment";
import { chainKeyFromId, getEnabledTokensForChain, explorerTxUrl, type ChainKey } from "@/lib/services";
import { receiveAddressValid, QUESTPAY_RECEIVE_ADDRESS } from "@/lib/server-config";

export const dynamic = "force-dynamic";
export const maxDuration = 20;

type PaymentJoinRow = {
  tx_hash: string;
  from_address: string | null;
  to_address: string | null;
  token_symbol: string | null;
  amount_human: string | null;
  chain_id: number | null;
  block_number: string | number | null;
  block_timestamp: string | null;
  confirmations: number | null;
  verified_at: string | null;
  public_order_id: string | null;
  slug: string | null;
  order_status: string | null;
};

/**
 * Stateless public verification endpoint.
 *
 * If the tx is associated with a DB order, derives expected
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

  // Try to find a payment matching this tx hash
  if (hasDatabase) {
    const payment = await queryOneOptional<PaymentJoinRow>(
      `SELECT p.tx_hash, p.from_address, p.to_address, p.token_symbol, p.amount_human,
              p.chain_id, p.block_number, p.block_timestamp, p.confirmations, p.verified_at,
              o.public_order_id, o.slug, o.status AS order_status
       FROM payments p
       LEFT JOIN orders o ON o.id = p.order_id
       WHERE lower(p.tx_hash) = lower($1)
       LIMIT 1`,
      [txHash],
    );

    if (payment) {
      return NextResponse.json({
        ok: true,
        txHash: payment.tx_hash,
        from: payment.from_address,
        to: payment.to_address,
        token: payment.token_symbol,
        amountHuman: payment.amount_human,
        blockNumber: payment.block_number != null ? Number(payment.block_number) : undefined,
        blockTimestamp: payment.block_timestamp
          ? Math.floor(new Date(payment.block_timestamp).getTime() / 1000)
          : undefined,
        confirmations: payment.confirmations,
        verifiedAt: payment.verified_at,
        explorer: explorerTxUrl(chainKeyFromId(payment.chain_id ?? 137), txHash),
        order: payment.public_order_id
          ? {
              public_order_id: payment.public_order_id,
              slug: payment.slug,
              status: payment.order_status,
            }
          : null,
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

  for (const chainKey of ["polygon", "bnb"] as ChainKey[]) {
    for (const token of getEnabledTokensForChain(chainKey)) {
      try {
        const result = await verifyPayment(txHash, {
          chainKey,
          receiveAddress: QUESTPAY_RECEIVE_ADDRESS,
          token,
          amountHuman: "0",
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
  }

  return NextResponse.json({
    ok: false,
    reason: "Transaction not found or does not match any QuestPay payment.",
  }, { status: 404 });
}
