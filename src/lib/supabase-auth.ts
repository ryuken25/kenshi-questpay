import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import {
  getSession,
  ROOT_EMAIL,
  type Role,
} from "@/lib/auth";
import {
  ADMIN_EMAIL,
  SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_URL,
} from "./server-config";
import { createClient } from "@supabase/supabase-js";

const STUDIO_ROLES: Role[] = ["creator", "super_admin"];

function getServiceClient() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
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

async function resolveStudioIdentity(accountId: string, roles: Role[]) {
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

  if (!email && roles.includes("super_admin")) {
    email = (ADMIN_EMAIL || ROOT_EMAIL || "").toLowerCase();
    if (!label || label === "studio-user") label = email || "super-admin";
  }

  return {
    id: accountId,
    email: email || label,
    roles,
  };
}

/**
 * Studio access gate.
 *
 * Super admin can access every Studio surface.
 * Creators can also access Studio for their operations.
 * Legacy single-email allowlist is no longer the primary gate.
 */
export async function requireStudioAdmin() {
  // Preferred path: unified QuestPay session + role table
  try {
    const session = await getSession();
    if (session) {
      const allowed = STUDIO_ROLES.some((role) => session.roles.includes(role));
      if (!allowed) redirect("/studio/access-denied");
      return resolveStudioIdentity(session.accountId, session.roles);
    }
  } catch {
    // Fall through to legacy Supabase auth cookie path.
  }

  // Legacy fallback for older Supabase-auth-only sessions.
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) redirect("/sign-in?next=/studio");
  const auth = getSupabaseAuth();
  const {
    data: { user },
  } = await auth.auth.getUser();
  if (!user) redirect("/sign-in?next=/studio");

  const email = (user.email || "").toLowerCase();
  const allowlisted = Boolean(
    email &&
      ((ADMIN_EMAIL && email === ADMIN_EMAIL.toLowerCase()) ||
        email === ROOT_EMAIL.toLowerCase()),
  );

  if (!allowlisted) redirect("/studio/access-denied");

  return {
    id: user.id,
    email: email || "owner",
    roles: ["super_admin", "creator", "buyer"] as Role[],
  };
}
