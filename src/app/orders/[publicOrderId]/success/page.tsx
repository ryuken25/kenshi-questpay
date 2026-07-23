import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

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
    <div className="min-h-screen px-4 py-12 text-white sm:px-6 sm:py-16">
      <section className="mx-auto max-w-xl">
        <div className="qp-receipt-card qp-receipt-card--success text-center">
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full border border-green-400/30 bg-green-400/10 lg:h-14 lg:w-14 lg:rounded-2xl">
            <CheckCircle2 size={28} className="text-[var(--qp-success)]" />
          </div>
          <p className="qp-work-eyebrow text-[var(--qp-success)]">Payment settled · Polygon Mainnet</p>
          <h1 className="mt-2 font-sora text-3xl font-extrabold tracking-[-0.03em] text-[var(--qp-success)]">
            Payment confirmed!
          </h1>
          <p className="mt-3 text-sm text-[var(--qp-text-secondary)]">
            Your order{" "}
            <code className="font-mono text-[var(--qp-violet-300)]">{publicOrderId}</code> has been
            verified on Polygon.
          </p>
          <p className="mt-2 text-sm text-[var(--qp-text-muted)]">
            A receipt has been sent to your email. You can verify this payment publicly at any time.
          </p>
        </div>

        <div className="qp-receipt-card mt-6">
          <p className="qp-work-eyebrow">What happens next</p>
          <ol className="mt-4 space-y-4">
            {NEXT_STEPS.map((step, i) => (
              <li key={step.title} className="flex gap-3">
                <span className="qp-step-node qp-step-node--current shrink-0">{i + 1}</span>
                <div>
                  <p className="text-sm font-bold text-white">{step.title}</p>
                  <p className="mt-0.5 text-sm leading-6 text-[var(--qp-text-muted)]">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href={`/orders/${publicOrderId}`}
              className="qp-button qp-button--primary flex-1"
            >
              View order progress →
            </Link>
            <Link
              href="/receipts"
              className="qp-button qp-button--secondary flex-1"
            >
              View receipt
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
