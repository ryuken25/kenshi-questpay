import { NextResponse } from "next/server";
import { getServiceClient, hashToken, normalizeWallet, findOrCreateAccountByWallet, createSession, getActiveRoles, redirectForRoles, type Role } from "@/lib/auth";
import { recoverMessageAddress } from "viem";
import crypto from "node:crypto";

// Node-only deps (pg / nodemailer / viem RPC) — pin to the Node.js runtime, never Edge.
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const walletAddress = normalizeWallet(body.address || "");
    const signature = body.signature || "";
    const nonce = body.nonce || "";
    const message = body.message || "";

    if (!walletAddress.match(/^0x[a-f0-9]{40}$/)) {
      return NextResponse.json({ ok: false, reason: "invalid_address" }, { status: 400 });
    }
    if (!signature || !nonce || !message) {
      return NextResponse.json({ ok: false, reason: "missing_fields" }, { status: 400 });
    }

    const sb = getServiceClient();
    const nonceHash = crypto.createHash("sha256").update(nonce).digest("hex");

    // Find nonce
    const { data: nonceRow } = await sb
      .from("wallet_nonces")
      .select("id, expires_at, consumed_at, domain, chain_id, wallet_address")
      .eq("nonce_hash", nonceHash)
      .single();

    if (!nonceRow) {
      return NextResponse.json({ ok: false, reason: "nonce_not_found" }, { status: 400 });
    }
    if (nonceRow.consumed_at) {
      return NextResponse.json({ ok: false, reason: "nonce_used" }, { status: 400 });
    }
    if (new Date(nonceRow.expires_at).getTime() <= Date.now()) {
      return NextResponse.json({ ok: false, reason: "nonce_expired" }, { status: 400 });
    }
    if (nonceRow.wallet_address !== walletAddress) {
      return NextResponse.json({ ok: false, reason: "wallet_mismatch" }, { status: 400 });
    }

    // Verify signature
    let recoveredAddress: string;
    try {
      recoveredAddress = (await recoverMessageAddress({ message, signature: signature as `0x${string}` })).toLowerCase();
    } catch {
      return NextResponse.json({ ok: false, reason: "signature_invalid" }, { status: 400 });
    }

    if (recoveredAddress !== walletAddress) {
      return NextResponse.json({ ok: false, reason: "signature_mismatch" }, { status: 400 });
    }

    // Consume nonce
    await sb.from("wallet_nonces").update({ consumed_at: new Date().toISOString() }).eq("id", nonceRow.id);

    // Find or create account
    const { accountId, identityId, isNew } = await findOrCreateAccountByWallet(walletAddress);
    const roles = await getActiveRoles(accountId);

    // Create session
    const { token, expiresAt } = await createSession(accountId, "wallet", identityId);

    // Write audit log
    await sb.from("admin_audit_log").insert({
      actor_account_id: accountId,
      action: "wallet_signin",
      metadata: { provider: "wallet", new_account: isNew },
    });

    const redirectTo = redirectForRoles(roles);
    const response = NextResponse.json({ ok: true, redirectTo, roles, isNew });
    response.cookies.set("qp_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 604800,
    });
    return response;
  } catch (err) {
    return NextResponse.json({ ok: false, reason: "verify_failed", detail: err instanceof Error ? err.message : "unknown" }, { status: 500 });
  }
}
