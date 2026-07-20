import "server-only";
import { randomUUID } from "node:crypto";
import { getSupabase } from "@/lib/supabase-server";
import type {
  CreatorApplication,
  CreatorApplicationStatus,
  CreatorService,
  CreatorServiceStatus,
} from "@/lib/studio/types";
import type {
  CreateCreatorApplicationInput,
  CreateCreatorServiceInput,
  ReviewCreatorApplicationInput,
  UpdateCreatorServiceInput,
} from "@/lib/schemas";

/* ── In-memory fallback (when Supabase unavailable / tables missing) ─ */

const g = globalThis as unknown as {
  __qpCreatorApps?: Map<string, CreatorApplication>;
  __qpCreatorServices?: Map<string, CreatorService>;
};

function appsStore(): Map<string, CreatorApplication> {
  if (!g.__qpCreatorApps) g.__qpCreatorApps = new Map();
  return g.__qpCreatorApps;
}

function servicesStore(): Map<string, CreatorService> {
  if (!g.__qpCreatorServices) g.__qpCreatorServices = new Map();
  return g.__qpCreatorServices;
}

function nowIso() {
  return new Date().toISOString();
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "service";
}

/* ── Row mappers ───────────────────────────────────────────────────── */

function mapApplication(row: Record<string, unknown>): CreatorApplication {
  return {
    id: String(row.id),
    accountId: String(row.account_id),
    displayName: String(row.display_name ?? ""),
    craft: String(row.craft ?? ""),
    portfolioUrl: row.portfolio_url != null ? String(row.portfolio_url) : null,
    note: String(row.note ?? ""),
    status: row.status as CreatorApplicationStatus,
    reviewedBy: row.reviewed_by != null ? String(row.reviewed_by) : null,
    reviewedAt: row.reviewed_at != null ? String(row.reviewed_at) : null,
    reviewNote: row.review_note != null ? String(row.review_note) : null,
    createdAt: String(row.created_at ?? nowIso()),
    updatedAt: String(row.updated_at ?? nowIso()),
    accountEmail:
      row.account_email != null
        ? String(row.account_email)
        : row.accounts && typeof row.accounts === "object" && row.accounts !== null
          ? String((row.accounts as { primary_email?: string }).primary_email ?? "") || null
          : null,
  };
}

function mapService(row: Record<string, unknown>): CreatorService {
  return {
    id: String(row.id),
    creatorAccountId: String(row.creator_account_id),
    slug: String(row.slug ?? ""),
    title: String(row.title ?? ""),
    description: String(row.description ?? ""),
    outcome: String(row.outcome ?? ""),
    usdPrice: Number(row.usd_price ?? 0),
    delivery: String(row.delivery ?? ""),
    revisions: String(row.revisions ?? ""),
    status: row.status as CreatorServiceStatus,
    sortOrder: Number(row.sort_order ?? 0),
    createdAt: String(row.created_at ?? nowIso()),
    updatedAt: String(row.updated_at ?? nowIso()),
  };
}

function isMissingRelation(error: { message?: string; code?: string } | null | undefined): boolean {
  if (!error) return false;
  const msg = (error.message || "").toLowerCase();
  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    msg.includes("does not exist") ||
    msg.includes("could not find the table") ||
    msg.includes("schema cache")
  );
}

/* ── Creator applications ──────────────────────────────────────────── */

