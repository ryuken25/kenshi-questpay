// Service-detail placeholder — matches the [1fr_320px] panel + sticky sidebar so
// the deep-linked page paints structure immediately instead of a white flash.
const line = "animate-pulse rounded bg-white/[0.06]";

export default function Loading() {
  return (
    <div role="status" aria-busy="true" aria-live="polite" className="min-screen-safe pt-6">
      <span className="sr-only">Loading service…</span>
      <section className="px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <div className="glass-panel-strong rounded-[2rem] p-6 sm:p-8 lg:p-10">
              <div className={`${line} h-3 w-24`} />
              <div className={`${line} mt-4 h-10 w-3/4`} />
              {/* Mobile price + quick-facts placeholders (desktop uses the sidebar) */}
              <div className={`${line} mt-3 h-8 w-40 lg:hidden`} />
              <div className={`${line} mt-5 h-4 w-full`} />
              <div className={`${line} mt-2 h-4 w-5/6`} />
              <div className="mt-3 grid grid-cols-2 gap-2.5 lg:hidden">
                <div className={`${line} h-16 w-full rounded-2xl`} />
                <div className={`${line} h-16 w-full rounded-2xl`} />
              </div>
              <div className="mt-8 grid gap-4 md:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="rounded-2xl border border-white/10 bg-[var(--qp-surface)] p-4">
                    <div className={`${line} h-4 w-1/3`} />
                    <div className={`${line} mt-3 h-3 w-full`} />
                    <div className={`${line} mt-2 h-3 w-4/5`} />
                  </div>
                ))}
              </div>
            </div>
            <aside className="hidden lg:sticky lg:top-24 lg:block lg:self-start">
              <div className="rounded-[2rem] border border-white/10 bg-[var(--qp-surface)] p-5">
                <div className={`${line} h-3 w-24`} />
                <div className={`${line} mt-3 h-8 w-28`} />
                <div className={`${line} mt-6 h-3.5 w-full`} />
                <div className={`${line} mt-2 h-3.5 w-2/3`} />
                <div className={`${line} mt-6 h-12 w-full rounded-2xl`} />
                <div className={`${line} mt-3 h-12 w-full rounded-2xl`} />
              </div>
            </aside>
          </div>
          {/* Mobile sticky CTA placeholder */}
          <div className="qp-cta-dock qp-cta-dock--bleed lg:hidden">
            <div className={`${line} h-12 w-full rounded-2xl`} />
          </div>
        </div>
      </section>
    </div>
  );
}
