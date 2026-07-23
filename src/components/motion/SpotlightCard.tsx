"use client";
/* SpotlightCard.tsx — pointer-tracked spotlight wrapper + motion utilities.
   Ported from the Design project handoff (handoff/SpotlightCard.tsx).

   Pairs with src/app/qp-motion.css. Pointer listeners do real work ONLY on
   fine pointers; touch devices get the static sheen + accent border straight
   from the stylesheet, so nothing runs on a phone. */

import {
  useCallback,
  useEffect,
  useRef,
  type ComponentPropsWithoutRef,
  type ElementType,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from "react";

const finePointer = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
  !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export type SpotlightHue = "review" | "build" | "integration";

/* Rendered element is configurable, but every tag we use (article / div /
   section / li) shares the same HTMLAttributes surface — so the props are
   typed once against "article" rather than made generic. That keeps children
   and event handlers inferable at the call sites. */
export type SpotlightCardProps = {
  as?: ElementType;
  /** Category accent from the design tokens (see deriveCategory). */
  hue?: SpotlightHue;
  /** how-it-works: 60% intensity spotlight. */
  soft?: boolean;
  className?: string;
  /** Pass-through for data-* hooks (data-reveal, data-testid, …). */
  [key: `data-${string}`]: unknown;
} & Omit<ComponentPropsWithoutRef<"article">, "className">;

export function SpotlightCard({
  as,
  hue = "review",
  soft = false,
  className = "",
  children,
  ...rest
}: SpotlightCardProps) {
  const Tag = (as || "article") as "article";
  const fine = useRef<boolean | null>(null);

  const onPointerMove = useCallback((e: ReactPointerEvent<HTMLElement>) => {
    if (fine.current === null) fine.current = finePointer();
    if (!fine.current) return; // zero work on touch
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--qp-x", `${e.clientX - r.left}px`);
    el.style.setProperty("--qp-y", `${e.clientY - r.top}px`);
  }, []);

  const cls = ["qp-spot-card", "qp-press", soft ? "qp-spot-card--soft" : "", `qp-cat-${hue}`, className]
    .filter(Boolean)
    .join(" ");

  return (
    <Tag {...rest} className={cls} onPointerMove={onPointerMove}>
      {children}
    </Tag>
  );
}

/* IntersectionObserver fallback for .qp-reveal when the browser lacks
   scroll-driven animations. Adds .is-in with a 70ms stagger (cap 5). */
export function useRevealFallback(rootRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (typeof CSS !== "undefined" && CSS.supports("animation-timeline: view()")) return;
    const root = rootRef.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      root.querySelectorAll(".qp-reveal").forEach((el) => el.classList.add("is-in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries
          .filter((e) => e.isIntersecting)
          .forEach((e, i) => {
            (e.target as HTMLElement).style.setProperty("--qp-delay", `${Math.min(i * 70, 280)}ms`);
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          });
      },
      { threshold: 0.12 },
    );
    root.querySelectorAll(".qp-reveal").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [rootRef]);
}

/* Pause ambient loops (shimmer / float / breathe / marquee) while off-screen.
   Mark loop elements with data-loop. */
export function usePauseOffscreen(rootRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          (e.target as HTMLElement).style.animationPlayState = e.isIntersecting ? "running" : "paused";
        });
      },
      { threshold: 0.05 },
    );
    root.querySelectorAll("[data-loop]").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [rootRef]);
}

/* Trigger .qp-draw icon line-draws when a container scrolls into view.

   Deviation from the handoff: lucide-react renders its own <path> elements, so
   we cannot hand-author pathLength/data-draw on them. The hook stamps both onto
   every geometry node inside a .qp-draw container (idempotent) and assigns the
   70–90ms stagger, which keeps the CSS contract in qp-motion.css unchanged. */
const DRAW_GEOMETRY = "path, line, polyline, polygon, rect, circle, ellipse";

export function useDrawOnView(rootRef: RefObject<HTMLElement | null>, stepMs = 80) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const containers = Array.from(root.querySelectorAll<HTMLElement>(".qp-draw"));
    if (!containers.length) return;

    containers.forEach((container) => {
      let i = 0;
      container.querySelectorAll<SVGGeometryElement>(DRAW_GEOMETRY).forEach((node) => {
        if (node.hasAttribute("data-draw")) return;
        node.setAttribute("pathLength", "1");
        node.setAttribute("data-draw", "");
        node.style.setProperty("--qp-draw-delay", `${Math.min(i, 5) * stepMs}ms`);
        i += 1;
      });
    });

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      containers.forEach((c) => c.classList.add("is-in"));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          e.target.classList.add("is-in");
          io.unobserve(e.target);
        });
      },
      { threshold: 0.3 },
    );
    containers.forEach((c) => io.observe(c));
    return () => io.disconnect();
  }, [rootRef, stepMs]);
}

/* Badge-pill marquee: only when the pill genuinely overflows.
   Toggles .qp-marquee-on on the pill; the track carries .qp-marquee. */
export function useMarqueeOnOverflow(pillRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = pillRef.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let overflowing = false;
    const check = () => {
      const inner = el.querySelector<HTMLElement>("[data-marquee-content]");
      if (!inner) return;
      const single = el.classList.contains("qp-marquee-on") ? inner.scrollWidth / 2 : inner.scrollWidth;
      const next = single > el.clientWidth + 2;
      if (next !== overflowing) {
        overflowing = next;
        el.classList.toggle("qp-marquee-on", next);
      }
    };
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [pillRef]);
}

/* Connector rail fallback + active-step badges (how-it-works).
   - Fills .qp-rail-fill by scroll progress when view() timelines are missing.
   - Calls onActive(index) when a step row crosses the viewport midline. */
export function useConnectorRail(
  wrapRef: RefObject<HTMLElement | null>,
  onActive: (index: number) => void,
) {
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const fill = wrap.querySelector<HTMLElement>(".qp-rail-fill");
    const rows = Array.from(wrap.querySelectorAll<HTMLElement>("[data-step-row]"));
    const needsJsFill =
      !(typeof CSS !== "undefined" && CSS.supports("animation-timeline: view()")) && finePointer();
    let raf = 0;
    const tick = () => {
      raf = 0;
      const vc = window.innerHeight * 0.5;
      if (needsJsFill && fill) {
        const r = wrap.getBoundingClientRect();
        const p = Math.min(1, Math.max(0, (vc - r.top) / Math.max(1, r.height)));
        fill.style.transform = `scaleY(${p})`;
      }
      let active = 0;
      rows.forEach((el, i) => {
        if (el.getBoundingClientRect().top < vc) active = i;
      });
      onActive(active);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    tick();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [wrapRef, onActive]);
}

/* View-Transitions shuffle for list filtering / re-sorting.
   Cards must carry style={{ viewTransitionName: "…" }}. */
export function applyFilterTransition(apply: () => void) {
  if (typeof window === "undefined") {
    apply();
    return;
  }
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const doc = document as Document & { startViewTransition?: (cb: () => void) => void };
  if (!reduced && typeof doc.startViewTransition === "function") doc.startViewTransition(apply);
  else apply();
}
