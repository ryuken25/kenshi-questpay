import { getServerSideOrder } from '@/lib/server-config';
export const dynamic = 'force-dynamic';
export default async function OrderStatusPage({ params }: { params: { publicOrderId: string } }) {
  const order = await getServerSideOrder(params.publicOrderId);
  if (!order) return <main className="min-h-screen bg-[var(--qp-bg)] flex items-center justify-center text-white"><div className="text-center"><h1 className="text-2xl font-black">Order not found</h1><p className="mt-2 text-muted">Check your order ID and try again.</p></div></main>;
  return <main className="min-h-screen bg-[var(--qp-bg)] px-4 py-10 text-white sm:px-6 lg:px-8">
    <section className="mx-auto max-w-2xl rounded-[2rem] border border-white/10 bg-[var(--qp-surface)] p-5 sm:p-8">
      <p className="font-mono text-xs font-black uppercase tracking-[0.22em] text-[var(--qp-violet-300)]">Order Status</p>
      <h1 className="mt-3 font-sora text-3xl font-black">{order.slug}</h1>
      <div className="mt-6 space-y-3">
        <Row label="Order ID" value={order.public_order_id} />
        <Row label="Status" value={order.status} />
        <Row label="Amount" value={`${order.amount_human} ${order.token_symbol}`} />
        <Row label="Created" value={new Date(order.created_at).toLocaleString()} />
      </div>
      {order.status === 'pending' && <a href={`/pay/${order.public_order_id}`} className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-2xl bg-verse-purple px-5 font-black text-white">Pay Now →</a>}
      {order.status === 'paid' && <a href={`/orders/${order.public_order_id}/success`} className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-2xl bg-green-400 px-5 font-black text-black">View Receipt →</a>}
    </section>
  </main>;
}
function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between rounded-xl bg-[rgba(8,8,14,.72)] p-3"><span className="text-muted">{label}</span><span className="font-mono text-white">{value}</span></div>;
}
