"use client";

import Image from "next/image";
import { useCallback, useRef, useState } from "react";
import { SpotlightCard, useConnectorRail } from "@/components/motion/SpotlightCard";

/**
 * Six-stage workflow.
 *
 * Behaviour contract (from the Design project handoff):
 * - Detail panels live in document flow (grid-template-rows 0fr -> 1fr) and
 *   push their siblings. No absolutely-positioned overlays, so an expanded
 *   step can never overlap the next one.
 * - Multi-open: a step closes only when the user closes it. Toggling one never
 *   closes another and never moves the reader's scroll position.
 * - A connector spine draws alongside the rows and lights the badge of the step
 *   crossing the viewport midline.
 * - Step 04 has its own illustration (flow-04-verify.svg); it used to reuse
 *   step 03's.
 * Copy is unchanged.
 */
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
    image: "/assets/how-it-works/flow-04-verify.svg",
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
  const [open, setOpen] = useState<Set<string>>(() => new Set());
  const [active, setActive] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);

  const onActive = useCallback((i: number) => setActive((p) => (p === i ? p : i)), []);
  useConnectorRail(wrapRef, onActive);

  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <section aria-labelledby="workflow-heading" className="px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <p className="font-mono text-xs font-black uppercase tracking-[.2em] text-[var(--qp-violet-300)]">Six connected stages</p>
        <h2 id="workflow-heading" className="mt-3 max-w-3xl font-sora text-3xl font-black tracking-[-.04em] text-white sm:text-5xl">See what each side knows at every step.</h2>

        {/* Connector spine + rows */}
        <div ref={wrapRef} className="relative mt-10 flex flex-col gap-5">
          <span aria-hidden="true" className="qp-rail-track left-[12px] sm:left-[19px]" />
          <span aria-hidden="true" className="qp-rail-fill left-[12px] sm:left-[19px]" />
          {steps.map((step, index) => {
            const expanded = open.has(step.id);
            return (
              <div
                key={step.id}
                data-step-row
                className="grid grid-cols-[26px_minmax(0,1fr)] gap-x-3 sm:grid-cols-[40px_minmax(0,1fr)] sm:gap-x-5"
              >
                {/* Step badge on the spine — lights when the row crosses the midline */}
                <div className="relative">
                  <span
                    className={`absolute left-1/2 top-2 grid size-[22px] -translate-x-1/2 place-items-center rounded-full bg-[#0d0a19] font-mono text-[9.5px] font-black transition-all duration-[360ms] ease-[cubic-bezier(0.22,1,0.36,1)] sm:size-[30px] sm:text-[11px] ${
                      active === index
                        ? "border-2 border-[#8752ff] text-[#d8caff] shadow-[0_0_14px_rgba(135,82,255,.5)]"
                        : expanded
                          ? "border-2 border-[#a27cff] text-[#d8caff]"
                          : "border-2 border-white/[.18] text-[var(--qp-text-subtle)]"
                    }`}
                  >
                    {step.number}
                  </span>
                </div>

                <SpotlightCard
                  id={step.id}
                  soft
                  className="scroll-mt-28 rounded-[1.75rem] border border-[var(--qp-border-default)] bg-[radial-gradient(circle_at_82%_12%,rgba(139,77,255,.12),transparent_36%),linear-gradient(180deg,rgba(15,13,24,.94),rgba(7,7,13,.97))] p-6 sm:p-8"
                >
                  {"aliases" in step
                    ? step.aliases.map((alias) => <span id={alias} key={alias} className="absolute -top-24" aria-hidden="true" />)
                    : null}

                  <div className={`grid gap-7 lg:grid-cols-[1fr_340px] lg:items-center ${index % 2 ? "lg:[&>*:first-child]:order-2" : ""}`}>
                    <div>
                      <p className="font-mono text-xs font-black uppercase tracking-[.18em] text-[var(--qp-violet-300)]">Step {step.number}</p>
                      <h3 className="mt-3 font-sora text-2xl font-black text-white sm:text-4xl">{step.title}</h3>
                      <p className="mt-4 text-base leading-8 text-[var(--qp-text-secondary)]">{step.intro}</p>
                      <button
                        type="button"
                        aria-expanded={expanded}
                        aria-controls={`detail-${step.id}`}
                        aria-label={`View ${step.id} details`}
                        onClick={() => toggle(step.id)}
                        className="qp-press mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--qp-border-default)] bg-white/[.025] px-4 text-sm font-bold text-white hover:bg-[var(--qp-surface-hover)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--qp-focus-ring)]"
                      >
                        {expanded ? "Hide details" : "View details"}
                        <svg className="qp-chevron" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="m6 9 6 6 6-6" />
                        </svg>
                      </button>
                    </div>
                    <Image src={step.image} alt="" width={680} height={390} className="h-auto w-full rounded-2xl" />
                  </div>

                  {/* Reflow detail region — stays in flow and pushes siblings */}
                  <div id={`detail-${step.id}`} className="qp-acc-panel" data-open={expanded}>
                    <div className="qp-acc-clip">
                      <div className="qp-acc-body mt-7 grid gap-3 border-t border-[var(--qp-border-soft)] pt-7 md:grid-cols-2">
                        <p className="rounded-2xl border border-[var(--qp-border-soft)] bg-black/20 p-4 text-sm leading-7 text-[var(--qp-text-secondary)] md:col-span-2"><strong className="text-white">Deeper detail:</strong> {step.detail}</p>
                        <p className="rounded-2xl border border-[var(--qp-border-soft)] bg-black/20 p-4 text-sm leading-7 text-[var(--qp-text-secondary)]"><strong className="text-white">Buyer sees:</strong> {step.buyer}</p>
                        <p className="rounded-2xl border border-[var(--qp-border-soft)] bg-black/20 p-4 text-sm leading-7 text-[var(--qp-text-secondary)]"><strong className="text-white">Creator sees:</strong> {step.creator}</p>
                        <p className="rounded-2xl border border-[var(--qp-violet-500)]/25 bg-[var(--qp-violet-600)]/10 p-4 text-sm leading-7 text-[var(--qp-text-secondary)] md:col-span-2"><strong className="text-white">Boundary:</strong> {step.note}</p>
                      </div>
                    </div>
                  </div>
                </SpotlightCard>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
