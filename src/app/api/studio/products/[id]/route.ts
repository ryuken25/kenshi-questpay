import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { updateCreatorServiceSchema } from "@/lib/schemas";
import {
  archiveService,
  getServiceById,
  updateService,
} from "@/lib/studio/store";

export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

function authError(status: number, error: string) {
  return NextResponse.json({ ok: false, error }, { status });
}

function hasStudioRole(roles: string[]): boolean {
  return roles.includes("creator") || roles.includes("super_admin");
}

/**
 * GET /api/studio/products/[id]
 * Owner or super_admin.
 */
export async function GET(_req: NextRequest, { params }: Ctx) {
  const session = await getSession();
  if (!session) return authError(401, "Sign in is required.");
  if (!hasStudioRole(session.roles)) return authError(403, "Creator or super admin required.");

  const product = await getServiceById(params.id);
  if (!product) return authError(404, "Product not found.");

  const isOwner = product.creatorAccountId === session.accountId;
  const isSuper = session.roles.includes("super_admin");
  if (!isOwner && !isSuper) return authError(403, "Forbidden.");

  return NextResponse.json({ ok: true, product });
}

/**
 * PATCH /api/studio/products/[id]
 * Owner or super_admin updates fields / status.
 */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const session = await getSession();
  if (!session) return authError(401, "Sign in is required.");
  if (!hasStudioRole(session.roles)) return authError(403, "Creator or super admin required.");

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return authError(400, "Invalid request body.");
  }

  const parsed = updateCreatorServiceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Validation failed", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  if (Object.keys(parsed.data).length === 0) {
    return authError(400, "No fields to update.");
  }

  const isSuper = session.roles.includes("super_admin");

  try {
    const product = await updateService(params.id, session.accountId, parsed.data, {
      asSuperAdmin: isSuper,
    });
    return NextResponse.json({ ok: true, product });
  } catch (e) {
    const code = (e as Error & { code?: string }).code || (e as Error).message;
    if (code === "not_found") return authError(404, "Product not found.");
    if (code === "forbidden") return authError(403, "Forbidden.");
    if (code === "slug_conflict") return authError(409, "A product with that slug already exists.");
    console.error("[api/studio/products PATCH]", e);
    return authError(500, "Could not update product.");
  }
}

/**
 * DELETE /api/studio/products/[id]
 * Soft-delete → archive. Owner or super_admin.
 */
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const session = await getSession();
  if (!session) return authError(401, "Sign in is required.");
  if (!hasStudioRole(session.roles)) return authError(403, "Creator or super admin required.");

  const isSuper = session.roles.includes("super_admin");

  try {
    const product = await archiveService(params.id, session.accountId, {
      asSuperAdmin: isSuper,
    });
    return NextResponse.json({ ok: true, product });
  } catch (e) {
    const code = (e as Error & { code?: string }).code || (e as Error).message;
    if (code === "not_found") return authError(404, "Product not found.");
    if (code === "forbidden") return authError(403, "Forbidden.");
    console.error("[api/studio/products DELETE]", e);
    return authError(500, "Could not archive product.");
  }
}
