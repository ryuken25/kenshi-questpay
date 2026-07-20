import "server-only";
import { parseUnits } from "viem";
import type { SupabaseClient } from "@supabase/supabase-js";

/** Unique 4-digit decimal suffix range (avoid 0000). */
export const AMOUNT_SUFFIX_MIN = 1;
export const AMOUNT_SUFFIX_MAX = 9999;
export const UNIQUE_SUFFIX_MIN = AMOUNT_SUFFIX_MIN;
export const UNIQUE_SUFFIX_MAX = AMOUNT_SUFFIX_MAX;
export const PAYMENT_AMOUNT_DECIMALS = 4;

export const PAYMENT_WINDOW_SECONDS = Number(process.env.PAYMENT_WINDOW_SECONDS || 1800);

/** Statuses that still reserve a unique payment amount. */
export const ACTIVE_PAYMENT_STATUSES = [
  "awaiting_payment",
  "payment_submitted",
  "pending",
] as const;

export type ActivePaymentStatus = (typeof ACTIVE_PAYMENT_STATUSES)[number];

export interface UniqueAmountResult {
  /** Integer suffix 1–9999 */
  amountSuffix: number;
  /** Zero-padded 4-digit form, e.g. "0017" */
  amountSuffixPadded: string;
  /** Alias of amountSuffixPadded */
  suffix: string;
  /** Human amount with exactly 4 decimals, e.g. "12.0017" */
  amountHuman: string;
  /** Raw integer units for the token decimals */
  amountRaw: string;
}

/** @deprecated Use UniqueAmountResult */
export type SuffixedAmount = UniqueAmountResult;

function padSuffix(n: number): string {
  return String(n).padStart(PAYMENT_AMOUNT_DECIMALS, "0");
}

/**
 * Build the exact human amount: whole + 0.XXXX where XXXX is the unique suffix.
 * Matches vNext examples (12.0017, 12.0042). Underpay-safe: if floor(base)+suffix
 * would be below base (e.g. volatile-token quotes), bumps the whole part by 1.
 * Requires token decimals >= 4 at the call site.
 */
export function formatAmountWithUniqueSuffix(baseAmount: number, suffix: number | string): string {
  const n = typeof suffix === "string" ? Number(suffix) : suffix;
  if (!Number.isInteger(n) || n < AMOUNT_SUFFIX_MIN || n > AMOUNT_SUFFIX_MAX) {
    throw new Error(`invalid_unique_suffix:${suffix}`);
  }
  if (!Number.isFinite(baseAmount) || baseAmount < 0) {
    throw new Error("invalid_base_amount");
  }
  const frac = n / 10 ** PAYMENT_AMOUNT_DECIMALS;
  let whole = Math.floor(baseAmount + 1e-12);
  if (whole + frac + 1e-12 < baseAmount) {
    whole += 1;
  }
  if (baseAmount > 0 && whole === 0) {
    whole = 1;
  }
  return `${whole}.${padSuffix(n)}`;
}

export function buildUniqueAmount(params: {
  baseAmount: number;
  suffix: number | string;
  tokenDecimals: number;
}): UniqueAmountResult {
  const { baseAmount, suffix, tokenDecimals } = params;
  if (tokenDecimals < PAYMENT_AMOUNT_DECIMALS) {
    throw new Error(`token_decimals_below_${PAYMENT_AMOUNT_DECIMALS}`);
  }
  const n = typeof suffix === "string" ? Number(suffix) : suffix;
  if (!Number.isInteger(n) || n < AMOUNT_SUFFIX_MIN || n > AMOUNT_SUFFIX_MAX) {
    throw new Error(`invalid_unique_suffix:${suffix}`);
  }
  const padded = padSuffix(n);
  const amountHuman = formatAmountWithUniqueSuffix(baseAmount, n);
  const amountRaw = parseUnits(amountHuman, tokenDecimals).toString();
  return {
    amountSuffix: n,
    amountSuffixPadded: padded,
    suffix: padded,
    amountHuman,
    amountRaw,
  };
}

/**
 * Apply a 4-digit decimal suffix to a quote amount so each open invoice has a
 * unique exact on-chain amount (e.g. base 12 → 12.0042).
 */
export function applyAmountSuffix(
  baseAmountHuman: string,
  decimals: number,
  suffix: number,
): UniqueAmountResult {
  const base = Number(baseAmountHuman);
  if (!Number.isFinite(base) || base < 0) {
    throw new Error("invalid_base_amount_human");
  }
  return buildUniqueAmount({
    baseAmount: base,
    suffix,
    tokenDecimals: decimals,
  });
}

