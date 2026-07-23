"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, ExternalLink, ScrollText } from "lucide-react";
import {
  SpotlightCard,
  applyFilterTransition,
  usePauseOffscreen,
  useRevealFallback,
} from "@/components/motion/SpotlightCard";
import Badge, { type BadgeTone } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import HashChip from "@/components/ui/HashChip";
import InlineVerify from "@/components/verify/InlineVerify";

/**
 * Buyer workspace list — the restyled "My Receipts" / "My Orders" surface.
 *
 * VISUAL LAYER ONLY. Rows are fetched + shaped by the server pages
 * (src/app/receipts, src/app/my-orders); this component never fetches, never
 * mutates, and renders only the app's REAL orders. The status filter and the
 * per-card "Receipt details" disclosure are presentational client state over
 * the already-loaded rows — no route / endpoint / data changes.
 */

export interface WorkspaceRow {
  id: string;
  publicOrderId: string;
  slug: string;
  serviceName: string;
  status: string;
  tokenSymbol: string | null;
  amountHuman: string | null;
  usd: number | null;
  createdAt: string;
  paidAt: string | null;
  txHash: string | null;
}

type Group = "active" | "delivered" | "completed" | "closed";
type FilterKey = "all" | Group;

const STATUS_GROUP: Record<string, Group> = {
  pending: "active",
  awaiting_payment: "active",
  payment_submitted: "active",
  paid: "active",
  in_progress: "active",
  reviewing: "active",
  awaiting_client: "active",
  work_submitted: "delivered",
  ready_for_review: "delivered",
  delivered: "delivered",
  accepted: "completed",
  released: "completed",
  completed: "completed",
  expired: "closed",
  cancelled: "closed",
  disputed: "closed",
  refunded: "closed",
  archived: "closed",
};

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "delivered", label: "Delivered" },
  { key: "completed", label: "Completed" },
  { key: "closed", label: "Closed" },
];

function groupOf(status: string): Group {
  return STATUS_GROUP[status] ?? "active";
}

/** DS Badge tone per the reference: completed=success, delivered=info,
 *  paid/in-progress/reviewing=violet, awaiting=warning, expired=neutral,
 *  cancelled=danger. */
function toneOf(status: string): BadgeTone {
  if (status === "delivered" || status === "work_submitted" || status === "ready_for_review") return "info";
  const g = groupOf(status);
  if (g === "completed") return "success";
  if (g === "closed") return status === "expired" || status === "archived" ? "neutral" : "danger";
  if (status === "awaiting_payment" || status === "pending" || status === "payment_submitted") return "warning";
  return "violet";
}

function dotOf(status: string): boolean {
  return (
    status === "in_progress" ||
    status === "reviewing" ||
    status === "awaiting_client" ||
    status === "awaiting_payment" ||
    status === "pending"
  );
}

/** Nodes lit on the mini rail (Created → Paid → In-progress → Done). */
function railFilled(status: string): number {
  const g = groupOf(status);
  if (g === "completed") return 4;
  if (g === "delivered") return 3;
  if (status === "in_progress" || status === "reviewing" || status === "awaiting_client") return 3;
  if (status === "paid") return 2;
  return 1;
}

function humanizeStatus(status: string): string {
  const overrides: Record<string, string> = {
    awaiting_payment: "Awaiting payment",
    payment_submitted: "Payment submitted",
    ready_for_review: "Ready for review",
    work_submitted: "Work submitted",
    awaiting_client: "Awaiting client",
    in_progress: "In progress",
  };
  return overrides[status] || status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, " ");
}

function fmt(ts: string | null): string {
  if (!ts) return "";
  const d = new Date(ts);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleString();
}

