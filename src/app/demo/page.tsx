import type { Metadata } from "next";
import { Web3Provider } from "@/components/Web3Provider";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Demo — Kenshi QuestPay",
  description: "Free evaluator demo on Base Sepolia testnet. No real funds.",
};

export default function DemoPage() {
  return (
    <Web3Provider>
      <Navbar />
      <main className="min-screen-safe pt-20">
        <section className="px-4 py-14 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <div className="text-center mb-8">
              <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-yellow-400">
                Free evaluator demo
              </p>
              <h1 className="section-title mt-3 font-sora font-black text-white">
                Base Sepolia <span className="gradient-text">Demo</span>
              </h1>
              <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-gray-400">
                Try the QuestPay checkout flow for free on the Base Sepolia testnet. No real funds needed.
              </p>
            </div>

            <div className="glass-panel-strong rounded-2xl p-6 sm:p-8 space-y-6">
              <div className="rounded-2xl border border-yellow-400/30 bg-yellow-400/10 p-4 text-sm leading-6 text-yellow-100">
                <b>Testnet only — no real funds.</b> The demo uses the Base Sepolia testnet to show the full checkout → payment → receipt flow without spending real crypto.
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                  <h3 className="font-sora text-lg font-bold text-white">🧪 Try the demo</h3>
                  <p className="mt-2 text-sm text-gray-400">
                    Walk through the full checkout flow on Base Sepolia. You'll need testnet ETH in your wallet.
                  </p>
                  <a
                    href="/demo/base-sepolia"
                    className="mt-4 inline-flex min-h-11 items-center rounded-2xl bg-yellow-400 px-6 py-3 font-bold text-black"
                  >
                    Start demo →
                  </a>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                  <h3 className="font-sora text-lg font-bold text-white">💰 Real payments</h3>
                  <p className="mt-2 text-sm text-gray-400">
                    Ready for real? Browse services and pay with USDT, VERSE, or POL on Polygon mainnet.
                  </p>
                  <a
                    href="/services"
                    className="mt-4 inline-flex min-h-11 items-center rounded-2xl bg-verse-purple px-6 py-3 font-bold text-white"
                  >
                    Browse services →
                  </a>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs text-gray-500">{SITE.disclaimer}</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </Web3Provider>
  );
}
