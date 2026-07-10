import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAuth } from "@/lib/supabase-auth";
import { ADMIN_EMAIL, NEXT_PUBLIC_SITE_URL } from "@/lib/server-config";

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const email = String(form.get("email") || "").trim().toLowerCase();
  if (!ADMIN_EMAIL || email !== ADMIN_EMAIL.toLowerCase()) {
    return NextResponse.redirect(`${NEXT_PUBLIC_SITE_URL}/studio/login?sent=1`, 303);
  }
  const auth = getSupabaseAuth();
  await auth.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${NEXT_PUBLIC_SITE_URL}/auth/callback?next=/studio` },
  });
  return NextResponse.redirect(`${NEXT_PUBLIC_SITE_URL}/studio/login?sent=1`, 303);
}
