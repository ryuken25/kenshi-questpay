import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAuth } from "@/lib/supabase-auth";
import { NEXT_PUBLIC_SITE_URL, SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/server-config";
import { sanitizeNextPath } from "@/lib/auth";
import { magicLinkSchema } from "@/lib/schemas";

type MagicLinkState =
  | "accepted"
  | "invalid_email"
  | "rate_limited"
  | "configuration_error";

function json(state: MagicLinkState, message: string, status: number) {
  return NextResponse.json({ ok: state === "accepted", state, message }, { status });
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json("invalid_email", "Enter a valid email address.", 400);
  }

  const parsed = magicLinkSchema.safeParse(body);
  if (!parsed.success) {
    return json("invalid_email", "Enter a valid email address.", 400);
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error("[magic-link] Supabase auth is not configured (missing URL or anon key).");
    return json("configuration_error", "Sign-in is temporarily unavailable. Please try again later.", 500);
  }

  const email = parsed.data.email.trim().toLowerCase();
  const nextPath = sanitizeNextPath(parsed.data.next) ?? "/account";
  const intent = parsed.data.intent?.trim() || "buyer";
  const emailRedirectTo = `${NEXT_PUBLIC_SITE_URL}/auth/callback?next=${encodeURIComponent(nextPath)}`;

  try {
    const auth = getSupabaseAuth();
    const { error } = await auth.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo,
        shouldCreateUser: true,
        data: { requested_intent: intent },
      },
    });

    if (error) {
      const status = (error as { status?: number }).status;
      if (status === 429) {
        return json("rate_limited", "Too many requests. Please wait a moment before requesting another link.", 429);
      }
      console.error("[magic-link] signInWithOtp failed:", error.message);
      return json("configuration_error", "We couldn't send the link right now. Please try again shortly.", 500);
    }

    return json(
      "accepted",
      "Check your inbox. If the address can receive a QuestPay sign-in link, it should arrive shortly.",
      200,
    );
  } catch (err) {
    console.error("[magic-link] Unexpected error:", err instanceof Error ? err.message : err);
    return json("configuration_error", "We couldn't send the link right now. Please try again shortly.", 500);
  }
}
