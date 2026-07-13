"use client";

import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useState } from "react";

const steps = [
  {
    id: "service",
    number: "01",
    title: "Choose a scoped service",
    intro: "Compare a fixed deliverable, price, turnaround, included revision boundary, required inputs, and exclusions before checkout.",
    detail: "The service page is the shared expectation baseline. It prevents an order from beginning as an open-ended DM and gives both sides the same visible package definition.",
    buyer: "The buyer sees what is included, what is excluded, the starting USD price, delivery target, and the exact inputs needed.",
    creator: "The creator receives a request tied to a known package rather than an unbounded custom promise.",
    note: "Browsing and comparing packages requires no wallet connection.",
    image: "/assets/how-it-works/flow-01-service.svg",
  },
  {
    id: "brief",
    number: "02",
    title: "Complete a private brief",
    intro: "Sign in, complete the required profile fields, and submit order-specific requirements through a structured private form.",
    detail: "Profile data can prefill the order, while order-specific name and contact fields remain editable. Submitted requirements are stored with the order off-chain.",
    buyer: "The buyer sees clear Required and Optional labels, field validation, and the final brief before submission.",
    creator: "The creator sees the private context required to perform the paid package after server authorization.",
    note: "Private brief text and contact details are not published in the blockchain transaction.",
    image: "/assets/how-it-works/flow-02-brief.svg",
    aliases: ["profile"],
  },
  {
    id: "quote",
    number: "03",
    title: "Receive a locked quote",
    intro: "QuestPay creates a server-authoritative snapshot of the network, token, receiver, amount, expiry, and order reference.",
    detail: "The browser displays the quote but cannot choose a different receiver or quietly mark the order paid. An expired quote must be replaced by a fresh server quote.",
    buyer: "The buyer reviews the exact payment route and value before approving a wallet transaction.",
    creator: "The creator receives an order whose expected payment values remain connected to the package and brief.",
    note: "Only payment assets and networks enabled by the server are presented.",
    image: "/assets/how-it-works/flow-03-payment.svg",
  },
  {
    id: "payment",
    number: "04",
    title: "Pay and verify",
    intro: "The buyer submits the configured transfer and QuestPay verifies the chain, asset, receiver, amount, confirmation policy, quote integrity, and transaction uniqueness.",
    detail: "Authentication is only a message signature. Payment is a separate wallet transaction initiated after the buyer confirms the quote. Rejection, wrong network, pending confirmation, and expired quotes remain explicit states.",
    buyer: "The buyer sees transaction progress and a precise verification failure instead of a client-side paid shortcut.",
    creator: "The creator sees paid status only after the server accepts a real transfer matching the locked quote.",
    note: "One transaction hash can prove only one order.",
    image: "/assets/how-it-works/flow-03-payment.svg",
  },
  {
    id: "tracking",
    number: "05",
    title: "Track work and delivery",
    intro: "The persisted order status moves through the real QuestPay lifecycle from payment review to accepted work, delivery, and completion.",
    detail: "Current stored states include pending, awaiting payment, paid, reviewing, accepted, in progress, delivered, completed, expired, and cancelled. QuestPay does not invent unsupported revision or late states.",
    buyer: "The buyer follows the current status and keeps the same public order reference from checkout through completion.",
    creator: "The creator reviews paid work and updates the allowed status through the role-gated Studio workflow.",
    note: "After providing the agreed output through the established delivery channel, the creator records delivered status and timestamp.",
    image: "/assets/how-it-works/flow-04-tracking.svg",
    aliases: ["delivery"],
  },
  {
    id: "receipt",
    number: "06",
    title: "Keep public proof",
    intro: "A privacy-safe receipt connects the order reference to the verified transaction and completion state.",
    detail: "Public proof can include chain, asset, amount, transaction hash, and verification state while private contact, brief, references, and sensitive delivery context remain redacted.",
    buyer: "The buyer keeps a shareable record that can be verified without exposing the private request.",
    creator: "The creator keeps payment and completion history connected to the original scoped order.",
    note: "Public receipts are proof views, not a public copy of the private workspace.",
    image: "/assets/how-it-works/flow-05-receipt.svg",
  },
] as const;

