import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { getSupabase } from "@/lib/db";
import { QUESTPAY_RECEIVE_ADDRESS, receiveAddressValid } from "@/lib/server-config";
import { getServiceBySlug, isValidChainTokenPair } from "@/lib/services";
import { createOrderSchema, profileSchema } from "@/lib/schemas";
import { sendOrderCreatedEmails } from "@/lib/email";
import { createPaymentQuote } from "@/lib/payments/quote-service";
import {
  createUniqueOrderAmount,
  computePaymentExpiresAt,
  PAYMENT_AMOUNT_DECIMALS,
  PAYMENT_WINDOW_SECONDS,
} from "@/lib/payments/amount-suffix";
import { getSession } from "@/lib/auth";
import { getProfile, upsertProfile } from "@/lib/profile";

// Node-only deps (pg / nodemailer / viem RPC) — pin to the Node.js runtime, never Edge.
export const runtime = "nodejs";

export const dynamic = "force-dynamic";

function generatePublicOrderId(): string {
  const ts = Date.now().toString(36);
  const rnd = Math.random().toString(36).slice(2, 8);
  return `qp-${ts}-${rnd}`;
}

function sha256(input: unknown): string {
  return createHash("sha256").update(JSON.stringify(input)).digest("hex");
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Sign in is required to create an order." }, { status: 401 });
  }

  const profile = await getProfile(session.accountId);
  if (!profile?.onboardingCompletedAt) {
    return NextResponse.json({ error: "Complete your profile before creating an order." }, { status: 409 });
  }

  if (!receiveAddressValid || !QUESTPAY_RECEIVE_ADDRESS) {
    return NextResponse.json({ error: "Payments are being upgraded. Order drafting is available, but payment is temporarily unavailable." }, { status: 503 });
  }

  const sb = getSupabase();
  if (!sb) return NextResponse.json({ error: "Order system is not configured." }, { status: 503 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 }); }

  const parsed = createOrderSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Validation failed", details: parsed.error.issues }, { status: 400 });

  const { slug, chainKey, tokenSymbol, brief, saveProfileDefaults } = parsed.data;
  const service = getServiceBySlug(slug);
  if (!service) return NextResponse.json({ error: "Unknown service slug." }, { status: 400 });

  if (!isValidChainTokenPair(chainKey, tokenSymbol)) {
    return NextResponse.json({ error: `${tokenSymbol} is not enabled on ${chainKey}.` }, { status: 400 });
  }

  // Resolve the creator that owns this service (SERVER-side; the client cannot
  // supply or influence it). Every order MUST carry a creator so custody release
  // and studio scoping work; a service with no mapped creator fails CLOSED rather
  // than creating an unreleasable order. (Agent R F1/F2/F3 root-cause fix.)
  const { data: serviceCreator } = await sb
    .from("service_creators")
    .select("creator_account_id, creator_wallet")
    .eq("service_slug", slug)
    .maybeSingle();
  if (!serviceCreator?.creator_account_id || !serviceCreator?.creator_wallet) {
    return NextResponse.json(
      { error: "This service is not currently available for orders.", reason: "service_creator_unmapped" },
      { status: 409 },
    );
  }

  let quote;
  try {
    quote = await createPaymentQuote({ slug, chainKey, tokenSymbol });
  } catch (e) {
    const reason = e instanceof Error ? e.message : "quote_unavailable";
    return NextResponse.json({ error: `${tokenSymbol} quote is unavailable. Token is disabled until a real price source responds.`, reason }, { status: 503 });
  }

  if (quote.tokenDecimals < PAYMENT_AMOUNT_DECIMALS) {
    return NextResponse.json({
      error: `${tokenSymbol} has fewer than ${PAYMENT_AMOUNT_DECIMALS} decimals and cannot use unique amount matching.`,
      reason: "token_decimals_too_low",
    }, { status: 503 });
  }

  // Server-generated unique 4-digit decimal suffix among active awaiting_payment orders.
  let suffixed;
  try {
    suffixed = await createUniqueOrderAmount(sb, quote.amountHuman, quote.tokenDecimals, {
      chainId: quote.chainId,
      tokenSymbol,
    });
  } catch (e) {
    const reason = e instanceof Error ? e.message : "unique_suffix_failed";
    return NextResponse.json({
      error: "Could not allocate a unique payment amount. Please try again.",
      reason,
    }, { status: 503 });
  }

  if (saveProfileDefaults) {
    try {
      await upsertProfile(session.accountId, profileSchema.parse({
        displayName: brief.customerName,
        publicHandle: profile.publicHandle ?? "",
        contactMethod: brief.contactMethod,
        contactValue: brief.contactValue,
        organization: profile.organization ?? "",
        preferredChain: chainKey,
        timezone: profile.timezone ?? "",
      }));
    } catch {
      // Non-fatal — the order itself still proceeds with the submitted snapshot.
    }
  }

  const publicOrderId = generatePublicOrderId();
  const now = new Date();
  const paymentExpiresAt = computePaymentExpiresAt(now, PAYMENT_WINDOW_SECONDS);

  const { data, error } = await sb.from("orders").insert({
    public_order_id: publicOrderId,
    slug,
    account_id: session.accountId,
    creator_account_id: serviceCreator.creator_account_id,
    creator_wallet: serviceCreator.creator_wallet,
    status: "awaiting_payment",
    receive_address: QUESTPAY_RECEIVE_ADDRESS,
    chain_id: quote.chainId,
    token_symbol: tokenSymbol,
    token_address: quote.tokenAddress,
    token_decimals: quote.tokenDecimals,
    amount_human: suffixed.amountHuman,
    amount_raw: suffixed.amountRaw,
    amount_suffix: suffixed.amountSuffix,
    unique_amount_suffix: suffixed.amountSuffixPadded,
    usd_price: service.usd,
    quote_id: quote.id,
    quote_expires_at: quote.expiresAt,
    payment_expires_at: paymentExpiresAt,
    brief_sha256: sha256(brief),
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
  }).select("id, public_order_id").single();

  if (error) {
    // Unique index race on active amount suffix / amount_raw.
    if (error.code === "23505") {
      return NextResponse.json({
        error: "Unique payment amount conflict. Please retry order creation.",
        reason: "unique_suffix_conflict",
      }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create order.", detail: error.message }, { status: 500 });
  }

  // Persist quote snapshot with the same unique amount the order requires.
  await sb.from("payment_quotes").insert({
    id: quote.id,
    service_slug: quote.serviceSlug,
    chain_id: quote.chainId,
    token_symbol: quote.tokenSymbol,
    token_address: quote.tokenAddress,
    token_decimals: quote.tokenDecimals,
    usd_price: quote.usdPrice,
    token_usd_price: quote.tokenUsdPrice,
    amount_human: suffixed.amountHuman,
    amount_raw: suffixed.amountRaw,
    source: quote.source,
    expires_at: quote.expiresAt,
  }).then(() => undefined);

  await sb.from("questpay_order_events").insert({
    order_id: data.id,
    event_type: "order_created",
    to_status: "awaiting_payment",
    metadata: {
      source: "public_checkout",
      quote_id: quote.id,
      quote_source: quote.source,
      payment_expires_at: paymentExpiresAt,
      amount_suffix: suffixed.amountSuffix,
      unique_amount_suffix: suffixed.amountSuffixPadded,
      amount_human: suffixed.amountHuman,
      base_amount_human: quote.amountHuman,
      payment_window_seconds: PAYMENT_WINDOW_SECONDS,
    },
  });

  await sendOrderCreatedEmails({
    id: data.id,
    publicOrderId: data.public_order_id,
    serviceName: service.name,
    amountHuman: suffixed.amountHuman,
    tokenSymbol,
    customerName: brief.customerName,
    contactMethod: brief.contactMethod,
    contactValue: brief.contactValue,
    brief: brief.mainProblem,
  });

  return NextResponse.json({
    publicOrderId: data.public_order_id,
    slug,
    chainKey: quote.chainKey,
    tokenSymbol,
    amountHuman: suffixed.amountHuman,
    amountRaw: suffixed.amountRaw,
    amountSuffix: suffixed.amountSuffix,
    uniqueAmountSuffix: suffixed.amountSuffixPadded,
    quoteId: quote.id,
    quoteSource: quote.source,
    quoteExpiresAt: quote.expiresAt,
    paymentExpiresAt,
    receiveAddress: QUESTPAY_RECEIVE_ADDRESS,
    chainId: quote.chainId,
    tokenAddress: quote.tokenAddress,
    tokenDecimals: quote.tokenDecimals,
    serviceName: service.name,
    serviceUsd: service.usd,
  });
}
