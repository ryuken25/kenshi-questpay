import { NextResponse } from "next/server";
import { getSupabaseAuth } from "@/lib/supabase-auth";
import { NEXT_PUBLIC_SITE_URL } from "@/lib/server-config";
import { findOrCreateAccountByEmail, createSession, getActiveRoles, redirectForRoles, sanitizeNextPath } from "@/lib/auth";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const next = searchParams.get("next") || "";
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${NEXT_PUBLIC_SITE_URL}/sign-in?error=oauth_callback_failed`);
  }

  const auth = getSupabaseAuth();
  const { data, error } = await auth.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(`${NEXT_PUBLIC_SITE_URL}/sign-in?error=oauth_callback_failed`);
  }

  const email = data.user.email;
  if (!email) {
    return NextResponse.redirect(`${NEXT_PUBLIC_SITE_URL}/sign-in?error=no_verified_email`);
  }

  try {
    const { accountId, identityId, isNew } = await findOrCreateAccountByEmail(email);
    const roles = await getActiveRoles(accountId);
    const { token } = await createSession(accountId, "google", identityId);

    const redirectTo = redirectForRoles(roles, sanitizeNextPath(next) ?? undefined);
    const response = NextResponse.redirect(`${NEXT_PUBLIC_SITE_URL}${redirectTo}`);
    response.cookies.set("qp_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 604800,
    });
    return response;
  } catch {
    return NextResponse.redirect(`${NEXT_PUBLIC_SITE_URL}/sign-in?error=account_creation_failed`);
  }
}
