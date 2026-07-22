import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, Blocks, BriefcaseBusiness, CircleDollarSign, Clock3, FileCheck2, LockKeyhole, ReceiptText, ShieldCheck, Sparkles, Workflow } from "lucide-react";
import { Web3Provider } from "@/components/Web3Provider";
import CreatorIntentButton from "@/components/CreatorIntentButton";

export const metadata: Metadata = {
  title: "For Creators — Turn Clear Scope Into Trackable Paid Work",
  description: "Learn how QuestPay helps approved creators receive structured briefs, verify direct Polygon payments, manage order status, and keep privacy-safe delivery proof.",
};

const primary = "inline-flex min-h-12 items-center justify-center rounded-xl bg-[linear-gradient(180deg,#8b5cff,#6c3ee8)] px-6 py-3 font-bold text-white shadow-[0_14px_38px_rgba(103,55,225,.28)] transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--qp-focus-ring)]";
const secondary = "inline-flex min-h-12 items-center justify-center rounded-xl border border-[var(--qp-border-default)] bg-white/[.025] px-6 py-3 font-bold text-white transition hover:bg-white/[.07] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--qp-focus-ring)]";

const joinSteps = [
  ["01", "Create one account", "Sign in with a supported wallet, Google, or secure email link. QuestPay never asks for a seed phrase."],
  ["02", "Complete your profile", "Add the required identity and contact fields so paid orders have a reliable delivery context."],
  ["03", "Request creator access", "Choose Start Selling and complete onboarding. Creator Studio remains role-gated and is enabled for approved creator accounts."],
  ["04", "Work from clear orders", "Review structured briefs, confirm paid status, update allowed progress states, and record delivery against one order."],
] as const;

const features = [
  [BriefcaseBusiness, "Scoped service requests", "Each request begins from a defined package, price baseline, turnaround target, inputs, and revision boundary."],
  [LockKeyhole, "Private structured briefs", "Contact details, requirements, references, and delivery context remain off-chain and behind authorized access."],
  [CircleDollarSign, "Direct Polygon payments", "Funds go to the configured creator wallet. QuestPay verifies the locked receiver, asset, amount, and transaction."],
  [Workflow, "Persisted order status", "Review paid work and move it through the real allowed lifecycle instead of losing progress across scattered DMs."],
  [ReceiptText, "Connected proof", "Payment, order events, delivery state, and privacy-safe public receipt remain attached to the same order reference."],
  [ShieldCheck, "Server-side boundaries", "Private data and status mutations use server authorization; the browser cannot simply mark an order paid."],
] as const;

const creatorGets = [
  "A structured view of paid requests",
  "Clear package and revision boundaries",
  "Private buyer brief and references",
  "Verified payment status before work begins",
  "A consistent progress and delivery history",
  "A shareable receipt without exposing the brief",
];

