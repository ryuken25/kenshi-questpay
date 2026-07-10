import type { Metadata } from "next";
import { Web3Provider } from "@/components/Web3Provider";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { SERVICES } from "@/lib/services";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Services — Kenshi QuestPay",
  description: "Fixed-price micro-commission packages from $1 to $80. Pay with USDT, VERSE, or POL on Polygon mainnet.",
};

export default function ServicesPage() {
  return (
    <Web3Provider>
      <Navbar />
      <main className="min-screen-safe pt-20">
        <section className="px-4 py-14 sm:px-6 sm:py-18 lg:px-8">
          <div className="mx-auto w-full max-w-7xl">
            <div className="text-center mb-12">
              <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-verse-blue">
                Real payments: Polygon mainnet
              </p>
              <h1 className="section-title mt-3 font-sora font-black text-white">
                Service <span className="gradient-text">Catalog</span>
              </h1>
              <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-gray-400">
                Fixed-price packages make scope clear before payment. Pay with USDT, VERSE, or POL.
              </p>
              <p className="mx-auto mt-2 max-w-xl text-sm text-gray-600">{SITE.disclaimer}</p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {SERVICES.map((svc) => (
                <div
                  key={svc.slug}
                  className="group flex flex-col rounded-[1.5rem] p-6 glass-panel hover:border-verse-purple/30 hover:bg-white/[0.04] transition-all duration-300"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-4xl">{svc.emoji}</span>
                    <span className="rounded-full bg-verse-blue/10 px-3 py-1 font-mono text-xs font-bold text-verse-blue">
                      ${svc.usd} USDT
                    </span>
                  </div>
                  <h2 className="mt-4 font-sora text-lg font-black text-white">{svc.name}</h2>
                  <p className="mt-3 flex-1 text-sm leading-6 text-gray-400">{svc.description}</p>
                  <a
                    href={`/services/${svc.slug}`}
                    className="mt-5 inline-flex min-h-11 items-center justify-center rounded-2xl bg-verse-purple/20 px-4 py-3 font-bold text-verse-purple border border-verse-purple/30 group-hover:bg-verse-purple/30 transition-all"
                  >
                    View details →
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </Web3Provider>
  );
}
