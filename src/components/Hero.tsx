"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import WalletButton from "@/components/wallet/WalletButton";
import { brandAssets } from "@/data/brand-assets";
import { SITE } from "@/lib/site";

export default function Hero() {
  return (
    <section className="relative min-screen-safe overflow-hidden px-4 pb-14 pt-24 sm:px-6 lg:px-8 lg:pt-28">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-24 h-72 w-72 rounded-full bg-verse-purple/20 blur-[110px]" />
        <div className="absolute -right-24 bottom-24 h-72 w-72 rounded-full bg-verse-blue/20 blur-[110px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(124,92,255,.12),transparent_42%)]" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-[0.98fr_1.02fr] lg:items-center">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
            <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-verse-purple/20 bg-verse-purple/10 px-3 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-verse-purple">
              <Image src={brandAssets.verseLogo} alt="VERSE community" width={64} height={16} className="h-4 w-auto" />
              <span>{SITE.edition}</span>
            </div>

            <h1 className="hero-title mt-5 max-w-4xl font-sora font-black text-white">
              Turn a clear brief into paid, trackable creator work.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-gray-300 sm:text-lg lg:text-xl">
              Choose a fixed service, send a structured request, pay directly on Polygon, and follow the work through delivery.
            </p>
            <p className="mt-3 max-w-xl text-sm leading-6 text-gray-500">{SITE.disclaimer}</p>

            <div className="mt-6 grid gap-3 sm:flex sm:flex-wrap">
              <Link href="/services" className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-verse-purple px-6 py-3 text-center font-sora text-sm font-bold text-white shadow-[0_0_38px_rgba(124,92,255,.28)] transition hover:bg-verse-purple/80">
                Browse Services
              </Link>
              <Link href="/how-it-works" className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-center font-sora text-sm font-bold text-gray-200 transition hover:border-verse-blue/40 hover:bg-verse-blue/10">
                See How It Works
              </Link>
              <WalletButton />
            </div>

            <div className="mt-6 grid grid-cols-2 gap-2 text-center text-[11px] font-bold text-gray-400 sm:max-w-2xl sm:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-white/[.04] p-3"><span className="block text-white">Direct-to-creator</span>payments</div>
              <div className="rounded-2xl border border-white/10 bg-white/[.04] p-3"><span className="block text-white">Polygon</span>verified</div>
              <div className="rounded-2xl border border-white/10 bg-white/[.04] p-3"><span className="block text-white">Private</span>briefs</div>
              <div className="rounded-2xl border border-white/10 bg-white/[.04] p-3"><span className="block text-white">Trackable</span>delivery</div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.08 }} className="mx-auto w-full max-w-md lg:max-w-lg">
            <div className="relative rounded-[2rem] border border-white/10 bg-[#11131D]/85 p-5 shadow-[0_26px_90px_rgba(0,0,0,.5)] backdrop-blur-xl">
              <div className="absolute inset-0 -z-10 rounded-[2rem] bg-gradient-to-br from-verse-purple/20 to-verse-blue/10 blur-2xl" />
              <div className="flex items-center gap-3"><Image src={brandAssets.questpayMark} alt="QuestPay mark" width={44} height={44}/><div><p className="text-xs uppercase tracking-[0.2em] text-gray-500">Lifecycle</p><h2 className="font-sora text-2xl font-black text-white">Service to receipt</h2></div></div>
              <div className="mt-6 grid gap-3">
                {["Choose a scoped service", "Submit a private brief", "Receive a locked Polygon quote", "Track work and delivery", "Keep a public receipt"].map((label, i) => (
                  <div key={label} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/25 p-3">
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-verse-purple/20 font-mono text-xs text-verse-blue">0{i + 1}</span>
                    <p className="text-sm font-bold text-white">{label}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-2xl border border-verse-blue/20 bg-verse-blue/10 p-3">
                <p className="hash-chip text-xs text-verse-blue">Payment verified on Polygon. Private scope fingerprint stored off-chain.</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
