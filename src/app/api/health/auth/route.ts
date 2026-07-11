import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  let googleConfigured = false;
  let magicLinkConfigured = false;
  let walletConfigured = true;
  let siteUrlConfigured = false;
  let rootEmailClaimed = false;
  let rootWallet1Claimed = false;
  let rootWallet2Claimed = false;

  siteUrlConfigured = !!process.env.NEXT_PUBLIC_SITE_URL;
  magicLinkConfigured = !!(sbUrl && sbKey);
  googleConfigured = !!(process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CONFIGURED === "true");

  if (sbUrl && sbKey) {
    try {
      const { createClient } = await import("@supabase/supabase-js");
      const sb = createClient(sbUrl, sbKey, { auth: { persistSession: false } });
      const { data: claims } = await sb.from("root_identity_claims").select("provider, normalized_identifier, claimed_at");
      if (claims) {
        for (const c of claims) {
          if (c.provider === "google_email" && c.normalized_identifier === "winanyaarya@gmail.com") rootEmailClaimed = !!c.claimed_at;
          if (c.provider === "wallet" && c.normalized_identifier === "0xea8ab08eabbead7e3d28cb067ec7f638d40b39cf") rootWallet1Claimed = !!c.claimed_at;
          if (c.provider === "wallet" && c.normalized_identifier === "0xa111a8c806b1fac9d27650455344f5c2f144a743") rootWallet2Claimed = !!c.claimed_at;
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
    rootIdentities: {
      rootEmailClaimed,
      rootWallet1Claimed,
      rootWallet2Claimed,
    },
  });
}
