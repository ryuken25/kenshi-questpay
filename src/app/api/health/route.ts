import { NextResponse } from "next/server";
import { hasSupabase, hasSMTP, receiveAddressValid } from "@/lib/server-config";
import { NETWORKS, getEnabledTokensForChain } from "@/lib/services";

export const dynamic = "force-dynamic";

export async function GET() {
  const buildSha = process.env.VERCEL_GIT_COMMIT_SHA || process.env.NEXT_PUBLIC_BUILD_SHA || "unknown";
  return NextResponse.json({
    ok: true,
    app: "Kenshi QuestPay",
    version: "v6",
    buildSha,
    buildTime: process.env.NEXT_PUBLIC_BUILD_TIME || "unknown",
    networks: {
      polygon: { ...NETWORKS.polygon, enabledTokens: getEnabledTokensForChain("polygon").map((t) => t.symbol) },
      bnb: { ...NETWORKS.bnb, enabledTokens: getEnabledTokensForChain("bnb").map((t) => t.symbol) },
    },
    services: {
      database: hasSupabase,
      email: hasSMTP,
      polygonRpc: Boolean(process.env.POLYGON_RPC_URL || process.env.NEXT_PUBLIC_POLYGON_RPC_URL),
      bscRpc: Boolean(process.env.BSC_RPC_URL),
      receiver: receiveAddressValid,
      analytics: true,
      quoteProvider: true,
    },
  });
}