export default function ReceiptWorkspace({
  variant,
  rows,
}: {
  variant: "receipts" | "orders";
  rows: WorkspaceRow[];
}) {
  const [filter, setFilter] = useState<FilterKey>("all");
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const chipsRef = useRef<HTMLDivElement>(null);
  const [pill, setPill] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  useRevealFallback(listRef);
  usePauseOffscreen(rootRef);

  // Slide the active-filter pill to the measured chip box.
  const measurePill = useCallback(() => {
    const wrap = chipsRef.current;
    if (!wrap) return;
    const btn = wrap.querySelector<HTMLElement>(`[data-chip="${filter}"]`);
    if (!btn) return;
    setPill((prev) => {
      const next = { x: btn.offsetLeft, y: btn.offsetTop, w: btn.offsetWidth, h: btn.offsetHeight };
      if (prev && prev.x === next.x && prev.y === next.y && prev.w === next.w && prev.h === next.h) {
        return prev;
      }
      return next;
    });
  }, [filter]);

  useEffect(() => {
    measurePill();
    window.addEventListener("resize", measurePill);
    return () => window.removeEventListener("resize", measurePill);
  }, [measurePill]);

  const counts = useMemo(() => {
    const c: Record<FilterKey, number> = { all: rows.length, active: 0, delivered: 0, completed: 0, closed: 0 };
    for (const r of rows) c[groupOf(r.status)]++;
    return c;
  }, [rows]);

  const visible = useMemo(
    () => (filter === "all" ? rows : rows.filter((r) => groupOf(r.status) === filter)),
    [rows, filter],
  );

  const heading = variant === "receipts" ? "Receipts" : "Orders";
  const noun = variant === "receipts" ? "receipts" : "orders";

  return (
    <div ref={rootRef} className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-12">
      <header>
        <p className="qp-work-eyebrow">Buyer workspace · Polygon Mainnet</p>
        <h1 className="mt-3 font-sora text-[clamp(2.2rem,6vw,3.15rem)] font-extrabold leading-[0.98] tracking-[-0.055em] text-[var(--qp-text-strong)]">
          My{" "}
          <span className="qp-shimmer" data-loop>
            {heading}
          </span>
        </h1>
        <p className="mt-3 max-w-[62ch] text-[0.95rem] leading-[1.75] text-[var(--qp-text-secondary)]">
          {variant === "receipts" ? (
            <>
              Payment and delivery proof for orders you own. Public verification of other people&apos;s
              payments lives on{" "}
              <Link href="/verify" className="font-semibold text-[var(--qp-violet-300)] hover:underline">
                Verify
              </Link>
              .
            </>
          ) : (
            <>
              Every order you&apos;ve placed, with live status and payment proof. Track delivery on each
              order&apos;s workspace and accept work to release payment.
            </>
          )}
        </p>
      </header>

      {rows.length > 0 && (
        <div
          ref={chipsRef}
          className="relative mt-7 flex flex-wrap gap-2"
          role="group"
          aria-label="Filter orders by status"
        >
          {pill && (
            <span
              aria-hidden="true"
              className="qp-chip-pill"
              style={{ left: 0, top: pill.y, width: pill.w, height: pill.h, transform: `translateX(${pill.x}px)` }}
            />
          )}
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              data-chip={f.key}
              className="qp-filter qp-press"
              aria-pressed={filter === f.key}
              onClick={() => applyFilterTransition(() => setFilter(f.key))}
            >
              {f.label}
              <span className="qp-filter__count">{counts[f.key]}</span>
            </button>
          ))}
        </div>
      )}

      <div ref={listRef} className="mt-6 space-y-3.5">
        {visible.map((row) => (
          <OrderCard key={row.id} row={row} variant={variant} />
        ))}

        {rows.length > 0 && visible.length === 0 && (
          <p className="rounded-2xl border border-white/10 px-5 py-8 text-center text-sm text-[var(--qp-text-muted)]">
            No {filter} {noun} to show.
          </p>
        )}

        {rows.length === 0 && <EmptyState variant={variant} />}
      </div>
    </div>
  );
}

function MiniRail({ filled }: { filled: number }) {
  return (
    <div
      className="qp-rail shrink-0 self-start sm:self-center"
      role="img"
      aria-label={`Progress ${filled} of 4 stages`}
    >
      {[0, 1, 2, 3].map((i) => (
        <span key={i} className="inline-flex items-center">
          <span className={`qp-rail__node ${i < filled ? "qp-rail__node--on" : ""}`} />
          {i < 3 && <span className={`qp-rail__line ${i + 1 < filled ? "qp-rail__line--on" : ""}`} />}
        </span>
      ))}
    </div>
  );
}

