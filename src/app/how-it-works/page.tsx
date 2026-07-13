import type { Metadata } from "next";
import Link from "next/link";
import {
  BadgeCheck,
  CircleDollarSign,
  ClipboardList,
  FileLock2,
  PackageCheck,
  ReceiptText,
  ShieldCheck,
  Truck,
  UserRoundCheck,
  WalletCards,
} from "lucide-react";
import { Web3Provider } from "@/components/Web3Provider";
import CreatorIntentButton from "@/components/CreatorIntentButton";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "How QuestPay Works — Scope, Crypto Payment, Delivery and Proof",
  description: "A detailed guide to QuestPay service scope, private briefs, locked quotes, Polygon payments, verification, delivery, and privacy-safe receipts.",
};

const steps = [
  {
    id: "service",
    number: "01",
    icon: PackageCheck,
    title: "Choose a scoped service",
    text: "Each package defines the deliverable, USD price, delivery window, buyer inputs, revision boundary, and enabled payment assets before checkout begins.",
    bullets: ["Exact deliverable", "Required buyer inputs", "Visible revision boundary", "Server-enabled chain and token options"],
  },
  {
    id: "profile",
    number: "02",
    icon: UserRoundCheck,
    title: "Sign in and complete your profile",
    text: "Use a wallet message signature, Google, or secure email. A wallet signature authenticates an account; it is not a blockchain payment and never exposes a seed phrase.",
    bullets: ["Verified identity methods", "Reusable contact details", "Preferred network", "Server-authoritative roles"],
  },
  {
    id: "brief",
    number: "03",
    icon: FileLock2,
    title: "Submit a private structured brief",
    text: "The order captures the goal, current problem, desired outcome, references, contact preference, deadline context, and optional notes as one stable request snapshot.",
    bullets: ["Private requirements stay off-chain", "References remain tied to the order", "No scattered DM history", "Scope survives later status changes"],
  },
  {
    id: "quote",
    number: "04",
    icon: ClipboardList,
    title: "Receive a locked quote",
    text: "QuestPay creates the quote server-side. The browser cannot override the receive address, amount, token contract, chain ID, expiry, or order reference.",
    bullets: ["Service price", "Exact token amount", "Configured receive address", "Chain ID and expiry"],
  },
  {
    id: "payment",
    number: "05",
    icon: WalletCards,
    title: "Pay directly in crypto",
    text: "Polygon is live. BNB Chain remains staged behind the payment and verification gate until it is production-safe. QuestPay displays only combinations actually enabled by the server.",
    bullets: ["USDT", "USDC", "POL", "VERSE"],
  },
  {
    id: "verification",
    number: "06",
    icon: BadgeCheck,
    title: "Verify the transfer server-side",
    text: "An order becomes paid only after QuestPay verifies the transaction, network, asset, receiver, amount, confirmation policy, quote integrity, and transaction uniqueness.",
    bullets: ["Correct network and asset", "Expected receiver and amount", "No reused transaction hash", "No client-side paid-state shortcut"],
  },
  {
    id: "tracking",
    number: "07",
    icon: CircleDollarSign,
    title: "Track the work",
    text: "Payment, progress, delivery, and receipt share one order reference from awaiting payment through completion.",
    bullets: ["Pending or awaiting payment", "Paid, reviewing, accepted, or in progress", "Delivered or completed", "Expired or cancelled"],
  },
  {
    id: "delivery",
    number: "08",
    icon: Truck,
    title: "Receive the output",
    text: "After providing the agreed output through the established delivery channel, a creator can mark the connected order delivered. QuestPay records the status and delivery timestamp without claiming to host private files.",
    bullets: ["Connected order reference", "Delivered status", "Delivery timestamp", "Completion path"],
  },
  {
    id: "receipt",
    number: "09",
    icon: ReceiptText,
    title: "Keep privacy-safe public proof",
    text: "The receipt can expose public payment and completion proof while redacting the buyer contact, private brief, private references, delivery secrets, and internal notes.",
    bullets: ["Public order reference", "Chain, asset, amount, and transaction", "Verification and completion state", "Private data redacted"],
  },
] as const;

