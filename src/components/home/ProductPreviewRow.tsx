"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, FileText, LayoutDashboard, PackageCheck, ReceiptText, WalletCards } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const previews = [
  {
    id: "service",
    number: "01",
    title: "Service page",
    summary: "Scoped packages, price, delivery, and requirements.",
    detail: "Buyers compare productized services before sending a brief. Every package makes the deliverable, turnaround, price, and input requirements visible before checkout.",
    points: ["Fixed scope and USD price", "Delivery window shown up front", "Clear requirements before ordering"],
    icon: PackageCheck,
  },
  {
    id: "brief",
    number: "02",
    title: "Brief form",
    summary: "Private structured request replaces scattered DMs.",
    detail: "A guided brief collects the project goal, references, contact preference, and required context in one private order snapshot—not across disconnected chats.",
    points: ["Required and optional fields stay explicit", "Private details remain off-chain", "Order keeps an immutable brief snapshot"],
    icon: FileText,
  },
  {
    id: "checkout",
    number: "03",
    title: "Checkout",
    summary: "Locked quote with token, amount, receiver, and chain.",
    detail: "After authentication and profile completion, QuestPay creates a server-authoritative quote. The exact asset amount, network, receiver, and expiry are shown before payment.",
    points: ["Polygon payment configuration", "USDT, USDC, POL, or VERSE", "No client-controlled receiver or amount"],
    icon: WalletCards,
  },
  {
    id: "tracking",
    number: "04",
    title: "Order tracking",
    summary: "Payment and delivery status stay in one timeline.",
    detail: "The order page connects payment verification with creator progress. Buyers can see when payment clears, work begins, delivery is submitted, and the order completes.",
    points: ["One public order reference", "Readable status timeline", "Payment and delivery stay connected"],
    icon: CheckCircle2,
  },
  {
    id: "receipt",
    number: "05",
    title: "Receipt",
    summary: "Public proof with private brief data redacted.",
    detail: "A shareable receipt links the order to verified on-chain payment while keeping personal contact data, private requirements, and sensitive project context out of public view.",
    points: ["Transaction hash and explorer proof", "Locked payment snapshot", "Private client data remains redacted"],
    icon: ReceiptText,
  },
  {
    id: "dashboard",
    number: "06",
    title: "Creator dashboard",
    summary: "Role-gated view for paid creator work.",
    detail: "Creators manage paid requests from a focused workspace: review briefs, filter orders, update delivery status, and preserve a clear operational history for every client.",
    points: ["Creator-only access", "Search and status filters", "Order events and delivery controls"],
    icon: LayoutDashboard,
  },
] as const;

