"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import WalletButton from "@/components/wallet/WalletButton";
import HeroOrbitalScene from "@/components/home/HeroOrbitalScene";
import { brandAssets } from "@/data/brand-assets";
import { SITE } from "@/lib/site";

const trustItems = [
  ["Direct-to-creator", "payments"],
  ["Polygon", "verified"],
  ["Private", "briefs"],
  ["Public", "transaction proof"],
];

export default function PremiumHomeHero() {
  return (
    <section className="relative overflow-hidden px-4 pb-14 pt-24 sm:px-6 lg:px-8 lg:pb-20 lg:pt-28">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_28%_16%,rgba(124,92,255,.24),transparent_30%),radial-gradient(circle_at_82%_24%,rgba(66,215,245,.12),transparent_24%),linear-gradient(180deg,rgba(8,11,24,0)_0%,#080b18_90%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-16 h-px bg-gradient-to-r from-transparent via-[#7c5cff]/60 to-transparent" />

      <div className="relative mx-auto grid max-w-7xl gap-8 lg:min-h-[calc(100svh-7rem)] lg:grid-cols-[.98fr_1.02fr] lg:items-center">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }} className="order-1">
          <div className="event-badge inline-flex max-w-full flex-wrap items-center gap-2 rounded-full border border-[rgba(179,164,255,.35)] bg-[rgba(124,92,255,.14)] px-3 py-2 text-xs font-bold uppercase text-[#C1B6FF]">
            <Image src={brandAssets.verseLogo} alt="VERSE community" width={64} height={16} className="h-4 w-auto shrink-0" />
            <span className="min-w-0 break-words">{SITE.edition}</span>
          </div>

          <h1 className="mt-5 max-w-4xl font-sora text-[clamp(2.15rem,8.7vw,5.1rem)] font-black leading-[.99] tracking-[-.052em] text-white sm:leading-[.98] lg:tracking-[-.058em]">
            Turn a clear brief into paid, trackable creator work.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--qp-text-secondary)] sm:text-lg lg:text-xl">
            Choose a fixed service, send a structured request, pay directly on Polygon, and follow the work through delivery.
          </p>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--qp-text-muted)]">{SITE.disclaimer}</p>

          <div className="mt-7 grid gap-3 sm:flex sm:flex-wrap">
            <Link href="/services" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[var(--qp-violet-strong)] px-5 text-center text-base font-bold text-white shadow-[0_0_34px_rgba(124,92,255,.34)] transition hover:bg-[var(--qp-violet)]">Explore Services</Link>
            <Link href="/sign-in?next=/studio" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[var(--qp-border-default)] bg-[rgba(17,24,45,.82)] px-5 text-center text-base font-semibold text-[var(--qp-text-primary)] transition hover:bg-[var(--qp-surface-hover)]">Start Selling</Link>
            <WalletButton />
          </div>

          <div className="mt-7 grid grid-cols-2 gap-2 text-sm font-semibold leading-5 text-[var(--qp-text-muted)] sm:max-w-2xl sm:grid-cols-4">
            {trustItems.map(([headline, subline]) => (
              <div key={headline} className="rounded-2xl border border-[var(--qp-border-soft)] bg-[rgba(17,24,45,.72)] p-3">
                <span className="block text-white">{headline}</span>{subline}
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.08, duration: 0.55 }} className="order-2 mx-auto w-full max-w-[430px] lg:max-w-none">
          <HeroOrbitalScene variant="home" />
        </motion.div>
      </div>
    </section>
  );
}
