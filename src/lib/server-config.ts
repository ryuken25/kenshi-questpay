import "server-only";
import { queryOneOptional } from "@/lib/db";

/**
 * Server-side configuration.
 * Reads sensitive env vars that must NEVER be exposed to the client.
 * This module is imported only by server components / route handlers.
 */

function requireEnv(key: string): string | undefined {
  return process.env[key]?.trim() || undefined;
}

/** Normalize a Supabase URL — strip trailing /rest/v1/ if present. */
function normalizeSupabaseUrl(raw: string): string {
  const trimmed = raw.trim().replace(/\/+$/, "");
  return trimmed.replace(/\/rest\/v1$/, "");
}

const rawSupabaseUrl = requireEnv("SUPABASE_URL") || "";
export const SUPABASE_URL = normalizeSupabaseUrl(rawSupabaseUrl);
export const SUPABASE_SERVICE_ROLE_KEY =
  requireEnv("SUPABASE_SECRET_KEY") || requireEnv("SUPABASE_SERVICE_ROLE_KEY") || "";
export const SUPABASE_ANON_KEY =
  requireEnv("SUPABASE_PUBLISHABLE_KEY") || requireEnv("SUPABASE_ANON_KEY") || "";

export const SMTP_HOST = requireEnv("SMTP_HOST") || "";
export const SMTP_PORT = requireEnv("SMTP_PORT") ? Number(requireEnv("SMTP_PORT")) : 587;
export const SMTP_USER = requireEnv("SMTP_USER") || "";
export const SMTP_PASS = requireEnv("SMTP_PASS") || "";
export const SMTP_FROM = requireEnv("SMTP_FROM") || "";

/** Server-only receive address — never exposed to client. */
export const QUESTPAY_RECEIVE_ADDRESS = requireEnv("QUESTPAY_RECEIVE_ADDRESS") || "";

/**
 * Server-only custody release private key (must control QUESTPAY_RECEIVE_ADDRESS).
 * Prefer QUESTPAY_RELEASE_PRIVATE_KEY; QUESTPAY_CUSTODY_PRIVATE_KEY is an alias.
 * Never import this into client bundles — keep usage inside `server-only` modules.
 */
export const QUESTPAY_RELEASE_PRIVATE_KEY =
  requireEnv("QUESTPAY_RELEASE_PRIVATE_KEY") ||
  requireEnv("QUESTPAY_CUSTODY_PRIVATE_KEY") ||
  "";

export const POLYGON_RPC_URL =
  requireEnv("POLYGON_RPC_URL") || "https://polygon-bor-rpc.publicnode.com";

export const NEXT_PUBLIC_SITE_URL =
  requireEnv("NEXT_PUBLIC_SITE_URL") || "http://localhost:3000";

export const ADMIN_EMAIL = requireEnv("ADMIN_EMAIL") || "";

/** True when Supabase is fully configured (URL + service key). */
export const hasSupabase = Boolean(process.env.DATABASE_URL || (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY));

/** True when Neon/Postgres DATABASE_URL is configured. */
export const hasDatabase = Boolean(process.env.DATABASE_URL?.trim());

/** True when SMTP is fully configured. */
export const hasSMTP = Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS && SMTP_FROM);

/** Validate an Ethereum address (basic 0x + 40 hex chars). */
export function isValidAddress(addr: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(addr);
}

/** True when the receive address is present and valid. */
export const receiveAddressValid =
  Boolean(QUESTPAY_RECEIVE_ADDRESS) && isValidAddress(QUESTPAY_RECEIVE_ADDRESS);

/**
 * Minimum on-chain confirmations required for payment verification.
 * Wired from PAYMENT_MIN_CONFIRMATIONS (default 5 — matches .env.example / gate docs).
 */
export const PAYMENT_MIN_CONFIRMATIONS = (() => {
  const raw = process.env.PAYMENT_MIN_CONFIRMATIONS?.trim();
  if (!raw) return 5;
  const n = Number(raw);
  if (Number.isFinite(n) && n >= 0) return Math.floor(n);
  return 5;
})();

/**
 * True when a custody release private key is present and well-formed.
 * Does not return or log the key.
 */
export function hasReleaseSignerConfigured(): boolean {
  const raw = QUESTPAY_RELEASE_PRIVATE_KEY;
  if (!raw) return false;
  const normalized = raw.startsWith("0x") ? raw : `0x${raw}`;
  return /^0x[a-fA-F0-9]{64}$/.test(normalized);
}

/**
 * Parse NEXT_PUBLIC_ENABLE_REAL_PAYMENTS (fail-safe).
 * Real payments / on-chain release are enabled ONLY when the flag is the
 * explicit string `true` (case-insensitive). Unset, empty, or anything else
 * → disabled. No implicit "enable when secrets exist" path: a preview
 * deployment that forgets the flag can never silently move real funds.
 */
function parseRealPaymentsEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_REAL_PAYMENTS?.trim().toLowerCase() === "true";
}

/**
 * Server-side real-payment / release gate.
 * Client UI still reads NEXT_PUBLIC_ENABLE_REAL_PAYMENTS at build time;
 * operators should set it explicitly to "true" for wallet-pay CTAs.
 */
export const REAL_PAYMENTS_ENABLED = parseRealPaymentsEnabled();

/** Sanitized readiness snapshot for health endpoints (no secrets). */
export function getPaymentGateStatus() {
  const flagRaw = process.env.NEXT_PUBLIC_ENABLE_REAL_PAYMENTS?.trim() ?? "";
  return {
    realPaymentsEnabled: REAL_PAYMENTS_ENABLED,
    publicFlag: flagRaw === "" ? "unset" : flagRaw,
    minConfirmations: PAYMENT_MIN_CONFIRMATIONS,
    receiveAddressConfigured: receiveAddressValid,
    releaseSignerConfigured: hasReleaseSignerConfigured(),
    /** True when on-chain release can proceed (flag + custody). */
    releaseReady: REAL_PAYMENTS_ENABLED && receiveAddressValid && hasReleaseSignerConfigured(),
    /** True when inbound payment verification can run (receive + RPC path). */
    paymentVerifyReady: receiveAddressValid,
  };
}

/** Fetch a sanitized order by public_id (no brief/contact in response). */
export async function getServerSideOrder(publicOrderId: string) {
  return queryOneOptional<{
    public_order_id: string;
    slug: string;
    status: string;
    amount_human: string;
    token_symbol: string;
    created_at: string;
  }>(
    `SELECT public_order_id, slug, status, amount_human, token_symbol, created_at
     FROM orders
     WHERE public_order_id = $1
     LIMIT 1`,
    [publicOrderId],
  );
}
