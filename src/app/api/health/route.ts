import { NextResponse } from "next/server";
import {
  hasSupabase,
  hasSMTP,
  receiveAddressValid,
  getPaymentGateStatus,
} from "@/lib/server-config";
import { NETWORKS, getEnabledTokensForChain } from "@/lib/services";

export const dynamic = "force-dynamic";

export async function GET() {
  const buildSha = process.env.VERCEL_GIT_COMMIT_SHA || process.env.NEXT_PUBLIC_BUILD_SHA || "unknown";
  const paymentGate = getPaymentGateStatus();
  const provider = process.env.DATABASE_URL ? "neon" : hasSupabase ? "supabase" : "none";

  return NextResponse.json({
    ok: true,
    app: "Kenshi QuestPay",
    version: "v7-neon",
    buildSha,
    buildTime: process.env.NEXT_PUBLIC_BUILD_TIME || "unknown",
    networks: {
      polygon: {
        ...NETWORKS.polygon,
        enabledTokens: getEnabledTokensForChain("polygon").map((t) => t.symbol),
      },
      bnb: {
        ...NETWORKS.bnb,
        enabledTokens: getEnabledTokensForChain("bnb").map((t) => t.symbol),
      },
    },
    services: {
      database: Boolean(process.env.DATABASE_URL) || hasSupabase,
      provider,
      email: hasSMTP,
      polygonRpc: Boolean(process.env.POLYGON_RPC_URL || process.env.NEXT_PUBLIC_POLYGON_RPC_URL),
      bscRpc: Boolean(process.env.BSC_RPC_URL),
      receiver: receiveAddressValid,
      analytics: true,
      quoteProvider: true,
      realPayments: paymentGate.realPaymentsEnabled,
      releaseSigner: paymentGate.releaseSignerConfigured,
      releaseReady: paymentGate.releaseReady,
      paymentVerifyReady: paymentGate.paymentVerifyReady,
      minConfirmations: paymentGate.minConfirmations,
    },
    paymentGate,
  });
}
