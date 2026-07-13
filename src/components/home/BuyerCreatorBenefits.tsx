import Link from "next/link";
import type { ReactNode } from "react";
import CreatorIntentButton from "@/components/CreatorIntentButton";

const actionClass = "mt-5 inline-flex min-h-11 items-center rounded-xl border border-[var(--qp-border-default)] px-4 text-sm font-bold text-white hover:bg-[var(--qp-surface-hover)]";

const creatorBenefits = [
  "Scope and payment proof stay connected",
  "Direct Polygon payment verification",
  "Trackable order states",
  "Delivery and receipt in one workflow",
];

const buyerBenefits = [
  "Clear service scope before payment",
  "Private brief with public transaction proof",
  "Order status and delivery tracking",
  "Receipt keeps private data redacted",
];

export default function BuyerCreatorBenefits() {
  return (
    <section id="for-creators" className="scroll-mt-28 px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-4 lg:grid-cols-2">
          <BenefitCard title="For creators" body="Turn scattered DMs into structured work with payment proof, order status, and delivery links." items={creatorBenefits} action={<CreatorIntentButton className={actionClass} />} />
          <BenefitCard title="For buyers" body="Start with a clear scope, pay on Polygon, track progress, and keep a safe receipt." items={buyerBenefits} action={<Link href="/services" className={actionClass}>Browse Services</Link>} />
        </div>
        <div className="mt-5 rounded-[1.5rem] border border-[var(--qp-violet-500)]/20 bg-[var(--qp-violet-600)]/10 p-5">
          <p className="font-sora text-sm font-bold uppercase tracking-[0.12em] text-[var(--qp-violet-300)]">Polygon payment model</p>
          <p className="mt-2 max-w-4xl text-base leading-7 text-[var(--qp-text-secondary)]">QuestPay verifies token transfers on Polygon and keeps private briefs off-chain. Receipts can show public transaction proof without leaking contact details or private scope.</p>
        </div>
      </div>
    </section>
  );
}

function BenefitCard({ title, body, items, action }: { title: string; body: string; items: string[]; action: ReactNode }) {
  return (
    <div className="rounded-[1.5rem] border border-[var(--qp-border-soft)] bg-[rgba(17,24,45,.76)] p-6 shadow-[0_20px_70px_rgba(0,0,0,.22)]">
      <h2 className="font-sora text-2xl font-black text-white">{title}</h2>
      <p className="mt-3 text-base leading-7 text-[var(--qp-text-secondary)]">{body}</p>
      <ul className="mt-5 grid gap-2 text-sm leading-6 text-[var(--qp-text-muted)]">
        {items.map((item) => <li key={item} className="rounded-xl border border-[var(--qp-border-soft)] bg-[rgba(8,11,24,.44)] px-4 py-3">• {item}</li>)}
      </ul>
      {action}
    </div>
  );
}
