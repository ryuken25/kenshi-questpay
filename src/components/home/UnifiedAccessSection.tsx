"use client";

import { motion } from "framer-motion";
import { Fingerprint, Link2, ShieldCheck, Wallet } from "lucide-react";

const flowSteps = [
  { title: "Connect", body: "Use wallet, Google, or secure email.", icon: Wallet },
  { title: "Link", body: "Optionally bind verified identities into one account.", icon: Link2 },
  { title: "Access", body: "Open orders, receipts, deliveries, creator tools, or admin areas based on server-side roles.", icon: Fingerprint },
];

const roles = [
  { title: "Buyer", items: ["Buy scoped services", "Track orders", "Open receipts", "Review delivery"] },
  { title: "Creator", items: ["Manage service work", "View paid orders", "Update status", "Deliver output"] },
  { title: "Super admin", items: ["Grant creator roles", "Audit access", "Protect root controls", "Review system state"] },
];

export default function UnifiedAccessSection() {
  return (
    <section className="relative px-4 py-16 sm:px-6 lg:px-8" id="unified-access">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 max-w-3xl">
          <p className="font-sora text-sm font-bold uppercase tracking-[0.12em] text-[#a793ff]">Unified Access</p>
          <h2 className="section-title mt-3 font-sora font-black text-white">One QuestPay account, multiple verified identities.</h2>
          <p className="mt-4 text-base leading-7 text-[var(--qp-text-secondary)] sm:text-lg">Wallet, Google, and email can point into one secure account, while buyer, creator, and admin capabilities stay server-authoritative.</p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_.92fr]">
          <motion.div initial={false} className="rounded-[1.5rem] border border-[#7c5cff]/20 bg-[#090d1b]/80 p-5 shadow-[0_0_60px_rgba(124,92,255,.08)]">
            <h3 className="font-sora text-sm font-bold uppercase tracking-[0.12em] text-[#a793ff]">Auth Flow / Simple & Unified</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {flowSteps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div key={step.title} className="rounded-2xl border border-[var(--qp-border-soft)] bg-[rgba(17,24,45,.7)] p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-bold text-[#b9abff]">{index + 1}. {step.title}</p>
                        <p className="mt-1 text-sm leading-6 text-[var(--qp-text-muted)]">{step.body}</p>
                      </div>
                      <div className="grid size-12 shrink-0 place-items-center rounded-2xl border border-[#7c5cff]/30 bg-[#7c5cff]/12 text-[#c1b6ff]"><Icon size={22} /></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          <motion.div initial={false} className="rounded-[1.5rem] border border-[#7c5cff]/20 bg-[#090d1b]/80 p-5">
            <h3 className="font-sora text-sm font-bold uppercase tracking-[0.12em] text-[#a793ff]">Role System / Strict</h3>
            <div className="mt-4 grid gap-3 md:grid-cols-3 lg:grid-cols-1">
              {roles.map((role) => (
                <div key={role.title} className="rounded-2xl border border-[var(--qp-border-soft)] bg-[rgba(17,24,45,.7)] p-4">
                  <p className="flex items-center gap-2 text-sm font-bold uppercase text-[#c1b6ff]"><ShieldCheck size={16} /> {role.title}</p>
                  <ul className="mt-2 space-y-1 text-sm leading-6 text-[var(--qp-text-muted)]">
                    {role.items.map((item) => <li key={item}>• {item}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
