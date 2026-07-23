import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { queryManyOptional } from "@/lib/db";
import { getServiceBySlug } from "@/lib/services";
import InlineVerify from "@/components/verify/InlineVerify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type MyOrderRow = {
  id: string;
  public_order_id: string;
  slug: string;
  status: string;
  token_symbol: string | null;
  amount_human: string | null;
  usd_price: number | string | null;
  created_at: string;
  paid_at: string | null;
  tx_hash: string | null;
};

const NEGATIVE_TERMINAL = new Set(["expired", "cancelled", "disputed", "refunded", "archived"]);
const DONE = new Set(["released", "completed", "accepted"]);
const PAID_ISH = new Set([
  "paid",
  "in_progress",
  "work_submitted",
  "reviewing",
  "awaiting_client",
  "ready_for_review",
  "delivered",
]);

function statusChipClass(status: string): string {
  if (NEGATIVE_TERMINAL.has(status)) return "bg-red-400/15 text-red-200";
  if (DONE.has(status)) return "bg-green-400/15 text-green-200";
  if (PAID_ISH.has(status)) return "bg-[var(--qp-violet-strong)]/25 text-[#C1B6FF]";
  return "bg-amber-400/15 text-amber-100"; // pending / awaiting_payment
}

function humanizeStatus(status: string): string {
  const overrides: Record<string, string> = {
    awaiting_payment: "Awaiting payment",
    payment_submitted: "Payment submitted",
    ready_for_review: "Ready for review",
    work_submitted: "Work submitted",
    awaiting_client: "Awaiting client",
    in_progress: "In progress",
  };
  return overrides[status] || status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, " ");
}

export default async function MyOrdersPage() {
  const session = await getSession();
  if (!session) redirect("/sign-in?next=/my-orders");

  const rows = await queryManyOptional<MyOrderRow>(
    `SELECT o.id, o.public_order_id, o.slug, o.status, o.token_symbol, o.amount_human,
            o.usd_price, o.created_at, o.paid_at,
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
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-[#C1B6FF]">Buyer workspace</p>
        <h1 className="mt-3 font-sora text-3xl font-black">My Orders</h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--qp-text-secondary)]">
          Every order you&apos;ve placed, with live status and payment proof. Track delivery on each
          order&apos;s workspace and accept work to release payment.
        </p>

        <div className="mt-8 space-y-3">
          {rows.map((order) => {
            const usd = order.usd_price == null ? null : Number(order.usd_price);
            const service = getServiceBySlug(order.slug);
            return (
              <article
                key={order.id}
                data-testid="order-row"
                className="rounded-[1.6rem] border border-white/10 bg-[var(--qp-surface)] p-5"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-mono text-sm font-black text-[var(--qp-violet-300)]">
                      {order.public_order_id}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-[var(--qp-text-primary)]">
                      {service?.name || order.slug}
                    </p>
                    <p className="mt-1 text-sm text-[var(--qp-text-secondary)]">
                      {order.amount_human} {order.token_symbol}
                      {usd != null && Number.isFinite(usd) ? ` · ~$${usd}` : ""}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      Created {new Date(order.created_at).toLocaleString()}
                      {order.paid_at ? ` · Paid ${new Date(order.paid_at).toLocaleString()}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-black ${statusChipClass(order.status)}`}
                    >
                      {humanizeStatus(order.status)}
                    </span>
                    <Link
                      href={`/orders/${order.public_order_id}`}
                      className="inline-flex min-h-11 items-center rounded-xl bg-verse-purple px-4 text-sm font-black text-white"
                    >
                      Open order
                    </Link>
                  </div>
                </div>

                {order.tx_hash && (
                  <div className="mt-4 border-t border-white/10 pt-4">
                    <InlineVerify txHash={order.tx_hash} showOrderLink={false} />
                  </div>
                )}
              </article>
            );
          })}

          {!rows.length && (
            <div className="rounded-[2rem] border border-dashed border-white/15 bg-[var(--qp-surface)] p-10 text-center">
              <h2 className="font-sora text-xl font-black text-white">No orders yet</h2>
              <p className="mx-auto mt-2 max-w-md text-base text-[var(--qp-text-muted)]">
                When you check out a service, it shows up here with live status and a verifiable
                payment receipt.
              </p>
              <Link
                href="/services"
                className="mt-6 inline-flex min-h-12 items-center justify-center rounded-xl bg-[var(--qp-violet-strong)] px-5 text-base font-bold text-white hover:bg-[var(--qp-violet)]"
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
