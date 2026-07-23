// Orders list placeholder — a stack of row cards so the buyer's list never blanks
// while the session + DB read resolves.
const line = "animate-pulse rounded bg-white/[0.06]";

export default function Loading() {
  return (
    <div role="status" aria-busy="true" aria-live="polite" className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <span className="sr-only">Loading orders…</span>
      <div className={`${line} h-3 w-28`} />
      <div className={`${line} mt-3 h-8 w-52 max-w-full`} />
      <div className={`${line} mt-3 h-4 w-full max-w-xl`} />
      <div className="mt-8 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-[1.6rem] border border-white/10 bg-[var(--qp-surface)] p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 flex-1">
                <div className={`${line} h-4 w-40`} />
                <div className={`${line} mt-3 h-3.5 w-3/4`} />
              </div>
              <div className={`${line} h-8 w-24 rounded-full`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
