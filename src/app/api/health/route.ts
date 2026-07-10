import { NextResponse } from "next/server";
import { hasSupabase, hasSMTP, receiveAddressValid } from "@/lib/server-config";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "QuestPay v2",
    time: new Date().toISOString(),
    supabase: hasSupabase,
    smtp: hasSMTP,
    paymentsEnabled: receiveAddressValid,
  });
}
