import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, CircleAlert, LockKeyhole, ReceiptText, ShieldCheck } from "lucide-react";
import { Web3Provider } from "@/components/Web3Provider";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CreatorIntentButton from "@/components/CreatorIntentButton";
import HowWorkflowSteps from "@/components/how-it-works/HowWorkflowSteps";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "How QuestPay Works — Scope, Payment, Delivery, Proof",
  description: "Follow the real QuestPay path from a scoped service and private brief to server-verified Polygon payment, tracked delivery, and privacy-safe public proof.",
};

const primaryButton = "inline-flex min-h-12 items-center justify-center rounded-xl bg-[linear-gradient(180deg,#8b5cff,#6c3ee8)] px-6 py-3 font-bold text-white shadow-[0_12px_32px_rgba(100,56,220,.25)] transition hover:bg-[linear-gradient(180deg,#966cff,#7548ed)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--qp-focus-ring)]";
const secondaryButton = "inline-flex min-h-12 items-center justify-center rounded-xl border border-[var(--qp-border-default)] bg-white/[.025] px-6 py-3 font-bold text-white transition hover:bg-[var(--qp-surface-hover)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--qp-focus-ring)]";
const persistedStates = ["pending", "awaiting payment", "paid", "reviewing", "accepted", "in progress", "delivered", "completed", "expired", "cancelled"];
const edgeCases = [
  ["Wallet request rejected", "No transaction or session is created. Return to the wallet list and retry when ready."],
  ["Wrong network", "Switch to the network shown in the locked quote. QuestPay does not silently submit on another chain."],
  ["Payment still pending", "The order remains unverified until the configured confirmation policy is satisfied."],
  ["Quote expired", "Request a fresh server quote rather than reusing an old receiver and amount snapshot."],
  ["Wrong receiver or amount", "Verification rejects the transfer and does not attach it as payment proof."],
  ["Duplicate transaction", "One transaction hash can prove only one order."],
  ["Delivery target missed", "The real current status remains visible. QuestPay does not invent a late state or automatic refund."],
] as const;
const faqs = [
  ["Does connecting a wallet charge gas?", "No. Wallet authentication asks for a message signature. Payment is a separate transaction after quote confirmation."],
  ["Is my brief public?", "No. Contact details, brief text, references, and sensitive delivery context remain off-chain and are redacted from public receipts."],
  ["Which assets can I use?", "QuestPay displays only network and asset combinations enabled by the server for the current checkout."],
  ["Does QuestPay custody payment?", "No. The verified transfer goes to the receive address configured by the server."],
  ["Can a transaction be reused?", "No. Transaction uniqueness protection rejects reuse across orders."],
] as const;

