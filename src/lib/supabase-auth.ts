import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import {
  getSession,
  ROOT_EMAIL,
  type Role,
  type QuestPaySession,
} from "@/lib/auth";
import {
  ADMIN_EMAIL,
  SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_URL,
} from "./server-config";
import { createClient } from "@supabase/supabase-js";

const STUDIO_ROLES: Role[] = ["creator", "super_admin"];

export type StudioUser = {
  id: string;
  email: string;
  roles: Role[];
};

function getServiceClient() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
}

function isAllowlistedEmail(email: string | null | undefined): boolean {
  const normalized = (email || "").trim().toLowerCase();
  if (!normalized) return false;
  if (ADMIN_EMAIL && normalized === ADMIN_EMAIL.toLowerCase()) return true;
  if (ROOT_EMAIL && normalized === ROOT_EMAIL.toLowerCase()) return true;
  return false;
}

function hasStudioRole(roles: Role[]): boolean {
  return STUDIO_ROLES.some((role) => roles.includes(role));
}

export function getSupabaseAuth() {
  const cookieStore = cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(items) {
        try {
          items.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Components cannot write cookies. Route handlers/callbacks refresh them.
        }
      },
    },
  });
}

async function resolveStudioIdentity(accountId: string, roles: Role[]): Promise<StudioUser> {
  const sb = getServiceClient();
  let email = "";
  let label = "studio-user";

  if (sb) {
    const { data: account } = await sb
      .from("accounts")
      .select("primary_email")
      .eq("id", accountId)
      .maybeSingle();

    if (account?.primary_email) {
      email = String(account.primary_email).toLowerCase();
      label = email;
    } else {
      const { data: identity } = await sb
        .from("account_identities")
        .select("provider, provider_subject, normalized_email")
        .eq("account_id", accountId)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (identity?.normalized_email) {
        email = String(identity.normalized_email).toLowerCase();
        label = email;
      } else if (identity?.provider_subject) {
        label = String(identity.provider_subject);
      }
    }
  }

  if (!email && (roles.includes("super_admin") || isAllowlistedEmail(label))) {
    email = (ADMIN_EMAIL || ROOT_EMAIL || "").toLowerCase();
    if (!label || label === "studio-user") label = email || "super-admin";
  }

  // Legacy email allowlist elevates to full studio roles when DB roles are incomplete.
  const effectiveRoles =
    hasStudioRole(roles) || isAllowlistedEmail(email)
      ? (Array.from(new Set([...roles, "super_admin", "creator", "buyer"])) as Role[])
      : roles;

  return {
    id: accountId,
    email: email || label,
    roles: effectiveRoles,
  };
}

/**
 * Resolve QuestPay session without swallowing Next.js redirect throws.
 */
async function tryGetSession(): Promise<QuestPaySession | null> {
  try {
    return await getSession();
  } catch {
    return null;
  }
}

/**
 * Studio access gate.
 *
 * Primary: QuestPay session roles include `super_admin` or `creator`.
 * Fallback: ADMIN_EMAIL / ROOT_EMAIL allowlist (legacy single-owner path).
 * Super admin can access every Studio surface (dashboard, earnings, creator ops).
 */
export async function requireStudioAdmin(): Promise<StudioUser> {
  // Preferred path: unified QuestPay session + role table
  const session = await tryGetSession();
  if (session) {
    if (hasStudioRole(session.roles)) {
      return resolveStudioIdentity(session.accountId, session.roles);
    }

    // Session present but missing studio roles — still honor legacy email allowlist.
    const identity = await resolveStudioIdentity(session.accountId, session.roles);
    if (isAllowlistedEmail(identity.email)) {
      return identity;
    }

    redirect("/studio/access-denied");
  }

  // Legacy fallback for older Supabase-auth-only sessions.
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) redirect("/sign-in?next=/studio");
  const auth = getSupabaseAuth();
  const {
    data: { user },
  } = await auth.auth.getUser();
  if (!user) redirect("/sign-in?next=/studio");

  const email = (user.email || "").toLowerCase();
  if (!isAllowlistedEmail(email)) redirect("/studio/access-denied");

  return {
    id: user.id,
    email: email || "owner",
    roles: ["super_admin", "creator", "buyer"] as Role[],
  };
}
