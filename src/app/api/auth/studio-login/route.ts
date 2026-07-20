import { NextRequest, NextResponse } from "next/server";
import { ROOT_EMAIL } from "@/lib/auth";
import { getSupabaseAuth } from "@/lib/supabase-auth";
import { ADMIN_EMAIL, NEXT_PUBLIC_SITE_URL } from "@/lib/server-config";

function isOwnerEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return false;
  if (ADMIN_EMAIL && normalized === ADMIN_EMAIL.toLowerCase()) return true;
  if (ROOT_EMAIL && normalized === ROOT_EMAIL.toLowerCase()) return true;
  return false;
}

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const email = String(form.get("email") || "").trim().toLowerCase();
  // Always redirect the same way to avoid email enumeration.
  if (!isOwnerEmail(email)) {
    return NextResponse.redirect(`${NEXT_PUBLIC_SITE_URL}/studio/login?sent=1`, 303);
  }
  const auth = getSupabaseAuth();
  await auth.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${NEXT_PUBLIC_SITE_URL}/auth/callback?next=/studio` },
  });
  return NextResponse.redirect(`${NEXT_PUBLIC_SITE_URL}/studio/login?sent=1`, 303);
}
