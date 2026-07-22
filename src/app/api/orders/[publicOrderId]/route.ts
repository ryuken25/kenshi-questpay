import { NextRequest, NextResponse } from "next/server";
import { queryOneOptional, hasDatabase, query } from "@/lib/db";
import { getServiceBySlug } from "@/lib/services";
import {
  ACTIVE_PAYMENT_STATUSES,
  type ActivePaymentStatus,
} from "@/lib/payments/amount-suffix";

// Node-only deps (pg / nodemailer / viem RPC) — pin to the Node.js runtime, never Edge.
export const runtime = "nodejs";

export const dynamic = "force-dynamic";

type OrderRow = {
  id: string;
  public_order_id: string;
  slug: string;
  status: string;
  receive_address: string | null;
  chain_id: number | null;
  token_symbol: string | null;
  token_address: string | null;
  token_decimals: number | null;
  amount_human: string | null;
  amount_raw: string | null;
  amount_suffix: number | null;
  unique_amount_suffix: string | null;
  usd_price: number | null;
  created_at: string;
  paid_at: string | null;
  payment_expires_at: string | null;
};

type PaymentRow = {
  tx_hash: string | null;
  from_address: string | null;
  to_address: string | null;
  token_symbol: string | null;
  amount_human: string | null;
  block_number: string | number | null;
  block_timestamp: string | null;
  confirmations: number | null;
  verified_at: string | null;
};

/** On-access expiry: open payment window elapsed → cancelled (idempotent). */
async function cancelOrderIfPaymentExpiredSql(
  order: { id: string; status: string; payment_expires_at?: string | null },
  now = new Date(),
): Promise<{ expired: boolean; status: string; previousStatus?: string }> {
  if (!ACTIVE_PAYMENT_STATUSES.includes(order.status as ActivePaymentStatus)) {
    return { expired: false, status: order.status };
  }
  if (!order.payment_expires_at) {
    return { expired: false, status: order.status };
  }
  if (new Date(order.payment_expires_at).getTime() >= now.getTime()) {
    return { expired: false, status: order.status };
  }

  const previousStatus = order.status;
  const cancelledAt = now.toISOString();
  const updated = await query(
    `UPDATE orders
     SET status = 'cancelled', updated_at = $2
     WHERE id = $1
       AND status = ANY($3::text[])
     RETURNING id`,
    [order.id, cancelledAt, [...ACTIVE_PAYMENT_STATUSES]],
  );

  if ((updated.rowCount ?? 0) > 0) {
    await query(
      `INSERT INTO questpay_order_events
         (order_id, event_type, from_status, to_status, metadata)
       VALUES ($1, $2, $3, $4, $5::jsonb)`,
      [
        order.id,
        "order_cancelled_payment_expired",
        previousStatus,
        "cancelled",
        JSON.stringify({
          payment_expires_at: order.payment_expires_at,
          reason: "payment_window_elapsed",
          cancelled_at: cancelledAt,
        }),
      ],
    );
  }

  return { expired: true, status: "cancelled", previousStatus };
}

export async function GET(_req: NextRequest, props: { params: Promise<{ publicOrderId: string }> }) {
  const params = await props.params;
  if (!hasDatabase) {
    return NextResponse.json({ error: "Order system is not configured." }, { status: 503 });
  }

  const { publicOrderId } = params;
  if (!publicOrderId || !publicOrderId.startsWith("qp-")) {
    return NextResponse.json({ error: "Invalid order ID." }, { status: 400 });
  }

  const order = await queryOneOptional<OrderRow>(
    `SELECT id, public_order_id, slug, status, receive_address, chain_id,
            token_symbol, token_address, token_decimals, amount_human, amount_raw,
            amount_suffix, unique_amount_suffix, usd_price, created_at, paid_at,
            payment_expires_at
     FROM orders
     WHERE public_order_id = $1
     LIMIT 1`,
    [publicOrderId],
  );

  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  const expiry = await cancelOrderIfPaymentExpiredSql({
    id: order.id,
    status: order.status,
    payment_expires_at: order.payment_expires_at,
  });
  const status = expiry.expired ? expiry.status : order.status;

  const payment = await queryOneOptional<PaymentRow>(
    `SELECT tx_hash, from_address, to_address, token_symbol, amount_human,
            block_number, block_timestamp, confirmations, verified_at
     FROM payments
     WHERE order_id = $1
     LIMIT 1`,
    [order.id],
  );

  const service = getServiceBySlug(order.slug);

  return NextResponse.json({
    publicOrderId: order.public_order_id,
    slug: order.slug,
    serviceName: service?.name || order.slug,
    serviceUsd: order.usd_price,
    serviceDescription: service?.description,
    status,
    receiveAddress: order.receive_address,
    chainId: order.chain_id,
    tokenSymbol: order.token_symbol,
    tokenAddress: order.token_address,
    tokenDecimals: order.token_decimals,
    amountHuman: order.amount_human,
    amountRaw: order.amount_raw,
    amountSuffix: order.amount_suffix ?? null,
    uniqueAmountSuffix: order.unique_amount_suffix || null,
    paymentExpiresAt: order.payment_expires_at || null,
    createdAt: order.created_at,
    paidAt: order.paid_at,
    payment: payment || null,
  });
}
