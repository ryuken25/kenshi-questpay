"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Search, SlidersHorizontal, PackageX, Sparkles, Clock, Tag } from "lucide-react";
import {
  SpotlightCard,
  applyFilterTransition,
  useRevealFallback,
  type SpotlightHue,
} from "@/components/motion/SpotlightCard";
import { SERVICES, type ServicePackage } from "@/lib/services";
import { SITE } from "@/lib/site";
import { ENABLED_TOKEN_SYMBOLS } from "@/lib/token-metadata";

// ---------------------------------------------------------------------------
// Category derivation
// ---------------------------------------------------------------------------
// The ServicePackage interface has no explicit `category` field, so we derive
// one from the slug/name. This is real, deterministic data — no fabrication.
type ServiceCategory = "Review" | "Build" | "Integration";

const CATEGORY_KEYWORDS: { match: RegExp; label: ServiceCategory }[] = [
  { match: /(integration|sprint)/i, label: "Integration" },
  { match: /(component|landing|polish|build)/i, label: "Build" },
  { match: /(review|quick-look|ux|ui)/i, label: "Review" },
];

function deriveCategory(svc: ServicePackage): ServiceCategory {
  for (const { match, label } of CATEGORY_KEYWORDS) {
    if (match.test(svc.slug) || match.test(svc.name)) return label;
  }
  return "Review";
}

const ALL_CATEGORIES: ServiceCategory[] = ["Review", "Build", "Integration"];

/** Category → spotlight accent hue (Review violet-500 · Build VERSE blue ·
 *  Integration violet-300). Same mapping the design system ships. */
function hueOf(category: ServiceCategory): SpotlightHue {
  return category.toLowerCase() as SpotlightHue;
}

// ---------------------------------------------------------------------------
// Turnaround sorting helper — parse "12-24 hours", "3-5 days", etc. into hours.
// ---------------------------------------------------------------------------
function turnaroundHours(delivery: string): number {
  const m = delivery.match(/(\d+)\s*[-–]\s*(\d+)\s*(hour|day|week)/i);
  if (m) {
    const lo = parseInt(m[1], 10);
    const hi = parseInt(m[2], 10);
    const unit = m[3].toLowerCase();
    const mult = unit === "day" ? 24 : unit === "week" ? 168 : 1;
    // Use the upper bound so "3-5 days" ranks after "24 hours"
    return hi * mult;
  }
  const single = delivery.match(/(\d+)\s*(hour|day|week)/i);
  if (single) {
    const n = parseInt(single[1], 10);
    const unit = single[2].toLowerCase();
    return n * (unit === "day" ? 24 : unit === "week" ? 168 : 1);
  }
  return 999_999; // unknown — sort last
}

