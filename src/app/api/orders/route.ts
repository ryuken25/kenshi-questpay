import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase-server";
import {
  QUESTPAY_RECEIVE_ADDRESS,
  receiveAddressValid,
  isValidAddress,
} from "@/lib/server-config";
import { getServiceBySlug, TOKENS, tokenAmountForService, type TokenSymbol } from "@/lib/services";
import { createOrderSchema } from "@/lib/schemas";
import { sendOrderCreatedEmails } from "@/lib/email";
import { parseUnits } from "viem";

export const dynamic = "force-dynamic";

function generatePublicOrderId(): string {
  // qp-<timestamp36>-<random6>
  const ts = Date.now().toString(36);
  const rnd = Math.random().toString(36).slice(2, 8);
  return `qp-${ts}-${rnd}`;
}

export async function POST(req: NextRequest) {
  // ── Guard: receive address must be configured server-side ──
  if (!receiveAddressValid || !QUESTPAY_RECEIVE_ADDRESS) {
    return NextResponse.json(
      { error: "Payments are temporarily unavailable. Please try again later." },
      { status: 503 },
    );
  }

  // ── Guard: Supabase must be configured ──
  const sb = getSupabase();
  if (!sb) {
    return NextResponse.json(
      { error: "Order system is not configured." },
      { status: 503 },
    );
  }

  // ── Parse and validate body ──
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = createOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.issues },
      { status: 400 },
    );
  }

  const { slug, tokenSymbol, brief } = parsed.data;
  const service = getServiceBySlug(slug);
  if (!service) {
    return NextResponse.json({ error: "Unknown service slug." }, { status: 400 });
  }

  const token = TOKENS[tokenSymbol as TokenSymbol];
  if (!token || !token.enabled) {
    return NextResponse.json({ error: "Token not available." }, { status: 400 });
  }

  // POL requires a configured amount — for now, POL is only enabled if
  // the server has a POL_AMOUNT_USD configured. Since this is per-order,
  // we check if we can compute the amount.
  const polAmountUsd = process.env.POL_AMOUNT_USD; // optional
  const amountHuman = tokenAmountForService(service, tokenSymbol, polAmountUsd);
  if (!amountHuman) {
    return NextResponse.json(
      { error: `${tokenSymbol} amount is not configured for this service.` },
      { status: 400 },
    );
  }

  const amountRaw = parseUnits(amountHuman, token.decimals).toString();
  const publicOrderId = generatePublicOrderId();

  // ── Insert order ──
  const { data, error } = await sb
    .from("orders")
    .insert({
      public_order_id: publicOrderId,
      slug,
      status: "pending",
      receive_address: QUESTPAY_RECEIVE_ADDRESS,
      chain_id: 137,
      token_symbol: tokenSymbol,
      token_address: token.address || null,
      token_decimals: token.decimals,
      amount_human: amountHuman,
      amount_raw: amountRaw,
      usd_price: service.usd,
      customer_name: brief.customerName,
      contact_method: brief.contactMethod,
      contact_value: brief.contactValue,
      project_link: brief.projectLink || null,
      brief: brief.mainProblem,
      expected_output: brief.expectedOutput || null,
      ref_links: brief.refLinks || null,
      notes: brief.notes || null,
      deadline: brief.deadline || null,
      client_ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
      user_agent: req.headers.get("user-agent") || null,
    })
    .select("id, public_order_id")
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Failed to create order.", detail: error.message },
      { status: 500 },
    );
  }

  await sb.from("questpay_order_events").insert({
    order_id: data.id,
    event_type: "order_created",
    to_status: "pending",
    metadata: { status: "pending", source: "public_checkout" },
  });
  await sendOrderCreatedEmails({
    id: data.id,
    publicOrderId: data.public_order_id,
    serviceName: service.name,
    amountHuman,
    tokenSymbol,
    customerName: brief.customerName,
    contactMethod: brief.contactMethod,
    contactValue: brief.contactValue,
    brief: brief.mainProblem,
  });

  return NextResponse.json({
    publicOrderId: data.public_order_id,
    slug,
    tokenSymbol,
    amountHuman,
    receiveAddress: QUESTPAY_RECEIVE_ADDRESS, // safe to return to the buyer — it's where they pay
    chainId: 137,
    tokenAddress: token.address || null,
    tokenDecimals: token.decimals,
    serviceName: service.name,
    serviceUsd: service.usd,
  });
}
