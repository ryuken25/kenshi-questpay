"use client";

import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { CheckCircle2, FileText, LayoutDashboard, PackageCheck, ReceiptText, WalletCards } from "lucide-react";

const previews = [
  {
    id: "service",
    number: "01",
    title: "Service page",
    summary: "Scoped packages, price, delivery, and requirements.",
    detail: "Buyers compare productized services before sending a brief. Every package makes the deliverable, turnaround, price, and input requirements visible before checkout.",
    points: ["Fixed scope and USD price", "Delivery window shown up front", "Clear requirements before ordering"],
    image: "/assets/how-it-works/flow-01-service.svg",
    icon: PackageCheck,
  },
  {
    id: "brief",
    number: "02",
    title: "Brief form",
    summary: "Private structured request replaces scattered DMs.",
    detail: "A guided brief collects the project goal, references, contact preference, and required context in one private order snapshot—not across disconnected chats.",
    points: ["Required and optional fields stay explicit", "Private details remain off-chain", "Order keeps a submitted brief snapshot"],
    image: "/assets/how-it-works/flow-02-brief.svg",
    icon: FileText,
  },
  {
    id: "checkout",
    number: "03",
    title: "Checkout",
    summary: "Locked quote with token, amount, receiver, and chain.",
    detail: "After authentication and profile completion, QuestPay creates a server-authoritative quote. The exact asset amount, network, receiver, and expiry are shown before payment.",
    points: ["Polygon payment configuration", "Server-enabled payment assets", "No client-controlled receiver or amount"],
    image: "/assets/how-it-works/flow-03-payment.svg",
    icon: WalletCards,
  },
  {
    id: "tracking",
    number: "04",
    title: "Order tracking",
    summary: "Payment and delivery status stay in one timeline.",
    detail: "The order page connects payment verification with creator progress. Buyers can see when payment clears, work begins, delivery is submitted, and the order completes.",
    points: ["One public order reference", "Readable persisted status", "Payment and delivery stay connected"],
    image: "/assets/how-it-works/flow-04-tracking.svg",
    icon: CheckCircle2,
  },
  {
    id: "receipt",
    number: "05",
    title: "Receipt",
    summary: "Public proof with private brief data redacted.",
    detail: "A shareable receipt links the order to verified on-chain payment while keeping personal contact data, private requirements, and sensitive project context out of public view.",
    points: ["Transaction hash and explorer proof", "Locked payment snapshot", "Private client data remains redacted"],
    image: "/assets/how-it-works/flow-05-receipt.svg",
    icon: ReceiptText,
  },
  {
    id: "dashboard",
    number: "06",
    title: "Creator dashboard",
    summary: "Role-gated view for paid creator work.",
    detail: "Creators manage paid requests from a focused workspace: review briefs, filter orders, update delivery status, and preserve a clear operational history for every client.",
    points: ["Creator-only access", "Search and status filters", "Order events and delivery controls"],
    image: "/assets/how-it-works/flow-06-dashboard.svg",
    icon: LayoutDashboard,
  },
] as const;

type TriggerHandle = { start: number; end: number; kill: (revert?: boolean) => void };

