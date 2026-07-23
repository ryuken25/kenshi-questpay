import { NextRequest, NextResponse } from "next/server";
import { getSession, type QuestPaySession } from "@/lib/auth";
import { hasDatabase, query, queryOneOptional } from "@/lib/db";

// Node-only deps (pg). Never Edge; always dynamic (admin, per-request session).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/**
 * Orders a super-admin may archive or delete: only clearly-abandoned,
 * never-paid intents. This is an ALLOWLIST — any status not listed (paid,
 * released, completed, accepted, work_*, disputed, refunded, payment_submitted,
 * …) is refused, so new/unknown statuses fail closed. Paid evidence orders are
 * therefore un-deletable.
 */
const DELETABLE_ORDER_STATUSES = new Set<string>([
  "pending",
  "awaiting_payment",
  "expired",
  "cancelled",
  "archived",
]);

type AdminOrderRow = {
  id: string;
  public_order_id: string;
  slug: string | null;
  status: string;
  amount_human: string | null;
  token_symbol: string | null;
  account_id: string | null;
  creator_account_id: string | null;
  paid_at: string | null;
};

function jsonError(status: number, error: string, extra?: Record<string, unknown>) {
  return NextResponse.json({ ok: false, error, ...(extra || {}) }, { status });
}

async function requireSuperAdmin(): Promise<
  { ok: true; session: QuestPaySession } | { ok: false; response: NextResponse }
> {
  const session = await getSession();
  if (!session) return { ok: false, response: jsonError(401, "Sign in is required.") };
  if (!session.roles.includes("super_admin")) {
    return { ok: false, response: jsonError(403, "Super admin only.") };
  }
  return { ok: true, session };
}

async function loadOrderForAdmin(publicOrderId: string): Promise<AdminOrderRow | null> {
  return queryOneOptional<AdminOrderRow>(
    `SELECT id, public_order_id, slug, status, amount_human, token_symbol,
            account_id, creator_account_id, paid_at
     FROM orders
     WHERE public_order_id = $1
     LIMIT 1`,
    [publicOrderId],
  );
}

/** Any recorded payment → treat as paid regardless of status (defense-in-depth). */
async function orderHasPayment(orderId: string): Promise<boolean> {
  const row = await queryOneOptional<{ has_payment: boolean }>(
    `SELECT EXISTS (SELECT 1 FROM payments WHERE order_id = $1) AS has_payment`,
    [orderId],
  );
  return Boolean(row?.has_payment);
}

/** Returns a 409 response when the order must NOT be removed, else null. */
async function refuseIfNotDeletable(order: AdminOrderRow): Promise<NextResponse | null> {
  const paidish =
    Boolean(order.paid_at) ||
    !DELETABLE_ORDER_STATUSES.has(order.status) ||
    (await orderHasPayment(order.id));
  if (paidish) {
    return jsonError(409, "order_not_deletable", {
      reason: "Only non-paid orders can be archived or deleted.",
      status: order.status,
    });
  }
  return null;
}

async function writeAudit(
  actorAccountId: string,
  action: string,
  order: AdminOrderRow,
  extra: Record<string, unknown>,
): Promise<void> {
  await query(
    `INSERT INTO admin_audit_log (actor_account_id, action, target_account_id, metadata)
     VALUES ($1, $2, $3, $4::jsonb)`,
    [
      actorAccountId,
      action,
      order.account_id || order.creator_account_id || null,
      JSON.stringify({
        public_order_id: order.public_order_id,
        slug: order.slug,
        previous_status: order.status,
        amount_human: order.amount_human,
        token_symbol: order.token_symbol,
        ...extra,
      }),
    ],
  );
}

/**
 * DELETE /api/admin/orders/[id]  — hard-remove a non-paid order.
 * [id] is the public order id (qp-…). Cascades events (a non-paid order has no
 * payment rows). Refuses paid/released/completed/etc. Writes an audit row.
 */
export async function DELETE(_req: NextRequest, props: Ctx) {
  if (!hasDatabase) return jsonError(503, "Order system is not configured.");
  const gate = await requireSuperAdmin();
  if (!gate.ok) return gate.response;

  const { id } = await props.params;
  const order = await loadOrderForAdmin(id);
  if (!order) return jsonError(404, "Order not found.");

  const refusal = await refuseIfNotDeletable(order);
  if (refusal) return refusal;

  // Atomic guard: the WHERE re-checks paid_at + status, so a concurrent
  // transition to paid between the read and the delete cannot slip through.
  const deleted = await query(
    `DELETE FROM orders
     WHERE id = $1 AND paid_at IS NULL AND status = ANY($2::text[])
     RETURNING id`,
    [order.id, [...DELETABLE_ORDER_STATUSES]],
  );
  if ((deleted.rowCount ?? 0) === 0) {
    return jsonError(409, "order_not_deletable", {
      reason: "Order changed; refusing to delete.",
      status: order.status,
    });
  }

  await writeAudit(gate.session.accountId, "order_deleted", order, { mode: "hard_delete" });
  return NextResponse.json({
    ok: true,
    deleted: true,
    publicOrderId: order.public_order_id,
    previousStatus: order.status,
  });
}

/**
 * POST /api/admin/orders/[id]  { action: "archive" } — reversible soft-archive
 * (status → 'archived', keeps the row + history). Same refuse-paid guard.
 */
export async function POST(req: NextRequest, props: Ctx) {
  if (!hasDatabase) return jsonError(503, "Order system is not configured.");
  const gate = await requireSuperAdmin();
  if (!gate.ok) return gate.response;

  let action = "archive";
  try {
    const body = await req.json();
    if (body && typeof body.action === "string") action = body.action;
  } catch {
    /* empty body → default archive */
  }
  if (action !== "archive") return jsonError(400, "Unsupported action.");

  const { id } = await props.params;
  const order = await loadOrderForAdmin(id);
  if (!order) return jsonError(404, "Order not found.");
  if (order.status === "archived") {
    return NextResponse.json({
      ok: true,
      archived: true,
      publicOrderId: order.public_order_id,
      previousStatus: order.status,
    });
  }

  const refusal = await refuseIfNotDeletable(order);
  if (refusal) return refusal;

  const updated = await query(
    `UPDATE orders
     SET status = 'archived', archived_at = now(), archived_by = $2, updated_at = now()
     WHERE id = $1 AND paid_at IS NULL AND status = ANY($3::text[])
     RETURNING id`,
    [order.id, gate.session.accountId, [...DELETABLE_ORDER_STATUSES]],
  );
  if ((updated.rowCount ?? 0) === 0) {
    return jsonError(409, "order_not_deletable", {
      reason: "Order changed; refusing to archive.",
      status: order.status,
    });
  }

  await writeAudit(gate.session.accountId, "order_archived", order, { mode: "soft_archive" });
  return NextResponse.json({
    ok: true,
    archived: true,
    publicOrderId: order.public_order_id,
    previousStatus: order.status,
  });
}