export async function listApplicationsForAccount(accountId: string): Promise<CreatorApplication[]> {
  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb
      .from("creator_applications")
      .select("*")
      .eq("account_id", accountId)
      .order("created_at", { ascending: false });
    if (!error && data) return data.map((r: any) => mapApplication(r as Record<string, unknown>));
    if (error && !isMissingRelation(error)) {
      console.error("[studio] listApplicationsForAccount", error.message);
    }
  }
  return [...appsStore().values()]
    .filter((a) => a.accountId === accountId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getPendingApplication(accountId: string): Promise<CreatorApplication | null> {
  const all = await listApplicationsForAccount(accountId);
  return all.find((a) => a.status === "pending") ?? null;
}

export async function listAllApplications(opts?: {
  status?: CreatorApplicationStatus;
  limit?: number;
}): Promise<CreatorApplication[]> {
  const limit = opts?.limit ?? 100;
  const sb = getSupabase();
  if (sb) {
    let q = sb
      .from("creator_applications")
      .select("*, accounts(primary_email)")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (opts?.status) q = q.eq("status", opts.status);
    const { data, error } = await q;
    if (!error && data) {
      return data.map((r: any) => {
        const row = r as Record<string, unknown>;
        const mapped = mapApplication(row);
        const accounts = row.accounts as { primary_email?: string } | null;
        if (accounts?.primary_email) mapped.accountEmail = accounts.primary_email;
        return mapped;
      });
    }
    if (error && !isMissingRelation(error)) {
      console.error("[studio] listAllApplications", error.message);
    }
  }

  let rows = [...appsStore().values()];
  if (opts?.status) rows = rows.filter((a) => a.status === opts.status);
  return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit);
}

export async function createApplication(
  accountId: string,
  input: CreateCreatorApplicationInput,
): Promise<CreatorApplication> {
  const existing = await getPendingApplication(accountId);
  if (existing) {
    const err = new Error("pending_application_exists");
    (err as Error & { code?: string }).code = "pending_application_exists";
    throw err;
  }

  const payload = {
    account_id: accountId,
    display_name: input.displayName,
    craft: input.craft,
    portfolio_url: input.portfolioUrl || null,
    note: input.note,
    status: "pending" as const,
  };

  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb.from("creator_applications").insert(payload).select("*").single();
    if (!error && data) return mapApplication(data as Record<string, unknown>);
    if (error && !isMissingRelation(error)) {
      if (error.code === "23505") {
        const e = new Error("pending_application_exists");
        (e as Error & { code?: string }).code = "pending_application_exists";
        throw e;
      }
      console.error("[studio] createApplication", error.message);
      throw new Error("create_failed");
    }
  }

  const ts = nowIso();
  const app: CreatorApplication = {
    id: randomUUID(),
    accountId,
    displayName: input.displayName,
    craft: input.craft,
    portfolioUrl: input.portfolioUrl || null,
    note: input.note,
    status: "pending",
    reviewedBy: null,
    reviewedAt: null,
    reviewNote: null,
    createdAt: ts,
    updatedAt: ts,
  };
  appsStore().set(app.id, app);
  return app;
}

export async function getApplicationById(id: string): Promise<CreatorApplication | null> {
  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb.from("creator_applications").select("*").eq("id", id).maybeSingle();
    if (!error && data) return mapApplication(data as Record<string, unknown>);
    if (error && !isMissingRelation(error)) {
      console.error("[studio] getApplicationById", error.message);
    }
  }
  return appsStore().get(id) ?? null;
}

export async function reviewApplication(
  id: string,
  reviewerAccountId: string,
  input: ReviewCreatorApplicationInput,
): Promise<CreatorApplication> {
  const current = await getApplicationById(id);
  if (!current) {
    const e = new Error("not_found");
    (e as Error & { code?: string }).code = "not_found";
    throw e;
  }
  if (current.status !== "pending") {
    const e = new Error("not_pending");
    (e as Error & { code?: string }).code = "not_pending";
    throw e;
  }

  const ts = nowIso();
  const patch = {
    status: input.status,
    reviewed_by: reviewerAccountId,
    reviewed_at: ts,
    review_note: input.reviewNote || null,
    updated_at: ts,
  };

  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb
      .from("creator_applications")
      .update(patch)
      .eq("id", id)
      .eq("status", "pending")
      .select("*")
      .maybeSingle();

    if (!error && data) {
      const app = mapApplication(data as Record<string, unknown>);
      if (input.status === "approved") {
        await grantCreatorRole(app.accountId, reviewerAccountId, id);
      }
      await writeAdminAudit(reviewerAccountId, `creator_application_${input.status}`, app.accountId, {
        applicationId: id,
        reviewNote: input.reviewNote || null,
      });
      return app;
    }
    if (error && !isMissingRelation(error)) {
      console.error("[studio] reviewApplication", error.message);
      throw new Error("review_failed");
    }
  }

  const updated: CreatorApplication = {
    ...current,
    status: input.status,
    reviewedBy: reviewerAccountId,
    reviewedAt: ts,
    reviewNote: input.reviewNote || null,
    updatedAt: ts,
  };
  appsStore().set(id, updated);

  if (input.status === "approved") {
    await grantCreatorRole(updated.accountId, reviewerAccountId, id);
  }
  await writeAdminAudit(reviewerAccountId, `creator_application_${input.status}`, updated.accountId, {
    applicationId: id,
    reviewNote: input.reviewNote || null,
  });
  return updated;
}