export default function HowItWorksPage() {
  return (
    <Web3Provider>
      <Navbar />
      <main className="relative min-screen-safe overflow-clip bg-[#020207] pt-20 text-white">
        <section className="relative flex min-h-[min(760px,calc(100svh-80px))] items-center border-b border-white/[.055] px-5 py-16 sm:px-6 sm:py-24 lg:px-8">
          <span className="qp-workflow-particles absolute -inset-[4%] bg-[url('/assets/how-it-works/workflow-particle-field.svg')] bg-cover bg-center bg-no-repeat opacity-60 mix-blend-screen" aria-hidden="true" />
          <div className="relative mx-auto grid w-full max-w-6xl gap-12 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
            <div>
              <p className="font-mono text-xs font-black uppercase tracking-[.2em] text-[var(--qp-violet-300)]">The QuestPay workflow · {SITE.realNetwork}</p>
              <h1 className="mt-5 max-w-3xl text-balance font-sora text-[clamp(2.7rem,6.2vw,6rem)] font-black leading-[.95] tracking-[-.06em] text-white">From a clear brief<br /><span className="gradient-text">to verifiable delivery.</span></h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-[var(--qp-text-secondary)] sm:text-lg">QuestPay keeps service scope, private requirements, crypto payment, progress, delivery, and public proof connected to one order.</p>
              <div className="mt-8 flex flex-col gap-3 min-[390px]:flex-row">
                <Link href="/services" className={primaryButton}>Browse Services</Link>
                <CreatorIntentButton className={secondaryButton} />
              </div>
            </div>
            <div className="rounded-[2rem] border border-[rgba(166,116,255,.18)] bg-[radial-gradient(circle_at_70%_20%,rgba(139,77,255,.17),transparent_42%),rgba(6,6,12,.88)] p-5 shadow-[0_30px_100px_rgba(0,0,0,.45)] sm:p-7">
              <p className="font-mono text-xs font-bold uppercase tracking-[.18em] text-[var(--qp-violet-300)]">One connected order</p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {["Scoped service", "Private brief", "Locked quote", "Verified payment", "Tracked delivery", "Public receipt"].map((item, index) => <div key={item} className="flex min-h-16 items-center gap-3 rounded-2xl border border-[var(--qp-border-soft)] bg-black/25 p-4"><span className="grid size-8 shrink-0 place-items-center rounded-full bg-[var(--qp-violet-600)]/25 font-mono text-xs font-black text-[var(--qp-violet-300)]">{index + 1}</span><span className="font-sora text-sm font-bold text-white">{item}</span></div>)}
              </div>
              <div className="mt-5 overflow-hidden rounded-2xl border border-[var(--qp-violet-500)]/20 bg-[var(--qp-violet-600)]/10 p-4 font-mono text-xs leading-6 text-[var(--qp-text-secondary)]">Order → quote → transaction → verification → delivery → receipt</div>
            </div>
          </div>
        </section>

        <section id="overview" className="scroll-mt-40 px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="mx-auto max-w-6xl rounded-[2rem] border border-[var(--qp-border-default)] bg-[linear-gradient(180deg,rgba(18,16,29,.92),rgba(7,7,13,.97))] p-6 sm:p-10">
            <p className="font-mono text-xs font-black uppercase tracking-[.2em] text-[var(--qp-violet-300)]">Why the workflow exists</p>
            <h2 className="mt-3 max-w-3xl font-sora text-3xl font-black tracking-[-.04em] text-white sm:text-5xl">Replace fragmented DMs with one structured order.</h2>
            <p className="mt-5 max-w-4xl text-base leading-8 text-[var(--qp-text-secondary)]">Small creator jobs often scatter scope, contact details, payment proof, status, and delivery across unrelated chats. QuestPay gives each side one order reference and keeps private workspace data separate from public transaction proof.</p>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {["Scope stays explicit", "Payment is server-verified", "Public proof stays redacted"].map((item) => <p key={item} className="rounded-2xl border border-[var(--qp-border-soft)] bg-black/20 p-4 font-sora text-sm font-bold text-white">{item}</p>)}
            </div>
          </div>
        </section>

        <HowWorkflowSteps />

        <section id="verification" className="scroll-mt-40 px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="mx-auto max-w-6xl rounded-[2rem] border border-[var(--qp-violet-500)]/25 bg-[var(--qp-violet-600)]/10 p-6 sm:p-10">
            <div className="flex items-center gap-3"><BadgeCheck className="text-[var(--qp-violet-300)]" size={30} aria-hidden="true" /><h2 className="font-sora text-3xl font-black text-white">Payment proof, step by step.</h2></div>
            <div className="mt-7 grid gap-3 md:grid-cols-3 lg:grid-cols-6">{["Order total", "Network + token", "Locked receiver + amount", "Transaction hash", "Server verification", "Public receipt"].map((item, index) => <div key={item} className="rounded-xl border border-white/10 bg-black/20 p-4"><span className="font-mono text-xs text-[var(--qp-violet-300)]">0{index + 1}</span><p className="mt-2 text-sm font-bold text-white">{item}</p></div>)}</div>
            <Link href="/verify" className="mt-7 inline-flex min-h-11 items-center font-bold text-[var(--qp-violet-300)] hover:text-white">Open receipt verifier →</Link>
          </div>
        </section>

        <section className="px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-2">
            <article id="creator-workflow" className="relative scroll-mt-40 overflow-hidden rounded-[2rem] border border-[var(--qp-border-default)] bg-[radial-gradient(circle_at_85%_10%,rgba(139,77,255,.14),transparent_38%),rgba(8,7,15,.96)] p-6 sm:p-8">
              <span id="creator" className="absolute -top-24" aria-hidden="true" />
              <Image src="/assets/how-it-works/creator-flow-illustration.svg" alt="Creator workflow" width={520} height={300} className="h-auto w-full" />
              <p className="mt-6 font-mono text-xs font-black uppercase tracking-[.18em] text-[var(--qp-violet-300)]">Creator workflow</p>
              <h2 className="mt-3 font-sora text-3xl font-black text-white">Paid work with connected context.</h2>
              <p className="mt-3 text-base leading-7 text-[var(--qp-text-secondary)]">Receive a scoped paid request, review private requirements, update allowed status, and keep completion history attached to the same order.</p>
              <details className="mt-6 rounded-2xl border border-[var(--qp-border-soft)] bg-black/20 p-4"><summary className="cursor-pointer font-bold text-white">View Creator Workflow</summary><ol className="mt-4 space-y-2 text-sm leading-7 text-[var(--qp-text-secondary)]">{["Review a paid structured order", "Read the private brief", "Move through allowed persisted statuses", "Provide the agreed output through the established channel", "Mark delivery and completion", "Keep payment and order events connected"].map((item, index) => <li key={item}><strong className="text-white">{index + 1}.</strong> {item}</li>)}</ol></details>
              <CreatorIntentButton className={`${primaryButton} mt-6`} />
            </article>
            <article id="buyer-workflow" className="relative scroll-mt-40 overflow-hidden rounded-[2rem] border border-[var(--qp-border-default)] bg-[radial-gradient(circle_at_85%_10%,rgba(139,77,255,.12),transparent_38%),rgba(8,7,15,.96)] p-6 sm:p-8">
              <span id="buyer" className="absolute -top-24" aria-hidden="true" />
              <Image src="/assets/how-it-works/buyer-flow-illustration.svg" alt="Buyer workflow" width={520} height={300} className="h-auto w-full" />
              <p className="mt-6 font-mono text-xs font-black uppercase tracking-[.18em] text-[var(--qp-violet-300)]">Buyer workflow</p>
              <h2 className="mt-3 font-sora text-3xl font-black text-white">Clear expectations before payment.</h2>
              <p className="mt-3 text-base leading-7 text-[var(--qp-text-secondary)]">Compare packages, submit private context, review the locked quote, pay through a supported route, and keep verifiable proof.</p>
              <details className="mt-6 rounded-2xl border border-[var(--qp-border-soft)] bg-black/20 p-4"><summary className="cursor-pointer font-bold text-white">View Buyer Workflow</summary><ol className="mt-4 space-y-2 text-sm leading-7 text-[var(--qp-text-secondary)]">{["Compare scoped services", "Sign in and complete required profile fields", "Submit the private brief", "Review the server quote", "Confirm the wallet transfer", "Follow persisted status", "Keep a privacy-safe receipt"].map((item, index) => <li key={item}><strong className="text-white">{index + 1}.</strong> {item}</li>)}</ol></details>
              <Link href="/services" className={`${secondaryButton} mt-6`}>Browse Services</Link>
            </article>
          </div>
        </section>

        <section id="failures" className="scroll-mt-40 px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="flex items-center gap-3"><CircleAlert className="text-[var(--qp-violet-300)]" aria-hidden="true" /><h2 className="font-sora text-3xl font-black text-white sm:text-5xl">When something goes wrong.</h2></div>
            <div className="mt-8 grid gap-3 md:grid-cols-2">{edgeCases.map(([title, text]) => <details key={title} className="rounded-2xl border border-[var(--qp-border-soft)] bg-[var(--qp-surface)] p-5"><summary className="cursor-pointer font-sora text-base font-bold text-white">{title}</summary><p className="mt-3 text-sm leading-7 text-[var(--qp-text-muted)]">{text}</p></details>)}</div>
          </div>
        </section>

        <section id="security" className="scroll-mt-40 px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="mx-auto max-w-6xl rounded-[2rem] border border-[var(--qp-violet-500)]/25 bg-[var(--qp-violet-600)]/10 p-6 sm:p-10">
            <div className="flex items-center gap-3"><ShieldCheck className="text-[var(--qp-violet-300)]" size={30} aria-hidden="true" /><h2 className="font-sora text-3xl font-black text-white">Privacy and security boundaries.</h2></div>
            <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{["Server-authoritative quote", "No seed phrase collection", "Message signature is not payment", "Private brief remains off-chain", "Public receipt is sanitized", "Server authorization protects private records"].map((item) => <p key={item} className="rounded-xl border border-white/10 bg-black/15 p-4 text-sm leading-6 text-[var(--qp-text-secondary)]"><LockKeyhole className="mr-2 inline text-[var(--qp-violet-300)]" size={15} aria-hidden="true" />{item}</p>)}</div>
            <p className="mt-6 text-sm leading-7 text-[var(--qp-text-secondary)]">Persisted order states: {persistedStates.join(" · ")}.</p>
          </div>
        </section>

        <section id="faq" className="scroll-mt-40 px-4 py-16 sm:px-6 sm:py-24 lg:px-8"><div className="mx-auto max-w-4xl"><div className="flex items-center gap-3"><ReceiptText className="text-[var(--qp-violet-300)]" aria-hidden="true" /><h2 className="font-sora text-3xl font-black text-white sm:text-5xl">Practical answers.</h2></div><div className="mt-8 space-y-3">{faqs.map(([question, answer]) => <details key={question} className="rounded-2xl border border-[var(--qp-border-soft)] bg-[var(--qp-surface)] p-5"><summary className="cursor-pointer font-sora text-base font-bold text-white">{question}</summary><p className="mt-3 text-sm leading-7 text-[var(--qp-text-muted)]">{answer}</p></details>)}</div></div></section>

        <section id="about" className="scroll-mt-40 px-4 py-20 sm:px-6 sm:py-28 lg:px-8"><div className="mx-auto max-w-4xl rounded-[2rem] border border-[var(--qp-border-default)] bg-[linear-gradient(180deg,rgba(18,16,29,.95),rgba(7,7,13,.98))] p-8 text-center sm:p-12"><p className="font-mono text-xs font-black uppercase tracking-[.18em] text-[var(--qp-violet-300)]">Ready to turn clear scope into trackable work?</p><h2 className="mt-4 font-sora text-3xl font-black text-white sm:text-5xl">Start with a real package and keep the proof connected.</h2><div className="mt-8 flex flex-col justify-center gap-3 min-[390px]:flex-row"><Link href="/services" className={primaryButton}>Browse Services</Link><CreatorIntentButton className={secondaryButton} /></div><p className="mt-5 text-xs leading-6 text-[var(--qp-text-subtle)]">{SITE.disclaimer}</p></div></section>
      </main>
      <Footer />
    </Web3Provider>
  );
}
