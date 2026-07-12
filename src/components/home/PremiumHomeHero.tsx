"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import AuthModal from "@/components/auth/AuthModal";
import HeroOrbitalScene from "@/components/home/HeroOrbitalScene";
import { SITE } from "@/lib/site";

const trustItems = ["Direct-to-creator payments", "Private briefs", "Trackable delivery", "Public receipt proof"];

export default function PremiumHomeHero() {
  const [authOpen, setAuthOpen] = useState(false);
  return (
    <section className="qp-home-hero relative overflow-hidden px-4 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_68%_44%,rgba(107,39,219,.19),transparent_34%),linear-gradient(90deg,rgba(2,2,7,.98)_0%,rgba(2,2,7,.94)_42%,rgba(4,3,10,.80)_72%,rgba(2,2,7,.96)_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-16 h-px bg-gradient-to-r from-transparent via-[#7c5cff]/60 to-transparent" />

      <div className="qp-home-hero__grid relative mx-auto grid max-w-7xl gap-8 lg:grid-cols-[.92fr_1.08fr] lg:items-center">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }} className="order-1">
          <div className="event-badge inline-flex max-w-full flex-wrap items-center gap-2 rounded-full border border-[rgba(179,164,255,.35)] bg-[rgba(124,92,255,.14)] px-3 py-2 text-xs font-bold uppercase text-[#C1B6FF]">
            <Image src="/brand/verse/verse-v-glow.svg" alt="" width={14} height={12} className="h-3 w-auto shrink-0" />
            <span className="min-w-0 break-words">Powered by VERSE</span>
          </div>

          <h1 className="qp-hero-title mt-5 max-w-[570px]">
            Creator services.<br />Paid with crypto.<br /><span className="gradient-text">Built for clear delivery.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--qp-text-secondary)] sm:text-lg">
            QuestPay helps buyers and creators turn small scoped work into structured paid orders, with direct crypto payment, trackable delivery, and public on-chain proof.
          </p>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--qp-text-muted)]">{SITE.disclaimer}</p>

          <div className="mt-7 grid gap-3 sm:flex sm:flex-wrap">
            <Link href="/services" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[linear-gradient(180deg,#8D61FF_0%,#6E46F2_100%)] px-5 text-center text-base font-bold text-white shadow-[0_10px_28px_rgba(96,57,220,.38),inset_0_1px_0_rgba(255,255,255,.18)] transition hover:-translate-y-0.5">Explore Services</Link>
            <button type="button" onClick={() => setAuthOpen(true)} className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/10 bg-white/[.02] px-5 text-center text-base font-semibold text-white transition hover:-translate-y-0.5 hover:border-[#8b72ff]/40 hover:bg-white/[.05]">Start Selling</button>
          </div>

          <div className="mt-7 grid grid-cols-2 gap-2 text-sm font-semibold leading-5 text-[var(--qp-text-muted)] sm:max-w-2xl sm:grid-cols-4">
            {trustItems.map((item) => (
              <div key={item} className="rounded-2xl border border-[var(--qp-border-soft)] bg-[rgba(13,16,28,.72)] p-3 text-white/90">{item}</div>
            ))}
          </div>
          <div className="mt-5 inline-flex max-w-full flex-wrap gap-2 rounded-2xl border border-[#7c5cff]/20 bg-[#7c5cff]/10 px-4 py-3 text-sm font-semibold text-[#cfc7ff]">
            <span>Polygon live</span><span>•</span><span>USDT</span><span>USDC</span><span>POL</span><span>VERSE</span><span>•</span><span>BNB Chain staged behind payment gate</span>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.08, duration: 0.55 }} className="order-2 mx-auto w-full max-w-[430px] lg:max-w-none">
          <HeroOrbitalScene variant="home" />
        </motion.div>
      </div>
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} intent="creator" next="/studio" />
    </section>
  );
}
