import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { queryManyOptional } from "@/lib/db";

export const dynamic = "force-dynamic";

type PaymentRow = {
  id: string;
  order_id: string | null;
  chain_id: number | null;
  tx_hash: string | null;
  from_address: string | null;
  to_address: string | null;
  token_symbol: string | null;
  amount_human: string | null;
  verified_at: string | null;
  created_at: string | null;
};

type OrderRow = {
  id: string;
  public_order_id: string;
  status: string;
  token_symbol: string | null;
  amount_human: string | null;
  created_at: string | null;
  paid_at: string | null;
};

export default async function AdminTransactionsPage() {
  const session = await getSession();
  if (!session) redirect("/sign-in?next=/admin/transactions");
  if (!session.roles.includes("super_admin")) redirect("/my-orders");

  const [paymentRows, orderRows] = await Promise.all([
    queryManyOptional<PaymentRow>(
      `SELECT id, order_id, chain_id, tx_hash, from_address, to_address,
              token_symbol, amount_human, verified_at, created_at
       FROM payments
       ORDER BY created_at DESC
       LIMIT 50`,
    ),
    queryManyOptional<OrderRow>(
      `SELECT id, public_order_id, status, token_symbol, amount_human, created_at, paid_at
       FROM orders
       ORDER BY created_at DESC
       LIMIT 50`,
    ),
  ]);

  return (
    <div className="min-h-screen bg-[var(--qp-bg)] text-[var(--qp-text-primary)]">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <Link href="/admin" className="text-sm text-[var(--qp-text-muted)] hover:text-white">
          &larr; Admin
        </Link>
        <div className="mt-3">
          <p className="text-sm font-bold uppercase tracking-[0.12em] text-[#C1B6FF]">Super Admin</p>
          <h1 className="mt-2 font-sora text-3xl font-black">Transactions</h1>
          <p className="mt-2 max-w-2xl text-sm text-[var(--qp-text-muted)]">
            All verified payments and order payment states across the platform (custody + release
            audit surface).
          </p>
        </div>

        <section className="mt-8">
          <h2 className="font-sora text-xl font-black">Verified payments</h2>
          <div className="mt-4 overflow-x-auto rounded-[2rem] border border-[var(--qp-border-soft)] bg-[var(--qp-surface)]">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="bg-[rgba(8,8,14,.55)] text-xs uppercase text-muted">
                <tr>
                  <th className="p-4">Tx</th>
                  <th>Token</th>
                  <th>Amount</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Verified</th>
                </tr>
              </thead>
              <tbody>
                {paymentRows.map((p) => (
                  <tr key={p.id} className="border-t border-[var(--qp-border-soft)]">
                    <td className="p-4">
                      {p.tx_hash ? (
                        <a
                          href={`https://polygonscan.com/tx/${p.tx_hash}`}
                          target="_blank"
                          rel="noreferrer"
                          className="font-mono text-xs font-bold text-[var(--qp-violet-300)] hover:underline"
                        >
                          {String(p.tx_hash).slice(0, 10)}…
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>{p.token_symbol || "—"}</td>
                    <td className="font-mono">{p.amount_human || "—"}</td>
                    <td className="font-mono text-xs text-muted">
                      {p.from_address ? `${String(p.from_address).slice(0, 8)}…` : "—"}
                    </td>
                    <td className="font-mono text-xs text-muted">
                      {p.to_address ? `${String(p.to_address).slice(0, 8)}…` : "—"}
                    </td>
                    <td className="text-muted">
                      {p.verified_at
                        ? new Date(p.verified_at).toLocaleString()
                        : p.created_at
                          ? new Date(p.created_at).toLocaleString()
                          : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!paymentRows.length && (
              <p className="p-8 text-center text-muted">No verified payments yet.</p>
            )}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="font-sora text-xl font-black">Recent orders</h2>
          <div className="mt-4 overflow-x-auto rounded-[2rem] border border-[var(--qp-border-soft)] bg-[var(--qp-surface)]">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-[rgba(8,8,14,.55)] text-xs uppercase text-muted">
                <tr>
                  <th className="p-4">Order</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Paid</th>
                </tr>
              </thead>
              <tbody>
                {orderRows.map((order) => (
                  <tr key={order.id} className="border-t border-[var(--qp-border-soft)]">
                    <td className="p-4">
                      <Link
                        href={`/studio/orders/${order.id}`}
                        className="font-mono font-bold text-[var(--qp-violet-300)] hover:underline"
                      >
                        {order.public_order_id}
                      </Link>
                    </td>
                    <td>
                      {order.amount_human} {order.token_symbol}
                    </td>
                    <td>
                      <span className="rounded-full bg-white/10 px-2 py-1 text-xs font-bold">
                        {order.status}
                      </span>
                    </td>
                    <td className="text-muted">
                      {order.created_at ? new Date(order.created_at).toLocaleDateString() : "—"}
                    </td>
                    <td className="text-muted">
                      {order.paid_at ? new Date(order.paid_at).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!orderRows.length && (
              <p className="p-8 text-center text-muted">No orders in the ledger yet.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
