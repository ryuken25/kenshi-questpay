import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createCreatorApplicationSchema } from "@/lib/schemas";
import {
  createApplication,
  getPendingApplication,
  listApplicationsForAccount,
  listAllApplications,
} from "@/lib/studio/store";

export const dynamic = "force-dynamic";

function authError(status: number, error: string) {
  return NextResponse.json({ ok: false, error }, { status });
}

/**
 * GET /api/studio/applications
 * - buyer/creator: own applications
 * - super_admin: all applications (optional ?status=)
 */
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return authError(401, "Sign in is required.");

  const status = req.nextUrl.searchParams.get("status") || undefined;
  const isSuper = session.roles.includes("super_admin");

  try {
    if (isSuper && req.nextUrl.searchParams.get("scope") === "all") {
      const applications = await listAllApplications({
        status: status as "pending" | "approved" | "rejected" | "withdrawn" | undefined,
      });
      return NextResponse.json({ ok: true, applications });
    }

    const applications = await listApplicationsForAccount(session.accountId);
    const pending = await getPendingApplication(session.accountId);
    return NextResponse.json({ ok: true, applications, pending });
  } catch (e) {
    console.error("[api/studio/applications GET]", e);
    return authError(500, "Could not load applications.");
  }
}

/**
 * POST /api/studio/applications
 * Authenticated buyer (or any signed-in user without creator yet) submits application.
 * Creators/super_admins are rejected with 409 (already have access).
 */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return authError(401, "Sign in is required.");

  if (session.roles.includes("creator") || session.roles.includes("super_admin")) {
    return authError(409, "You already have Creator Studio access.");
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return authError(400, "Invalid request body.");
  }

  const parsed = createCreatorApplicationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Validation failed", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const application = await createApplication(session.accountId, parsed.data);
    return NextResponse.json({ ok: true, application }, { status: 201 });
  } catch (e) {
    const code = (e as Error & { code?: string }).code || (e as Error).message;
    if (code === "pending_application_exists") {
      return authError(409, "You already have a pending application.");
    }
    console.error("[api/studio/applications POST]", e);
    return authError(500, "Could not submit application.");
  }
}
