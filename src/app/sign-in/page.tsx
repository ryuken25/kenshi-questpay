"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Web3Provider } from "@/components/Web3Provider";
import HeroOrbitalScene from "@/components/home/HeroOrbitalScene";
import AuthPanel from "@/components/auth/AuthPanel";

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--qp-bg)]" />}>
      <SignInContent />
    </Suspense>
  );
}

function SignInContent() {
  const params = useSearchParams();
  const error = params.get("error");
  const next = params.get("next");
  return (
    <Web3Provider>
      <main className="min-h-screen overflow-hidden bg-[var(--qp-bg)] text-[var(--qp-text-primary)]">
        <Navbar authPage />
        <section className="relative px-4 pb-14 pt-24 sm:px-6 lg:px-8 lg:pt-28">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_26%_20%,rgba(124,92,255,.22),transparent_28%),radial-gradient(circle_at_80%_16%,rgba(135,82,255,.07),transparent_22%)]" />
          <div className="relative mx-auto grid max-w-6xl gap-7 lg:grid-cols-[.9fr_1fr] lg:items-center">
            <div className="hidden lg:block">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#8b72ff]/30 bg-[#7c5cff]/10 px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] text-[#cfc7ff]">
                <Image src="/brand/questpay/questpay-mark.svg" alt="" width={18} height={18} />
                Fallback auth route
              </div>
              <h1 className="font-sora text-5xl font-black leading-[1] tracking-[-.045em] text-white">Welcome back to QuestPay.</h1>
              <p className="mt-4 max-w-md text-base leading-7 text-[var(--qp-text-secondary)]">Use one secure account across wallet, Google, and email to access orders, receipts, deliveries, and creator tools.</p>
              <div className="mt-4 max-w-sm"><HeroOrbitalScene variant="signin" /></div>
            </div>
            <div className="mx-auto w-full max-w-md">
              <Link href="/" className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-[var(--qp-text-muted)] hover:text-white"><ArrowLeft size={16} /> Back to homepage</Link>
              <AuthPanel compact error={error} next={next} />
            </div>
          </div>
        </section>
        <Footer />
      </main>
    </Web3Provider>
  );
}
