/**
 * Order payment-window helpers. Canonical mutation lives in amount-suffix.ts;
 * this module re-exports it and adds a pure decision helper for on-read expiry.
 */
import {
  ACTIVE_PAYMENT_STATUSES,
  PAYMENT_WINDOW_SECONDS,
  cancelOrderIfPaymentExpired,
  computePaymentExpiresAt,
  type ActivePaymentStatus,
} from "./amount-suffix";

export {
  PAYMENT_WINDOW_SECONDS,
  ACTIVE_PAYMENT_STATUSES,
  cancelOrderIfPaymentExpired,
  computePaymentExpiresAt,
};

/**
 * Pure decision for on-read auto-expiry: has this order's payment window
 * elapsed? True only when the order is still in an active payment status
 * (awaiting_payment / payment_submitted / pending) AND its payment_expires_at
 * is strictly in the past. The order GET route and the verify path use this
 * (via cancelOrderIfPaymentExpired) to transition a stale awaiting_payment
 * order out of the active set idempotently — no cron required.
 */
export function isPaymentWindowExpired(
  order: { status: string; payment_expires_at?: string | null },
  now: Date = new Date(),
): boolean {
  if (!ACTIVE_PAYMENT_STATUSES.includes(order.status as ActivePaymentStatus)) {
    return false;
  }
  if (!order.payment_expires_at) return false;
  return new Date(order.payment_expires_at).getTime() < now.getTime();
}