function OrderCard({ row, variant }: { row: WorkspaceRow; variant: "receipts" | "orders" }) {
  const [open, setOpen] = useState(false);
  const usdText = row.usd != null && Number.isFinite(row.usd) ? `~$${row.usd}` : "";
  const created = fmt(row.createdAt);
  const paid = row.paidAt ? fmt(row.paidAt) : "";
  const amountLine = row.amountHuman ? `${row.amountHuman} ${row.tokenSymbol ?? ""}`.trim() : "";

  return (
    <SpotlightCard
      className="qp-receipt-card qp-reveal"
      data-reveal
      style={{ viewTransitionName: `rcpt-${row.publicOrderId.toLowerCase().replace(/[^a-z0-9]+/g, "-")}` }}
      {...(variant === "orders" ? { "data-testid": "order-row" } : {})}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <h2 className="font-sora text-[17px] font-extrabold leading-tight text-white">{row.serviceName}</h2>
            <Badge tone={toneOf(row.status)} dot={dotOf(row.status)}>
              {humanizeStatus(row.status)}
            </Badge>
          </div>
          <p className="mt-1.5 font-mono text-[13px] font-bold text-[var(--qp-violet-300)]">{row.publicOrderId}</p>
          {amountLine && (
            <p className="mt-1 text-sm">
              <span className="qp-amount qp-price-pulse inline-block">{amountLine}</span>
              {usdText && <span className="ml-2 text-[var(--qp-text-subtle)]">{usdText}</span>}
            </p>
          )}
          <p className="mt-1.5 text-xs text-[var(--qp-text-muted)]">
            Created {created}
            {paid ? ` · Paid ${paid}` : ""}
          </p>
        </div>
        <MiniRail filled={railFilled(row.status)} />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button size="sm" href={`/orders/${row.publicOrderId}`}>
          Open order
        </Button>
        {row.txHash && <InlineVerify txHash={row.txHash} showOrderLink={false} />}
        <button
          type="button"
          className="qp-disclosure qp-press ml-auto"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          Receipt details
          <ChevronDown size={15} className="qp-chevron" />
        </button>
      </div>

      <div className="qp-acc-panel mt-3" data-open={open}>
        <div className="qp-acc-clip">
          <div className="qp-acc-body grid gap-2.5 pt-1 sm:grid-cols-3">
            <div className="qp-tile">
              <p className="qp-tile__label">Network</p>
              <p className="qp-tile__value">Polygon Mainnet</p>
            </div>
            <div className="qp-tile">
              <p className="qp-tile__label">Locked amount</p>
              <p className="qp-tile__value">
                {amountLine || "—"}
                {row.txHash && (
                  <span className="mt-0.5 block text-[11px] text-[var(--qp-success)]">exact-match verified</span>
                )}
              </p>
            </div>
            {row.txHash ? (
              <div className="qp-tile">
                <p className="qp-tile__label">Transaction</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <HashChip value={row.txHash} label="Tx" />
                  <a
                    href={`https://polygonscan.com/tx/${row.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--qp-violet-300)] hover:underline"
                  >
                    Explorer
                    <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            ) : (
              <div className="qp-tile qp-tile--dashed">
                <p className="qp-tile__label">Transaction</p>
                <p className="mt-1 text-xs text-[var(--qp-text-muted)]">
                  No transaction attached. This order hasn&apos;t been paid on-chain yet.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </SpotlightCard>
  );
}

function EmptyState({ variant }: { variant: "receipts" | "orders" }) {
  return (
    <div className="rounded-[28px] border border-dashed border-white/15 p-10 text-center sm:p-16">
      <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl border border-white/10 bg-white/[0.03] text-[var(--qp-violet-300)]">
        <ScrollText size={26} />
      </div>
      {variant === "orders" ? (
        <>
          <h2 className="font-sora text-xl font-extrabold text-white">No orders yet</h2>
          <p className="mx-auto mt-2 max-w-md text-[var(--qp-text-muted)]">
            When you check out a service, it shows up here with live status and a verifiable payment
            receipt.
          </p>
        </>
      ) : (
        <p className="mx-auto max-w-md text-[var(--qp-text-muted)]">
          No receipts yet. Checkout a service to generate your first payment proof.
        </p>
      )}
      <Button href="/services" className="mt-6">
        Browse Services
      </Button>
    </div>
  );
}
