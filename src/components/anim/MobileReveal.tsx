"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Mobile-lite animation tier (GSAP + matchMedia).
 *
 * A single app-wide engine that reveals any element marked `data-reveal`:
 *   - ≥1024px .............. NO-OP. Desktop keeps its existing full animations
 *                           (framer-motion hero mount, the pinned GSAP story).
 *                           data-reveal elements stay at their natural visibility.
 *   - <1024px (motion OK) .. GSAP ON but LITE — transform+opacity only, one
 *                           short duration (≤0.5s), simple staggered reveals via
 *                           ScrollTrigger.batch. No pinned ScrollTrigger scenes.
 *   - reduce ............... near-static: a quick opacity fade, no transform.
 *
 * ScrollTrigger.config({ ignoreMobileResize: true }) stops mobile URL-bar
 * show/hide from thrashing triggers. If GSAP fails to load, elements simply
 * stay visible (no stuck-hidden content) — failure is graceful by construction.
 */
export default function MobileReveal() {
  const pathname = usePathname();

  useEffect(() => {
    let disposed = false;
    let mm: {
      add: (query: string, fn: () => (() => void) | void) => void;
      revert: () => void;
    } | null = null;

    void (async () => {
      const [{ default: gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      if (disposed) return;

      gsap.registerPlugin(ScrollTrigger);
      ScrollTrigger.config({ ignoreMobileResize: true });

      const SELECTOR = "[data-reveal]";
      mm = gsap.matchMedia();

      // ── <1024px, motion allowed: lite staggered reveals, no pins ──────────
      mm.add("(max-width: 1023px) and (prefers-reduced-motion: no-preference)", () => {
        const els = gsap.utils.toArray<HTMLElement>(SELECTOR);
        if (!els.length) return;

        gsap.set(els, { opacity: 0, y: 16, willChange: "transform, opacity" });
        const triggers = ScrollTrigger.batch(els, {
          start: "top 88%",
          once: true,
          onEnter: (batch) =>
            gsap.to(batch, {
              opacity: 1,
              y: 0,
              duration: 0.45,
              stagger: 0.06,
              ease: "power2.out",
              overwrite: true,
              onComplete: () => gsap.set(batch as HTMLElement[], { willChange: "auto" }),
            }),
        });
        ScrollTrigger.refresh();

        return () => {
          triggers.forEach((t) => t.kill());
          gsap.set(els, { clearProps: "opacity,transform,willChange" });
        };
      });

      // ── prefers-reduced-motion: fade only, near-static ────────────────────
      mm.add("(max-width: 1023px) and (prefers-reduced-motion: reduce)", () => {
        const els = gsap.utils.toArray<HTMLElement>(SELECTOR);
        if (!els.length) return;
        gsap.fromTo(els, { opacity: 0 }, { opacity: 1, duration: 0.3, stagger: 0.02, ease: "none" });
        return () => gsap.set(els, { clearProps: "opacity" });
      });

      // ≥1024px: intentionally no branch — desktop animations are unchanged.
    })();

    return () => {
      disposed = true;
      mm?.revert();
    };
  }, [pathname]);

  return null;
}
