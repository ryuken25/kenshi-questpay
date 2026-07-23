import { NextRequest, NextResponse } from "next/server";
import { requireStudioAdmin } from "@/lib/supabase-auth";
import { getSupabase } from "@/lib/supabase-server";
import { NEXT_PUBLIC_SITE_URL } from "@/lib/server-config";
import {
  STUDIO_ALLOWED_STATUSES,
  STUDIO_BLOCKED_STATUSES,
  canStudioTransition,
  isStudioAllowedStatus,
} from "@/lib/payments/order-status";
import { recordOrderEvent } from "@/lib/order-events";

// Node-only deps (pg / nodemailer / viem RPC) — pin to the Node.js runtime, never Edge.
export const runtime = "nodejs";

export const dynamic = "force-dynamic";

/**
 * Studio lifecycle updates — work ops only.
 *
 * Explicitly blocked (never studio-forceable):
 * - paid / awaiting_payment / pending / payment_submitted  (payment verify only)
 * - accepted                                              (buyer accept only)
 * - released / completed                                  (release worker only)
 * - cancelled / expired / refunded / disputed             (admin/system)
 */
export async function POST(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const user = await requireStudioAdmin();
  const form = await request.formData();
  const status = String(form.get("status") || "").trim();
  const wantsJson =
    request.headers.get("accept")?.includes("application/json") ||
    request.headers.get("content-type")?.includes("application/json");

  const fail = (message: string, code: number) => {
    if (wantsJson) {
      return NextResponse.json({ error: message }, { status: code });
    }
    // Form posts: bounce back with error query (no silent success).
    return NextResponse.redirect(
      `${NEXT_PUBLIC_SITE_URL}/studio/orders/${params.id}?error=${encodeURIComponent(message)}`,
      303,
    );
  };

  if (!status) {
    return fail("Status is required.", 400);
  }

  if (STUDIO_BLOCKED_STATUSES.has(status) || !isStudioAllowedStatus(status)) {
    return fail(
      `Status "${status}" cannot be set from Studio. Paid/accepted/released/completed are system- or buyer-controlled.`,
      403,
    );
  }

  if (!STUDIO_ALLOWED_STATUSES.has(status)) {
    return fail("Invalid status.", 400);
  }

  const sb = getSupabase();
  if (!sb) {
    return fail("Order system unavailable.", 503);
  }

  const { data: order } = await sb
    .from("orders")
    .select("id, status")
    .eq("id", params.id)
    .single();

  if (!order) {
    return fail("Order not found.", 404);
  }

  // Terminal / money statuses cannot be moved by studio at all.
  if (
    ["accepted", "released", "completed", "cancelled", "expired", "refunded", "disputed"].includes(
      order.status,
    )
  ) {
    return fail(
      `Order is in system-controlled status "${order.status}" and cannot be changed from Studio.`,
      409,
    );
  }

  if (!canStudioTransition(order.status, status)) {
    return fail(
      `Transition ${order.status} → ${status} is not allowed for Studio.`,
      409,
    );
  }

  const now = new Date().toISOString();
  const patch: Record<string, unknown> = {
    status,
    updated_at: now,
  };
  if (status === "delivered") {
    patch.delivered_at = now;
  }
  if (status === "work_submitted") {
    patch.work_submitted_at = now;
  }

  const { error } = await sb.from("orders").update(patch).eq("id", params.id).eq("status", order.status);
  if (error) {
    return fail("Status update failed.", 500);
  }

  await sb.from("questpay_order_events").insert({
    order_id: params.id,
    event_type: "status_changed",
    from_status: order.status,
    to_status: status,
    metadata: {
      actor: user.email,
      actor_id: user.id,
      channel: "studio",
      allowed_set: Array.from(STUDIO_ALLOWED_STATUSES),
    },
  });

  // Additive buyer/creator-facing lifecycle-feed hook (after the commit above).
  await recordOrderEvent({
    orderId: params.id,
    actorRole: user.roles.includes("creator") ? "creator" : "admin",
    eventType: "status_change",
    fromStatus: order.status,
    toStatus: status,
  });

  if (wantsJson) {
    return NextResponse.json({ ok: true, from: order.status, to: status });
  }

  return NextResponse.redirect(`${NEXT_PUBLIC_SITE_URL}/studio/orders/${params.id}`, 303);
}
