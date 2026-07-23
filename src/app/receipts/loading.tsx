// Receipts placeholder — mirrors the real /receipts layout (max-w-4xl, eyebrow →
// title → lead → row cards) so the authenticated DB read never shows a white gap.
const line = "animate-pulse rounded bg-white/[0.06]";

export default function Loading() {
  return (
    <div className="min-h-screen bg-[var(--qp-bg)] text-[var(--qp-text-primary)]">
      <div role="status" aria-busy="true" aria-live="polite" className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <span className="sr-only">Loading receipts…</span>
        <div className={`${line} h-3 w-32`} />
        <div className={`${line} mt-3 h-8 w-48 max-w-full`} />
        <div className={`${line} mt-3 h-4 w-full max-w-2xl`} />
        <div className={`${line} mt-2 h-4 w-2/3 max-w-lg`} />
        <div className="mt-8 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-[1.6rem] border border-white/10 bg-[var(--qp-surface)] p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className={`${line} h-4 w-36`} />
                  <div className={`${line} mt-3 h-3.5 w-2/3`} />
                </div>
                <div className={`${line} h-7 w-24 rounded-full`} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
