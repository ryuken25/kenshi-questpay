// How-it-works placeholder — header block + stacked step panels while the (heavier,
// image-rich) page hydrates.
const line = "animate-pulse rounded bg-white/[0.06]";

export default function Loading() {
  return (
    <div role="status" aria-busy="true" aria-live="polite" className="qp-container py-16">
      <span className="sr-only">Loading…</span>
      <div className="mx-auto max-w-3xl text-center">
        <div className={`${line} mx-auto h-3 w-32`} />
        <div className={`${line} mx-auto mt-5 h-10 w-3/4`} />
        <div className={`${line} mx-auto mt-4 h-4 w-full`} />
        <div className={`${line} mx-auto mt-2 h-4 w-5/6`} />
      </div>
      <div className="mx-auto mt-12 max-w-4xl space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-[1.6rem] border border-white/10 bg-[var(--qp-surface-1)] p-6">
            <div className={`${line} h-5 w-1/3`} />
            <div className={`${line} mt-4 h-3.5 w-full`} />
            <div className={`${line} mt-2 h-3.5 w-4/5`} />
          </div>
        ))}
      </div>
    </div>
  );
}
