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
  customer_name: string | null;
  created_at: string;
};

export default async function StudioOrders(
  props: {
    searchParams: Promise<{ status?: string; q?: string }>;
  }
) {
  const searchParams = await props.searchParams;
  const user = await requireStudioAdmin();

  const clauses: string[] = [];
  const params: unknown[] = [];
  if (searchParams.status) {
    params.push(searchParams.status);
    clauses.push(`status = $${params.length}`);
  }
  if (searchParams.q) {
    params.push(`%${searchParams.q}%`);
    const i = params.length;
    clauses.push(
      `(public_order_id ILIKE $${i} OR customer_name ILIKE $${i} OR slug ILIKE $${i})`,
    );
  }

  // Per-creator scoping (Agent R F1): a creator sees ONLY orders assigned to them;
  // a real env super_admin sees all. Orders carry creator_account_id as of Task 2.
  if (!user.roles?.includes("super_admin")) {
    params.push(user.id);
    clauses.push(`creator_account_id = $${params.length}`);
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const orders = await queryManyOptional<OrderRow>(
    `SELECT id, public_order_id, slug, status, token_symbol, amount_human, customer_name, created_at
     FROM orders
     ${where}
     ORDER BY created_at DESC
     LIMIT 200`,
    params,
  );

  return (
    <StudioShell email={user.email || "owner"} showAdmin={user.roles?.includes("super_admin")}>
      <h1 className="font-sora text-3xl font-black">Orders</h1>
      <form className="mt-5 grid gap-2 rounded-2xl bg-[var(--qp-surface)] p-3 sm:grid-cols-[1fr_auto_auto]">
        <input
          name="q"
          defaultValue={searchParams.q}
          placeholder="Search order, client, service"
          className="min-h-11 rounded-xl border border-white/10 bg-[rgba(8,8,14,.72)] px-4 text-base outline-none"
        />
        <select
          name="status"
          defaultValue={searchParams.status}
          className="min-h-11 rounded-xl bg-[rgba(8,11,24,.56)] px-4 text-base"
        >
          <option value="">All statuses</option>
          {["pending", "paid", "reviewing", "accepted", "in_progress", "delivered", "completed", "cancelled"].map(
            (x) => (
              <option key={x}>{x}</option>
            ),
          )}
        </select>
        <button className="min-h-11 rounded-xl bg-verse-purple px-5 font-black">Filter</button>
      </form>
      {/* Desktop: wide data table (frozen). Hidden below lg so it never
          horizontally scrolls on mobile; the card list below renders the same
          rows for small screens. */}
      <div className="mt-5 hidden overflow-x-auto rounded-2xl border border-white/10 lg:block">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-[var(--qp-surface)] text-xs uppercase text-muted">
            <tr>
              <th className="p-4">Order</th>
              <th>Client</th>
              <th>Service</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-t border-[var(--qp-border-soft)]">
                <td className="p-4">
                  <Link className="font-mono font-bold text-[var(--qp-violet-300)]" href={`/studio/orders/${order.id}`}>
                    {order.public_order_id}
                  </Link>
                </td>
                <td>{order.customer_name || "—"}</td>
                <td>{order.slug}</td>
                <td>
                  {order.amount_human} {order.token_symbol}
                </td>
                <td>
                  <span className="rounded-full bg-white/10 px-2 py-1 text-xs">{order.status}</span>
                </td>
                <td>{new Date(order.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!orders.length && <p className="p-8 text-center text-muted">No orders match this view.</p>}
      </div>

      {/* Mobile: same rows as the table above, rendered as stacked cards so
          nothing scrolls sideways at 360px. */}
      <div className="mt-5 flex flex-col gap-2.5 lg:hidden">
        {orders.map((order) => (
          <Link
            key={order.id}
            href={`/studio/orders/${order.id}`}
            className="block rounded-2xl border border-white/10 bg-[var(--qp-surface)] p-4 active:bg-[var(--qp-surface-hover)]"
          >
            <div className="flex items-center gap-2">
              <span className="min-w-0 truncate font-mono text-sm font-bold text-[var(--qp-violet-300)]">
                {order.public_order_id}
              </span>
              <span className="ml-auto shrink-0 rounded-full bg-white/10 px-2.5 py-1 text-xs font-bold">
                {order.status}
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="min-w-0 flex-1 truncate text-sm font-bold text-white">{order.slug}</span>
              <span className="shrink-0 font-mono text-sm text-[var(--qp-violet-400)]">
                {order.amount_human} {order.token_symbol}
              </span>
            </div>
            <p className="mt-2 font-mono text-[11px] text-[var(--qp-text-subtle)]">
              {new Date(order.created_at).toLocaleDateString()}
              {order.customer_name ? ` · ${order.customer_name}` : ""}
            </p>
          </Link>
        ))}
        {!orders.length && (
          <p className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-muted">
            No orders match this view.
          </p>
        )}
      </div>
    </StudioShell>
  );
}
