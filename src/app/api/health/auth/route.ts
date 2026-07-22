import { NextResponse } from "next/server";
import { hasDatabase, queryManyOptional } from "@/lib/db";
import { hasSupabase } from "@/lib/server-config";
import { ROOT_EMAIL } from "@/lib/auth";

// Node-only deps (pg / nodemailer / viem RPC) — pin to the Node.js runtime, never Edge.
export const runtime = "nodejs";

export const dynamic = "force-dynamic";

export async function GET() {
  let googleConfigured = false;
  let magicLinkConfigured = false;
  let walletConfigured = true;
  let siteUrlConfigured = false;
  let rootEmailClaimed = false;
  let rootWallet1Claimed = false;
  let rootWallet2Claimed = false;

  siteUrlConfigured = !!process.env.NEXT_PUBLIC_SITE_URL;
  // Auth providers still use Supabase Auth during migration; data plane uses Neon.
  magicLinkConfigured = hasSupabase;
  googleConfigured = hasSupabase;

  if (hasDatabase) {
    try {
      const claims = await queryManyOptional<{
        provider: string;
        normalized_identifier: string;
        claimed_at: string | null;
      }>(`SELECT provider, normalized_identifier, claimed_at FROM root_identity_claims`);
      for (const c of claims) {
        if (c.provider === "google_email" && c.normalized_identifier === ROOT_EMAIL) {
          rootEmailClaimed = !!c.claimed_at;
        }
        if (
          c.provider === "wallet" &&
          c.normalized_identifier === "0xea8ab08eabbead7e3d28cb067ec7f638d40b39cf"
        ) {
          rootWallet1Claimed = !!c.claimed_at;
        }
        if (
          c.provider === "wallet" &&
          c.normalized_identifier === "0xa111a8c806b1fac9d27650455344f5c2f144a743"
        ) {
          rootWallet2Claimed = !!c.claimed_at;
        }
      }
    } catch {
      // DB not accessible — return defaults
    }
  }

  return NextResponse.json({
    ok: googleConfigured || magicLinkConfigured || walletConfigured,
    providers: {
      googleConfigured,
      magicLinkConfigured,
      walletConfigured,
    },
    siteUrlConfigured,
    redirectConfigurationDocumented: true,
    databaseConfigured: hasDatabase,
    rootIdentities: {
      rootEmailClaimed,
      rootWallet1Claimed,
      rootWallet2Claimed,
    },
  });
}