/**
 * Allocate a unique 4-digit suffix among active open-payment orders.
 * Uniqueness is global among active payment intents (and reinforced per
 * chain+token via amount_raw unique index).
 */
export async function allocateUniqueAmountSuffix(
  sb: SupabaseClient,
  opts?: { maxAttempts?: number; chainId?: number; tokenSymbol?: string },
): Promise<number> {
  const maxAttempts = opts?.maxAttempts ?? 12;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    let query = sb
      .from("orders")
      .select("amount_suffix, unique_amount_suffix")
      .in("status", [...ACTIVE_PAYMENT_STATUSES]);

    if (opts?.chainId != null) query = query.eq("chain_id", opts.chainId);
    if (opts?.tokenSymbol) query = query.eq("token_symbol", opts.tokenSymbol);

    const { data, error } = await query;

    if (error) {
      throw new Error(`amount_suffix_lookup_failed:${error.message}`);
    }

    const used = new Set<number>();
    for (const row of data || []) {
      const fromInt = Number((row as { amount_suffix?: number | null }).amount_suffix);
      const fromText = Number(
        String((row as { unique_amount_suffix?: string | null }).unique_amount_suffix || ""),
      );
      for (const n of [fromInt, fromText]) {
        if (Number.isInteger(n) && n >= AMOUNT_SUFFIX_MIN && n <= AMOUNT_SUFFIX_MAX) {
          used.add(n);
        }
      }
    }

    if (used.size >= AMOUNT_SUFFIX_MAX) {
      throw new Error("amount_suffix_exhausted");
    }

    // Prefer random allocation to reduce contention under concurrent creates.
    const remaining = AMOUNT_SUFFIX_MAX - used.size;
    const pickOffset = Math.floor(Math.random() * remaining);
    let seen = 0;
    for (let candidate = AMOUNT_SUFFIX_MIN; candidate <= AMOUNT_SUFFIX_MAX; candidate++) {
      if (used.has(candidate)) continue;
      if (seen === pickOffset) return candidate;
      seen += 1;
    }
  }

  throw new Error("amount_suffix_allocation_failed");
}

/**
 * Build a unique suffixed payment amount for a new order.
 */
export async function createUniqueOrderAmount(
  sb: SupabaseClient,
  baseAmountHuman: string,
  decimals: number,
  opts?: { chainId?: number; tokenSymbol?: string },
): Promise<UniqueAmountResult> {
  const suffix = await allocateUniqueAmountSuffix(sb, opts);
  return applyAmountSuffix(baseAmountHuman, decimals, suffix);
}

export function applyUniqueSuffixToQuoteAmount(params: {
  baseAmountHuman: string;
  suffix: number | string;
  tokenDecimals: number;
}): UniqueAmountResult {
  const n = typeof params.suffix === "string" ? Number(params.suffix) : params.suffix;
  return applyAmountSuffix(params.baseAmountHuman, params.tokenDecimals, n);
}

/**
 * Cancel an order whose payment window has elapsed.
 * Safe to call on every order access / verify path (idempotent).
 */
export async function cancelOrderIfPaymentExpired(
  sb: SupabaseClient,
  order: {
    id: string;
    status: string;
    payment_expires_at?: string | null;
  },
  now = new Date(),
): Promise<{ expired: boolean; status: string; previousStatus?: string }> {
  if (!ACTIVE_PAYMENT_STATUSES.includes(order.status as ActivePaymentStatus)) {
    return { expired: false, status: order.status };
  }
  if (!order.payment_expires_at) {
    return { expired: false, status: order.status };
  }
  if (new Date(order.payment_expires_at).getTime() >= now.getTime()) {
    return { expired: false, status: order.status };
  }

  const previousStatus = order.status;
  const cancelledAt = now.toISOString();
  const { error } = await sb
    .from("orders")
    .update({ status: "cancelled", updated_at: cancelledAt })
    .eq("id", order.id)
    .in("status", [...ACTIVE_PAYMENT_STATUSES]);

  if (!error) {
    await sb.from("questpay_order_events").insert({
      order_id: order.id,
      event_type: "order_cancelled_payment_expired",
      from_status: previousStatus,
      to_status: "cancelled",
      metadata: {
        payment_expires_at: order.payment_expires_at,
        reason: "payment_window_elapsed",
        cancelled_at: cancelledAt,
      },
    });
  }

  return { expired: true, status: "cancelled", previousStatus };
}

export function computePaymentExpiresAt(
  from = new Date(),
  windowSeconds = PAYMENT_WINDOW_SECONDS,
): string {
  const seconds = Number.isFinite(windowSeconds) && windowSeconds > 0 ? windowSeconds : 1800;
  return new Date(from.getTime() + seconds * 1000).toISOString();
}
