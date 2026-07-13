"use client";

import { motion } from "framer-motion";
import { CheckCircle2, FileText, PackageCheck, ReceiptText, WalletCards } from "lucide-react";
import Link from "next/link";

const steps = [
  { title: "Choose a service", text: "Select a scoped package so the work starts with clarity.", icon: PackageCheck },
  { title: "Send the brief", text: "Use a structured request instead of scattered DMs.", icon: FileText },
  { title: "Pay in crypto", text: "Create a locked quote and complete payment with supported assets.", icon: WalletCards },
  { title: "Track progress", text: "Status, delivery timing, and proof stay connected to one order.", icon: CheckCircle2 },
  { title: "Receive output + receipt", text: "Delivery stays tied to public on-chain proof with private data redacted.", icon: ReceiptText },
];

export default function ScrollStoryHowItWorks() {
  return (
    <section id="how-it-works-story" className="relative overflow-hidden px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_30%,rgba(124,92,255,.14),transparent_28%)]" />
      <div className="relative mx-auto grid max-w-7xl gap-8 lg:grid-cols-[.88fr_1.12fr] lg:items-start">
        <div className="lg:sticky lg:top-24">
          <p className="font-sora text-sm font-bold uppercase tracking-[0.16em] text-[#a793ff]">How QuestPay works</p>
          <h2 className="mt-3 font-sora text-[clamp(2.1rem,5.2vw,4.6rem)] font-black leading-[.94] tracking-[-.05em] text-white">From brief to proof.</h2>
          <p className="mt-5 max-w-md text-base leading-7 text-[var(--qp-text-secondary)]">QuestPay turns small creator work into a clean path: scope, order, payment, status, delivery, and receipt.</p>
          <Link href="/how-it-works#overview" className="mt-6 inline-flex min-h-11 items-center rounded-xl border border-[var(--qp-border-default)] bg-[var(--qp-surface)] px-5 text-sm font-bold text-white hover:bg-[var(--qp-surface-hover)]">Learn more</Link>
          <div className="mt-7 hidden rounded-[1.5rem] border border-[#7c5cff]/18 bg-[var(--qp-surface-1)] p-5 lg:block">
            <p className="text-sm font-bold text-white">Revenue proof path</p>
            <p className="mt-2 text-sm leading-6 text-[var(--qp-text-muted)]">Order total → selected chain/token → locked receive address → tx hash → public receipt.</p>
          </div>
        </div>
        <div className="space-y-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.article key={step.title} initial={{ opacity: 0.86, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-20%" }} transition={{ duration: .35 }} className="group relative overflow-hidden rounded-[1.6rem] border border-[#7c5cff]/18 bg-[rgba(10,12,20,.82)] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,.04)] sm:p-6">
                <div className="absolute left-8 top-0 h-full w-px bg-white/8" />
                <div className="relative flex gap-4">
                  <div className="grid size-14 shrink-0 place-items-center rounded-2xl border border-[#9367ff]/24 bg-[#7c5cff]/14 text-[#cbbcff]"><Icon size={25} /></div>
                  <div>
                    <p className="font-mono text-xs font-black uppercase tracking-[.16em] text-[var(--qp-violet-300)]">Step {index + 1}</p>
                    <h3 className="mt-1 font-sora text-xl font-black text-white">{step.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-[var(--qp-text-muted)] sm:text-base">{step.text}</p>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
