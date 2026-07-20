/**
 * Order payment-window helpers. Canonical implementation is amount-suffix.ts.
 */
export {
  PAYMENT_WINDOW_SECONDS,
  ACTIVE_PAYMENT_STATUSES,
  cancelOrderIfPaymentExpired,
  computePaymentExpiresAt,
} from "./amount-suffix";
