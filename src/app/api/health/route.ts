import { NextResponse } from "next/server";
import { hasSupabase, hasSMTP, receiveAddressValid } from "@/lib/server-config";

export const dynamic = "force-dynamic";

export async function GET() {
  const buildSha = process.env.VERCEL_GIT_COMMIT_SHA || process.env.NEXT_PUBLIC_BUILD_SHA || "unknown";
  return NextResponse.json({
    ok: true,
    app: "Kenshi QuestPay",
    version: "v3",
    buildSha,
    buildTime: process.env.NEXT_PUBLIC_BUILD_TIME || "unknown",
    network: { name: "Polygon Mainnet", chainId: 137 },
    services: {
      database: hasSupabase,
      email: hasSMTP,
      polygonRpc: Boolean(process.env.POLYGON_RPC_URL || process.env.NEXT_PUBLIC_POLYGON_RPC_URL),
      receiver: receiveAddressValid,
      analytics: true,
      quoteProvider: true,
    },
  });
}
