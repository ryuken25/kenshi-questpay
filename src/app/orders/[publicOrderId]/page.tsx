import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { queryOneOptional } from "@/lib/db";
import { getServiceBySlug } from "@/lib/services";
import { listOrderEvents } from "@/lib/order-events";
import OrderDetailClient, {
  type OrderEventView,
  type ViewerRole,
} from "@/components/OrderDetailClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type OrderRow = {
  id: string;
  public_order_id: string;
  slug: string;
  status: string;
  account_id: string | null;
  creator_account_id: string | null;
  amount_human: string | null;
  token_symbol: string | null;
  usd_price: number | string | null;
  created_at: string;
  paid_at: string | null;
  work_submitted_at: string | null;
  accepted_at: string | null;
  delivered_at: string | null;
  released_at: string | null;
  payment_expires_at: string | null;
};

type PaymentRow = {
  tx_hash: string | null;
  from_address: string | null;
  block_number: string | number | null;
  confirmations: number | null;
  verified_at: string | null;
};

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--qp-bg)] text-white">
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">{children}</div>
    </div>
  );
}

export default async function OrderWorkspacePage(props: {
  params: Promise<{ publicOrderId: string }>;
}) {
  const { publicOrderId } = await props.params;

  // Anonymous → sign in, then return here.
  const session = await getSession();
  if (!session) {
    redirect(`/sign-in?next=/orders/${encodeURIComponent(publicOrderId)}`);
  }

  if (!publicOrderId || !publicOrderId.startsWith("qp-")) {
    return (
      <Shell>
        <div className="rounded-[2rem] border border-white/10 bg-[var(--qp-surface)] p-8 text-center">
          <h1 className="font-sora text-2xl font-black">Order not found</h1>
          <p className="mt-2 text-sm text-muted">Check your order ID and try again.</p>
          <Link href="/my-orders" className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-verse-purple px-5 font-black">
            My orders
          </Link>
        </div>
      </Shell>
    );
  }

  const order = await queryOneOptional<OrderRow>(
    `SELECT id, public_order_id, slug, status, account_id, creator_account_id,
            amount_human, token_symbol, usd_price, created_at, paid_at,
            work_submitted_at, accepted_at, delivered_at, released_at, payment_expires_at
       FROM orders
      WHERE public_order_id = $1
      LIMIT 1`,
    [publicOrderId],
  );

  if (!order) {
    return (
      <Shell>
        <div className="rounded-[2rem] border border-white/10 bg-[var(--qp-surface)] p-8 text-center">
          <h1 className="font-sora text-2xl font-black">Order not found</h1>
          <p className="mt-2 text-sm text-muted">Check your order ID and try again.</p>
          <Link href="/my-orders" className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-verse-purple px-5 font-black">
            My orders
          </Link>
        </div>
      </Shell>
    );
  }

  // Participant gate: buyer (owner), assigned creator, or admin.
  const isBuyer = Boolean(order.account_id) && order.account_id === session.accountId;
  const isCreator = Boolean(order.creator_account_id) && order.creator_account_id === session.accountId;
  const isAdmin = session.roles.includes("super_admin");

  if (!isBuyer && !isCreator && !isAdmin) {
    return (
      <Shell>
        <div
          data-testid="access-gate"
          className="rounded-[2rem] border border-white/10 bg-[var(--qp-surface)] p-8 text-center"
        >
          <h1 className="font-sora text-2xl font-black">You don&apos;t have access to this order</h1>
          <p className="mt-3 text-sm text-muted">
            Only the buyer who placed it and the assigned creator can view an order&apos;s progress.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/my-orders" className="inline-flex min-h-11 items-center rounded-xl bg-verse-purple px-5 font-black">
              My orders
            </Link>
            <Link href="/services" className="inline-flex min-h-11 items-center rounded-xl border border-white/15 px-5 font-bold text-secondary">
              Browse services
            </Link>
          </div>
        </div>
      </Shell>
    );
  }

  const viewerRole: ViewerRole = isBuyer ? "buyer" : isCreator ? "creator" : "admin";

  const [payment, rawEvents] = await Promise.all([
    queryOneOptional<PaymentRow>(
      `SELECT tx_hash, from_address, block_number, confirmations, verified_at
         FROM payments
        WHERE order_id = $1
        ORDER BY verified_at DESC NULLS LAST
        LIMIT 1`,
      [order.id],
    ),
    listOrderEvents(order.id),
  ]);

  const events: OrderEventView[] = rawEvents.map((e) => ({
    id: e.id,
    actorRole: e.actor_role,
    eventType: e.event_type,
    fromStatus: e.from_status,
    toStatus: e.to_status,
    note: e.note,
    createdAt: e.created_at,
  }));

  const service = getServiceBySlug(order.slug);
  const usd =
    order.usd_price == null ? null : Number(order.usd_price);

  return (
    <div className="min-h-screen bg-[var(--qp-bg)]">
      <OrderDetailClient
        viewerRole={viewerRole}
        initialEvents={events}
        order={{
          publicOrderId: order.public_order_id,
          slug: order.slug,
          serviceName: service?.name || order.slug,
          serviceUsd: Number.isFinite(usd as number) ? (usd as number) : null,
          status: order.status,
          amountHuman: order.amount_human,
          tokenSymbol: order.token_symbol,
          createdAt: order.created_at,
          paidAt: order.paid_at,
          workSubmittedAt: order.work_submitted_at,
          acceptedAt: order.accepted_at,
          deliveredAt: order.delivered_at,
          releasedAt: order.released_at,
          paymentExpiresAt: order.payment_expires_at,
          payment: payment
            ? {
                txHash: payment.tx_hash,
                fromAddress: payment.from_address,
                blockNumber: payment.block_number,
                confirmations: payment.confirmations,
                verifiedAt: payment.verified_at,
              }
            : null,
        }}
      />
    </div>
  );
}
