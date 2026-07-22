import { NextResponse } from "next/server";
import { requireStudioAdmin } from "@/lib/supabase-auth";
import { sendStudioTestEmail } from "@/lib/email";
import { NEXT_PUBLIC_SITE_URL } from "@/lib/server-config";

// Node-only deps (pg / nodemailer / viem RPC) — pin to the Node.js runtime, never Edge.
export const runtime = "nodejs";

export async function POST(){await requireStudioAdmin();const ok=await sendStudioTestEmail();return NextResponse.redirect(`${NEXT_PUBLIC_SITE_URL}/studio/settings?emailTest=${ok?"sent":"failed"}`,303)}
