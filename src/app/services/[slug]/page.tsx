import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Web3Provider } from "@/components/Web3Provider";
import { SERVICES, getServiceBySlug } from "@/lib/services";
import { SITE } from "@/lib/site";

interface Props { params: Promise<{ slug: string }>; }

export function generateStaticParams() { return SERVICES.map((s) => ({ slug: s.slug })); }

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const svc = getServiceBySlug(params.slug);
  return svc ? { title: `${svc.name} — Kenshi QuestPay`, description: svc.description } : { title: "Service not found — QuestPay" };
}

function List({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[var(--qp-surface)] p-4">
      <h3 className="font-sora text-sm font-bold text-white">{title}</h3>
      <ul className="mt-3 space-y-2 text-sm text-muted">
        {items.map((item) => <li key={item}>• {item}</li>)}
      </ul>
    </div>
  );
}

export default async function ServiceDetailPage(props: Props) {
  const params = await props.params;
  const svc = getServiceBySlug(params.slug);
  if (!svc) notFound();

  return (
    <Web3Provider>
      <div className="min-screen-safe pt-6">
        <section className="px-4 py-14 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
              <div className="glass-panel-strong rounded-[2rem] p-6 sm:p-8 lg:p-10">
                <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-[var(--qp-violet-300)]">{SITE.realNetwork}</p>
                <h1 className="mt-3 font-sora text-3xl font-black text-white sm:text-4xl">{svc.name}</h1>

                {/* Mobile price row — desktop keeps this in the sticky sidebar */}
                <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1 lg:hidden">
                  <span className="font-mono text-3xl font-black text-[var(--qp-violet-300)] drop-shadow-[0_0_18px_rgba(135,82,255,.3)]">${svc.usd}</span>
                  <span className="text-xs text-subtle">starting · USDT · USDC · POL · VERSE</span>
                </div>

                <p className="mt-4 text-lg leading-8 text-secondary">{svc.description}</p>
                <p className="mt-4 rounded-2xl border border-[#8752ff]/20 bg-[#8752ff]/10 p-4 text-sm leading-6 text-secondary">Outcome: {svc.outcome}</p>

                {/* Mobile quick-facts — desktop shows these in the sticky sidebar */}
                <div className="mt-3 grid grid-cols-2 gap-2.5 lg:hidden">
                  <div className="rounded-2xl border border-white/10 bg-[var(--qp-surface)] p-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-subtle">Delivery</p>
                    <p className="mt-1 text-sm font-bold text-white">{svc.delivery}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-[var(--qp-surface)] p-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-subtle">Revisions</p>
                    <p className="mt-1 text-sm font-bold text-white">{svc.revisions}</p>
                  </div>
                </div>

                <div className="mt-8 grid gap-4 md:grid-cols-2">
                  <List title="Included" items={svc.included} />
                  <List title="Best requirements" items={svc.requirements} />
                  <List title="Not included" items={svc.excluded} />
                  <List title="Process" items={["Submit a private brief", "Receive locked quote", "Payment verification", "Track delivery"]} />
                </div>
                <p className="mt-6 text-xs text-subtle">{SITE.disclaimer}</p>
                <Link href="/services" className="mt-4 inline-flex min-h-11 items-center text-sm font-bold text-[var(--qp-violet-300)] transition hover:text-white lg:hidden">← All services</Link>
              </div>
              <aside className="hidden lg:sticky lg:top-24 lg:block lg:self-start">
                <div className="rounded-[2rem] border border-white/10 bg-[var(--qp-surface)] p-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted">Starting price</p>
                  <p className="mt-2 font-mono text-3xl font-black text-white">${svc.usd}</p>
                  <div className="mt-5 space-y-3 text-sm text-secondary">
                    <p><b className="text-white">Delivery:</b> {svc.delivery}</p>
                    <p><b className="text-white">Revisions:</b> {svc.revisions}</p>
                    <p><b className="text-white">Tokens:</b> USDT, VERSE, POL</p>
                  </div>
                  <Link href={`/checkout/${svc.slug}`} className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-verse-purple px-8 py-3 font-bold text-white shadow-[0_0_38px_rgba(124,92,255,.28)] hover:bg-verse-purple/80 transition">Start Order</Link>
                  <Link href="/services" className="mt-3 inline-flex min-h-12 w-full items-center justify-center rounded-2xl border border-white/10 bg-[var(--qp-surface)] px-6 py-3 font-bold text-secondary hover:border-verse-blue/40 hover:bg-verse-blue/10 transition">All services</Link>
                </div>
              </aside>
            </div>

            {/* Sticky thumb CTA — mobile only; desktop uses the sidebar's Start Order */}
            <div className="qp-cta-dock qp-cta-dock--bleed lg:hidden">
              <Link
                href={`/checkout/${svc.slug}`}
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-[rgba(190,155,255,.38)] bg-[linear-gradient(135deg,#8752ff,#5f27cf)] px-6 text-[15px] font-bold text-white shadow-[0_12px_30px_rgba(87,41,190,.4),inset_0_1px_0_rgba(255,255,255,.18)] transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--qp-focus-ring)]"
              >
                Continue to checkout · ${svc.usd}
              </Link>
            </div>
          </div>
        </section>
      </div>
    </Web3Provider>
  );
}