export default function ProductPreviewRow() {
  const rangeRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<HTMLButtonElement[]>([]);
  const progressRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<TriggerHandle | null>(null);
  const activeRef = useRef(0);
  const [active, setActive] = useState(0);
  const [activeMobile, setActiveMobile] = useState(0);
  const [desktopMotion, setDesktopMotion] = useState(false);
  const mobileCardRefs = useRef<(HTMLElement | null)[]>([]);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    let disposed = false;
    let cleanup = () => {};

    void (async () => {
      if (!rangeRef.current || !stageRef.current || reduceMotion) return;
      const gsapModule = await import("gsap");
      const triggerModule = await import("gsap/ScrollTrigger");
      if (disposed || !rangeRef.current || !stageRef.current) return;

      const gsap = gsapModule.default;
      const ScrollTrigger = triggerModule.ScrollTrigger;
      gsap.registerPlugin(ScrollTrigger);
      ScrollTrigger.getById("questpay-inside-story")?.kill(true);
      const media = gsap.matchMedia();

      media.add("(min-width: 1024px) and (prefers-reduced-motion: no-preference)", () => {
        if (!rangeRef.current || !stageRef.current) return;
        setDesktopMotion(true);
        const trigger = ScrollTrigger.create({
          id: "questpay-inside-story",
          trigger: rangeRef.current,
          start: "top top+=72",
          end: () => `+=${Math.min(window.innerHeight * .56, 460) * (previews.length - 1)}`,
          pin: stageRef.current,
          pinSpacing: true,
          scrub: .55,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate(self) {
            const next = Math.min(previews.length - 1, Math.max(0, Math.round(self.progress * (previews.length - 1))));
            if (next !== activeRef.current) {
              activeRef.current = next;
              setActive(next);
            }
            if (progressRef.current) progressRef.current.style.transform = `scaleX(${self.progress})`;
          },
        });
        triggerRef.current = trigger;
        return () => {
          trigger.kill(true);
          triggerRef.current = null;
          setDesktopMotion(false);
        };
      });

      const refresh = window.setTimeout(() => ScrollTrigger.refresh(), 180);
      cleanup = () => {
        window.clearTimeout(refresh);
        media.revert();
        ScrollTrigger.getById("questpay-inside-story")?.kill(true);
      };
    })();

    return () => {
      disposed = true;
      cleanup();
    };
  }, [reduceMotion]);

  // IntersectionObserver for mobile active chapter
  useEffect(() => {
    const refs = mobileCardRefs.current;
    if (!refs.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.52) {
            const idx = refs.indexOf(entry.target as HTMLElement);
            if (idx !== -1) setActiveMobile(idx);
          }
        }
      },
      { threshold: [0.35, 0.52, 0.7], rootMargin: '-16% 0px -26% 0px' }
    );
    refs.forEach((el) => { if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, []);

  const current = previews[active];
  const CurrentIcon = current.icon;

  const activate = (index: number, focus = false) => {
    const next = (index + previews.length) % previews.length;
    activeRef.current = next;
    setActive(next);
    const trigger = triggerRef.current;
    if (trigger) {
      const target = trigger.start + (trigger.end - trigger.start) * (next / (previews.length - 1));
      window.scrollTo({ top: target, behavior: reduceMotion ? "auto" : "smooth" });
    }
    if (focus) tabRefs.current[next]?.focus();
  };

  return (
    <section id="inside-questpay" className="relative qp-blend-section" style={{'--blend-x': '67%', '--blend-color': 'rgba(102,44,214,.085)'} as React.CSSProperties}>
      <div ref={rangeRef} className="relative hidden overflow-visible lg:block">
        <div ref={stageRef} className="flex min-h-[calc(100svh-72px)] items-center py-8">
          <div className="mx-auto grid w-full max-w-7xl grid-cols-[.82fr_1.18fr] items-center gap-12 px-8">
            <aside className="flex min-h-0 flex-col">
              <p className="font-sora text-xs font-bold uppercase tracking-[0.2em] text-[var(--qp-violet-300)]">Inside QuestPay</p>
              <h2 className="mt-3 max-w-xl font-sora text-[clamp(2.5rem,4vw,4.5rem)] font-black leading-[.98] tracking-[-.055em] text-white">A closer look at the complete flow.</h2>
              <p className="mt-5 max-w-xl text-base leading-7 text-[var(--qp-text-secondary)]">Follow one paid creator order from a clear service page to verified payment, delivery, and a privacy-safe receipt.</p>
              <div role="tablist" aria-label="QuestPay workflow stages" className="mt-8 space-y-2">
                {previews.map((item, index) => (
                  <button
                    key={item.id}
                    ref={(node) => { if (node) tabRefs.current[index] = node; }}
                    id={`workflow-tab-${item.id}`}
                    role="tab"
                    aria-controls="workflow-active-panel"
                    aria-selected={active === index}
                    tabIndex={active === index ? 0 : -1}
                    type="button"
                    onClick={() => activate(index)}
                    onKeyDown={(event) => {
                      if (event.key === "ArrowDown" || event.key === "ArrowRight") { event.preventDefault(); activate(index + 1, true); }
                      if (event.key === "ArrowUp" || event.key === "ArrowLeft") { event.preventDefault(); activate(index - 1, true); }
                      if (event.key === "Home") { event.preventDefault(); activate(0, true); }
                      if (event.key === "End") { event.preventDefault(); activate(previews.length - 1, true); }
                    }}
                    className={`flex min-h-11 w-full items-center gap-3 rounded-xl border px-4 py-2 text-left transition ${active === index ? "border-[var(--qp-line-4)] bg-[rgba(139,77,255,.10)] text-white" : "border-transparent text-[var(--qp-text-muted)] hover:border-[var(--qp-line-2)] hover:text-white"}`}
                  >
                    <span className="font-mono text-xs text-[var(--qp-violet-300)]">{item.number}</span>
                    <span className="font-sora text-sm font-bold">{item.title}</span>
                  </button>
                ))}
              </div>
              <div className="mt-5 h-px overflow-hidden bg-white/10"><div ref={progressRef} className="h-full w-full origin-left scale-x-0 bg-[var(--qp-violet-500)]" /></div>
              <p className="mt-3 font-mono text-xs text-[var(--qp-text-muted)]">{current.number} / 06 · Scroll to explore</p>
            </aside>

            <div className="relative h-[min(70svh,650px)] overflow-hidden rounded-[2rem] border border-[var(--qp-line-2)] bg-[radial-gradient(circle_at_70%_15%,rgba(139,77,255,.15),transparent_42%),rgba(5,5,11,.96)] shadow-[0_32px_110px_rgba(0,0,0,.48)]" aria-live="polite">
              <AnimatePresence mode="wait" initial={false}>
                <motion.article
                  key={current.id}
                  id="workflow-active-panel"
                  role="tabpanel"
                  aria-labelledby={`workflow-tab-${current.id}`}
                  initial={{ opacity: 0, y: 22, scale: .985, filter: "blur(8px)" }}
                  animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -18, scale: .99, filter: "blur(6px)" }}
                  transition={{ duration: desktopMotion ? .38 : .2, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute inset-0 flex flex-col justify-between p-9 xl:p-12"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="grid h-14 w-14 place-items-center rounded-2xl border border-[var(--qp-line-3)] bg-[rgba(139,77,255,.10)] text-[var(--qp-violet-300)]"><CurrentIcon size={27} /></span>
                      <span className="font-mono text-sm tracking-[.16em] text-[var(--qp-violet-300)]">{current.number}</span>
                    </div>
                    <Image src={current.image} alt="" width={760} height={360} className="mt-5 h-[clamp(120px,22vh,210px)] w-full object-contain" />
                    <h3 className="mt-4 font-sora text-4xl font-black tracking-[-.045em] text-white xl:text-5xl">{current.title}</h3>
                    <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--qp-text-secondary)]">{current.detail}</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {current.points.map((point) => <div key={point} className="rounded-2xl border border-[var(--qp-line-2)] bg-black/25 p-4 text-sm leading-6 text-[var(--qp-text-secondary)]"><span className="mb-3 block h-1.5 w-8 rounded-full bg-[var(--qp-violet-500)]" />{point}</div>)}
                  </div>
                </motion.article>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-20 sm:px-6 lg:hidden" data-testid="mobile-inside-story">
        <div className="mx-auto max-w-2xl">
          <p className="font-sora text-xs font-bold uppercase tracking-[0.2em] text-[var(--qp-violet-300)]">Inside QuestPay</p>
          <h2 className="mt-3 font-sora text-4xl font-black leading-none tracking-[-.045em] text-white sm:text-5xl">A closer look at the complete flow.</h2>
          <p className="mt-5 leading-7 text-[var(--qp-text-secondary)]">Six clear stages connect service selection, private requirements, verified payment, and delivery.</p>
          <div className="sticky top-[calc(var(--qp-navbar-height)+8px)] z-15 mt-10 mb-6 flex items-center gap-3 rounded-full border border-[rgba(174,139,255,.11)] bg-[rgba(4,4,10,.76)] px-3 py-2.5 backdrop-blur-[16px]" data-testid="mobile-story-progress">
            <span className="font-mono text-xs text-[var(--qp-violet-300)]">{String(activeMobile + 1).padStart(2, '0')} / 06</span>
            <div className="relative h-1 flex-1 overflow-hidden rounded-full bg-white/10">
              <motion.div className="absolute inset-y-0 left-0 rounded-full bg-[var(--qp-violet-500)]" animate={{ scaleX: (activeMobile + 1) / previews.length }} transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }} style={{ transformOrigin: 'left' }} />
            </div>
          </div>
          <div className="space-y-5">
            {previews.map((item, idx) => {
              const Icon = item.icon;
              return (
                <motion.article
                  key={item.id}
                  data-testid={`mobile-story-card-${idx + 1}`}
                  ref={(node) => { if (node) mobileCardRefs.current[idx] = node; }}
                  initial={reduceMotion ? false : { opacity: 0, y: 24, scale: 0.985 }}
                  whileInView={reduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true, amount: 0.28 }}
                  transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                  data-active={activeMobile === idx}
                  className="relative min-h-[min(72svh,570px)] overflow-hidden rounded-[26px] border border-[rgba(174,139,255,.12)] p-5"
                  style={{
                    background: 'radial-gradient(circle at 82% 10%, rgba(124,65,238,.13), transparent 42%), linear-gradient(180deg, rgba(10,10,18,.92), rgba(5,5,10,.96))',
                    boxShadow: activeMobile === idx ? '0 22px 70px rgba(59,24,125,.20), inset 0 1px rgba(255,255,255,.035)' : '0 20px 60px rgba(0,0,0,.30), inset 0 1px rgba(255,255,255,.025)',
                    borderColor: activeMobile === idx ? 'rgba(174,139,255,.23)' : undefined,
                  }}
                >
                  <div className="flex items-center justify-between"><span className="grid h-11 w-11 place-items-center rounded-xl bg-[rgba(139,77,255,.11)] text-[var(--qp-violet-300)]"><Icon size={22}/></span><span className="font-mono text-xs text-[var(--qp-violet-300)]">{item.number}</span></div>
                  <Image src={item.image} alt="" width={640} height={300} className="mt-4 h-auto w-full" />
                  <h3 className="mt-5 font-sora text-2xl font-black text-white">{item.title}</h3>
                  <p className="mt-2 font-medium text-[var(--qp-text-secondary)]">{item.summary}</p>
                  <p className="mt-3 text-sm leading-6 text-[var(--qp-text-muted)]">{item.detail}</p>
                  <ul className="mt-4 space-y-2">{item.points.map((point)=><li key={point} className="flex gap-2 text-sm text-[var(--qp-text-secondary)]"><span className="text-[var(--qp-violet-300)]">•</span>{point}</li>)}</ul>
                </motion.article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