// ---------------------------------------------------------------------------
// Sort options
// ---------------------------------------------------------------------------
type SortKey = "recommended" | "price-asc" | "turnaround-asc";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "recommended", label: "Recommended" },
  { value: "price-asc", label: "Price: Low → High" },
  { value: "turnaround-asc", label: "Fastest turnaround" },
];

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------
export default function ServicesClient() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<ServiceCategory | "all">("all");
  const [sortKey, setSortKey] = useState<SortKey>("recommended");
  const [loading, setLoading] = useState(true);

  const gridRef = useRef<HTMLDivElement>(null);
  useRevealFallback(gridRef);

  // Brief mount-time loading skeleton — gives the page a polished feel without
  // faking network latency. Resolves on next paint.
  useEffect(() => {
    const t = requestAnimationFrame(() => setLoading(false));
    return () => cancelAnimationFrame(t);
  }, []);

  const filtered = useMemo(() => {
    let list = SERVICES.slice();

    // Category filter
    if (activeCategory !== "all") {
      list = list.filter((s) => deriveCategory(s) === activeCategory);
    }

    // Search filter — matches name, description, outcome, and included items
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((s) => {
        const haystack = [s.name, s.description, s.outcome, ...s.included].join(" ").toLowerCase();
        return haystack.includes(q);
      });
    }

    // Sort
    if (sortKey === "price-asc") {
      list.sort((a, b) => a.usd - b.usd);
    } else if (sortKey === "turnaround-asc") {
      list.sort((a, b) => turnaroundHours(a.delivery) - turnaroundHours(b.delivery));
    }
    // "recommended" preserves the natural SERVICES order (already curated)

    return list;
  }, [query, activeCategory, sortKey]);

  return (
    <section id="pricing" className="scroll-mt-28 px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">
        {/* Header — left-aligned on mobile (consistent with every other screen); centered on desktop (lg) */}
        <div className="mb-8 text-left sm:mb-10 lg:text-center">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-[var(--qp-violet-300)]">
            {SITE.realNetwork}
          </p>
          <h1 className="section-title mt-3 font-sora font-black text-white">
            Service <span className="gradient-text">Catalog</span>
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted lg:mx-auto">
            Productized services with clear scope, delivery targets, and fixed starting prices.
          </p>
          <p className="mt-2 max-w-xl text-sm text-subtle lg:mx-auto">{SITE.disclaimer}</p>
        </div>

        {/* Token / network summary */}
        <div className="mb-8 flex max-w-2xl flex-wrap items-center gap-2 text-left lg:mx-auto lg:justify-center lg:text-center">
          <span className="text-xs font-medium text-subtle">Pay with:</span>
          <div className="flex flex-wrap items-center gap-1.5">
            {ENABLED_TOKEN_SYMBOLS.map((symbol) => (
              <span
                key={symbol}
                className="rounded-full border border-[var(--qp-violet-500)]/30 bg-[var(--qp-violet-500)]/10 px-2.5 py-0.5 font-mono text-xs font-bold text-[var(--qp-violet-300)]"
              >
                {symbol}
              </span>
            ))}
          </div>
          <span className="text-xs text-subtle">on {SITE.realNetwork}</span>
        </div>

        {/* Toolbar: search + sort */}
        <div className="mb-5 grid gap-3 sm:grid-cols-[minmax(0,320px)_auto] sm:items-center sm:justify-between">
          {/* Search */}
          <div className="relative flex-1 sm:max-w-xs">
            <Search
              size={18}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-subtle"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search services…"
              aria-label="Search services"
              className="min-h-12 w-full rounded-xl border border-white/10 bg-[var(--qp-surface)] py-2.5 pl-10 pr-4 text-base text-white placeholder:text-subtle focus:border-[var(--qp-violet-500)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--qp-focus-ring)] sm:text-sm"
            />
          </div>

          {/* Sort dropdown */}
          <div className="flex min-h-12 items-center gap-2 rounded-xl border border-white/10 bg-[var(--qp-surface)] pl-3">
            <SlidersHorizontal size={16} className="text-subtle" />
            <label htmlFor="sort-select" className="sr-only">
              Sort services
            </label>
            <select
              id="sort-select"
              value={sortKey}
              onChange={(e) => {
                const next = e.target.value as SortKey;
                applyFilterTransition(() => setSortKey(next));
              }}
              className="min-h-12 flex-1 rounded-xl bg-transparent px-1 pr-3 text-base font-medium text-secondary focus:outline-none sm:text-sm"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-[var(--qp-black-100)] text-white">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Category chips — the active state is a single pill that slides */}
        <ChipRow
          active={activeCategory}
          onPick={(next) => applyFilterTransition(() => setActiveCategory(next))}
        />

        <p className="sr-only" aria-live="polite">{filtered.length} services shown</p>

        {/* Content: loading skeleton / empty state / grid */}
        {loading ? (
          <SkeletonGrid />
        ) : filtered.length === 0 ? (
          <EmptyState onReset={() => { setQuery(""); setActiveCategory("all"); }} />
        ) : (
          <div
            ref={gridRef}
            className="qp-grid-stagger grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {filtered.map((svc) => (
              <ServiceCard key={svc.slug} svc={svc} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// ChipRow — category filters with one absolutely-positioned pill that slides
// between the active chip's measured box (offsetLeft/Top/Width/Height).
// ---------------------------------------------------------------------------
type CategoryFilter = ServiceCategory | "all";

type PillBox = { x: number; y: number; w: number; h: number };

function ChipRow({
  active,
  onPick,
}: {
  active: CategoryFilter;
  onPick: (next: CategoryFilter) => void;
}) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [pill, setPill] = useState<PillBox | null>(null);

  const measure = useCallback(() => {
    const wrap = rowRef.current;
    if (!wrap) return;
    const btn = wrap.querySelector<HTMLElement>(`[data-chip="${active}"]`);
    if (!btn) return;
    setPill((prev) => {
      const next = { x: btn.offsetLeft, y: btn.offsetTop, w: btn.offsetWidth, h: btn.offsetHeight };
      if (prev && prev.x === next.x && prev.y === next.y && prev.w === next.w && prev.h === next.h) {
        return prev;
      }
      return next;
    });
  }, [active]);

  // The pill only mounts once it has a measured box, so it never slides in
  // from x=0 on first paint. Re-measure on resize (the row wraps when narrow).
  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  const chips: { key: CategoryFilter; label: string; count: number }[] = [
    { key: "all", label: "All", count: SERVICES.length },
    ...ALL_CATEGORIES.map((cat) => ({
      key: cat as CategoryFilter,
      label: cat,
      count: SERVICES.filter((s) => deriveCategory(s) === cat).length,
    })),
  ];

  return (
    <div ref={rowRef} className="relative mb-8 flex flex-wrap items-center gap-2">
      {pill && (
        <span
          aria-hidden="true"
          className="qp-chip-pill"
          style={{ left: 0, top: pill.y, width: pill.w, height: pill.h, transform: `translateX(${pill.x}px)` }}
        />
      )}
      {chips.map(({ key, label, count }) => (
        <Chip
          key={key}
          id={key}
          active={active === key}
          onClick={() => onPick(key)}
          label={label}
          count={count}
        />
      ))}
    </div>
  );
}

function Chip({
  id,
  active,
  onClick,
  label,
  count,
}: {
  id: CategoryFilter;
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      data-chip={id}
      onClick={onClick}
      aria-pressed={active}
      className={`qp-press relative inline-flex min-h-11 items-center gap-1.5 rounded-full border bg-transparent px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors duration-[180ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
        active ? "border-transparent text-white" : "border-white/10 text-subtle hover:text-secondary"
      }`}
    >
      {label}
      <span
        className={`rounded-full px-1.5 font-mono text-[10px] ${
          active ? "bg-white/20 text-white" : "bg-white/5 text-subtle"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// ServiceCard — clearer card hierarchy with deliverable + token summary
// ---------------------------------------------------------------------------
function ServiceCard({ svc }: { svc: ServicePackage }) {
  const category = deriveCategory(svc);
  return (
    <SpotlightCard
      data-reveal
      hue={hueOf(category)}
      style={{ viewTransitionName: `svc-${svc.slug}` }}
      className="qp-reveal group flex flex-col rounded-[1.5rem] p-5 glass-panel sm:p-6"
    >
      {/* Top row: category badge + price */}
      <div className="flex items-start justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-[var(--qp-surface)] px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-secondary">
          <Tag size={11} />
          {category}
        </span>
        <span className="qp-price-pulse inline-block rounded-full bg-verse-blue/10 px-3 py-1 font-mono text-xs font-bold text-[var(--qp-violet-300)]">
          ${svc.usd} USD
        </span>
      </div>

      {/* Title + description */}
      <h2 className="mt-4 font-sora text-lg font-black text-white">{svc.name}</h2>
      <p className="mt-2 flex-1 text-sm leading-6 text-muted">{svc.description}</p>

      {/* Deliverable summary (outcome) */}
      <div className="mt-4 rounded-xl border border-white/5 bg-black/20 p-3">
        <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-subtle">
          <Sparkles size={11} className="text-[var(--qp-violet-300)]" />
          Deliverable
        </p>
        <p className="mt-1 text-xs leading-5 text-muted">{svc.outcome}</p>
      </div>

      {/* Meta row: delivery + token badges */}
      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
        <span className="inline-flex items-center gap-1 text-subtle">
          <Clock size={12} />
          {svc.delivery}
        </span>
        <span className="text-subtle">·</span>
        <div className="hidden flex-wrap items-center gap-1 sm:flex">
          {ENABLED_TOKEN_SYMBOLS.map((sym) => (
            <span
              key={sym}
              className="rounded border border-[var(--qp-violet-500)]/20 bg-[var(--qp-violet-500)]/5 px-1.5 py-0.5 font-mono text-[10px] font-bold text-[var(--qp-violet-300)]"
            >
              {sym}
            </span>
          ))}
        </div>
      </div>

      {/* CTA */}
      <Link
        href={`/services/${svc.slug}`}
        className="qp-arrow-row qp-press mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-verse-purple/30 bg-verse-purple/20 px-4 py-3 font-bold text-[#C1B6FF] transition-all group-hover:bg-verse-purple/30"
      >
        View package
        <span aria-hidden="true" className="qp-arrow">
          →
        </span>
      </Link>
    </SpotlightCard>
  );
}

// ---------------------------------------------------------------------------
// SkeletonGrid — loading placeholder
// ---------------------------------------------------------------------------
function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col rounded-[1.5rem] p-6 glass-panel"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="h-7 w-20 animate-pulse rounded-full bg-white/5" />
            <div className="h-7 w-16 animate-pulse rounded-full bg-white/5" />
          </div>
          <div className="mt-4 h-5 w-3/4 animate-pulse rounded bg-white/5" />
          <div className="mt-3 h-3 w-full animate-pulse rounded bg-white/5" />
          <div className="mt-1.5 h-3 w-5/6 animate-pulse rounded bg-white/5" />
          <div className="mt-4 h-16 w-full animate-pulse rounded-xl bg-white/5" />
          <div className="mt-4 h-4 w-2/3 animate-pulse rounded bg-white/5" />
          <div className="mt-5 h-11 w-full animate-pulse rounded-2xl bg-white/5" />
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// EmptyState — no results
// ---------------------------------------------------------------------------
function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[1.5rem] py-20 text-center glass-panel">
      <PackageX size={48} className="text-subtle" strokeWidth={1.5} />
      <h3 className="mt-4 font-sora text-lg font-bold text-white">No services found</h3>
      <p className="mt-2 max-w-sm text-sm text-muted">
        Try adjusting your search or category filter to see available services.
      </p>
      <button
        type="button"
        onClick={onReset}
        className="mt-5 inline-flex min-h-11 items-center justify-center rounded-2xl border border-verse-purple/30 bg-verse-purple/20 px-5 py-2.5 text-sm font-bold text-[#C1B6FF] transition-all hover:bg-verse-purple/30"
      >
        Clear filters
      </button>
    </div>
  );
}
