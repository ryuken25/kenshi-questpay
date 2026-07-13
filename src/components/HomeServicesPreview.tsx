"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { SERVICES } from "@/lib/services";

export default function HomeServicesPreview() {
  return (
    <section id="pricing" className="relative px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
      <div className="mx-auto w-full max-w-7xl">
        <motion.div initial={false} className="mb-8 text-center sm:mb-12">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-[var(--qp-violet-300)]">
            Real payment ladder • Polygon live • BNB Chain payment-gated
          </p>
          <h2 className="section-title mt-3 font-sora font-black text-white">
            Service packages that can actually sell.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-muted sm:text-base">
            Fixed-price packages make scope clear before payment. Polygon quotes support USDT, USDC, POL, and VERSE; BNB Chain is staged behind the payment verification gate until it is fully safe.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((svc) => (
            <motion.div key={svc.slug} initial={false} className="min-h-[205px] w-full rounded-[1.5rem] p-5 glass-panel hover:border-verse-purple/30 hover:bg-[var(--qp-surface)] transition-all duration-300">
              <div className="flex items-start justify-between gap-3">
                <span className="rounded-full border border-white/10 bg-[var(--qp-surface)] px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-secondary">{svc.delivery}</span>
                <span className="rounded-full bg-verse-blue/10 px-3 py-1 font-mono text-xs font-bold text-[var(--qp-violet-300)]">${svc.usd}</span>
              </div>
              <h3 className="mt-4 font-sora text-lg font-black text-white">{svc.name}</h3>
              <p className="mt-3 text-sm leading-6 text-muted">{svc.description}</p>
              <Link href={`/services/${svc.slug}`} className="mt-4 inline-flex text-sm font-bold text-[#c1b6ff] hover:text-white">View package →</Link>
            </motion.div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link href="/services" className="inline-flex min-h-11 items-center rounded-2xl bg-verse-purple/20 px-6 py-3 font-bold text-[#C1B6FF] border border-verse-purple/30 hover:bg-verse-purple/30 transition-all">View all services →</Link>
        </div>
      </div>
    </section>
  );
}
