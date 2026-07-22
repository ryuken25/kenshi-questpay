import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/db";
import { getSession } from "@/lib/auth";
import {
  releaseAcceptedOrder,
  REAL_PAYMENTS_ENABLED,
  hasReleaseSignerConfigured,
} from "@/lib/payments/release";

// Node-only deps (pg / nodemailer / viem RPC) — pin to the Node.js runtime, never Edge.
export const runtime = "nodejs";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * POST /api/orders/[publicOrderId]/release
 *
 * Server-authoritative custody release after buyer accept.
 * - Requires authenticated session (buyer owner, creator on order, or super_admin).
 * - Order must be status=accepted (idempotent if already released).
 * - On-chain send requires REAL_PAYMENTS_ENABLED + QUESTPAY_RELEASE_PRIVATE_KEY.
 *   REAL_PAYMENTS_ENABLED is true when NEXT_PUBLIC_ENABLE_REAL_PAYMENTS=true, or
 *   when the flag is unset and custody (receive + signer) is fully configured.
 * - Never trusts client amount / address / status overrides.
 */
export async function POST(
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

  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { data: order, error: orderErr } = await sb
    .from("orders")
    .select("id, public_order_id, status, account_id, creator_account_id")
    .eq("public_order_id", publicOrderId)
    .single();

  if (orderErr || !order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  const isBuyer = order.account_id && order.account_id === session.accountId;
  const isCreator =
    order.creator_account_id && order.creator_account_id === session.accountId;
  const isSuper = session.roles.includes("super_admin");

  if (!isBuyer && !isCreator && !isSuper) {
    return NextResponse.json(
      { error: "Not authorized to trigger release for this order." },
      { status: 403 },
    );
  }

  // Preflight diagnostics when gated (clear, safe refusal).
  if (!REAL_PAYMENTS_ENABLED) {
    return NextResponse.json(
      {
        ok: false,
        error: "Real payments are disabled. Release refused.",
        code: "real_payments_disabled",
        realPaymentsEnabled: false,
        signerConfigured: hasReleaseSignerConfigured(),
        status: order.status,
      },
      { status: 503 },
    );
  }

  if (!hasReleaseSignerConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Release signer is not configured (QUESTPAY_RELEASE_PRIVATE_KEY). Funds remain in custody.",
        code: "signer_missing",
        realPaymentsEnabled: true,
        signerConfigured: false,
        status: order.status,
      },
      { status: 503 },
    );
  }

  const result = await releaseAcceptedOrder(sb, {
    publicOrderId,
    actor: session.accountId,
  });

  if (!result.ok) {
    const status =
      result.code === "order_not_found"
        ? 404
        : result.code === "invalid_status"
          ? 409
          : result.code === "real_payments_disabled" || result.code === "signer_missing"
            ? 503
            : result.code === "broadcast_failed"
              ? 502
              : 400;
    return NextResponse.json(result, { status });
  }

  return NextResponse.json({
    ok: true,
    alreadyReleased: result.alreadyReleased,
    publicOrderId: result.publicOrderId,
    status: result.status,
    releaseId: result.releaseId,
    txHash: result.txHash,
    toAddress: result.toAddress,
    amountHuman: result.amountHuman,
    amountRaw: result.amountRaw,
    tokenSymbol: result.tokenSymbol,
  });
}
