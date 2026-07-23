import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { queryManyOptional } from "@/lib/db";
import { getServiceBySlug } from "@/lib/services";
import ReceiptWorkspace, { type WorkspaceRow } from "@/components/workspace/ReceiptWorkspace";

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

  const workspaceRows: WorkspaceRow[] = rows.map((o) => ({
    id: o.id,
    publicOrderId: o.public_order_id,
    slug: o.slug,
    serviceName: getServiceBySlug(o.slug)?.name || o.slug,
    status: o.status,
    tokenSymbol: o.token_symbol,
    amountHuman: o.amount_human,
    usd: o.usd_price == null ? null : Number(o.usd_price),
    createdAt: o.created_at,
    paidAt: o.paid_at,
    txHash: o.tx_hash,
  }));

  return (
    <div className="min-h-screen text-[var(--qp-text-primary)]">
      <ReceiptWorkspace variant="orders" rows={workspaceRows} />
    </div>
  );
}