const failures = [
  ["Wallet connection rejected", "No transaction occurs. Retry or choose another sign-in method."],
  ["Quote expired", "Generate a fresh server quote instead of accepting the old amount."],
  ["Wrong network", "Switch to the selected network; QuestPay does not silently submit elsewhere."],
  ["Transaction pending", "Keep the order in payment verification until the confirmation policy is met."],
  ["Wrong receiver or amount", "Reject verification with a clear reason and do not attach the transfer."],
  ["Duplicate transaction", "Reject reuse: one transaction hash can prove only one order."],
  ["Delivery target missed", "Keep the real current order status visible and use the available contact or support path; QuestPay does not invent automatic refunds."],
] as const;

const faqs = [
  ["Does connecting a wallet charge gas?", "No. Authentication uses a message signature. A blockchain transaction is requested only when the buyer confirms payment."],
  ["Can I use Google or email?", "Yes for account access. A compatible wallet is still required for an on-chain crypto payment."],
  ["Which assets are supported?", "QuestPay displays only combinations enabled by the server. Current direction is USDT, USDC, POL, and VERSE, with Polygon live."],
  ["Does QuestPay hold the money?", "No. The verified transfer goes to the receive address configured by the server; QuestPay does not custody the payment."],
  ["Is my brief public?", "No. Public receipts redact private briefs, contact details, references, and sensitive delivery data."],
  ["Can one transaction be reused?", "No. Transaction uniqueness protection rejects reuse across orders."],
] as const;

const primaryButton = "inline-flex min-h-12 items-center justify-center rounded-xl bg-[var(--qp-violet-strong)] px-6 py-3 font-bold text-white transition hover:bg-[var(--qp-violet)]";
const secondaryButton = "inline-flex min-h-12 items-center justify-center rounded-xl border border-[var(--qp-border-default)] bg-[var(--qp-surface)] px-6 py-3 font-bold text-[var(--qp-text-primary)] transition hover:bg-[var(--qp-surface-hover)]";

