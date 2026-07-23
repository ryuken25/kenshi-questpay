import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { queryManyOptional } from "@/lib/db";
import InlineVerify from "@/components/verify/InlineVerify";

export const dynamic = "force-dynamic";

type ReceiptOrder = {
  id: string;
  public_order_id: string;
  slug: string;
  status: string;
  token_symbol: string | null;
  amount_human: string | null;
  usd_price: number | null;
  created_at: string;
  paid_at: string | null;
  account_id: string | null;
  tx_hash: string | null;
};

export default async function ReceiptsPage() {
  const session = await getSession();
  if (!session) redirect("/sign-in?next=/receipts");

  const rows = await queryManyOptional<ReceiptOrder>(
    `SELECT o.id, o.public_order_id, o.slug, o.status, o.token_symbol, o.amount_human,
            o.usd_price, o.created_at, o.paid_at, o.account_id,
            pm.tx_hash
     FROM orders o
     LEFT JOIN LATERAL (
       SELECT tx_hash
       FROM payments
       WHERE order_id = o.id
       ORDER BY verified_at DESC NULLS LAST
       LIMIT 1
     ) pm ON true
     WHERE o.account_id = $1
     ORDER BY o.created_at DESC
     LIMIT 50`,
    [session.accountId],
  );

  return (
    <div className="min-h-screen bg-[var(--qp-bg)] text-[var(--qp-text-primary)]">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <p className="text-xs font-black uppercase tracking-[.2em] text-[var(--qp-violet-300)]">
          Buyer workspace
        </p>
        <h1 className="mt-3 font-sora text-3xl font-black">My Receipts</h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--qp-text-secondary)]">
          Payment and delivery proof for orders you own. Public verification of other people&apos;s
          payments lives on{" "}
          <Link href="/verify" className="font-semibold text-[var(--qp-violet-300)] hover:underline">
            Verify
          </Link>
          .
        </p>

        <div className="mt-8 space-y-3">
          {rows.map((order) => (
            <article
              key={order.id}
              className="rounded-[1.6rem] border border-white/10 bg-[var(--qp-surface)] p-5"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-mono text-sm font-black text-[var(--qp-violet-300)]">
                    {order.public_order_id}
                  </p>
                  <p className="mt-1 text-sm text-[var(--qp-text-secondary)]">
                    {order.slug} · {order.amount_human} {order.token_symbol}
                    {order.usd_price != null ? ` · ~$${order.usd_price}` : ""}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    Created {new Date(order.created_at).toLocaleString()}
                    {order.paid_at ? ` · Paid ${new Date(order.paid_at).toLocaleString()}` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black">
                    {order.status}
                  </span>
                  <Link
                    href={`/orders/${order.public_order_id}`}
                    className="inline-flex min-h-11 items-center rounded-xl bg-verse-purple px-4 text-sm font-black"
                  >
                    Open order
                  </Link>
                </div>
              </div>

              {order.tx_hash && (
                <div className="mt-4 border-t border-white/10 pt-4">
                  <InlineVerify txHash={order.tx_hash} />
                </div>
              )}
            </article>
          ))}

          {!rows.length && (
            <div className="rounded-[2rem] border border-dashed border-white/15 bg-[var(--qp-surface)] p-8 text-center">
              <p className="text-base text-[var(--qp-text-muted)]">
                No receipts yet. Checkout a service to generate your first payment proof.
              </p>
              <Link
                href="/services"
                className="mt-5 inline-flex min-h-12 items-center justify-center rounded-xl bg-[var(--qp-violet-strong)] px-5 text-base font-bold text-white hover:bg-[var(--qp-violet)]"
              >
                Browse Services
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
