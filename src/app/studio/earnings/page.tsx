import Link from "next/link";
import StudioShell from "@/components/StudioShell";
import { requireStudioAdmin } from "@/lib/supabase-auth";
import { getSupabase } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

const RELEASED = new Set(["released", "completed", "delivered"]);
const IN_FLIGHT = new Set(["paid", "work_submitted", "accepted", "in_progress", "reviewing"]);

export default async function StudioEarningsPage() {
  const user = await requireStudioAdmin();
  const sb = getSupabase();
  const { data: orders = [] } = sb
    ? await sb
        .from("orders")
        .select("id,public_order_id,slug,status,token_symbol,amount_human,usd_price,created_at,paid_at")
        .order("created_at", { ascending: false })
        .limit(100)
    : { data: [] };

  const rows = orders || [];
  const released = rows.filter((o) => RELEASED.has(o.status));
  const pending = rows.filter((o) => IN_FLIGHT.has(o.status));
  const sumUsd = (list: typeof rows) =>
    list.reduce((acc, o) => acc + (Number(o.usd_price) || 0), 0);

  return (
    <StudioShell email={user.email || "owner"} showAdmin={user.roles?.includes("super_admin")}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[.2em] text-[var(--qp-violet-300)]">
            Creator Studio
          </p>
          <h1 className="mt-2 font-sora text-3xl font-black">Earnings</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--qp-text-muted)]">
            Payout history after buyer accept and server-side release from the custody address.
          </p>
        </div>
        <Link
          href="/studio/orders"
          className="rounded-2xl bg-verse-purple px-5 py-3 text-center text-sm font-black"
        >
          Manage orders
        </Link>
      </div>

      <section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Metric label="Released (USD baseline)" value={`$${sumUsd(released).toFixed(2)}`} />
        <Metric label="In-flight (USD baseline)" value={`$${sumUsd(pending).toFixed(2)}`} />
        <Metric label="Released orders" value={String(released.length)} />
      </section>

      <section className="mt-8 rounded-[2rem] border border-white/10 bg-[var(--qp-surface)] p-5">
        <h2 className="font-sora text-xl font-black">Payout timeline</h2>
        <div className="mt-4 space-y-2">
          {rows.slice(0, 20).map((order) => (
            <Link
              key={order.id}
              href={`/studio/orders/${order.id}`}
              className="flex min-h-14 items-center justify-between gap-3 rounded-2xl bg-[rgba(8,8,14,.72)] px-4"
            >
              <span>
                <b className="block font-mono text-sm">{order.public_order_id}</b>
                <span className="text-xs text-muted">
                  {order.slug} · {order.amount_human} {order.token_symbol}
                </span>
              </span>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black">
                {order.status}
              </span>
            </Link>
          ))}
          {!rows.length && (
            <p className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-sm text-muted">
              Earnings appear after paid work is accepted and released.
            </p>
          )}
        </div>
      </section>
    </StudioShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#07070d] p-4">
      <p className="text-xs uppercase tracking-wider text-muted">{label}</p>
      <p className="mt-2 text-2xl font-black sm:text-3xl">{value}</p>
    </div>
  );
}
