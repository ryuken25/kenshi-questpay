import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { ADMIN_EMAIL, SUPABASE_ANON_KEY, SUPABASE_URL } from "./server-config";

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

export async function requireStudioAdmin() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !ADMIN_EMAIL) redirect("/studio/login?error=not-configured");
  const auth = getSupabaseAuth();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) redirect("/studio/login?next=/studio");
  if ((user.email || "").toLowerCase() !== ADMIN_EMAIL.toLowerCase()) redirect("/studio/access-denied");
  return user;
}
