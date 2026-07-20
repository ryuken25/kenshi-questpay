import Link from "next/link";
import StudioShell from "@/components/StudioShell";
import CreatorProductsPanel from "@/components/studio/CreatorProductsPanel";
import { requireStudioAdmin } from "@/lib/supabase-auth";
import { SERVICES } from "@/lib/services";
import { listServicesForCreator } from "@/lib/studio/store";

export const dynamic = "force-dynamic";

export default async function StudioProductsPage() {
  const user = await requireStudioAdmin();
  const isSuper = user.roles?.includes("super_admin");
  const products = await listServicesForCreator(user.id, { includeArchived: true });

  return (
    <StudioShell email={user.email || "owner"} showAdmin={isSuper}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[.2em] text-[var(--qp-violet-300)]">
            Creator Studio
          </p>
          <h1 className="mt-2 font-sora text-3xl font-black">Products</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--qp-text-muted)]">
            Manage your custom packages (title, price, delivery, status) and review the shared public
            catalog. Custom products use the <code className="text-[var(--qp-violet-300)]">creator_services</code>{" "}
            table with Zod-validated APIs.
          </p>
        </div>
        <Link
          href="/services"
          className="rounded-2xl border border-white/10 bg-[var(--qp-surface)] px-5 py-3 text-center text-sm font-black hover:bg-[var(--qp-surface-hover)]"
        >
          View public catalog
        </Link>
      </div>

      <CreatorProductsPanel initialProducts={products} />

      <section className="mt-10">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="font-sora text-xl font-black">Shared catalog packages</h2>
            <p className="mt-1 text-sm text-muted">
              Platform-wide listings from code config (read-only here).
            </p>
          </div>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {SERVICES.map((service) => (
            <article
              key={service.slug}
              className="rounded-[1.6rem] border border-white/10 bg-[var(--qp-surface)] p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-sora text-lg font-black">{service.name}</h3>
                  <p className="mt-1 font-mono text-xs text-[var(--qp-violet-300)]">{service.slug}</p>
                </div>
                <span className="rounded-full bg-white/10 px-3 py-1 text-sm font-black">
                  ${service.usd}
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-[var(--qp-text-muted)]">{service.description}</p>
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
        </div>
      </section>
    </StudioShell>
  );
}