export default function HowWorkflowSteps() {
  const [open, setOpen] = useState<string | null>(null);
  const reduced = useReducedMotion();

  return (
    <section aria-labelledby="workflow-heading" className="px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <p className="font-mono text-xs font-black uppercase tracking-[.2em] text-[var(--qp-violet-300)]">Six connected stages</p>
        <h2 id="workflow-heading" className="mt-3 max-w-3xl font-sora text-3xl font-black tracking-[-.04em] text-white sm:text-5xl">See what each side knows at every step.</h2>
        <div className="mt-10 space-y-5">
          {steps.map((step, index) => {
            const expanded = open === step.id;
            return (
              <motion.article
                id={step.id}
                key={step.id}
                initial={reduced ? false : { opacity: 0, y: 24 }}
                whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, amount: .18 }}
                transition={{ duration: .45, ease: [0.22, 1, .36, 1] }}
                className="relative scroll-mt-28 overflow-hidden rounded-[1.75rem] border border-[var(--qp-border-default)] bg-[radial-gradient(circle_at_82%_12%,rgba(139,77,255,.12),transparent_36%),linear-gradient(180deg,rgba(15,13,24,.94),rgba(7,7,13,.97))] p-6 sm:p-8"
              >
                {"aliases" in step ? step.aliases.map((alias) => <span id={alias} key={alias} className="absolute -top-24" aria-hidden="true" />) : null}
                <div className={`grid gap-7 lg:grid-cols-[1fr_340px] lg:items-center ${index % 2 ? "lg:[&>*:first-child]:order-2" : ""}`}>
                  <div>
                    <p className="font-mono text-xs font-black uppercase tracking-[.18em] text-[var(--qp-violet-300)]">Step {step.number}</p>
                    <h3 className="mt-3 font-sora text-2xl font-black text-white sm:text-4xl">{step.title}</h3>
                    <p className="mt-4 text-base leading-8 text-[var(--qp-text-secondary)]">{step.intro}</p>
                    <button type="button" aria-expanded={expanded} aria-controls={`detail-${step.id}`} aria-label={`View ${step.id} details`} onClick={() => setOpen(expanded ? null : step.id)} className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl border border-[var(--qp-border-default)] bg-white/[.025] px-4 text-sm font-bold text-white hover:bg-[var(--qp-surface-hover)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--qp-focus-ring)]">{expanded ? "Hide details" : "View details"}</button>
                  </div>
                  <Image src={step.image} alt="" width={680} height={390} className="h-auto w-full" />
                </div>
                <AnimatePresence initial={false}>
                  {expanded ? (
                    <motion.div id={`detail-${step.id}`} initial={reduced ? false : { opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={reduced ? undefined : { opacity: 0, height: 0 }} className="overflow-hidden">
                      <div className="mt-7 grid gap-3 border-t border-[var(--qp-border-soft)] pt-7 md:grid-cols-2">
                        <p className="rounded-2xl border border-[var(--qp-border-soft)] bg-black/20 p-4 text-sm leading-7 text-[var(--qp-text-secondary)] md:col-span-2"><strong className="text-white">Deeper detail:</strong> {step.detail}</p>
                        <p className="rounded-2xl border border-[var(--qp-border-soft)] bg-black/20 p-4 text-sm leading-7 text-[var(--qp-text-secondary)]"><strong className="text-white">Buyer sees:</strong> {step.buyer}</p>
                        <p className="rounded-2xl border border-[var(--qp-border-soft)] bg-black/20 p-4 text-sm leading-7 text-[var(--qp-text-secondary)]"><strong className="text-white">Creator sees:</strong> {step.creator}</p>
                        <p className="rounded-2xl border border-[var(--qp-violet-500)]/25 bg-[var(--qp-violet-600)]/10 p-4 text-sm leading-7 text-[var(--qp-text-secondary)] md:col-span-2"><strong className="text-white">Boundary:</strong> {step.note}</p>
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
