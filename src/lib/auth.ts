import { cookies } from "next/headers";
import crypto from "node:crypto";
import { getDb, queryOneOptional } from "@/lib/db";

export const SESSION_COOKIE = "qp_session";
export const SESSION_TTL_SECONDS = 604800; // 7 days
export const ROOT_ACCOUNT_ID = "00000000-0000-4000-8000-000000000001";
export const ROOT_EMAIL = "winayaarya@gmail.com";

/**
 * @deprecated NOT an authorization source. Super-admin is env-driven via
 * ROOT_SUPER_ADMIN_WALLETS (see {@link getRootSuperAdminWallets}). The old
 * "both wallets are super_admin" hardcode has been removed — the escrow wallet
 * in the env allowlist is the ONLY super-admin wallet; the creator wallet
 * (0xEa8A…) resolves to `creator` via account_roles, never admin.
 */
export const ROOT_WALLETS: readonly string[] = [];

/** Env var carrying the comma-separated super-admin (escrow) wallet allowlist. */
export const ROOT_SUPER_ADMIN_WALLETS_ENV = "ROOT_SUPER_ADMIN_WALLETS";

/**
 * Lowercased super-admin wallet allowlist read from ROOT_SUPER_ADMIN_WALLETS.
 * Comma-separated; blank and malformed entries are dropped. There is NO
 * hardcoded fallback: if the env var is unset, no wallet is authorized as
 * super_admin (fail-closed).
 */
export function getRootSuperAdminWallets(): string[] {
  const raw = process.env[ROOT_SUPER_ADMIN_WALLETS_ENV] || "";
  return raw
    .split(",")
    .map((entry) => normalizeWallet(entry))
    .filter((entry) => /^0x[a-f0-9]{40}$/.test(entry));
}

export type Role = "buyer" | "creator" | "super_admin";
export type AuthProvider = "google" | "email" | "wallet";

export interface QuestPaySession {
  accountId: string;
  authenticatedBy: AuthProvider;
  roles: Role[];
  expiresAt: number;
}

function getServiceClient() {
  // Neon-backed compatibility client
  return getDb() as any;
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

/**
 * Env-driven super-admin test for an account. True iff the account owns a
 * wallet listed in ROOT_SUPER_ADMIN_WALLETS (the escrow admin) OR its primary
 * email is ROOT_EMAIL (legacy owner). One round-trip; fail-closed (returns
 * false) when the DB is unreachable or the env allowlist is empty.
 */
export async function isEnvSuperAdmin(accountId: string): Promise<boolean> {
  const adminWallets = getRootSuperAdminWallets();
  const rootEmail = ROOT_EMAIL ? normalizeEmail(ROOT_EMAIL) : "";
  if (adminWallets.length === 0 && !rootEmail) return false;

  const row = await queryOneOptional<{ is_admin: boolean }>(
    `SELECT (
        EXISTS (
          SELECT 1 FROM account_identities ai
          WHERE ai.account_id = $1
            AND ai.provider = 'wallet'
            AND lower(ai.normalized_wallet) = ANY($2::text[])
        )
        OR EXISTS (
          SELECT 1 FROM accounts a
          WHERE a.id = $1
            AND $3 <> ''
            AND lower(a.primary_email) = $3
        )
     ) AS is_admin`,
    [accountId, adminWallets, rootEmail],
  );
  return Boolean(row?.is_admin);
}

/**
 * Resolve an account's effective roles. `buyer`/`creator` come from
 * account_roles; `super_admin` is ALWAYS re-derived from env
 * (ROOT_SUPER_ADMIN_WALLETS / ROOT_EMAIL) and never trusted from a stored grant.
 * A stale or seeded DB super_admin row therefore cannot escalate — the escrow
 * wallet in the env allowlist is the single admin authorization source.
 */
export async function deriveRoles(accountId: string): Promise<Role[]> {
  const sb = getServiceClient();
  const { data } = await sb
    .from("account_roles")
    .select("role")
    .eq("account_id", accountId)
    .is("revoked_at", null);
  const roles = new Set<Role>((data || []).map((r: { role: string }) => r.role as Role));
  // super_admin is env-derived, not DB-derived: drop any grant then re-add.
  roles.delete("super_admin");
  if (await isEnvSuperAdmin(accountId)) roles.add("super_admin");
  return [...roles];
}

export async function getSession(): Promise<QuestPaySession | null> {
  const cookieStore = await cookies();
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

  const roleList = await deriveRoles(session.account_id);

  return {
    accountId: session.account_id,
    authenticatedBy: session.authenticated_by as AuthProvider,
    roles: roleList,
    expiresAt: new Date(session.expires_at).getTime(),
  };
}

export async function getActiveRoles(accountId: string): Promise<Role[]> {
  return deriveRoles(accountId);
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
  const cookieStore = await cookies();
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

/**
 * Return `next` only when it is a safe same-origin relative path, else null.
 * Rejects absolute URLs, protocol-relative (`//`), backslash tricks (`/\`),
 * schemes (`javascript:`), and any whitespace/control characters.
 */
export function sanitizeNextPath(next: string | null | undefined): string | null {
  if (!next || typeof next !== "string") return null;
  if (!next.startsWith("/")) return null;
  if (next.startsWith("//") || next.startsWith("/\\")) return null;
  if (/\s/.test(next)) return null;
  const pathname = next.split(/[?#]/, 1)[0];
  const exact = new Set([
    "/",
    "/account",
    "/my-orders",
    "/receipts",
    "/dashboard",
    "/studio",
    "/onboarding",
    "/services",
    "/verify",
    "/sign-in",
    "/admin",
    "/for-creators",
  ]);
  const prefixes = [
    "/services/",
    "/checkout/",
    "/orders/",
    "/pay/",
    "/verify/",
    "/dashboard/",
    "/studio/",
    "/admin/",
    "/receipts/",
  ];
  return exact.has(pathname) || prefixes.some((prefix) => pathname.startsWith(prefix)) ? next : null;
}

export function redirectForRoles(roles: Role[], next?: string): string {
  const safeNext = sanitizeNextPath(next);
  if (safeNext) return safeNext;
  if (roles.includes("super_admin")) return "/admin";
  if (roles.includes("creator")) return "/studio";
  return "/my-orders";
}

export { getServiceClient };
