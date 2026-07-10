import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAuth } from "@/lib/supabase-auth";
import { NEXT_PUBLIC_SITE_URL } from "@/lib/server-config";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const next = request.nextUrl.searchParams.get("next") || "/studio";
  if (code) {
    const auth = getSupabaseAuth();
    const { error } = await auth.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${NEXT_PUBLIC_SITE_URL}${next.startsWith("/") ? next : "/studio"}`);
  }
  return NextResponse.redirect(`${NEXT_PUBLIC_SITE_URL}/studio/login?error=callback`);
}
