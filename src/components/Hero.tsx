"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
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
              <Image src={brandAssets.verseMark} alt="Verse mark" width={18} height={18} />
              {SITE.edition}
            </div>

            <h1 className="hero-title mt-5 font-sora font-black text-white">
              QuestPay
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-gray-300 sm:text-lg lg:text-xl">
              A crypto checkout desk for small creator jobs: clear brief, fixed package, Polygon mainnet payment, and an on-chain verifiable receipt.
            </p>
            <p className="mt-3 max-w-xl text-sm leading-6 text-gray-500">
              {SITE.disclaimer}
            </p>

            <div className="mt-6 grid gap-3 sm:flex sm:flex-wrap">
              <Link href="/services" className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-verse-purple px-6 py-3 text-center font-sora text-sm font-bold text-white shadow-[0_0_38px_rgba(124,92,255,.28)] transition hover:bg-verse-purple/80">
                Start a Quest
              </Link>
              <Link href="/how-it-works" className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-center font-sora text-sm font-bold text-gray-200 transition hover:border-verse-blue/40 hover:bg-verse-blue/10">
                See How It Works
              </Link>
              <Link href="/demo" className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-yellow-400/20 bg-yellow-400/10 px-6 py-3 text-center font-sora text-sm font-bold text-yellow-300 transition hover:bg-yellow-400/15">
                Try Free Demo
              </Link>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-2 text-center text-[11px] font-bold text-gray-400 sm:max-w-xl">
              <div className="rounded-2xl border border-white/10 bg-white/[.04] p-3"><span className="block text-white">Real payments</span>Polygon mainnet</div>
              <div className="rounded-2xl border border-white/10 bg-white/[.04] p-3"><span className="block text-white">Free demo</span>Base Sepolia testnet</div>
              <div className="rounded-2xl border border-white/10 bg-white/[.04] p-3"><span className="block text-white">Private</span>brief</div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.08 }} className="mx-auto w-full max-w-md lg:max-w-lg">
            <div className="relative rounded-[2rem] border border-white/10 bg-[#11131D]/85 p-4 shadow-[0_26px_90px_rgba(0,0,0,.5)] backdrop-blur-xl sm:p-5">
              <div className="absolute inset-0 -z-10 rounded-[2rem] bg-gradient-to-br from-verse-purple/20 to-verse-blue/10 blur-2xl" />
              <Image src={brandAssets.questpayPass} alt="QuestPay pass" width={400} height={240} className="w-full rounded-[1.5rem]" priority />
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {["Brief", "Pay", "Receipt"].map((label, i) => (
                  <div key={label} className="rounded-2xl border border-white/10 bg-black/25 p-3">
                    <p className="font-mono text-[10px] text-gray-500">0{i + 1}</p>
                    <p className="mt-1 text-sm font-bold text-white">{label}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 rounded-2xl border border-verse-blue/20 bg-verse-blue/10 p-3">
                <p className="hash-chip text-xs text-verse-blue">questpay:20260710:a3f8b2c1 → on-chain proof hash</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
