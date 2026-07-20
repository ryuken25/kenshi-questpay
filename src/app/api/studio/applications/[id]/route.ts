import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { reviewCreatorApplicationSchema } from "@/lib/schemas";
import { getApplicationById, reviewApplication } from "@/lib/studio/store";

export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

function authError(status: number, error: string) {
  return NextResponse.json({ ok: false, error }, { status });
}

/**
 * GET /api/studio/applications/[id]
 * Owner or super_admin.
 */
export async function GET(_req: NextRequest, { params }: Ctx) {
  const session = await getSession();
  if (!session) return authError(401, "Sign in is required.");

  const application = await getApplicationById(params.id);
  if (!application) return authError(404, "Application not found.");

  const isOwner = application.accountId === session.accountId;
  const isSuper = session.roles.includes("super_admin");
  if (!isOwner && !isSuper) return authError(403, "Forbidden.");

  return NextResponse.json({ ok: true, application });
}

/**
 * PATCH /api/studio/applications/[id]
 * Super admin only — approve or reject. Approving grants creator role.
 */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const session = await getSession();
  if (!session) return authError(401, "Sign in is required.");
  if (!session.roles.includes("super_admin")) return authError(403, "Super admin only.");

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return authError(400, "Invalid request body.");
  }

  const parsed = reviewCreatorApplicationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Validation failed", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const application = await reviewApplication(params.id, session.accountId, parsed.data);
    return NextResponse.json({ ok: true, application });
  } catch (e) {
    const code = (e as Error & { code?: string }).code || (e as Error).message;
    if (code === "not_found") return authError(404, "Application not found.");
    if (code === "not_pending") return authError(409, "Application is not pending.");
    console.error("[api/studio/applications PATCH]", e);
    return authError(500, "Could not review application.");
  }
}
