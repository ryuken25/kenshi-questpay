import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/db";
import { getSession } from "@/lib/auth";
import {
  markOrderAccepted,
  releaseAcceptedOrder,
  REAL_PAYMENTS_ENABLED,
  hasReleaseSignerConfigured,
} from "@/lib/payments/release";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * POST /api/orders/[publicOrderId]/accept
 *
 * Buyer accepts submitted work → status=accepted → attempts custody release.
 * Release is server-only and idempotent; if signer/gate missing, order stays accepted
 * and funds remain in custody until release is retried.
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
    .select("id, public_order_id, status, account_id")
    .eq("public_order_id", publicOrderId)
    .single();

  if (orderErr || !order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  // Buyer ownership (super_admin may assist).
  const isBuyer = order.account_id && order.account_id === session.accountId;
  const isSuper = session.roles.includes("super_admin");
  if (!isBuyer && !isSuper) {
    return NextResponse.json(
      { error: "Only the buyer who owns this order can accept work." },
      { status: 403 },
    );
  }

  const accepted = await markOrderAccepted(sb, {
    orderId: order.id,
    actorAccountId: session.accountId,
    actorLabel: session.accountId,
  });

  if (!accepted.ok) {
    const status =
      accepted.code === "order_not_found"
        ? 404
        : accepted.code === "forbidden"
          ? 403
          : accepted.code === "invalid_status"
            ? 409
            : 400;
    return NextResponse.json(accepted, { status });
  }

  // Attempt release only when real payments + signer are ready.
  // Otherwise leave status=accepted (funds still in custody) — safe refusal.
  if (!REAL_PAYMENTS_ENABLED || !hasReleaseSignerConfigured()) {
    return NextResponse.json({
      ok: true,
      accepted: true,
      alreadyAccepted: accepted.alreadyAccepted,
      publicOrderId,
      status: "accepted",
      release: {
        attempted: false,
        reason: !REAL_PAYMENTS_ENABLED
          ? "real_payments_disabled"
          : "signer_missing",
        realPaymentsEnabled: REAL_PAYMENTS_ENABLED,
        signerConfigured: hasReleaseSignerConfigured(),
      },
      message:
        "Work accepted. Custody release is pending system configuration (real payments + release signer).",
    });
  }

  const release = await releaseAcceptedOrder(sb, {
    orderId: order.id,
    actor: session.accountId,
  });

  if (!release.ok) {
    // Accept succeeded; release failed — do not roll back accept.
    return NextResponse.json({
      ok: true,
      accepted: true,
      alreadyAccepted: accepted.alreadyAccepted,
      publicOrderId,
      status: "accepted",
      release: {
        attempted: true,
        ok: false,
        error: release.error,
        code: release.code,
      },
      message:
        "Work accepted. Custody release failed; order remains accepted for retry.",
    });
  }

  return NextResponse.json({
    ok: true,
    accepted: true,
    alreadyAccepted: accepted.alreadyAccepted,
    publicOrderId,
    status: release.status,
    release: {
      attempted: true,
      ok: true,
      alreadyReleased: release.alreadyReleased,
      releaseId: release.releaseId,
      txHash: release.txHash,
      toAddress: release.toAddress,
      amountHuman: release.amountHuman,
      tokenSymbol: release.tokenSymbol,
    },
  });
}
