import { NextResponse } from "next/server";
import { hasSupabase, hasSMTP, receiveAddressValid } from "@/lib/server-config";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    app: "questpay",
    version: "2.3",
    gitSha: process.env.VERCEL_GIT_COMMIT_SHA || process.env.NEXT_PUBLIC_BUILD_SHA || "local",
    supabaseConfigured: hasSupabase,
    smtpConfigured: hasSMTP,
    polygonRpcConfigured: Boolean(process.env.POLYGON_RPC_URL),
    receiverConfigured: receiveAddressValid,
    hubImpactConfigured: Boolean(process.env.HUB_IMPACT_SCRIPT_SRC?.trim()),
    timestamp: new Date().toISOString(),
  });
}