export default function HowItWorksPage() {
  return (
    <Web3Provider>
      <Navbar />
      <main className="min-screen-safe pt-20">
        <section className="px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto max-w-4xl text-center">
              <p className="font-mono text-xs font-bold uppercase tracking-[.2em] text-[var(--qp-violet-300)]">How QuestPay works · {SITE.realNetwork}</p>
              <h1 className="mt-4 text-balance font-sora text-4xl font-black leading-tight tracking-[-.045em] text-white sm:text-6xl">From a clear service to <span className="gradient-text">verified delivery.</span></h1>
              <p className="mx-auto mt-5 max-w-3xl text-base leading-8 text-[var(--qp-text-secondary)] sm:text-lg">QuestPay connects scope, identity, payment, progress, delivery, and public proof in one order—without turning a private brief into public blockchain data.</p>
              <div className="mt-7 flex flex-wrap justify-center gap-3">
                <Link href="/services" className={primaryButton}>Browse Services</Link>
                <a href="#payment" className={secondaryButton}>See payment verification</a>
              </div>
            </div>

            <nav aria-label="How QuestPay works sections" className="mt-12 flex snap-x gap-2 overflow-x-auto pb-2 lg:flex-wrap lg:justify-center lg:overflow-visible">
              {["overview", ...steps.map((step) => step.id), "creator", "buyer", "failures", "security", "faq"].map((id) => (
                <a key={id} href={`#${id}`} className="min-h-11 shrink-0 snap-start rounded-full border border-[var(--qp-border-soft)] bg-[var(--qp-surface)] px-4 py-3 text-xs font-bold capitalize text-[var(--qp-text-secondary)] hover:text-white">{id}</a>
              ))}
            </nav>
          </div>
        </section>

        <section id="overview" className="scroll-mt-28 px-4 py-14 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl rounded-[2rem] border border-[var(--qp-border-default)] bg-[linear-gradient(180deg,rgba(18,16,29,.92),rgba(7,7,13,.97))] p-6 sm:p-10">
            <p className="font-mono text-xs font-bold uppercase tracking-[.2em] text-[var(--qp-violet-300)]">The problem QuestPay solves</p>
            <h2 className="mt-3 font-sora text-3xl font-black text-white sm:text-4xl">Replace fragmented DMs with one structured order.</h2>
            <p className="mt-4 max-w-3xl text-base leading-8 text-[var(--qp-text-secondary)]">Small creator jobs often lose scope, contact details, payment proof, and delivery links across chats. QuestPay keeps the complete path connected.</p>
            <div className="mt-8 grid gap-3 sm:grid-cols-5">
              {["Service", "Brief", "Quote", "Payment", "Delivery + Receipt"].map((item, index) => <div key={item} className="rounded-2xl border border-[var(--qp-border-soft)] bg-[var(--qp-surface)] p-4"><span className="font-mono text-xs text-[var(--qp-violet-300)]">0{index + 1}</span><p className="mt-2 font-bold text-white">{item}</p></div>)}
            </div>
          </div>
        </section>

        <section className="px-4 py-14 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl space-y-5">
            {steps.map(({ id, number, icon: Icon, title, text, bullets }) => (
              <article id={id} key={id} className="scroll-mt-28 rounded-[1.75rem] border border-[var(--qp-border-default)] bg-[linear-gradient(180deg,rgba(15,13,24,.90),rgba(8,8,14,.96))] p-6 sm:p-8">
                <div className="grid gap-6 lg:grid-cols-[auto_1fr_1fr] lg:items-start">
                  <div className="grid size-14 place-items-center rounded-2xl border border-[var(--qp-violet-500)]/30 bg-[var(--qp-violet-600)]/15 text-[var(--qp-violet-300)]"><Icon size={26} aria-hidden="true" /></div>
                  <div><p className="font-mono text-xs font-black uppercase tracking-[.18em] text-[var(--qp-violet-300)]">Step {number}</p><h2 className="mt-2 font-sora text-2xl font-black text-white sm:text-3xl">{title}</h2><p className="mt-3 text-base leading-8 text-[var(--qp-text-secondary)]">{text}</p></div>
                  <ul className="grid gap-2 text-sm leading-6 text-[var(--qp-text-muted)] sm:grid-cols-2 lg:grid-cols-1">{bullets.map((bullet) => <li key={bullet} className="rounded-xl border border-[var(--qp-border-soft)] bg-black/15 px-4 py-3">• {bullet}</li>)}</ul>
                </div>
                {id === "service" ? <Link href="/services#pricing" className="mt-5 inline-flex font-bold text-[var(--qp-violet-300)] hover:text-white">Compare services →</Link> : null}
                {id === "payment" ? <div className="mt-5 rounded-2xl border border-[var(--qp-violet-500)]/25 bg-[var(--qp-violet-600)]/10 p-4 text-sm leading-7 text-[var(--qp-text-secondary)]"><strong className="text-white">Authentication is not payment.</strong> Connecting a wallet signs a message. The transfer happens only after the buyer confirms a locked checkout quote.</div> : null}
                {id === "verification" ? <div className="mt-5 overflow-x-auto rounded-2xl border border-[var(--qp-border-soft)] bg-black/20 p-4 font-mono text-xs leading-6 text-[var(--qp-text-secondary)]">Order total → locked quote → wallet transaction → server verification → receipt</div> : null}
                {id === "receipt" ? <Link href="/verify" className="mt-5 inline-flex font-bold text-[var(--qp-violet-300)] hover:text-white">Open receipt verifier →</Link> : null}
              </article>
            ))}
          </div>
        </section>

        <section className="px-4 py-14 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-2">
            <article id="creator" className="scroll-mt-28 rounded-[1.75rem] border border-[var(--qp-border-default)] bg-[var(--qp-surface)] p-6 sm:p-8"><p className="font-mono text-xs font-bold uppercase tracking-[.18em] text-[var(--qp-violet-300)]">Creator workflow</p><h2 className="mt-3 font-sora text-3xl font-black text-white">Paid work with connected context.</h2><ol className="mt-5 space-y-3 text-base leading-7 text-[var(--qp-text-secondary)]">{["Receive a paid structured order", "Review the private brief", "Start work and update status", "Request missing information", "Deliver the output", "Respond to an allowed revision", "Keep payment and delivery history connected"].map((item, index) => <li key={item}><strong className="text-white">{index + 1}.</strong> {item}</li>)}</ol><CreatorIntentButton className={`${primaryButton} mt-6`} /></article>
            <article id="buyer" className="scroll-mt-28 rounded-[1.75rem] border border-[var(--qp-border-default)] bg-[var(--qp-surface)] p-6 sm:p-8"><p className="font-mono text-xs font-bold uppercase tracking-[.18em] text-[var(--qp-violet-300)]">Buyer workflow</p><h2 className="mt-3 font-sora text-3xl font-black text-white">Clear expectations before payment.</h2><ol className="mt-5 space-y-3 text-base leading-7 text-[var(--qp-text-secondary)]">{["Compare services", "Sign in once", "Submit a clear brief", "Review the locked quote", "Pay with an enabled asset", "Follow progress", "Receive delivery and public proof"].map((item, index) => <li key={item}><strong className="text-white">{index + 1}.</strong> {item}</li>)}</ol><Link href="/services" className={`${secondaryButton} mt-6`}>Browse Services</Link></article>
          </div>
        </section>

        <section id="failures" className="scroll-mt-28 px-4 py-14 sm:px-6 lg:px-8"><div className="mx-auto max-w-6xl"><p className="font-mono text-xs font-bold uppercase tracking-[.18em] text-[var(--qp-violet-300)]">Failure handling</p><h2 className="mt-3 font-sora text-3xl font-black text-white sm:text-4xl">What happens when something goes wrong?</h2><div className="mt-7 grid gap-4 md:grid-cols-2">{failures.map(([title, text]) => <article key={title} className="rounded-2xl border border-[var(--qp-border-soft)] bg-[var(--qp-surface)] p-5"><h3 className="font-sora text-lg font-bold text-white">{title}</h3><p className="mt-2 text-sm leading-7 text-[var(--qp-text-muted)]">{text}</p></article>)}</div></div></section>

        <section id="security" className="scroll-mt-28 px-4 py-14 sm:px-6 lg:px-8"><div className="mx-auto max-w-6xl rounded-[2rem] border border-[var(--qp-violet-500)]/25 bg-[var(--qp-violet-600)]/10 p-6 sm:p-10"><div className="flex items-center gap-3"><ShieldCheck className="text-[var(--qp-violet-300)]" size={30} /><h2 className="font-sora text-3xl font-black text-white">Privacy and security boundaries</h2></div><div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{["Direct, non-custodial configured transfer", "Server-side quote and verification", "No seed phrase collection", "Private briefs remain off-chain", "Public receipts are sanitized", "RLS and server authorization protect private records"].map((item) => <p key={item} className="rounded-xl border border-white/10 bg-black/15 p-4 text-sm leading-6 text-[var(--qp-text-secondary)]">• {item}</p>)}</div></div></section>

        <section id="faq" className="scroll-mt-28 px-4 py-14 sm:px-6 lg:px-8"><div className="mx-auto max-w-4xl"><p className="font-mono text-xs font-bold uppercase tracking-[.18em] text-[var(--qp-violet-300)]">FAQ</p><h2 className="mt-3 font-sora text-3xl font-black text-white sm:text-4xl">Practical answers before checkout.</h2><div className="mt-7 space-y-3">{faqs.map(([question, answer]) => <details key={question} className="group rounded-2xl border border-[var(--qp-border-soft)] bg-[var(--qp-surface)] p-5"><summary className="cursor-pointer list-none font-sora text-base font-bold text-white">{question}</summary><p className="mt-3 text-sm leading-7 text-[var(--qp-text-muted)]">{answer}</p></details>)}</div></div></section>

        <section id="about" className="scroll-mt-28 px-4 py-20 sm:px-6 lg:px-8"><div className="mx-auto max-w-4xl rounded-[2rem] border border-[var(--qp-border-default)] bg-[linear-gradient(180deg,rgba(18,16,29,.95),rgba(7,7,13,.98))] p-8 text-center sm:p-12"><p className="font-mono text-xs font-bold uppercase tracking-[.18em] text-[var(--qp-violet-300)]">Ready for one trackable order?</p><h2 className="mt-4 font-sora text-3xl font-black text-white sm:text-5xl">Turn a clear request into verified delivery.</h2><p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-[var(--qp-text-secondary)]">QuestPay is a community-built product and is not an official Bitcoin.com product. {SITE.disclaimer}</p><div className="mt-7 flex flex-wrap justify-center gap-3"><Link href="/services" className={primaryButton}>Browse Services</Link><CreatorIntentButton className={secondaryButton} /></div></div></section>
      </main>
      <Footer />
    </Web3Provider>
  );
}
