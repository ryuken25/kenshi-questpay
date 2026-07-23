import Link from "next/link";

export const dynamic = "force-dynamic";

const NEXT_STEPS = [
  {
    title: "The creator starts your work",
    body: "Your brief is now with the creator. They review it and begin.",
  },
  {
    title: "You get progress updates here",
    body: "Status changes and creator notes appear on your order workspace and by email.",
  },
  {
    title: "Review and accept the delivery",
    body: "When the work is delivered, accept it to release payment from custody.",
  },
];

export default async function SuccessPage(props: {
  params: Promise<{ publicOrderId: string }>;
}) {
  const { publicOrderId } = await props.params;

  return (
    <div className="min-h-screen bg-[var(--qp-bg)] px-4 py-16 text-white sm:px-6">
      <section className="mx-auto max-w-xl">
        <div className="rounded-[2rem] border border-green-400/30 bg-green-400/10 p-8 text-center">
          <h1 className="font-sora text-3xl font-black text-green-400">Payment confirmed!</h1>
          <p className="mt-4 text-sm text-secondary">
            Your order{" "}
            <code className="font-mono text-[var(--qp-violet-300)]">{publicOrderId}</code> has been
            verified on Polygon.
          </p>
          <p className="mt-2 text-sm text-muted">
            A receipt has been sent to your email. You can verify this payment publicly at any time.
          </p>
        </div>

        <div className="mt-6 rounded-[2rem] border border-white/10 bg-[var(--qp-surface)] p-6">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--qp-violet-300)]">
            What happens next
          </p>
          <ol className="mt-4 space-y-4">
            {NEXT_STEPS.map((step, i) => (
              <li key={step.title} className="flex gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--qp-violet-300)]/50 bg-[var(--qp-violet-strong)]/20 text-sm font-black text-white">
                  {i + 1}
                </span>
                <div>
                  <p className="text-sm font-bold text-white">{step.title}</p>
                  <p className="mt-0.5 text-sm leading-6 text-muted">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href={`/orders/${publicOrderId}`}
              className="flex min-h-12 flex-1 items-center justify-center rounded-2xl bg-verse-purple px-5 font-black text-white"
            >
              View order progress →
            </Link>
            <Link
              href="/receipts"
              className="flex min-h-12 flex-1 items-center justify-center rounded-2xl border border-white/15 px-5 font-bold text-secondary hover:bg-white/5"
            >
              View receipt
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
