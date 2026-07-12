"use client";

import { useRef, useState } from "react";
import { LockKeyhole, ShieldCheck } from "lucide-react";
import AuthModal from "@/components/auth/AuthModal";
import type { ServicePackage } from "@/lib/services";

export default function CheckoutAuthGate({ service, next }: { service: ServicePackage; next: string }) {
  const [authOpen, setAuthOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  return (
    <div className="mx-auto w-full max-w-3xl">
      <header className="text-center">
        <p className="qp-eyebrow mx-auto">Secure checkout</p>
        <h1 className="mt-4 font-sora text-3xl font-black tracking-[-.04em] text-white sm:text-5xl">
          {service.name} — <span className="gradient-text">${service.usd}</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-[var(--qp-text-secondary)]">{service.description}</p>
        <div className="mt-5 flex flex-wrap justify-center gap-3 text-xs text-[var(--qp-text-muted)]">
          <span className="inline-flex items-center gap-1.5"><ShieldCheck size={15} className="text-[var(--qp-violet-300)]" /> Server-authoritative quote</span>
          <span>•</span><span>Polygon payment</span><span>•</span><span>Public receipt</span>
        </div>
      </header>

      <section className="mx-auto mt-8 grid w-full max-w-[620px] justify-items-center rounded-[26px] border border-[rgba(142,92,255,.22)] bg-[linear-gradient(180deg,rgba(18,13,32,.92),rgba(8,7,15,.96))] px-6 py-8 text-center shadow-[0_28px_80px_rgba(0,0,0,.42),0_0_55px_rgba(111,54,221,.08),inset_0_1px_0_rgba(255,255,255,.045)] sm:px-9" aria-labelledby="checkout-lock-title">
        <div className="mb-4 grid size-12 place-items-center rounded-[15px] border border-[rgba(156,112,255,.28)] bg-[rgba(116,65,226,.13)] text-[var(--qp-violet-300)]"><LockKeyhole size={22} /></div>
        <h2 id="checkout-lock-title" className="font-sora text-2xl font-black tracking-[-.035em] text-white sm:text-3xl">Sign in to continue</h2>
        <p className="mt-3 max-w-[470px] text-[.98rem] leading-7 text-[var(--qp-text-muted)]">Save your details, create the order, and return here after signing in.</p>
        <button ref={triggerRef} type="button" onClick={() => setAuthOpen(true)} className="qp-button qp-button--primary mt-6 min-h-[50px] w-full px-6 sm:w-auto">Sign in to continue</button>
        <p className="mt-3 text-xs text-[var(--qp-text-subtle)]">Wallet, Google, or secure email</p>
      </section>

      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        onAuthenticated={async () => {
          setAuthOpen(false);
          window.location.assign(next);
        }}
        intent="signin"
        next={next}
        returnFocusRef={triggerRef}
      />
    </div>
  );
}
