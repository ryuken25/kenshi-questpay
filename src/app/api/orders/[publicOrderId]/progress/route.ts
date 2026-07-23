import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSupabase } from "@/lib/db";
import { getSession } from "@/lib/auth";
import {
  recordOrderEvent,
  sanitizeProgressNote,
  PROGRESS_NOTE_MAX,
} from "@/lib/order-events";

// Node-only deps (pg) — pin to the Node.js runtime, never Edge.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/orders/[publicOrderId]/progress
 *
 * Creator-only: append a PRIVATE progress note to the order lifecycle feed
 * (order_events). Auth requires the session account to be the order's assigned
 * creator (super_admin may assist). Notes are Zod-validated, length-capped,
 * sanitized (control bytes stripped; rendered as auto-escaped React text), and
 * per-account rate-limited. This endpoint does NOT touch order status or any
 * payment/verify/release logic.
 */

const progressSchema = z.object({
  note: z.string().trim().min(1).max(PROGRESS_NOTE_MAX),
});

// Per-account in-memory rate limit (per warm instance). A creator may post at
// most RATE_MAX notes per RATE_WINDOW_MS. Sufficient abuse-guard for a single
// authenticated author; not a distributed limiter.
const RATE_MAX = 12;
const RATE_WINDOW_MS = 60_000;
const rateBuckets = new Map<string, number[]>();

function isRateLimited(accountId: string, now = Date.now()): boolean {
  const cutoff = now - RATE_WINDOW_MS;
  const hits = (rateBuckets.get(accountId) ?? []).filter((t) => t > cutoff);
  if (hits.length >= RATE_MAX) {
    rateBuckets.set(accountId, hits);
    return true;
  }
  hits.push(now);
  rateBuckets.set(accountId, hits);
  return false;
}

export async function POST(req: NextRequest, props: { params: Promise<{ publicOrderId: string }> }) {
  const params = await props.params;
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

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = progressSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.issues },
      { status: 400 },
    );
  }

  const { data: order, error: orderErr } = await sb
    .from("orders")
    .select("id, public_order_id, status, creator_account_id")
    .eq("public_order_id", publicOrderId)
    .single();

  if (orderErr || !order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  const isCreatorOwner =
    Boolean(order.creator_account_id) && order.creator_account_id === session.accountId;
  const isSuper = session.roles.includes("super_admin");
  if (!isCreatorOwner && !isSuper) {
    return NextResponse.json(
      { error: "Only the assigned creator can post progress notes on this order." },
      { status: 403 },
    );
  }

  if (isRateLimited(session.accountId)) {
    return NextResponse.json(
      { error: "Too many progress notes. Please wait a moment and try again." },
      { status: 429 },
    );
  }

  const note = sanitizeProgressNote(parsed.data.note);
  if (!note) {
    return NextResponse.json({ error: "Note is empty after sanitization." }, { status: 400 });
  }

  const event = await recordOrderEvent({
    orderId: order.id,
    actorRole: isCreatorOwner ? "creator" : "admin",
    eventType: "progress_note",
    note,
  });

  if (!event) {
    return NextResponse.json({ error: "Failed to record progress note." }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    event: {
      id: event.id,
      actorRole: event.actor_role,
      eventType: event.event_type,
      fromStatus: event.from_status,
      toStatus: event.to_status,
      note: event.note,
      createdAt: event.created_at,
    },
  });
}
