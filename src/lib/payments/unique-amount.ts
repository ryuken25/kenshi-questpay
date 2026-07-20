/**
 * Re-export hub for unique payment amount helpers.
 * Canonical implementation lives in amount-suffix.ts.
 */
export {
  AMOUNT_SUFFIX_MIN,
  AMOUNT_SUFFIX_MAX,
  UNIQUE_SUFFIX_MIN,
  UNIQUE_SUFFIX_MAX,
  PAYMENT_AMOUNT_DECIMALS,
  PAYMENT_WINDOW_SECONDS,
  ACTIVE_PAYMENT_STATUSES,
  formatAmountWithUniqueSuffix,
  buildUniqueAmount,
  applyAmountSuffix,
  allocateUniqueAmountSuffix,
  createUniqueOrderAmount,
  applyUniqueSuffixToQuoteAmount,
  cancelOrderIfPaymentExpired,
  computePaymentExpiresAt,
  type ActivePaymentStatus,
  type UniqueAmountResult,
  type SuffixedAmount,
} from "./amount-suffix";
