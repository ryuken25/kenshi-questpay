import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { upsertProfile } from "@/lib/profile";
import { profileSchema } from "@/lib/schemas";

/**
 * Dedicated first-time onboarding endpoint. Functionally the same write path
 * as `PUT /api/profile` (both coalesce `onboarding_completed_at`), kept as a
 * separate route so onboarding UI has a stable, semantically distinct target.
 */
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Sign in is required." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid profile data.", issues: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const profile = await upsertProfile(session.accountId, parsed.data);
    return NextResponse.json({ ok: true, profile });
  } catch {
    return NextResponse.json({ error: "Could not save profile. Please try again." }, { status: 500 });
  }
}
