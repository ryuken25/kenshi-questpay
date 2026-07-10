import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase-server";
import { getServiceBySlug } from "@/lib/services";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
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

  const { data: order, error } = await sb
    .from("orders")
    .select(
      "id, public_order_id, slug, status, receive_address, chain_id, token_symbol, token_address, token_decimals, amount_human, amount_raw, usd_price, created_at, paid_at",
    )
    .eq("public_order_id", publicOrderId)
    .single();

  if (error || !order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  // Also fetch payment if exists
  const { data: payment } = await sb
    .from("payments")
    .select("tx_hash, from_address, to_address, token_symbol, amount_human, block_number, block_timestamp, confirmations, verified_at")
    .eq("order_id", order.id)
    .single();

  const service = getServiceBySlug(order.slug);

  // Sanitize — return public-facing fields only
  return NextResponse.json({
    publicOrderId: order.public_order_id,
    slug: order.slug,
    serviceName: service?.name || order.slug,
    serviceUsd: order.usd_price,
    serviceDescription: service?.description,
    status: order.status,
    receiveAddress: order.receive_address,
    chainId: order.chain_id,
    tokenSymbol: order.token_symbol,
    tokenAddress: order.token_address,
    tokenDecimals: order.token_decimals,
    amountHuman: order.amount_human,
    amountRaw: order.amount_raw,
    createdAt: order.created_at,
    paidAt: order.paid_at,
    payment: payment || null,
  });
}
