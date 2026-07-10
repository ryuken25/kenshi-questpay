import { NextResponse } from "next/server";
import { getSupabaseAuth } from "@/lib/supabase-auth";
import { NEXT_PUBLIC_SITE_URL } from "@/lib/server-config";

export async function POST() {
  const auth = getSupabaseAuth();
  await auth.auth.signOut();
  return NextResponse.redirect(`${NEXT_PUBLIC_SITE_URL}/studio/login`, 303);
}
