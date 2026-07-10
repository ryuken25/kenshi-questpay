"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ShieldCheck, Users, FlaskConical } from "lucide-react";
import { SITE } from "@/lib/site";

const steps = [
  { num: "1", title: "Pick a service", text: "Choose a fixed-price package that matches your need." },
  { num: "2", title: "Fill a brief", text: "Describe your problem in a structured form instead of messy DMs." },
  { num: "3", title: "Pay with crypto", text: "Pay with USDT, VERSE, or POL on Polygon mainnet." },
  { num: "4", title: "Get a receipt", text: "Receive a verifiable on-chain receipt and email confirmation." },
];

const cards = [
  { icon: ShieldCheck, title: "For creators", text: "Stop losing payment proof and scope details in DMs. Every request starts with a clear package and brief." },
  { icon: Users, title: "For clients", text: "Know exactly what you are buying before sending payment, then keep a verifiable on-chain receipt." },
  { icon: FlaskConical, title: "For demos", text: "Try the flow for free on Base Sepolia testnet — no real funds needed." },
];

export default function HomeHowItWorks() {
  return (
    <section className="relative px-4 py-14 sm:px-6 sm:py-18 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <div className="glass-panel-strong rounded-[1.75rem] p-5 sm:p-8 lg:p-10">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-verse-blue">
                How it works
              </p>
              <h2 className="section-title mt-3 font-sora font-black text-white">
                QuestPay is a checkout page for small creator jobs.
              </h2>
              <ol className="mt-6 space-y-3 text-sm leading-7 text-gray-300 sm:text-base">
                {steps.map((s) => (
                  <li key={s.num}>
                    <b className="text-white">{s.num}.</b> {s.text}
                  </li>
                ))}
              </ol>
              <p className="mt-5 rounded-2xl border border-verse-purple/20 bg-verse-purple/10 p-4 text-sm leading-6 text-gray-300">
                The full brief stays private. Only a proof hash goes on-chain.
              </p>
              <div className="mt-5">
                <Link href="/how-it-works" className="inline-flex min-h-11 items-center rounded-2xl border border-white/10 bg-white/5 px-6 py-3 font-bold text-gray-200 hover:border-verse-blue/40 hover:bg-verse-blue/10 transition">
                  Learn more →
                </Link>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {cards.map(({ icon: Icon, title, text }) => (
                <article key={title} className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 sm:p-5">
                  <Icon className="h-6 w-6 text-verse-blue" />
                  <h3 className="mt-3 font-sora text-base font-bold text-white">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-gray-400">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
