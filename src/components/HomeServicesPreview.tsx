"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { BadgeCheck, Blocks, ClipboardCheck, FileCheck2, LayoutTemplate, LockKeyhole, PanelsTopLeft, Rocket, ShieldCheck, Wrench, Zap } from "lucide-react";
import { SERVICES } from "@/lib/services";

const trustItems = [
  { icon: ClipboardCheck, title: "Scope clarity", caption: "Clear deliverables" },
  { icon: ShieldCheck, title: "On-chain proof", caption: "Polygon live quotes" },
  { icon: LockKeyhole, title: "Payment gate", caption: "Server-verified route" },
  { icon: Rocket, title: "Track & deliver", caption: "Status to delivery" },
] as const;

const cardIcons = [ClipboardCheck, PanelsTopLeft, Wrench, Blocks, LayoutTemplate, Zap] as const;

function CardArtwork({ index }: { index: number }) {
  const Icon = cardIcons[index] ?? FileCheck2;
  return (
    <div aria-hidden="true" className="relative grid h-[92px] w-[116px] shrink-0 place-items-center overflow-hidden rounded-xl border border-[rgba(171,117,255,.16)] bg-[linear-gradient(145deg,rgba(34,20,65,.88),rgba(7,6,18,.96))] shadow-[inset_0_1px_0_rgba(255,255,255,.035),0_16px_38px_rgba(0,0,0,.3)] sm:h-[104px] sm:w-[132px]">
      <span className="absolute left-3 top-3 h-1.5 w-12 rounded-full bg-[#9d65ff]/25" />
      <span className="absolute left-3 top-7 h-1.5 w-8 rounded-full bg-[#9d65ff]/15" />
      <span className="absolute bottom-3 right-3 h-7 w-12 rounded-md border border-[#a46dff]/10 bg-[#8b4dff]/10" />
      <div className="relative grid size-12 place-items-center rounded-xl border border-[#b27bff]/20 bg-[radial-gradient(circle,rgba(159,93,255,.28),rgba(89,39,177,.1))] text-[#b878ff] shadow-[0_0_28px_rgba(139,77,255,.32)]"><Icon size={26} strokeWidth={1.8} /></div>
    </div>
  );
}

export default function HomeServicesPreview() {
  return (
    <section id="pricing" className="relative overflow-hidden qp-blend-section px-4 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-28" style={{'--blend-x': '82%', '--blend-color': 'rgba(118,55,225,.075)'} as React.CSSProperties}>
      <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_28%,rgba(91,35,180,.08),transparent_42%)]" />
      <div className="relative mx-auto w-full max-w-7xl">
        <div className="inline-flex max-w-full items-center rounded-full border border-[rgba(168,111,255,.23)] bg-[rgba(105,55,191,.055)] px-4 py-2 font-mono text-[10px] font-black uppercase leading-5 tracking-[.14em] text-[#c8b5ec] sm:px-5 sm:text-xs sm:tracking-[.17em]">
          Real payment ladder&nbsp; · &nbsp;Polygon live&nbsp; · &nbsp;BNB Chain payment-gated
        </div>

        <div className="mt-6 grid gap-6 border-b border-white/[.07] pb-8 lg:grid-cols-[1.08fr_.92fr] lg:items-end lg:gap-14 lg:pb-10">
          <h2 className="max-w-3xl text-balance font-sora text-[clamp(2.55rem,5.1vw,5.2rem)] font-black leading-[.98] tracking-[-.065em] text-white">Service packages<br className="hidden sm:block" /> that can <span className="bg-[linear-gradient(90deg,#9c62ff,#c18cff)] bg-clip-text text-transparent">actually sell.</span></h2>
          <p className="max-w-xl text-sm leading-7 text-[var(--qp-text-secondary)] sm:text-base lg:pb-1">Fixed-price packages make scope clear before payment. Polygon quotes support USDT, USDC, POL, and VERSE; BNB Chain stays behind the payment-verification gate until the complete route is proven safe.</p>
        </div>

        <div className="relative grid grid-cols-2 border-b border-white/[.07] py-6 lg:grid-cols-4 lg:py-7">
          <span aria-hidden="true" className="absolute -top-px left-1/2 h-px w-28 -translate-x-1/2 bg-[linear-gradient(90deg,transparent,#9b5fff,transparent)] shadow-[0_0_14px_#8b4dff]" />
          {trustItems.map(({ icon: Icon, title, caption }, index) => (
            <div key={title} className={`flex min-w-0 items-center gap-3 px-2 py-3 sm:px-5 lg:py-0 ${index % 2 ? "border-l border-white/[.07]" : ""} ${index > 1 ? "border-t border-white/[.07] lg:border-t-0" : ""} ${index === 2 ? "lg:border-l" : ""}`}>
              <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-[#a76eff]/20 bg-[#8b4dff]/10 text-[#aa70ff] shadow-[0_0_24px_rgba(139,77,255,.16)] sm:size-12"><Icon size={21} strokeWidth={1.8} /></span>
              <span className="min-w-0"><strong className="block font-sora text-sm font-bold text-white sm:text-base">{title}</strong><span className="mt-0.5 block text-[11px] leading-5 text-[var(--qp-text-muted)] sm:text-xs">{caption}</span></span>
            </div>
          ))}
        </div>

        <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((service, index) => (
            <motion.article
              key={service.slug}
              initial={false}
              className="group relative min-w-0 overflow-hidden rounded-[1.25rem] border border-[rgba(173,119,255,.14)] bg-[radial-gradient(circle_at_88%_18%,rgba(103,48,198,.10),transparent_36%),linear-gradient(145deg,rgba(10,8,22,.98),rgba(5,5,13,.99))] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,.025)] transition duration-300 hover:-translate-y-0.5 hover:border-[rgba(181,128,255,.32)] hover:shadow-[0_20px_60px_rgba(0,0,0,.38)] sm:p-6"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="rounded-full border border-white/[.08] bg-white/[.025] px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[.09em] text-[var(--qp-text-secondary)]">{service.delivery}</span>
                <span className="font-mono text-lg font-black text-[#a96aff] drop-shadow-[0_0_14px_rgba(155,81,255,.35)]">${service.usd}</span>
              </div>
              <div className="mt-4 flex min-w-0 items-end justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h3 className="font-sora text-lg font-black tracking-[-.025em] text-white sm:text-xl">{service.name}</h3>
                  <p className="mt-2 line-clamp-3 text-xs leading-5 text-[var(--qp-text-muted)] sm:text-sm sm:leading-6">{service.description}</p>
                  <Link href={`/services/${service.slug}`} className="mt-5 inline-flex min-h-11 items-center text-sm font-bold text-[#bd8cff] transition hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--qp-focus-ring)]">View package&nbsp; →</Link>
                </div>
                <CardArtwork index={index} />
              </div>
            </motion.article>
          ))}
        </div>

        <div className="mt-7 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link href="/services" className="inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-[#b279ff]/30 bg-[linear-gradient(180deg,#8f50ee,#642ac9)] px-8 py-3 font-bold text-white shadow-[0_12px_34px_rgba(104,38,205,.28),inset_0_1px_0_rgba(255,255,255,.18)] transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--qp-focus-ring)] sm:w-auto">View all services&nbsp; →</Link>
          <div className="flex items-center gap-3 text-left text-xs leading-5 text-[var(--qp-text-muted)]"><BadgeCheck className="shrink-0 text-[#aa70ff]" size={18} /><span><strong className="block text-[var(--qp-text-secondary)]">Payment protected.</strong>Scope first, pay later.</span></div>
        </div>
      </div>
    </section>
  );
}
