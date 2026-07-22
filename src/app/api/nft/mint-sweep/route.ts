import { NextRequest, NextResponse } from "next/server";
import { sweepReceiptMints, getNftReceiptStatus } from "@/lib/nft/receipt-mint";

// Node-only deps (pg / viem RPC) — pin to the Node.js runtime, never Edge.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Async NFT receipt mint sweeper.
 *
 * Intentionally decoupled from the payment path: it scans for orders that are
 * already paid and still lack a receipt, then mints. Nothing in verify-payment
 * calls this. No-op when ENABLE_NFT_RECEIPTS is not "true".
 *
 * Protected by CRON_SECRET (Vercel Cron sends `Authorization: Bearer $CRON_SECRET`).
 * If CRON_SECRET is unset the endpoint refuses rather than being publicly callable.
 */
function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const header = req.headers.get("authorization") || "";
  return header === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const status = getNftReceiptStatus();
  if (!status.enabled) {
    return NextResponse.json({ ok: true, enabled: false, note: "ENABLE_NFT_RECEIPTS is off — no-op." });
  }
  if (!status.ready) {
    return NextResponse.json({
      ok: true,
      enabled: true,
      ready: false,
      note: "Receipt contract or minter key not configured — nothing attempted.",
      contractConfigured: status.contractConfigured,
      minterConfigured: status.minterConfigured,
    });
  }

  try {
    const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") || 10) || 10, 50);
    const result = await sweepReceiptMints(limit);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    // Never leak internals; sweeper failure must not affect anything else.
    console.error("[nft] sweep failed:", e instanceof Error ? e.message : e);
    return NextResponse.json({ ok: false, error: "sweep_failed" }, { status: 500 });
  }
}

export const POST = GET;