async function grantCreatorRole(
  accountId: string,
  grantedBy: string,
  applicationId: string,
): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;

  // Upsert-style: clear prior revoke if re-approving
  const { data: existing } = await sb
    .from("account_roles")
    .select("account_id, role, revoked_at")
    .eq("account_id", accountId)
    .eq("role", "creator")
    .maybeSingle();

  if (existing && !existing.revoked_at) return;

  if (existing?.revoked_at) {
    await sb
      .from("account_roles")
      .update({
        revoked_at: null,
        revoked_by: null,
        granted_by: grantedBy,
        grant_reason: `creator application ${applicationId} approved`,
        granted_at: nowIso(),
      })
      .eq("account_id", accountId)
      .eq("role", "creator");
    return;
  }

  await sb.from("account_roles").insert({
    account_id: accountId,
    role: "creator",
    granted_by: grantedBy,
    grant_reason: `creator application ${applicationId} approved`,
  });
}

async function writeAdminAudit(
  actorAccountId: string,
  action: string,
  targetAccountId: string | null,
  metadata: Record<string, unknown>,
): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  await sb.from("admin_audit_log").insert({
    actor_account_id: actorAccountId,
    action,
    target_account_id: targetAccountId,
    metadata,
  });
}

/* ── Creator services (products) ───────────────────────────────────── */

export async function listServicesForCreator(
  creatorAccountId: string,
  opts?: { includeArchived?: boolean },
): Promise<CreatorService[]> {
  const sb = getSupabase();
  if (sb) {
    let q = sb
      .from("creator_services")
      .select("*")
      .eq("creator_account_id", creatorAccountId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (!opts?.includeArchived) {
      q = q.neq("status", "archived");
    }
    const { data, error } = await q;
    if (!error && data) return data.map((r: any) => mapService(r as Record<string, unknown>));
    if (error && !isMissingRelation(error)) {
      console.error("[studio] listServicesForCreator", error.message);
    }
  }

  let rows = [...servicesStore().values()].filter((s) => s.creatorAccountId === creatorAccountId);
  if (!opts?.includeArchived) rows = rows.filter((s) => s.status !== "archived");
  return rows.sort((a, b) => a.sortOrder - b.sortOrder || b.createdAt.localeCompare(a.createdAt));
}

export async function listAllServices(opts?: {
  status?: CreatorServiceStatus;
  limit?: number;
}): Promise<CreatorService[]> {
  const limit = opts?.limit ?? 100;
  const sb = getSupabase();
  if (sb) {
    let q = sb
      .from("creator_services")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (opts?.status) q = q.eq("status", opts.status);
    const { data, error } = await q;
    if (!error && data) return data.map((r: any) => mapService(r as Record<string, unknown>));
    if (error && !isMissingRelation(error)) {
      console.error("[studio] listAllServices", error.message);
    }
  }

  let rows = [...servicesStore().values()];
  if (opts?.status) rows = rows.filter((s) => s.status === opts.status);
  return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit);
}

export async function getServiceById(id: string): Promise<CreatorService | null> {
  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb.from("creator_services").select("*").eq("id", id).maybeSingle();
    if (!error && data) return mapService(data as Record<string, unknown>);
    if (error && !isMissingRelation(error)) {
      console.error("[studio] getServiceById", error.message);
    }
  }
  return servicesStore().get(id) ?? null;
}

