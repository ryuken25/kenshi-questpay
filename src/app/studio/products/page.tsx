import Link from "next/link";
import StudioShell from "@/components/StudioShell";
import { requireStudioAdmin } from "@/lib/supabase-auth";
import { SERVICES } from "@/lib/services";

export const dynamic = "force-dynamic";

export default async function StudioProductsPage() {
  const user = await requireStudioAdmin();
  const isSuper = user.roles?.includes("super_admin");

  return (
    <StudioShell email={user.email || "owner"} showAdmin={isSuper}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[.2em] text-[var(--qp-violet-300)]">
            Creator Studio
          </p>
          <h1 className="mt-2 font-sora text-3xl font-black">Products</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--qp-text-muted)]">
            Manage fixed-price service packages shown on the public Services catalog. Full per-creator
            product CRUD lands with the creator_services table; catalog packages are live now.
          </p>
        </div>
        <Link
          href="/services"
          className="rounded-2xl border border-white/10 bg-[var(--qp-surface)] px-5 py-3 text-center text-sm font-black hover:bg-[var(--qp-surface-hover)]"
        >
          View public catalog
        </Link>
      </div>

      <section className="mt-8 grid gap-4 md:grid-cols-2">
        {SERVICES.map((service) => (
          <article
            key={service.slug}
            className="rounded-[1.6rem] border border-white/10 bg-[var(--qp-surface)] p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-sora text-xl font-black">{service.name}</h2>
                <p className="mt-1 font-mono text-xs text-[var(--qp-violet-300)]">{service.slug}</p>
              </div>
              <span className="rounded-full bg-white/10 px-3 py-1 text-sm font-black">
                ${service.usd}
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-[var(--qp-text-muted)]">{service.description}</p>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-xs text-[var(--qp-text-secondary)]">
              <div className="rounded-xl bg-[rgba(8,8,14,.72)] p-3">
                <dt className="uppercase tracking-wider text-muted">Delivery</dt>
                <dd className="mt-1 font-semibold text-white">{service.delivery}</dd>
              </div>
              <div className="rounded-xl bg-[rgba(8,8,14,.72)] p-3">
                <dt className="uppercase tracking-wider text-muted">Revisions</dt>
                <dd className="mt-1 font-semibold text-white">{service.revisions}</dd>
              </div>
            </dl>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href={`/services/${service.slug}`}
                className="rounded-xl bg-verse-purple px-4 py-2 text-sm font-black"
              >
                Open listing
              </Link>
              <Link
                href={`/checkout/${service.slug}`}
                className="rounded-xl border border-white/10 px-4 py-2 text-sm font-bold text-[var(--qp-text-secondary)] hover:bg-white/5"
              >
                Checkout flow
              </Link>
            </div>
          </article>
        ))}
      </section>

      <section className="mt-8 rounded-[2rem] border border-dashed border-white/15 bg-[#07070d] p-6">
        <h2 className="font-sora text-lg font-black">Custom product CRUD</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          Coming next: create, edit, pause, and price your own packages (title, outcome, delivery target,
          revision limit). Until then, super admins manage the shared catalog packages above.
        </p>
      </section>
    </StudioShell>
  );
}
