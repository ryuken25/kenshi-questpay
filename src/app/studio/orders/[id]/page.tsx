import { notFound } from "next/navigation";
import StudioShell from "@/components/StudioShell";
import { requireStudioAdmin } from "@/lib/supabase-auth";
import { queryManyOptional, queryOneOptional, hasDatabase } from "@/lib/db";
import { STUDIO_ALLOWED_STATUSES } from "@/lib/payments/order-status";

export const dynamic = "force-dynamic";

const STUDIO_STATUS_OPTIONS = Array.from(STUDIO_ALLOWED_STATUSES);

type OrderRow = Record<string, unknown> & {
  id: string;
  public_order_id: string;
  slug: string;
  status: string;
  customer_name?: string | null;
  contact_method?: string | null;
  contact_value?: string | null;
  project_link?: string | null;
  deadline?: string | null;
  brief?: string | null;
  expected_output?: string | null;
  ref_links?: string | null;
  notes?: string | null;
  amount_human?: string | null;
  token_symbol?: string | null;
  receive_address?: string | null;
  creator_wallet?: string | null;
  creator_account_id?: string | null;
};

type PaymentRow = {
  tx_hash?: string | null;
  from_address?: string | null;
};

type EventRow = {
  id: string;
  event_type: string;
  created_at: string;
};

type SubmissionRow = {
  id: string;
  note: string | null;
  delivery_url: string | null;
  submitted_at: string;
  submitted_by: string | null;
};

type ReleaseRow = {
  id: string;
  status: string | null;
  tx_hash: string | null;
  to_address: string | null;
  amount_human: string | null;
  token_symbol: string | null;
  released_at: string | null;
  failure_reason: string | null;
};

export default async function StudioOrderDetail(
  props: {
    params: Promise<{ id: string }>;
    searchParams?: Promise<{ error?: string }>;
  }
) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const user = await requireStudioAdmin();
  if (!hasDatabase) notFound();

  const [order, payment, events, submissions, release] = await Promise.all([
    queryOneOptional<OrderRow>(`SELECT * FROM orders WHERE id = $1 LIMIT 1`, [params.id]),
    queryOneOptional<PaymentRow>(`SELECT * FROM payments WHERE order_id = $1 LIMIT 1`, [params.id]),
    queryManyOptional<EventRow>(
      `SELECT * FROM questpay_order_events WHERE order_id = $1 ORDER BY created_at DESC`,
      [params.id],
    ),
    queryManyOptional<SubmissionRow>(
      `SELECT id, note, delivery_url, submitted_at, submitted_by
       FROM work_submissions
       WHERE order_id = $1
       ORDER BY submitted_at DESC
       LIMIT 5`,
      [params.id],
    ),
    queryOneOptional<ReleaseRow>(
      `SELECT id, status, tx_hash, to_address, amount_human, token_symbol, released_at, failure_reason
       FROM releases
       WHERE order_id = $1
       LIMIT 1`,
      [params.id],
    ),
  ]);

  if (!order) notFound();

  // Per-order ownership (Agent R F1 IDOR): only the assigned creator or a real env
  // super_admin may view an order's private brief / contact / payment. notFound (not
  // 403) so a creator cannot even probe another creator's order ids.
  const isSuper = user.roles?.includes("super_admin");
  if (!isSuper && order.creator_account_id !== user.id) notFound();

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
              {submissions.map((s) => (
                <div key={s.id} className="rounded-xl bg-[rgba(8,8,14,.72)] p-3 text-sm">
                  <p className="text-xs text-muted">{new Date(s.submitted_at).toLocaleString()}</p>
                  <p className="mt-1 whitespace-pre-wrap">{s.note || "—"}</p>
                  {s.delivery_url ? (
                    <p className="mt-1 break-all text-xs text-[var(--qp-violet-300)]">{s.delivery_url}</p>
                  ) : null}
                </div>
              ))}
              {!submissions.length && <p className="text-sm text-muted">No work submissions yet.</p>}
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
              {events.map((event) => (
                <div key={event.id} className="rounded-xl bg-[rgba(8,8,14,.72)] p-3 text-sm">
                  <b>{event.event_type}</b>
                  <p className="text-xs text-muted">{new Date(event.created_at).toLocaleString()}</p>
                </div>
              ))}
              {!events.length && <p className="text-sm text-muted">No events recorded yet.</p>}
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
