"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ShoppingBag, Sparkles } from "lucide-react";
import CreatorIntentButton from "@/components/CreatorIntentButton";

const creatorBenefits = [
  "Scope and payment proof stay connected",
  "Direct Polygon payment verification",
  "Trackable persisted order states",
  "Delivery and receipt in one workflow",
];

const buyerBenefits = [
  "Clear service scope before payment",
  "Private brief with public transaction proof",
  "Order status and delivery tracking",
  "Receipt keeps private data redacted",
];

const cardClass = "group relative isolate overflow-hidden rounded-[1.75rem] border border-[rgba(166,116,255,.16)] bg-[radial-gradient(circle_at_85%_10%,rgba(139,77,255,.14),transparent_38%),linear-gradient(180deg,rgba(12,10,22,.94),rgba(6,6,12,.94))] p-6 shadow-[0_24px_80px_rgba(0,0,0,.38),inset_0_1px_0_rgba(255,255,255,.035)] transition-colors hover:border-[rgba(182,138,255,.34)] focus-within:ring-4 focus-within:ring-[var(--qp-focus-ring)] sm:p-9";
const secondaryAction = "inline-flex min-h-12 items-center justify-center rounded-xl border border-[var(--qp-border-default)] bg-white/[.025] px-4 text-sm font-bold text-white transition hover:bg-[var(--qp-surface-hover)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--qp-focus-ring)]";
const primaryAction = `${secondaryAction} bg-[linear-gradient(180deg,#8b5cff,#6c3ee8)] shadow-[0_12px_32px_rgba(100,56,220,.25)] hover:bg-[linear-gradient(180deg,#966cff,#7548ed)]`;

export default function BuyerCreatorBenefits() {
  const reduced = useReducedMotion();
  const cardMotion = reduced ? {} : { initial: { opacity: 0, y: 28, scale: .985 }, whileInView: { opacity: 1, y: 0, scale: 1 }, viewport: { once: true, amount: .24 }, transition: { duration: .55, ease: [0.22, 1, .36, 1] as const } };

  return (
    <section id="for-creators" className="relative scroll-mt-28 overflow-hidden px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(116,67,236,.09),transparent_48%)]" aria-hidden="true" />
      <div className="relative mx-auto max-w-7xl">
        <div className="mb-9 max-w-3xl">
          <p className="font-mono text-xs font-black uppercase tracking-[.2em] text-[var(--qp-violet-300)]">One order, two clear views</p>
          <h2 className="mt-3 font-sora text-3xl font-black tracking-[-.04em] text-white sm:text-5xl">Built for the buyer and the creator.</h2>
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          <motion.article {...cardMotion} whileHover={reduced ? undefined : { y: -4 }} className={cardClass}>
            <span className="pointer-events-none absolute inset-0 -z-10 bg-[url('/assets/how-it-works/workflow-particle-field.svg')] bg-[length:180%_auto] bg-[position:65%_40%] bg-no-repeat opacity-35" aria-hidden="true" />
            <div className="grid gap-7 sm:grid-cols-[1fr_180px] sm:items-start">
              <div>
                <span className="grid size-12 place-items-center rounded-2xl border border-[var(--qp-violet-500)]/30 bg-[var(--qp-violet-600)]/15 text-[var(--qp-violet-300)]"><Sparkles size={23} aria-hidden="true" /></span>
                <h3 className="mt-5 font-sora text-3xl font-black text-white">For creators</h3>
                <p className="mt-3 text-base leading-7 text-[var(--qp-text-secondary)]">Turn scattered DMs into structured work with payment proof, order status, and connected delivery history.</p>
              </div>
              <Image src="/assets/how-it-works/creator-flow-illustration.svg" alt="Creator workflow illustration" width={360} height={250} className="h-auto w-full" />
            </div>
            <motion.ul initial="hidden" whileInView="visible" viewport={{ once: true, amount: .35 }} className="mt-7 grid gap-3 text-sm leading-6 text-[var(--qp-text-secondary)] sm:grid-cols-2">
              {creatorBenefits.map((item, index) => <motion.li key={item} variants={reduced ? undefined : { hidden: { opacity: 0, x: -10 }, visible: { opacity: 1, x: 0, transition: { delay: index * .08 } } }} className="rounded-xl border border-[var(--qp-border-soft)] bg-black/20 px-4 py-3"><span className="mr-2 text-[var(--qp-violet-300)]">•</span>{item}</motion.li>)}
            </motion.ul>
            <div className="mt-7 flex flex-col gap-3 min-[370px]:flex-row">
              <Link href="/how-it-works#creator-workflow" aria-label="View creator details" className={secondaryAction}>View details</Link>
              <CreatorIntentButton className={primaryAction} />
            </div>
          </motion.article>

          <motion.article {...cardMotion} whileHover={reduced ? undefined : { y: -4 }} className={cardClass}>
            <span className="pointer-events-none absolute inset-0 -z-10 bg-[url('/assets/how-it-works/workflow-particle-field.svg')] bg-[length:180%_auto] bg-[position:35%_60%] bg-no-repeat opacity-30" aria-hidden="true" />
            <div className="grid gap-7 sm:grid-cols-[1fr_180px] sm:items-start">
              <div>
                <span className="grid size-12 place-items-center rounded-2xl border border-[var(--qp-violet-500)]/30 bg-[var(--qp-violet-600)]/15 text-[var(--qp-violet-300)]"><ShoppingBag size={23} aria-hidden="true" /></span>
                <h3 className="mt-5 font-sora text-3xl font-black text-white">For buyers</h3>
                <p className="mt-3 text-base leading-7 text-[var(--qp-text-secondary)]">Start with a clear scope, pay through a supported route, track progress, and keep privacy-safe public proof.</p>
              </div>
              <Image src="/assets/how-it-works/buyer-flow-illustration.svg" alt="Buyer workflow illustration" width={360} height={250} className="h-auto w-full" />
            </div>
            <motion.ul initial="hidden" whileInView="visible" viewport={{ once: true, amount: .35 }} className="mt-7 grid gap-3 text-sm leading-6 text-[var(--qp-text-secondary)] sm:grid-cols-2">
              {buyerBenefits.map((item, index) => <motion.li key={item} variants={reduced ? undefined : { hidden: { opacity: 0, x: -10 }, visible: { opacity: 1, x: 0, transition: { delay: index * .08 } } }} className="rounded-xl border border-[var(--qp-border-soft)] bg-black/20 px-4 py-3"><span className="mr-2 text-[var(--qp-violet-300)]">•</span>{item}</motion.li>)}
            </motion.ul>
            <div className="mt-7 flex flex-col gap-3 min-[370px]:flex-row">
              <Link href="/how-it-works#buyer-workflow" aria-label="View buyer details" className={secondaryAction}>View details</Link>
              <Link href="/services" className={primaryAction}>Browse Services</Link>
            </div>
          </motion.article>
        </div>
        <div className="mt-5 rounded-[1.5rem] border border-[var(--qp-violet-500)]/20 bg-[var(--qp-violet-600)]/10 p-5">
          <p className="font-sora text-sm font-bold uppercase tracking-[0.12em] text-[var(--qp-violet-300)]">Polygon payment model</p>
          <p className="mt-2 max-w-4xl text-base leading-7 text-[var(--qp-text-secondary)]">QuestPay verifies configured token transfers on Polygon and keeps private briefs off-chain. Public receipts can show transaction proof without exposing contact details or private scope.</p>
        </div>
      </div>
    </section>
  );
}
