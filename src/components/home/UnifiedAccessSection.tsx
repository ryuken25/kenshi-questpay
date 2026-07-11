import { Fingerprint, Link2, ShieldCheck } from "lucide-react";

const cards = [
  { title: "Sign in your way", body: "Wallet, Google, or secure email.", icon: Fingerprint },
  { title: "Link when needed", body: "Verified identities can live under one account.", icon: Link2 },
  { title: "Role-based access", body: "Buyers, creators, and admins only see what they should.", icon: ShieldCheck },
];

export default function UnifiedAccessSection() {
  return (
    <section className="relative px-4 py-16 sm:px-6 lg:px-8" id="unified-access">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 max-w-3xl">
          <p className="font-sora text-sm font-bold uppercase tracking-[0.12em] text-[#a793ff]">Unified Access</p>
          <h2 className="section-title mt-3 font-sora font-black text-white">One account. Clear roles.</h2>
          <p className="mt-4 text-base leading-7 text-[var(--qp-text-secondary)] sm:text-lg">Short, safe, server-authoritative access for buyers, creators, and admins.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {cards.map(({ title, body, icon: Icon }) => (
            <article key={title} className="rounded-[1.5rem] border border-[#7c5cff]/20 bg-[#090d1b]/80 p-5 shadow-[0_0_60px_rgba(124,92,255,.06)]">
              <div className="grid size-12 place-items-center rounded-2xl border border-[#7c5cff]/30 bg-[#7c5cff]/12 text-[#c1b6ff]"><Icon size={22} /></div>
              <h3 className="mt-4 font-sora text-xl font-black text-white">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--qp-text-muted)]">{body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
