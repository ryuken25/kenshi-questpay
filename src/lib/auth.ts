import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import crypto from "node:crypto";

export const SESSION_COOKIE = "qp_session";
export const SESSION_TTL_SECONDS = 604800; // 7 days
export const ROOT_ACCOUNT_ID = "00000000-0000-4000-8000-000000000001";
export const ROOT_EMAIL = "winayaarya@gmail.com";
export const ROOT_WALLETS = [
  "0xea8ab08eabbead7e3d28cb067ec7f638d40b39cf",
  "0xa111a8c806b1fac9d27650455344f5c2f144a743",
];

export type Role = "buyer" | "creator" | "super_admin";
export type AuthProvider = "google" | "email" | "wallet";

export interface QuestPaySession {
  accountId: string;
  authenticatedBy: AuthProvider;
  roles: Role[];
  expiresAt: number;
}

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("supabase_not_configured");
  return createClient(url, key, { auth: { persistSession: false } });
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function normalizeWallet(addr: string): string {
  return addr.trim().toLowerCase();
}

export function walletProviderSubject(addr: string): string {
  return `eip155:137:${normalizeWallet(addr)}`;
}

export async function createSession(
  accountId: string,
  authenticatedBy: AuthProvider,
  identityId?: string,
): Promise<{ token: string; expiresAt: Date }> {
  const sb = getServiceClient();
  const token = generateSessionToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000);

  await sb.from("account_sessions").insert({
    account_id: accountId,
    token_hash: tokenHash,
    authenticated_by: authenticatedBy,
    authenticated_identity_id: identityId,
    expires_at: expiresAt.toISOString(),
    last_seen_at: new Date().toISOString(),
  });

  return { token, expiresAt };
}

export async function getSession(): Promise<QuestPaySession | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const sb = getServiceClient();
  const tokenHash = hashToken(token);
  const { data: session } = await sb
    .from("account_sessions")
    .select("account_id, authenticated_by, expires_at, revoked_at")
    .eq("token_hash", tokenHash)
    .single();

  if (!session) return null;
  if (session.revoked_at) return null;
  if (new Date(session.expires_at).getTime() <= Date.now()) return null;

  const { data: roles } = await sb
    .from("account_roles")
    .select("role")
    .eq("account_id", session.account_id)
    .is("revoked_at", null);

  const roleList = (roles || []).map((r) => r.role as Role);

  return {
    accountId: session.account_id,
    authenticatedBy: session.authenticated_by as AuthProvider,
    roles: roleList,
    expiresAt: new Date(session.expires_at).getTime(),
  };
}

export async function getActiveRoles(accountId: string): Promise<Role[]> {
  const sb = getServiceClient();
  const { data } = await sb
    .from("account_roles")
    .select("role")
    .eq("account_id", accountId)
    .is("revoked_at", null);
  return (data || []).map((r) => r.role as Role);
}

export async function requireRole(role: Role): Promise<{ accountId: string; roles: Role[] }> {
  const session = await getSession();
  if (!session) throw new Error("unauthenticated");
  const roles = await getActiveRoles(session.accountId);
  if (!roles.includes(role)) throw new Error("forbidden");
  return { accountId: session.accountId, roles };
}

export async function requireAnyRole(roles: Role[]): Promise<{ accountId: string; roles: Role[] }> {
  const session = await getSession();
  if (!session) throw new Error("unauthenticated");
  const activeRoles = await getActiveRoles(session.accountId);
  if (!roles.some((r) => activeRoles.includes(r))) throw new Error("forbidden");
  return { accountId: session.accountId, roles: activeRoles };
}

export async function destroySession(): Promise<void> {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return;
  const sb = getServiceClient();
  const tokenHash = hashToken(token);
  await sb.from("account_sessions").update({ revoked_at: new Date().toISOString() }).eq("token_hash", tokenHash);
}

