export const dynamic = 'force-dynamic';
export default function SuccessPage({ params }: { params: { publicOrderId: string } }) {
  return <main className="min-h-screen bg-[var(--qp-bg)] flex items-center justify-center px-4 text-white">
    <section className="mx-auto max-w-xl rounded-[2rem] border border-green-400/30 bg-green-400/10 p-8 text-center">
      <h1 className="font-sora text-3xl font-black text-green-400">Payment Confirmed!</h1>
      <p className="mt-4 text-sm text-secondary">Your order <code className="font-mono text-[#8FEAFF]">{params.publicOrderId}</code> has been verified on Polygon.</p>
      <p className="mt-2 text-sm text-muted">A receipt has been sent to your email. You can verify this payment publicly at any time.</p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <a href={`/verify`} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-verse-purple px-5 font-black text-white">Verify Payment</a>
        <a href={`/services`} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-white/10 px-5 font-black text-white">Browse Services</a>
      </div>
    </section>
  </main>;
}
