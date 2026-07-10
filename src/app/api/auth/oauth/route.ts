import { NextResponse } from "next/server";
import { getSupabaseAuth } from "@/lib/supabase-auth";
import { NEXT_PUBLIC_SITE_URL } from "@/lib/server-config";

export async function GET() {
  const auth = getSupabaseAuth();
  const { data, error } = await auth.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${NEXT_PUBLIC_SITE_URL}/auth/callback?next=/studio` },
  });
  if (error || !data.url) return NextResponse.redirect(`${NEXT_PUBLIC_SITE_URL}/studio/login?error=oauth`);
  return NextResponse.redirect(data.url);
}
