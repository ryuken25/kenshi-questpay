import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createCreatorServiceSchema } from "@/lib/schemas";
import {
  createService,
  listAllServices,
  listServicesForCreator,
} from "@/lib/studio/store";

export const dynamic = "force-dynamic";

function authError(status: number, error: string) {
  return NextResponse.json({ ok: false, error }, { status });
}

function hasStudioRole(roles: string[]): boolean {
  return roles.includes("creator") || roles.includes("super_admin");
}

/**
 * GET /api/studio/products
 * - creator: own products
 * - super_admin + ?scope=all: all products
 */
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return authError(401, "Sign in is required.");
  if (!hasStudioRole(session.roles)) return authError(403, "Creator or super admin required.");

  const isSuper = session.roles.includes("super_admin");
  const scopeAll = isSuper && req.nextUrl.searchParams.get("scope") === "all";
  const includeArchived = req.nextUrl.searchParams.get("archived") === "1";
  const status = req.nextUrl.searchParams.get("status") || undefined;

  try {
    if (scopeAll) {
      const products = await listAllServices({
        status: status as "draft" | "active" | "paused" | "archived" | undefined,
      });
      return NextResponse.json({ ok: true, products });
    }

    const products = await listServicesForCreator(session.accountId, { includeArchived });
    return NextResponse.json({ ok: true, products });
  } catch (e) {
    console.error("[api/studio/products GET]", e);
    return authError(500, "Could not load products.");
  }
}

/**
 * POST /api/studio/products
 * Creator or super_admin creates a product owned by the caller.
 */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return authError(401, "Sign in is required.");
  if (!hasStudioRole(session.roles)) return authError(403, "Creator or super admin required.");

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return authError(400, "Invalid request body.");
  }

  const parsed = createCreatorServiceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Validation failed", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const product = await createService(session.accountId, parsed.data);
    return NextResponse.json({ ok: true, product }, { status: 201 });
  } catch (e) {
    const code = (e as Error & { code?: string }).code || (e as Error).message;
    if (code === "slug_conflict") return authError(409, "A product with that slug already exists.");
    console.error("[api/studio/products POST]", e);
    return authError(500, "Could not create product.");
  }
}
