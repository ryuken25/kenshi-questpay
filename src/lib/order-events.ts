import "server-only";
import { getSupabase, queryManyOptional } from "@/lib/db";

/**
 * Buyer/creator-facing order lifecycle feed (`order_events`).
 *
 * This is intentionally SEPARATE from `questpay_order_events` (the low-level
 * system audit log written inside the frozen payment/verify/release paths).
 * `order_events` is the human-readable progress timeline shown on
 * /orders/[publicOrderId]: status transitions + creator progress notes.
 *
 * Writes here are ADDITIVE hooks that run AFTER an existing transition has
 * committed — they must never throw, so a feed-write failure can never roll
 * back or block a money-moving transition. Every helper fails soft.
 */

export type OrderEventActorRole = "buyer" | "creator" | "admin" | "system";
export type OrderEventType = "status_change" | "progress_note";

export interface OrderEventRow {
  id: string;
  order_id: string;
  actor_role: OrderEventActorRole;
  event_type: OrderEventType;
  from_status: string | null;
  to_status: string | null;
  note: string | null;
  created_at: string;
}

export interface RecordOrderEventInput {
  orderId: string;
  actorRole: OrderEventActorRole;
  eventType: OrderEventType;
  fromStatus?: string | null;
  toStatus?: string | null;
  note?: string | null;
}

/** Hard cap enforced on stored progress notes (also enforced by Zod on input). */
export const PROGRESS_NOTE_MAX = 2000;

/**
 * Normalize a free-text progress note before persisting.
 *
 * The feed renders notes as React text nodes (auto-escaped), and any HTML
 * context (e.g. the email module) must run its own escapeHtml — mirroring the
 * `escapeHtml` pattern in src/lib/email.ts. Here we keep the stored text
 * READABLE but inert: strip ASCII control characters (except newline/tab),
 * normalize newlines, collapse runs of blank lines, trim, and hard-cap length.
 * No stored note can carry control bytes or unbounded length.
 */
export function sanitizeProgressNote(raw: unknown): string {
  return String(raw ?? "")
    .replace(/\r\n?/g, "\n")
    // Strip ASCII control chars but keep tab (\x09) and newline (\x0A).
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, PROGRESS_NOTE_MAX);
}

/**
 * Append a row to `order_events`. Returns the created row, or null on any
 * failure (never throws). Callers hooking an existing transition should treat
 * this as fire-and-forget; the progress endpoint uses the returned row.
 */
export async function recordOrderEvent(
  input: RecordOrderEventInput,
): Promise<OrderEventRow | null> {
  const sb = getSupabase();
  if (!sb) return null;
  try {
    const { data, error } = await sb
      .from("order_events")
      .insert({
        order_id: input.orderId,
        actor_role: input.actorRole,
        event_type: input.eventType,
        from_status: input.fromStatus ?? null,
        to_status: input.toStatus ?? null,
        note: input.note ?? null,
      })
      .select("id, order_id, actor_role, event_type, from_status, to_status, note, created_at")
      .single();
    if (error) return null;
    return (data as OrderEventRow) ?? null;
  } catch {
    return null;
  }
}

/**
 * Chronological (oldest → newest) feed for one order. Server-only; callers must
 * gate access to order participants (buyer / creator / admin) BEFORE calling —
 * progress notes are private and must never be exposed on a public surface.
 */
export async function listOrderEvents(orderId: string): Promise<OrderEventRow[]> {
  return queryManyOptional<OrderEventRow>(
    `SELECT id, order_id, actor_role, event_type, from_status, to_status, note, created_at
       FROM order_events
      WHERE order_id = $1
      ORDER BY created_at ASC, id ASC`,
    [orderId],
  );
}
