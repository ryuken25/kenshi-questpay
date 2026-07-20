import { notFound } from "next/navigation";
import StudioShell from "@/components/StudioShell";
import { requireStudioAdmin } from "@/lib/supabase-auth";
import { getSupabase } from "@/lib/supabase-server";
import { STUDIO_ALLOWED_STATUSES } from "@/lib/payments/order-status";

export const dynamic = "force-dynamic";

const STUDIO_STATUS_OPTIONS = Array.from(STUDIO_ALLOWED_STATUSES);

export default async function StudioOrderDetail({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { error?: string };
}) {
  const user = await requireStudioAdmin();
  const sb = getSupabase();
  if (!sb) notFound();

  const [{ data: order }, { data: payment }, { data: events }, { data: submissions }, { data: release }] =
    await Promise.all([
      sb.from("orders").select("*").eq("id", params.id).single(),
      sb.from("payments").select("*").eq("order_id", params.id).maybeSingle(),
      sb
        .from("questpay_order_events")
        .select("*")
        .eq("order_id", params.id)
        .order("created_at", { ascending: false }),
      sb
        .from("work_submissions")
        .select("id, note, delivery_url, submitted_at, submitted_by")
        .eq("order_id", params.id)
        .order("submitted_at", { ascending: false })
        .limit(5),
      sb
        .from("releases")
        .select("id, status, tx_hash, to_address, amount_human, token_symbol, released_at, failure_reason")
        .eq("order_id", params.id)
        .maybeSingle(),
    ]);

  if (!order) notFound();

  const systemLocked = ["accepted", "released", "completed", "cancelled", "expired", "refunded", "disputed"].includes(
    order.status,
  );
  const canEditLifecycle =
    !systemLocked &&
    ["paid", "in_progress", "work_submitted", "reviewing", "awaiting_client", "ready_for_review", "delivered"].includes(
      order.status,
    );

  return (
    <StudioShell email={user.email || "owner"} showAdmin={user.roles?.includes("super_admin")}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-mono text-sm text-[var(--qp-violet-300)]">{order.public_order_id}</p>
          <h1 className="font-sora text-3xl font-black">{order.slug}</h1>
        </div>
        <span className="rounded-full bg-white/10 px-4 py-2 text-sm font-black">{order.status}</span>
      </div>

      {searchParams?.error ? (
        <p className="mt-4 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-100">
          {searchParams.error}
        </p>
      ) : null}

      <div className="mt-6 grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
        <section className="space-y-4 rounded-[2rem] border border-white/10 bg-[var(--qp-surface)] p-5">
          <h2 className="font-sora text-xl font-black">Private brief</h2>
          <Field label="Client" value={order.customer_name} />
          <Field label="Contact" value={`${order.contact_method || ""}: ${order.contact_value || ""}`} />
          <Field label="Project" value={order.project_link} />
          <Field label="Deadline" value={order.deadline} />
          <Field label="Main problem" value={order.brief} />
          <Field label="Expected output" value={order.expected_output} />
          <Field label="References" value={order.ref_links} />
          <Field label="Notes" value={order.notes} />
        </section>

        <section className="space-y-5">
          <div className="rounded-[2rem] border border-white/10 bg-[var(--qp-surface)] p-5">
            <h2 className="font-sora text-xl font-black">Lifecycle</h2>
            <p className="mt-2 text-xs leading-5 text-muted">
              Studio may only set work ops statuses.{" "}
              <b className="text-secondary">paid / accepted / released / completed</b> are system- or
              buyer-controlled and cannot be forced here.
            </p>

            {canEditLifecycle ? (
              <form
                action={`/api/studio/orders/${order.id}/status`}
                method="post"
                className="mt-4 grid gap-2"
              >
                <select
                  name="status"
                  defaultValue={
                    STUDIO_STATUS_OPTIONS.includes(order.status) ? order.status : "in_progress"
                  }
                  className="min-h-12 rounded-2xl bg-[rgba(8,11,24,.56)] px-4"
                >
                  {STUDIO_STATUS_OPTIONS.map((x) => (
                    <option key={x} value={x}>
                      {x}
                    </option>
                  ))}
                </select>
                <button className="min-h-12 rounded-2xl bg-verse-purple font-black">
                  Update work status + log event
                </button>
              </form>
            ) : (
              <p className="mt-4 rounded-2xl border border-white/10 bg-[rgba(8,8,14,.72)] p-4 text-sm text-secondary">
                {systemLocked
                  ? `Status "${order.status}" is locked. Custody release runs only after buyer accept via the server release path.`
                  : `Current status "${order.status}" is not studio-editable. Payment verify and buyer accept set money statuses.`}
              </p>
            )}
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-[var(--qp-surface)] p-5">
            <h2 className="font-sora text-xl font-black">Payment snapshot</h2>
            <div className="mt-3 space-y-2 text-sm">
              <Field label="Expected" value={`${order.amount_human} ${order.token_symbol}`} />
              <Field label="Receiver (custody)" value={order.receive_address} />
              <Field label="Creator wallet" value={order.creator_wallet} />
              <Field label="Transaction" value={payment?.tx_hash} />
              <Field label="Buyer" value={payment?.from_address} />
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-[var(--qp-surface)] p-5">
            <h2 className="font-sora text-xl font-black">Work submissions</h2>
            <div className="mt-3 space-y-2">
              {(submissions || []).map((s) => (
                <div key={s.id} className="rounded-xl bg-[rgba(8,8,14,.72)] p-3 text-sm">
                  <p className="text-xs text-muted">{new Date(s.submitted_at).toLocaleString()}</p>
                  <p className="mt-1 whitespace-pre-wrap">{s.note || "—"}</p>
                  {s.delivery_url ? (
                    <p className="mt-1 break-all text-xs text-[var(--qp-violet-300)]">{s.delivery_url}</p>
                  ) : null}
                </div>
              ))}
              {!submissions?.length && <p className="text-sm text-muted">No work submissions yet.</p>}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-[var(--qp-surface)] p-5">
            <h2 className="font-sora text-xl font-black">Release</h2>
            <div className="mt-3 space-y-2 text-sm">
              <Field label="Release status" value={release?.status || "—"} />
              <Field label="Tx" value={release?.tx_hash} />
              <Field label="To" value={release?.to_address} />
              <Field
                label="Amount"
                value={
                  release
                    ? `${release.amount_human} ${release.token_symbol}`
                    : "—"
                }
              />
              <Field label="Released at" value={release?.released_at} />
              <Field label="Failure" value={release?.failure_reason} />
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-[var(--qp-surface)] p-5">
            <h2 className="font-sora text-xl font-black">Timeline</h2>
            <div className="mt-3 space-y-2">
              {(events || []).map((event) => (
                <div key={event.id} className="rounded-xl bg-[rgba(8,8,14,.72)] p-3 text-sm">
                  <b>{event.event_type}</b>
                  <p className="text-xs text-muted">{new Date(event.created_at).toLocaleString()}</p>
                </div>
              ))}
              {!events?.length && <p className="text-sm text-muted">No events recorded yet.</p>}
            </div>
          </div>
        </section>
      </div>
    </StudioShell>
  );
}

function Field({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="rounded-2xl bg-[rgba(8,8,14,.72)] p-4">
      <p className="text-xs uppercase tracking-wider text-muted">{label}</p>
      <p className="mt-2 whitespace-pre-wrap break-words text-sm text-secondary">
        {String(value || "—")}
      </p>
    </div>
  );
}
