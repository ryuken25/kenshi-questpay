import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sendStudioTestEmail } from "@/lib/email";
import { NEXT_PUBLIC_SITE_URL } from "@/lib/server-config";

// Node-only deps (pg / nodemailer / viem RPC) — pin to the Node.js runtime, never Edge.
export const runtime = "nodejs";

// SUPER-ADMIN ONLY (Agent R F6). The delivery test triggers a real outbound send, so a
// plain `creator` must not be able to fire it. Authorization is the env-derived session
// role (deriveRoles → isEnvSuperAdmin), NEVER the studio identity's display roles.
export async function POST() {
  const session = await getSession();
  if (!session || !session.roles.includes("super_admin")) {
    return NextResponse.json({ error: "Super admin only." }, { status: 403 });
  }
  const ok = await sendStudioTestEmail();
  return NextResponse.redirect(
    `${NEXT_PUBLIC_SITE_URL}/studio/settings?emailTest=${ok ? "sent" : "failed"}`,
    303,
  );
}
