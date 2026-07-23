// Verify placeholder — search field + result card outline so the public proof
// lookup paints structure immediately.
const line = "animate-pulse rounded bg-white/[0.06]";

export default function Loading() {
  return (
    <div role="status" aria-busy="true" aria-live="polite" className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
      <span className="sr-only">Loading…</span>
      <div className={`${line} h-3 w-24`} />
      <div className={`${line} mt-4 h-9 w-56 max-w-full`} />
      <div className={`${line} mt-4 h-4 w-full max-w-lg`} />
      <div className="mt-8 flex gap-3">
        <div className={`${line} h-12 flex-1 rounded-2xl`} />
        <div className={`${line} h-12 w-28 rounded-2xl`} />
      </div>
      <div className="mt-8 rounded-[1.6rem] border border-white/10 bg-[var(--qp-surface)] p-6">
        <div className={`${line} h-4 w-1/3`} />
        <div className={`${line} mt-4 h-3.5 w-full`} />
        <div className={`${line} mt-2 h-3.5 w-2/3`} />
      </div>
    </div>
  );
}
