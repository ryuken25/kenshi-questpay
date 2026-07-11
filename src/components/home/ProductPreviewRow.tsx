const previews = [
  { title: "Service page", body: "Scoped packages, price, delivery, and requirements." },
  { title: "Brief form", body: "Private structured request replaces scattered DMs." },
  { title: "Checkout", body: "Locked quote with token, amount, receiver, and chain." },
  { title: "Order tracking", body: "Payment and delivery status stay in one timeline." },
  { title: "Receipt", body: "Public proof with private brief data redacted." },
  { title: "Creator dashboard", body: "Role-gated view for paid creator work." },
];

export default function ProductPreviewRow() {
  return (
    <section className="relative px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="font-sora text-sm font-bold uppercase tracking-[0.16em] text-[#a793ff]">Inside QuestPay</p>
            <h2 className="mt-3 font-sora text-3xl font-black tracking-[-.04em] text-white sm:text-5xl">A fast view of the flow.</h2>
          </div>
          <p className="max-w-md text-sm leading-7 text-[var(--qp-text-muted)]">The product preview stays honest: no fake stats, no fake logos, just the core workflow built for paid creator services.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {previews.map((item, index) => (
            <article key={item.title} className="rounded-[1.4rem] border border-[#7c5cff]/16 bg-[rgba(10,12,20,.78)] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,.04)]">
              <div className="mb-5 h-28 rounded-2xl border border-white/8 bg-[linear-gradient(135deg,rgba(124,92,255,.16),rgba(8,11,24,.9)),radial-gradient(circle_at_80%_10%,rgba(106,223,255,.15),transparent_38%)] p-3">
                <div className="h-3 w-20 rounded-full bg-[#7c5cff]/50" />
                <div className="mt-4 h-3 w-full rounded-full bg-white/10" />
                <div className="mt-2 h-3 w-2/3 rounded-full bg-white/8" />
                <div className="mt-5 grid grid-cols-3 gap-2">
                  <div className="h-7 rounded-lg bg-[#7c5cff]/35" />
                  <div className="h-7 rounded-lg bg-white/8" />
                  <div className="h-7 rounded-lg bg-white/8" />
                </div>
              </div>
              <p className="font-mono text-xs font-bold uppercase tracking-[.16em] text-[#8feaff]">0{index + 1}</p>
              <h3 className="mt-2 font-sora text-lg font-black text-white">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--qp-text-muted)]">{item.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
