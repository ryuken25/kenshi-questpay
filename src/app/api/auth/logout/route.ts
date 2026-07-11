import { NextResponse } from "next/server";
import { destroySession } from "@/lib/auth";

export async function POST() {
  await destroySession();
  const response = NextResponse.redirect(new URL("/sign-in", process.env.NEXT_PUBLIC_SITE_URL || "https://kenshi-questpay.vercel.app"), 303);
  response.cookies.set("qp_session", "", { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 0 });
  return response;
}
