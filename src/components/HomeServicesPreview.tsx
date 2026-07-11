"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { SERVICES } from "@/lib/services";

export default function HomeServicesPreview() {
  return (
    <section className="relative px-4 py-14 sm:px-6 sm:py-18 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
          className="mb-8 text-center sm:mb-12"
        >
          <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-[#8FEAFF]">
            Real payments: Polygon mainnet
          </p>
          <h2 className="section-title mt-3 font-sora font-black text-white">
            Choose a <span className="gradient-text">Service</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-muted sm:text-base">
            Fixed-price packages make scope clear before payment. Pay with USDT, VERSE, or POL on Polygon mainnet.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {SERVICES.map((svc, i) => (
            <motion.div
              key={svc.slug}
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: i * 0.04 }}
              className="min-h-[190px] w-full rounded-[1.5rem] p-5 glass-panel hover:border-verse-purple/30 hover:bg-[var(--qp-surface)] transition-all duration-300"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="rounded-full border border-white/10 bg-[var(--qp-surface)] px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-secondary">{svc.delivery}</span>
                <span className="rounded-full bg-verse-blue/10 px-3 py-1 font-mono text-xs font-bold text-[#8FEAFF]">
                  ${svc.usd}
                </span>
              </div>
              <h3 className="mt-4 font-sora text-lg font-black text-white">{svc.name}</h3>
              <p className="mt-3 text-sm leading-6 text-muted">{svc.description}</p>
            </motion.div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/services"
            className="inline-flex min-h-11 items-center rounded-2xl bg-verse-purple/20 px-6 py-3 font-bold text-[#C1B6FF] border border-verse-purple/30 hover:bg-verse-purple/30 transition-all"
          >
            View all services →
          </Link>
        </div>
      </div>
    </section>
  );
}
