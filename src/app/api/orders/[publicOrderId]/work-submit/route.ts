import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSupabase } from "@/lib/supabase-server";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

const workSubmitSchema = z.object({
  note: z.string().trim().min(1).max(5000),
  deliveryUrl: z.string().url().optional().or(z.literal("")),
  links: z.array(z.string().url()).max(20).optional().default([]),
  fileUrls: z.array(z.string().url()).max(20).optional().default([]),
});

/** Statuses from which creator may submit / re-submit work. */
const SUBMITTABLE = new Set([
  "paid",
  "in_progress",
  "reviewing",
  "awaiting_client",
  "ready_for_review",
  "delivered",
  "work_submitted",
]);

/**
 * POST /api/orders/[publicOrderId]/work-submit
 * Creator submits work proof. Moves order → work_submitted.
 * Does not touch paid/accepted/released (those are system/buyer only).
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { publicOrderId: string } },
) {
  const sb = getSupabase();
  if (!sb) {
    return NextResponse.json({ error: "Order system is not configured." }, { status: 503 });
  }

  const { publicOrderId } = params;
  if (!publicOrderId || !publicOrderId.startsWith("qp-")) {
    return NextResponse.json({ error: "Invalid order ID." }, { status: 400 });
  }

  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const isCreator = session.roles.includes("creator") || session.roles.includes("super_admin");
  if (!isCreator) {
    return NextResponse.json({ error: "Creator role required." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = workSubmitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.issues },
      { status: 400 },
    );
  }

  const { data: order, error: orderErr } = await sb
    .from("orders")
    .select("id, public_order_id, status, creator_account_id")
    .eq("public_order_id", publicOrderId)
    .single();

  if (orderErr || !order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  if (["accepted", "released", "completed", "cancelled", "expired", "refunded"].includes(order.status)) {
    return NextResponse.json(
      { error: `Cannot submit work for order in status ${order.status}.` },
      { status: 409 },
    );
  }

  if (!SUBMITTABLE.has(order.status)) {
    return NextResponse.json(
      { error: `Order is not ready for work submission (status ${order.status}).` },
      { status: 409 },
    );
  }

  // If order is assigned to a specific creator, enforce ownership (super_admin bypass).
  if (
    order.creator_account_id &&
    order.creator_account_id !== session.accountId &&
    !session.roles.includes("super_admin")
  ) {
    return NextResponse.json({ error: "Not the assigned creator for this order." }, { status: 403 });
  }

  const { note, deliveryUrl, links, fileUrls } = parsed.data;
  const now = new Date().toISOString();

  const { data: submission, error: subErr } = await sb
    .from("work_submissions")
    .insert({
      order_id: order.id,
      submitted_by: session.accountId,
      note,
      delivery_url: deliveryUrl || null,
      links: links || [],
      file_urls: fileUrls || [],
      submitted_at: now,
      metadata: { actor: session.accountId },
    })
    .select("id, submitted_at")
    .single();

  if (subErr) {
    return NextResponse.json(
      { error: "Failed to record work submission.", detail: subErr.message },
      { status: 500 },
    );
  }

  const { error: statusErr } = await sb
    .from("orders")
    .update({
      status: "work_submitted",
      work_submitted_at: now,
      updated_at: now,
    })
    .eq("id", order.id)
    .in("status", Array.from(SUBMITTABLE));

  if (statusErr) {
    return NextResponse.json(
      { error: "Submission saved but status update failed.", detail: statusErr.message },
      { status: 500 },
    );
  }

  await sb.from("questpay_order_events").insert({
    order_id: order.id,
    event_type: "work_submitted",
    from_status: order.status,
    to_status: "work_submitted",
    metadata: {
      actor: session.accountId,
      submission_id: submission.id,
      delivery_url: deliveryUrl || null,
      link_count: (links || []).length,
      file_count: (fileUrls || []).length,
    },
  });

  return NextResponse.json({
    ok: true,
    publicOrderId,
    status: "work_submitted",
    submissionId: submission.id,
    submittedAt: submission.submitted_at,
  });
}
