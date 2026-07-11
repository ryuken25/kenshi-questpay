import { NextResponse } from "next/server";
import { getSupabaseAuth } from "@/lib/supabase-auth";
import { NEXT_PUBLIC_SITE_URL } from "@/lib/server-config";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const next = searchParams.get("next") || "";
  const auth = getSupabaseAuth();
  const { data, error } = await auth.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${NEXT_PUBLIC_SITE_URL}/auth/callback${next ? `?next=${encodeURIComponent(next)}` : ""}`,
      queryParams: {
        access_type: "offline",
        prompt: "select_account",
      },
    },
  });
  if (error || !data.url) return NextResponse.redirect(`${NEXT_PUBLIC_SITE_URL}/sign-in?error=provider_not_enabled`);
  return NextResponse.redirect(data.url);
}