export async function createService(
  creatorAccountId: string,
  input: CreateCreatorServiceInput,
): Promise<CreatorService> {
  const baseSlug = input.slug?.trim() || slugify(input.title);
  let slug = baseSlug;

  // Ensure uniqueness for this creator in memory / attempt insert
  const existing = await listServicesForCreator(creatorAccountId, { includeArchived: true });
  if (existing.some((s) => s.slug === slug)) {
    slug = `${baseSlug}-${Date.now().toString(36).slice(-4)}`;
  }

  const payload = {
    creator_account_id: creatorAccountId,
    slug,
    title: input.title,
    description: input.description,
    outcome: input.outcome || "",
    usd_price: input.usdPrice,
    delivery: input.delivery,
    revisions: input.revisions,
    status: input.status ?? "draft",
    sort_order: input.sortOrder ?? 0,
  };

  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb.from("creator_services").insert(payload).select("*").single();
    if (!error && data) return mapService(data as Record<string, unknown>);
    if (error && !isMissingRelation(error)) {
      if (error.code === "23505") {
        const e = new Error("slug_conflict");
        (e as Error & { code?: string }).code = "slug_conflict";
        throw e;
      }
      console.error("[studio] createService", error.message);
      throw new Error("create_failed");
    }
  }

  const ts = nowIso();
  const service: CreatorService = {
    id: randomUUID(),
    creatorAccountId,
    slug,
    title: input.title,
    description: input.description,
    outcome: input.outcome || "",
    usdPrice: input.usdPrice,
    delivery: input.delivery,
    revisions: input.revisions,
    status: input.status ?? "draft",
    sortOrder: input.sortOrder ?? 0,
    createdAt: ts,
    updatedAt: ts,
  };
  servicesStore().set(service.id, service);
  return service;
}

export async function updateService(
  id: string,
  creatorAccountId: string,
  input: UpdateCreatorServiceInput,
  opts?: { asSuperAdmin?: boolean },
): Promise<CreatorService> {
  const current = await getServiceById(id);
  if (!current) {
    const e = new Error("not_found");
    (e as Error & { code?: string }).code = "not_found";
    throw e;
  }
  if (!opts?.asSuperAdmin && current.creatorAccountId !== creatorAccountId) {
    const e = new Error("forbidden");
    (e as Error & { code?: string }).code = "forbidden";
    throw e;
  }

  const patch: Record<string, unknown> = { updated_at: nowIso() };
  if (input.title !== undefined) patch.title = input.title;
  if (input.slug !== undefined) patch.slug = input.slug;
  if (input.description !== undefined) patch.description = input.description;
  if (input.outcome !== undefined) patch.outcome = input.outcome;
  if (input.usdPrice !== undefined) patch.usd_price = input.usdPrice;
  if (input.delivery !== undefined) patch.delivery = input.delivery;
  if (input.revisions !== undefined) patch.revisions = input.revisions;
  if (input.status !== undefined) patch.status = input.status;
  if (input.sortOrder !== undefined) patch.sort_order = input.sortOrder;

  const sb = getSupabase();
  if (sb) {
    let q = sb.from("creator_services").update(patch).eq("id", id);
    if (!opts?.asSuperAdmin) q = q.eq("creator_account_id", creatorAccountId);
    const { data, error } = await q.select("*").maybeSingle();
    if (!error && data) return mapService(data as Record<string, unknown>);
    if (error && !isMissingRelation(error)) {
      if (error.code === "23505") {
        const e = new Error("slug_conflict");
        (e as Error & { code?: string }).code = "slug_conflict";
        throw e;
      }
      console.error("[studio] updateService", error.message);
      throw new Error("update_failed");
    }
  }

  const updated: CreatorService = {
    ...current,
    title: input.title ?? current.title,
    slug: input.slug ?? current.slug,
    description: input.description ?? current.description,
    outcome: input.outcome ?? current.outcome,
    usdPrice: input.usdPrice ?? current.usdPrice,
    delivery: input.delivery ?? current.delivery,
    revisions: input.revisions ?? current.revisions,
    status: input.status ?? current.status,
    sortOrder: input.sortOrder ?? current.sortOrder,
    updatedAt: String(patch.updated_at),
  };
  servicesStore().set(id, updated);
  return updated;
}

export async function archiveService(
  id: string,
  creatorAccountId: string,
  opts?: { asSuperAdmin?: boolean },
): Promise<CreatorService> {
  return updateService(id, creatorAccountId, { status: "archived" }, opts);
}
