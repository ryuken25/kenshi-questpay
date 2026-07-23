import Link from "next/link";
import StudioShell from "@/components/StudioShell";
import { requireStudioAdmin } from "@/lib/supabase-auth";
import { queryManyOptional } from "@/lib/db";

export const dynamic = "force-dynamic";

type OrderRow = {
  id: string;
  public_order_id: string;
  slug: string;
  status: string;
  token_symbol: string | null;
  amount_human: string | null;
  created_at: string;
};

export default async function StudioDashboard() {
  const user = await requireStudioAdmin();
  // Per-creator scoping (Agent R F1): creator sees only their own; super_admin all.
  const scoped = !user.roles?.includes("super_admin");
  const rows = await queryManyOptional<OrderRow>(
    `SELECT id, public_order_id, slug, status, token_symbol, amount_human, created_at
     FROM orders
     ${scoped ? "WHERE creator_account_id = $1" : ""}
     ORDER BY created_at DESC
     LIMIT 50`,
    scoped ? [user.id] : [],
  );
  const count = (...statuses: string[]) => rows.filter((order) => statuses.includes(order.status)).length;
  return (
    <StudioShell email={user.email || "owner"} showAdmin={user.roles?.includes("super_admin")}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[.2em] text-[var(--qp-violet-300)]">
            Creator Studio
          </p>
          <h1 className="mt-2 font-sora text-3xl font-black">Overview</h1>
          <p className="mt-2 max-w-xl text-sm text-[var(--qp-text-muted)]">
            Custody → work submit → buyer accept → server release. Not a legacy /dashboard shell.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/studio/products" className="rounded-2xl border border-white/10 bg-[var(--qp-surface)] px-5 py-3 text-center text-sm font-black hover:bg-[var(--qp-surface-hover)]">
            Products
          </Link>
          <Link href="/studio/orders" className="rounded-2xl bg-verse-purple px-5 py-3 text-center text-sm font-black">
            Manage orders
          </Link>
        </div>
      </div>
      <section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric label="Awaiting payment" value={count("pending", "awaiting_payment")} />
        <Metric label="Paid / reviewing" value={count("paid", "reviewing", "accepted", "work_submitted")} />
        <Metric label="In progress" value={count("in_progress")} />
        <Metric label="Released / delivered" value={count("delivered", "completed", "released")} />
      </section>
      <section className="mt-6 grid gap-3 sm:grid-cols-3">
        <QuickLink href="/studio/products" title="Products" body="Custom packages + shared catalog CRUD" />
        <QuickLink href="/studio/orders" title="Studio Orders" body="Incoming briefs & status" />
        <QuickLink href="/studio/earnings" title="Earnings" body="Payout / release timeline" />
      </section>
      <section className="mt-8 rounded-[2rem] border border-white/10 bg-[var(--qp-surface)] p-5">
        <h2 className="font-sora text-xl font-black">Recent timeline</h2>
        <div className="mt-4 space-y-2">
          {rows.slice(0, 8).map((order) => (
            <Link
              key={order.id}
              href={`/studio/orders/${order.id}`}
              className="flex min-h-14 items-center justify-between gap-3 rounded-2xl bg-[rgba(8,8,14,.72)] px-4"
            >
              <span>
                <b className="block">{order.public_order_id}</b>
                <span className="text-xs text-muted">
                  {order.slug} · {new Date(order.created_at).toLocaleString()}
                </span>
              </span>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black">{order.status}</span>
            </Link>
          ))}
          {!rows.length && (
            <p className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-sm text-muted">
              New briefs will appear here after checkout.
            </p>
          )}
        </div>
      </section>
    </StudioShell>
  );
}
function QuickLink({ href, title, body }: { href: string; title: string; body: string }) {
  return (
    <Link href={href} className="rounded-2xl border border-white/10 bg-[#07070d] p-4 hover:border-[var(--qp-violet-500)]/40">
      <p className="font-sora text-lg font-black">{title}</p>
      <p className="mt-1 text-xs text-muted">{body}</p>
    </Link>
  );
}
function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#07070d] p-4">
      <p className="text-xs uppercase tracking-wider text-muted">{label}</p>
      <p className="mt-2 text-3xl font-black">{value}</p>
    </div>
  );
}