export async function findOrCreateAccountByEmail(email: string): Promise<{ accountId: string; identityId: string; isNew: boolean }> {
  const sb = getServiceClient();
  const normalized = normalizeEmail(email);

  // Check root identity claims first
  const { data: rootClaim } = await sb
    .from("root_identity_claims")
    .select("target_account_id, claimed_at")
    .eq("provider", "google_email")
    .eq("normalized_identifier", normalized)
    .single();

  let accountId: string;
  let isNew = false;

  if (rootClaim && !rootClaim.claimed_at) {
    // Claim root identity
    accountId = rootClaim.target_account_id;
    await sb.from("root_identity_claims").update({ claimed_at: new Date().toISOString() }).eq("provider", "google_email").eq("normalized_identifier", normalized);
  } else if (rootClaim && rootClaim.claimed_at) {
    accountId = rootClaim.target_account_id;
  } else {
    // Check existing identity
    const { data: existingIdentity } = await sb
      .from("account_identities")
      .select("account_id, id")
      .or(`provider.eq.google,provider.eq.email`)
      .eq("normalized_email", normalized)
      .single();

    if (existingIdentity) {
      accountId = existingIdentity.account_id;
    } else {
      // Create new buyer account
      const { data: newAccount, error } = await sb.from("accounts").insert({ primary_email: normalized, status: "active" }).select("id").single();
      if (error || !newAccount) throw new Error("account_creation_failed");
      accountId = newAccount.id;
      isNew = true;
      // Grant buyer role
      await sb.from("account_roles").insert({ account_id: accountId, role: "buyer", grant_reason: "auto on signup" });
    }
  }

  // Attach Google identity if not present
  const { data: existingId } = await sb
    .from("account_identities")
    .select("id")
    .eq("provider", "google")
    .eq("normalized_email", normalized)
    .single();

  let identityId: string;
  if (existingId) {
    identityId = existingId.id;
  } else {
    const { data: newId } = await sb
      .from("account_identities")
      .insert({
        account_id: accountId,
        provider: "google",
        provider_subject: `google:${normalized}`,
        normalized_email: normalized,
        verified_at: new Date().toISOString(),
        is_primary: true,
      })
      .select("id")
      .single();
    identityId = newId?.id || "";
  }

  return { accountId, identityId, isNew };
}

export async function findOrCreateAccountByWallet(walletAddress: string): Promise<{ accountId: string; identityId: string; isNew: boolean }> {
  const sb = getServiceClient();
  const normalized = normalizeWallet(walletAddress);

  // Check root identity claims
  const { data: rootClaim } = await sb
    .from("root_identity_claims")
    .select("target_account_id, claimed_at")
    .eq("provider", "wallet")
    .eq("normalized_identifier", normalized)
    .single();

  let accountId: string;
  let isNew = false;

  if (rootClaim && !rootClaim.claimed_at) {
    accountId = rootClaim.target_account_id;
    await sb.from("root_identity_claims").update({ claimed_at: new Date().toISOString() }).eq("provider", "wallet").eq("normalized_identifier", normalized);
  } else if (rootClaim && rootClaim.claimed_at) {
    accountId = rootClaim.target_account_id;
  } else {
    // Check existing identity
    const { data: existingIdentity } = await sb
      .from("account_identities")
      .select("account_id, id")
      .eq("provider", "wallet")
      .eq("normalized_wallet", normalized)
      .single();

    if (existingIdentity) {
      accountId = existingIdentity.account_id;
    } else {
      // Create new buyer account
      const { data: newAccount, error } = await sb.from("accounts").insert({ status: "active" }).select("id").single();
      if (error || !newAccount) throw new Error("account_creation_failed");
      accountId = newAccount.id;
      isNew = true;
      await sb.from("account_roles").insert({ account_id: accountId, role: "buyer", grant_reason: "auto on wallet signup" });
    }
  }

  // Attach wallet identity
  const { data: existingId } = await sb
    .from("account_identities")
    .select("id")
    .eq("provider", "wallet")
    .eq("normalized_wallet", normalized)
    .single();

  let identityId: string;
  if (existingId) {
    identityId = existingId.id;
  } else {
    const { data: newId } = await sb
      .from("account_identities")
      .insert({
        account_id: accountId,
        provider: "wallet",
        provider_subject: walletProviderSubject(normalized),
        normalized_wallet: normalized,
        verified_at: new Date().toISOString(),
        is_primary: true,
      })
      .select("id")
      .single();
    identityId = newId?.id || "";
  }

  return { accountId, identityId, isNew };
}

export function redirectForRoles(roles: Role[], next?: string): string {
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : null;
  if (safeNext) return safeNext;
  if (roles.includes("super_admin")) return "/admin";
  if (roles.includes("creator")) return "/dashboard";
  return "/my-orders";
}

export { getServiceClient };