export default function ForCreatorsPage() {
  return (
    <Web3Provider>
      <div className="relative min-screen-safe overflow-clip bg-[#020207] pt-6 text-white">
        <section className="relative px-4 py-16 sm:px-6 sm:py-24 lg:px-8 lg:py-28">
          <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_75%_20%,rgba(135,68,246,.18),transparent_34%),radial-gradient(circle_at_15%_70%,rgba(83,38,164,.11),transparent_32%)]" />
          <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.02fr_.98fr] lg:items-center">
            <div className="min-w-0">
              <div className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[var(--qp-violet-500)]/25 bg-[var(--qp-violet-600)]/10 px-4 font-mono text-xs font-black uppercase tracking-[.16em] text-[var(--qp-violet-300)]"><Sparkles size={15} /> Built for creator work</div>
              <h1 className="mt-6 max-w-4xl text-balance font-sora text-[clamp(2.8rem,6.4vw,6.3rem)] font-black leading-[.94] tracking-[-.065em]">Turn clear scope into <span className="gradient-text">trackable paid work.</span></h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-[var(--qp-text-secondary)] sm:text-lg">QuestPay gives approved creators one place to receive structured requests, confirm direct crypto payment, follow progress, and keep delivery proof connected—without publishing the private brief.</p>
              <div className="mt-8 flex flex-col gap-3 min-[390px]:flex-row">
                <CreatorIntentButton className={primary}>Become a Creator</CreatorIntentButton>
                <Link href="/how-it-works" className={secondary}>See the Full Workflow</Link>
              </div>
            </div>
            <div className="relative mx-auto w-full max-w-xl overflow-hidden rounded-[2rem] border border-[rgba(171,122,255,.22)] bg-[radial-gradient(circle_at_70%_20%,rgba(139,77,255,.2),transparent_42%),rgba(8,7,15,.94)] p-5 shadow-[0_35px_110px_rgba(0,0,0,.55)] sm:p-8">
              <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[url('/assets/how-it-works/workflow-particle-field.svg')] bg-cover opacity-30" />
              <Image src="/assets/how-it-works/creator-flow-illustration.svg" alt="QuestPay creator order workflow" width={720} height={440} priority className="relative h-auto w-full" />
              <div className="relative mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {["Private brief", "Verified paid state", "Tracked delivery"].map((item) => <div key={item} className="min-w-0 rounded-xl border border-white/[.09] bg-black/30 p-3 text-center text-xs font-bold leading-5 text-[var(--qp-text-secondary)] last:col-span-2 sm:last:col-span-1">{item}</div>)}
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-3 text-center text-sm font-bold text-[var(--qp-text-secondary)] sm:grid-cols-2 lg:grid-cols-4">
            {["Escrow released on accept", "No seed phrase", "Private brief off-chain", "Public proof redacted"].map((item) => <p key={item} className="rounded-xl border border-white/[.06] bg-black/20 px-4 py-3"><BadgeCheck className="mr-2 inline text-[var(--qp-violet-300)]" size={16} />{item}</p>)}
          </div>
        </section>

        <section className="px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <p className="font-mono text-xs font-black uppercase tracking-[.2em] text-[var(--qp-violet-300)]">How to become a creator</p>
            <h2 className="mt-3 max-w-3xl font-sora text-3xl font-black tracking-[-.045em] sm:text-5xl">A clear path from account to Creator Studio.</h2>
            <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {joinSteps.map(([number, title, text]) => <article key={number} className="relative min-w-0 overflow-hidden rounded-[1.6rem] border border-[var(--qp-border-default)] bg-[linear-gradient(180deg,rgba(17,14,28,.95),rgba(7,7,13,.98))] p-6"><span className="font-mono text-3xl font-black text-[var(--qp-violet-500)]/55">{number}</span><h3 className="mt-5 font-sora text-xl font-black">{title}</h3><p className="mt-3 text-sm leading-7 text-[var(--qp-text-muted)]">{text}</p></article>)}
            </div>
          </div>
        </section>

        <section className="px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl"><p className="font-mono text-xs font-black uppercase tracking-[.2em] text-[var(--qp-violet-300)]">Creator features</p><h2 className="mt-3 font-sora text-3xl font-black tracking-[-.045em] sm:text-5xl">Everything stays connected to the order.</h2></div>
            <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {features.map(([Icon, title, text]) => <article key={title} className="min-w-0 rounded-[1.6rem] border border-[var(--qp-border-default)] bg-[radial-gradient(circle_at_90%_0%,rgba(139,77,255,.11),transparent_38%),rgba(9,8,16,.96)] p-6 sm:p-7"><span className="grid size-12 place-items-center rounded-2xl border border-[var(--qp-violet-500)]/25 bg-[var(--qp-violet-600)]/12 text-[var(--qp-violet-300)]"><Icon size={23} /></span><h3 className="mt-5 font-sora text-xl font-black">{title}</h3><p className="mt-3 text-sm leading-7 text-[var(--qp-text-muted)]">{text}</p></article>)}
            </div>
          </div>
        </section>

        <section className="px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[.92fr_1.08fr]">
            <article className="rounded-[2rem] border border-[var(--qp-violet-500)]/20 bg-[var(--qp-violet-600)]/10 p-6 sm:p-9"><Blocks className="text-[var(--qp-violet-300)]" size={30} /><h2 className="mt-5 font-sora text-3xl font-black">What creators get.</h2><ul className="mt-7 grid gap-3">{creatorGets.map((item) => <li key={item} className="flex min-w-0 items-start gap-3 rounded-xl border border-white/[.08] bg-black/20 p-4 text-sm leading-6 text-[var(--qp-text-secondary)]"><FileCheck2 className="mt-0.5 shrink-0 text-[var(--qp-violet-300)]" size={18} />{item}</li>)}</ul></article>
            <article className="rounded-[2rem] border border-[var(--qp-border-default)] bg-[linear-gradient(180deg,rgba(17,14,28,.96),rgba(6,6,12,.99))] p-6 sm:p-9"><Clock3 className="text-[var(--qp-violet-300)]" size={30} /><h2 className="mt-5 font-sora text-3xl font-black">The real creator workflow.</h2><div className="mt-7 space-y-3">{["Receive a paid, scoped request", "Review its private brief and references", "Confirm server-verified payment status", "Update allowed progress states", "Provide the agreed output through the established channel", "Record delivery and preserve receipt history"].map((item, index) => <div key={item} className="flex min-w-0 gap-4 rounded-xl border border-white/[.075] bg-black/20 p-4"><span className="grid size-8 shrink-0 place-items-center rounded-full bg-[var(--qp-violet-600)]/25 font-mono text-xs font-black text-[var(--qp-violet-300)]">{index + 1}</span><p className="pt-1 text-sm leading-6 text-[var(--qp-text-secondary)]">{item}</p></div>)}</div></article>
          </div>
        </section>

        <section className="px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="mx-auto max-w-4xl rounded-[2rem] border border-[var(--qp-border-default)] bg-[radial-gradient(circle_at_50%_0%,rgba(139,77,255,.18),transparent_45%),rgba(8,7,15,.98)] p-7 text-center sm:p-12"><p className="font-mono text-xs font-black uppercase tracking-[.18em] text-[var(--qp-violet-300)]">Ready to organize paid work?</p><h2 className="mt-4 font-sora text-3xl font-black tracking-[-.045em] sm:text-5xl">Build a cleaner creator workflow.</h2><p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-[var(--qp-text-muted)]">Create your account, complete onboarding, and request creator access. Payments are held in transparent, on-chain-verifiable escrow and released to you when the buyer accepts — no hidden private brief exposure.</p><div className="mt-8 flex flex-col justify-center gap-3 min-[390px]:flex-row"><CreatorIntentButton className={primary}>Become a Creator</CreatorIntentButton><Link href="/services" className={secondary}>Explore Current Services</Link></div></div>
        </section>
      </div>
    </Web3Provider>
  );
}
