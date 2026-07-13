import { NextResponse } from "next/server";
import { destroySession, SESSION_COOKIE } from "@/lib/auth";

export async function POST() {
  // Browser logout must succeed even when server-side session revocation is temporarily unavailable.
  try {
    await destroySession();
  } catch (error) {
    console.error("[auth/logout] session revocation failed", error);
  }

  const response = NextResponse.redirect(new URL("/sign-in", process.env.NEXT_PUBLIC_SITE_URL || "https://kenshi-questpay.vercel.app"), 303);
  response.cookies.set(SESSION_COOKIE, "", { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 0 });
  response.headers.set("Cache-Control", "no-store");
  return response;
}
