import AuthPanel from "@/components/auth/AuthPanel";
import type { ServicePackage } from "@/lib/services";

export default function CheckoutAuthGate({ service, next }: { service: ServicePackage; next: string }) {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8 text-center">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-[#8FEAFF]">Checkout</p>
        <h1 className="mt-3 font-sora text-3xl font-black text-white">
          {service.name} — <span className="gradient-text">${service.usd}</span>
        </h1>
        <p className="mt-2 text-sm text-muted">{service.description}</p>
      </div>
      <div className="glass-panel-strong mb-6 rounded-2xl p-5 text-center sm:p-6">
        <h2 className="font-sora text-xl font-black text-white">Sign in to continue</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--qp-text-muted)]">
          Create a QuestPay account or sign back in to start this order. It only takes a moment, and you&apos;ll be back here right after.
        </p>
      </div>
      <AuthPanel intent="checkout" next={next} />
    </div>
  );
}