export default function ProductPreviewRow() {
  const rangeRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<HTMLElement[]>([]);
  const tabRefs = useRef<HTMLButtonElement[]>([]);
  const progressRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [motionManaged, setMotionManaged] = useState(false);

  useEffect(() => {
    const range = rangeRef.current;
    const stage = stageRef.current;
    const cards = cardRefs.current.filter(Boolean);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!range || !stage || cards.length !== previews.length || reduced || window.innerWidth < 1024) return;

    setMotionManaged(true);

    const context = gsap.context(() => {
      gsap.set(cards, { autoAlpha: 0, yPercent: 16, xPercent: 7, scale: .92 });
      gsap.set(cards[0], { autoAlpha: 1, yPercent: 0, xPercent: 0, scale: 1 });
      gsap.set(progressRef.current, { scaleX: 0, transformOrigin: "0% 50%" });

      const travel = Math.min(window.innerHeight * .52, 440);
      const timeline = gsap.timeline({
        scrollTrigger: {
          id: "questpay-inside-story",
          trigger: range,
          start: "top top+=72",
          end: `+=${travel * (previews.length - 1)}`,
          pin: stage,
          pinSpacing: true,
          scrub: .65,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const next = Math.min(previews.length - 1, Math.max(0, Math.ceil(self.progress * (previews.length - 1))));
            setActive(next);
            gsap.set(progressRef.current, { scaleX: self.progress });
          },
        },
      });

      cards.forEach((card, index) => {
        if (index === 0) return;
        timeline.to(cards[index - 1], { autoAlpha: 0, yPercent: -13, xPercent: -8, scale: .88, duration: .46, ease: "power2.out" });
        timeline.to(card, { autoAlpha: 1, yPercent: 0, xPercent: 0, scale: 1, duration: .56, ease: "power2.out" }, "<.08");
      });
    }, range);

    const refresh = window.setTimeout(() => ScrollTrigger.refresh(), 250);
    return () => {
      window.clearTimeout(refresh);
      ScrollTrigger.getById("questpay-inside-story")?.kill();
      context.revert();
    };
  }, []);

  const current = previews[active];

  const activate = (index: number, focus = false) => {
    const next = (index + previews.length) % previews.length;
    const trigger = ScrollTrigger.getById("questpay-inside-story");
    if (trigger) {
      const target = trigger.start + (trigger.end - trigger.start) * (next / (previews.length - 1));
      window.scrollTo({ top: target, behavior: "smooth" });
    } else {
      setActive(next);
    }
    if (focus) tabRefs.current[next]?.focus();
  };

  return (
    <section id="inside-questpay" className="relative border-y border-white/[.055] bg-[rgba(3,3,9,.72)]">
      <div ref={rangeRef} className="relative hidden overflow-visible lg:block">
        <div ref={stageRef} className="flex min-h-[calc(100svh-72px)] items-center py-8">
          <div className="mx-auto grid w-full max-w-7xl grid-cols-[.82fr_1.18fr] items-center gap-12 px-8">
            <aside className="flex min-h-0 flex-col">
              <p className="font-sora text-xs font-bold uppercase tracking-[0.2em] text-[var(--qp-violet-300)]">Inside QuestPay</p>
              <h2 className="mt-3 max-w-xl font-sora text-[clamp(2.5rem,4vw,4.5rem)] font-black leading-[.98] tracking-[-.055em] text-white">A closer look at the complete flow.</h2>
              <p className="mt-5 max-w-xl text-base leading-7 text-[var(--qp-text-secondary)]">Follow one paid creator order from a clear service page to verified payment, delivery, and a privacy-safe receipt.</p>

              <div role="tablist" aria-label="QuestPay workflow stages" className="mt-8 space-y-2">
                {previews.map((item, index) => (
                  <button key={item.id} ref={(node) => { if (node) tabRefs.current[index] = node; }} id={`workflow-tab-${item.id}`} role="tab" aria-controls={`workflow-panel-${item.id}`} aria-selected={active === index} tabIndex={active === index ? 0 : -1} type="button" onClick={() => activate(index)} onKeyDown={(event) => {
                    if (event.key === "ArrowDown" || event.key === "ArrowRight") { event.preventDefault(); activate(index + 1, true); }
                    if (event.key === "ArrowUp" || event.key === "ArrowLeft") { event.preventDefault(); activate(index - 1, true); }
                    if (event.key === "Home") { event.preventDefault(); activate(0, true); }
                    if (event.key === "End") { event.preventDefault(); activate(previews.length - 1, true); }
                  }} className={`flex min-h-11 w-full items-center gap-3 rounded-xl border px-4 py-2 text-left transition ${active === index ? "border-[var(--qp-line-4)] bg-[rgba(139,77,255,.10)] text-white" : "border-transparent text-[var(--qp-text-muted)] hover:border-[var(--qp-line-2)] hover:text-white"}`}>
                    <span className="font-mono text-xs text-[var(--qp-violet-300)]">{item.number}</span>
                    <span className="font-sora text-sm font-bold">{item.title}</span>
                  </button>
                ))}
              </div>
              <div className="mt-5 h-px overflow-hidden bg-white/10"><div ref={progressRef} className="h-full w-full bg-[var(--qp-violet-500)]" /></div>
              <p className="mt-3 font-mono text-xs text-[var(--qp-text-muted)]">{current.number} / 06 · Scroll to explore</p>
            </aside>

            <div className="relative h-[min(70svh,650px)] overflow-hidden rounded-[2rem] border border-[var(--qp-line-2)] bg-[radial-gradient(circle_at_70%_15%,rgba(139,77,255,.15),transparent_42%),rgba(5,5,11,.96)] shadow-[0_32px_110px_rgba(0,0,0,.48)]">
              {previews.map((item, index) => {
                const Icon = item.icon;
                return (
                  <article key={item.id} id={`workflow-panel-${item.id}`} role="tabpanel" aria-labelledby={`workflow-tab-${item.id}`} aria-hidden={active !== index} ref={(node) => { if (node) cardRefs.current[index] = node; }} style={motionManaged ? undefined : { opacity: active === index ? 1 : 0, visibility: active === index ? "visible" : "hidden" }} className="absolute inset-0 flex flex-col justify-between p-9 xl:p-12">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="grid h-14 w-14 place-items-center rounded-2xl border border-[var(--qp-line-3)] bg-[rgba(139,77,255,.10)] text-[var(--qp-violet-300)]"><Icon size={27} /></span>
                        <span className="font-mono text-sm tracking-[.16em] text-[var(--qp-violet-300)]">{item.number}</span>
                      </div>
                      <p className="mt-10 font-mono text-xs font-bold uppercase tracking-[.18em] text-[var(--qp-violet-300)]">QuestPay workflow</p>
                      <h3 className="mt-3 font-sora text-4xl font-black tracking-[-.045em] text-white xl:text-5xl">{item.title}</h3>
                      <p className="mt-4 max-w-2xl text-lg leading-8 text-[var(--qp-text-secondary)]">{item.detail}</p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      {item.points.map((point) => <div key={point} className="rounded-2xl border border-[var(--qp-line-2)] bg-black/25 p-4 text-sm leading-6 text-[var(--qp-text-secondary)]"><span className="mb-3 block h-1.5 w-8 rounded-full bg-[var(--qp-violet-500)]" />{point}</div>)}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-20 sm:px-6 lg:hidden">
        <div className="mx-auto max-w-2xl">
          <p className="font-sora text-xs font-bold uppercase tracking-[0.2em] text-[var(--qp-violet-300)]">Inside QuestPay</p>
          <h2 className="mt-3 font-sora text-4xl font-black leading-none tracking-[-.045em] text-white sm:text-5xl">A closer look at the complete flow.</h2>
          <p className="mt-5 leading-7 text-[var(--qp-text-secondary)]">Six clear stages connect service selection, private requirements, verified payment, and delivery.</p>
          <div className="mt-10 space-y-4">
            {previews.map((item) => { const Icon = item.icon; return <article key={item.id} className="rounded-[1.4rem] border border-[var(--qp-line-2)] bg-[var(--qp-surface-2)] p-5"><div className="flex items-center justify-between"><span className="grid h-11 w-11 place-items-center rounded-xl bg-[rgba(139,77,255,.11)] text-[var(--qp-violet-300)]"><Icon size={22}/></span><span className="font-mono text-xs text-[var(--qp-violet-300)]">{item.number}</span></div><h3 className="mt-5 font-sora text-2xl font-black text-white">{item.title}</h3><p className="mt-2 font-medium text-[var(--qp-text-secondary)]">{item.summary}</p><p className="mt-3 text-sm leading-6 text-[var(--qp-text-muted)]">{item.detail}</p><ul className="mt-4 space-y-2">{item.points.map((point)=><li key={point} className="flex gap-2 text-sm text-[var(--qp-text-secondary)]"><span className="text-[var(--qp-violet-300)]">•</span>{point}</li>)}</ul></article>; })}
          </div>
        </div>
      </div>
    </section>
  );
}
