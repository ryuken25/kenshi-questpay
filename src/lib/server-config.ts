import "server-only";

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
export const hasSupabase = Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);

/** True when SMTP is fully configured. */
export const hasSMTP = Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS && SMTP_FROM);

/** Validate an Ethereum address (basic 0x + 40 hex chars). */
export function isValidAddress(addr: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(addr);
}

/** True when the receive address is present and valid. */
export const receiveAddressValid =
  Boolean(QUESTPAY_RECEIVE_ADDRESS) && isValidAddress(QUESTPAY_RECEIVE_ADDRESS);

import { createClient } from "@supabase/supabase-js";

/** Fetch a sanitized order by public_id (no brief/contact in response). */
export async function getServerSideOrder(publicOrderId: string) {
  if (!hasSupabase) return null;
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { data } = await supabase
    .from("orders")
    .select("public_order_id,slug,status,amount_human,token_symbol,created_at")
    .eq("public_order_id", publicOrderId)
    .single();
  return data;
}
