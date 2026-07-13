import type { Metadata } from "next";
import { Web3Provider } from "@/components/Web3Provider";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HomeHowItWorks from "@/components/HomeHowItWorks";
import { SITE } from "@/lib/site";
const steps = [
  { num: "01", title: "Pick a Service", text: "Browse fixed-price services with defined scope, delivery target, and requirements." },
  { num: "02", title: "Fill a Brief", text: "Submit the problem, desired outcome, references, and contact path in a structured private form." },
  { num: "03", title: "Pay on Polygon", text: "Use a locked quote for USDT, fxVERSE, or POL when the token has a valid server-side price." },
  { num: "04", title: "Track and Receive", text: "Follow order status, receive delivery links, and keep a sanitized public receipt." },
];
export const metadata: Metadata = { title: "How It Works — Kenshi QuestPay", description: "Choose a service, submit a brief, pay on Polygon, track work, and receive delivery." };
export default function HowItWorksPage() { return <Web3Provider><Navbar/><main className="min-screen-safe pt-20"><section className="px-4 py-14 sm:px-6 lg:px-8"><div className="mx-auto max-w-4xl"><div className="mb-12 text-center"><p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-[var(--qp-violet-300)]">{SITE.realNetwork}</p><h1 className="section-title mt-3 font-sora font-black text-white">How It <span className="gradient-text">Works</span></h1><p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-muted">From service selection to delivery receipt in four simple steps.</p></div><div className="space-y-6">{steps.map((step)=><div key={step.num} className="glass-panel-strong rounded-2xl p-6 sm:p-8"><div className="flex items-start gap-6"><div className="grid h-14 w-14 flex-shrink-0 place-items-center rounded-2xl bg-verse-purple/20 font-mono text-sm font-black text-[var(--qp-violet-300)]">{step.num}</div><div className="flex-1"><h2 className="font-sora text-xl font-bold text-white">{step.title}</h2><p className="mt-2 text-sm leading-7 text-muted sm:text-base">{step.text}</p></div></div></div>)}</div><div className="mt-12 text-center"><a href="/services" className="inline-flex min-h-11 items-center rounded-2xl bg-verse-purple px-6 py-3 font-bold text-white">Browse Services</a></div></div></section><HomeHowItWorks/></main><Footer/></Web3Provider>; }
