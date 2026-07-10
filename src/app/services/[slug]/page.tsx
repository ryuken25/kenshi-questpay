import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Web3Provider } from "@/components/Web3Provider";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { SERVICES, getServiceBySlug } from "@/lib/services";
import { SITE } from "@/lib/site";

interface Props {
  params: { slug: string };
}

export function generateStaticParams() {
  return SERVICES.map((s) => ({ slug: s.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const svc = getServiceBySlug(params.slug);
  if (!svc) return { title: "Service not found — QuestPay" };
  return {
    title: `${svc.name} — Kenshi QuestPay`,
    description: svc.description,
  };
}

export default function ServiceDetailPage({ params }: Props) {
  const svc = getServiceBySlug(params.slug);
  if (!svc) notFound();

  return (
    <Web3Provider>
      <Navbar />
      <main className="min-screen-safe pt-20">
        <section className="px-4 py-14 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <div className="glass-panel-strong rounded-[2rem] p-6 sm:p-8 lg:p-10">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-verse-blue">
                    {SITE.realNetwork}
                  </p>
                  <h1 className="mt-3 font-sora text-4xl font-black text-white">
                    <span className="text-4xl mr-2">{svc.emoji}</span>
                    {svc.name}
                  </h1>
                </div>
                <span className="rounded-full bg-verse-blue/10 px-4 py-2 font-mono text-sm font-bold text-verse-blue">
                  ${svc.usd} USDT
                </span>
              </div>

              <p className="mt-6 text-base leading-7 text-gray-300">{svc.description}</p>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-xs uppercase tracking-wider text-gray-500">Price</p>
                  <p className="mt-1 font-mono text-lg text-white">${svc.usd}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-xs uppercase tracking-wider text-gray-500">Network</p>
                  <p className="mt-1 text-sm text-white">Polygon Mainnet</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-xs uppercase tracking-wider text-gray-500">Tokens</p>
                  <p className="mt-1 text-sm text-white">USDT · VERSE · POL</p>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href={`/checkout/${svc.slug}`}
                  className="inline-flex min-h-12 items-center rounded-2xl bg-verse-purple px-8 py-3 font-bold text-white shadow-[0_0_38px_rgba(124,92,255,.28)] hover:bg-verse-purple/80 transition"
                >
                  Checkout — ${svc.usd} →
                </a>
                <a
                  href="/services"
                  className="inline-flex min-h-12 items-center rounded-2xl border border-white/10 bg-white/5 px-6 py-3 font-bold text-gray-200 hover:border-verse-blue/40 hover:bg-verse-blue/10 transition"
                >
                  ← All services
                </a>
              </div>

              <p className="mt-6 text-xs text-gray-600">{SITE.disclaimer}</p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </Web3Provider>
  );
}
