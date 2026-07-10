import type { Metadata } from "next";
import { Web3Provider } from "@/components/Web3Provider";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HomeHowItWorks from "@/components/HomeHowItWorks";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "How It Works — Kenshi QuestPay",
  description: "Four steps: pick a service, fill a brief, pay with crypto on Polygon, get a verifiable receipt.",
};

const steps = [
  { num: "01", emoji: "🔍", title: "Pick a Service", text: "Browse fixed-price packages from $1 to $80. Each package clearly defines the scope of work — no ambiguity." },
  { num: "02", emoji: "📋", title: "Fill a Brief", text: "Submit a structured brief with your problem, deadline, and expected output. No more chaotic DMs or lost details." },
  { num: "03", emoji: "💳", title: "Pay with Crypto", text: "Pay with USDT, VERSE, or POL on Polygon mainnet. Low fees, instant settlement, no middlemen." },
  { num: "04", emoji: "✅", title: "Get a Receipt", text: "Receive an on-chain verifiable receipt and email confirmation. The transaction hash is your canonical proof." },
];

export default function HowItWorksPage() {
  return (
    <Web3Provider>
      <Navbar />
      <main className="min-screen-safe pt-20">
        <section className="px-4 py-14 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <div className="text-center mb-12">
              <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-verse-blue">
                {SITE.realNetwork}
              </p>
              <h1 className="section-title mt-3 font-sora font-black text-white">
                How It <span className="gradient-text">Works</span>
              </h1>
              <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-gray-400">
                From service selection to verifiable receipt in four simple steps.
              </p>
            </div>

            <div className="space-y-6">
              {steps.map((step) => (
                <div key={step.num} className="glass-panel-strong rounded-2xl p-6 sm:p-8">
                  <div className="flex items-start gap-6">
                    <div className="flex-shrink-0 grid h-14 w-14 place-items-center rounded-2xl bg-verse-purple/20 text-3xl">
                      {step.emoji}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-mono text-xs text-gray-500">{step.num}</span>
                        <h2 className="font-sora text-xl font-bold text-white">{step.title}</h2>
                      </div>
                      <p className="text-sm leading-7 text-gray-400 sm:text-base">{step.text}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12 text-center">
              <a
                href="/services"
                className="inline-flex min-h-11 items-center rounded-2xl bg-verse-purple px-6 py-3 font-bold text-white"
              >
                Browse Services →
              </a>
            </div>
          </div>
        </section>
        <HomeHowItWorks />
      </main>
      <Footer />
    </Web3Provider>
  );
}
