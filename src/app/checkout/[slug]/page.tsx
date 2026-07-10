import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Web3Provider } from "@/components/Web3Provider";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { SERVICES, getServiceBySlug } from "@/lib/services";
import { SITE } from "@/lib/site";
import CheckoutForm from "@/components/CheckoutForm";

interface Props {
  params: { slug: string };
}

export function generateStaticParams() {
  return SERVICES.map((s) => ({ slug: s.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const svc = getServiceBySlug(params.slug);
  if (!svc) return { title: "Checkout — QuestPay" };
  return {
    title: `Checkout: ${svc.name} — Kenshi QuestPay`,
    description: `Submit a brief and pay ${svc.usd} USDT for ${svc.name}.`,
  };
}

export default function CheckoutPage({ params }: Props) {
  const svc = getServiceBySlug(params.slug);
  if (!svc) notFound();

  return (
    <Web3Provider>
      <Navbar />
      <main className="min-screen-safe pt-20">
        <section className="px-4 py-14 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl">
            <div className="text-center mb-8">
              <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-verse-blue">
                Checkout
              </p>
              <h1 className="mt-3 font-sora text-3xl font-black text-white">
                {svc.emoji} {svc.name} — <span className="gradient-text">${svc.usd}</span>
              </h1>
              <p className="mt-2 text-sm text-gray-400">{svc.description}</p>
              <p className="mt-1 text-xs text-gray-600">{SITE.disclaimer}</p>
            </div>
            <CheckoutForm slug={params.slug} serviceName={svc.name} serviceUsd={svc.usd} />
          </div>
        </section>
      </main>
      <Footer />
    </Web3Provider>
  );
}
