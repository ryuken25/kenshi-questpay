import { NextResponse } from "next/server";
import { getServiceClient, normalizeWallet } from "@/lib/auth";
import crypto from "node:crypto";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const walletAddress = normalizeWallet(body.address || "");
    if (!walletAddress.match(/^0x[a-f0-9]{40}$/)) {
      return NextResponse.json({ ok: false, reason: "invalid_address" }, { status: 400 });
    }

    const sb = getServiceClient();
    const nonce = crypto.randomBytes(16).toString("hex");
    const nonceHash = crypto.createHash("sha256").update(nonce).digest("hex");
    const domain = process.env.NEXT_PUBLIC_SITE_URL || "https://kenshi-questpay.vercel.app";
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await sb.from("wallet_nonces").insert({
      wallet_address: walletAddress,
      nonce_hash: nonceHash,
      domain,
      chain_id: 137,
      expires_at: expiresAt.toISOString(),
    });

    const message = `${domain} wants you to sign in with your Ethereum account:

${walletAddress}

Sign in to Kenshi QuestPay.

URI: ${domain}
Version: 1
Chain ID: 137
Nonce: ${nonce}
Issued At: ${new Date().toISOString()}
Expiration Time: ${expiresAt.toISOString()}
Resources:
- ${domain}/terms
- ${domain}/privacy`;

    return NextResponse.json({ ok: true, nonce, message, expiresAt: expiresAt.toISOString() });
  } catch {
    return NextResponse.json({ ok: false, reason: "nonce_failed" }, { status: 500 });
  }
}
