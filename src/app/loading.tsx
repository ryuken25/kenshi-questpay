// Global navigation fallback (also serves `/`). Shows instantly during route
// transitions so the shell never blanks to white. Server component, zero JS.
const block = "animate-pulse rounded-2xl bg-white/[0.05]";
const line = "animate-pulse rounded bg-white/[0.06]";

export default function Loading() {
  return (
    <div role="status" aria-busy="true" aria-live="polite" className="qp-container py-16">
      <span className="sr-only">Loading…</span>
      <div className={`${line} h-3 w-28`} />
      <div className={`${line} mt-5 h-9 w-2/3 max-w-xl`} />
      <div className={`${line} mt-4 h-4 w-full max-w-2xl`} />
      <div className={`${line} mt-2 h-4 w-4/5 max-w-xl`} />
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={`${block} h-40`} />
        ))}
      </div>
    </div>
  );
}
