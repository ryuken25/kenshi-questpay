import "server-only";

/**
 * Server-authoritative order lifecycle helpers.
 * Money-moving and terminal payment statuses must never be client/studio-forced.
 */

/** Statuses only payment verify / system may set. */
export const PAYMENT_ONLY_STATUSES = new Set([
  "awaiting_payment",
  "payment_submitted",
  "paid",
  "pending",
]);

/** Statuses only the release worker may set. */
export const RELEASE_ONLY_STATUSES = new Set(["released", "completed"]);

/** Statuses only the buyer accept path may set. */
export const BUYER_ONLY_STATUSES = new Set(["accepted"]);

/** Admin-only / system terminal statuses (not studio force). */
export const ADMIN_OR_SYSTEM_STATUSES = new Set([
  "cancelled",
  "expired",
  "disputed",
  "refunded",
]);

/**
 * Studio (creator ops) may only move work operational states.
 * Explicitly excludes paid / accepted / released / completed.
 */
export const STUDIO_ALLOWED_STATUSES = new Set([
  "in_progress",
  "work_submitted",
  "reviewing",
  "awaiting_client",
  "ready_for_review",
  "delivered",
]);

/** All blocked statuses for studio force-update API. */
export const STUDIO_BLOCKED_STATUSES = new Set([
  ...PAYMENT_ONLY_STATUSES,
  ...RELEASE_ONLY_STATUSES,
  ...BUYER_ONLY_STATUSES,
  ...ADMIN_OR_SYSTEM_STATUSES,
]);

export function isStudioAllowedStatus(status: string): boolean {
  return STUDIO_ALLOWED_STATUSES.has(status);
}

/** Allowed from→to transitions for studio (finite work FSM subset). */
const STUDIO_TRANSITIONS: Record<string, ReadonlySet<string>> = {
  paid: new Set(["in_progress", "work_submitted", "reviewing", "delivered"]),
  in_progress: new Set([
    "work_submitted",
    "awaiting_client",
    "ready_for_review",
    "reviewing",
    "delivered",
  ]),
  work_submitted: new Set([
    "in_progress",
    "ready_for_review",
    "reviewing",
    "awaiting_client",
    "delivered",
  ]),
  reviewing: new Set([
    "in_progress",
    "work_submitted",
    "ready_for_review",
    "awaiting_client",
    "delivered",
  ]),
  awaiting_client: new Set([
    "in_progress",
    "work_submitted",
    "reviewing",
    "ready_for_review",
    "delivered",
  ]),
  ready_for_review: new Set([
    "in_progress",
    "work_submitted",
    "reviewing",
    "awaiting_client",
    "delivered",
  ]),
  delivered: new Set(["work_submitted", "in_progress", "ready_for_review"]),
};

export function canStudioTransition(from: string, to: string): boolean {
  if (!isStudioAllowedStatus(to)) return false;
  if (STUDIO_BLOCKED_STATUSES.has(from) && from !== "paid") {
    // Once accepted/released/etc., studio cannot change lifecycle.
    if (["accepted", "released", "completed", "cancelled", "expired", "refunded", "disputed"].includes(from)) {
      return false;
    }
  }
  const allowed = STUDIO_TRANSITIONS[from];
  if (!allowed) return false;
  return allowed.has(to);
}
