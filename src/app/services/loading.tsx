// Catalog grid placeholder for /services — mirrors the card grid so switching to
// the loaded list causes no jump.
const card = "animate-pulse rounded-[1.6rem] border border-white/10 bg-[var(--qp-surface-1)]";
const line = "animate-pulse rounded bg-white/[0.06]";

export default function Loading() {
  return (
    <div role="status" aria-busy="true" aria-live="polite" className="qp-container py-14">
      <span className="sr-only">Loading services…</span>
      <div className={`${line} h-3 w-24`} />
      <div className={`${line} mt-4 h-9 w-64 max-w-full`} />
      <div className={`${line} mt-4 h-4 w-full max-w-2xl`} />
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={`${card} p-6`}>
            <div className={`${line} h-5 w-2/3`} />
            <div className={`${line} mt-4 h-3.5 w-full`} />
            <div className={`${line} mt-2 h-3.5 w-5/6`} />
            <div className="mt-6 flex items-center justify-between">
              <div className={`${line} h-7 w-20`} />
              <div className={`${line} h-9 w-24 rounded-xl`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
