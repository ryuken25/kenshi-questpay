"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  Loader2,
  Lock,
  MessageSquarePlus,
  Send,
  ShieldCheck,
} from "lucide-react";
import InlineVerify from "@/components/verify/InlineVerify";
import HashChip from "@/components/ui/HashChip";

export type ViewerRole = "buyer" | "creator" | "admin";

export interface OrderView {
  publicOrderId: string;
  slug: string;
  serviceName: string;
  serviceUsd: number | null;
  status: string;
  amountHuman: string | null;
  tokenSymbol: string | null;
  createdAt: string;
  paidAt: string | null;
  workSubmittedAt: string | null;
  acceptedAt: string | null;
  deliveredAt: string | null;
  releasedAt: string | null;
  paymentExpiresAt: string | null;
  payment: {
    txHash: string | null;
    fromAddress: string | null;
    blockNumber: string | number | null;
    confirmations: number | null;
    verifiedAt: string | null;
  } | null;
}

export interface OrderEventView {
  id: string;
  actorRole: "buyer" | "creator" | "admin" | "system";
  eventType: "status_change" | "progress_note";
  fromStatus: string | null;
  toStatus: string | null;
  note: string | null;
  createdAt: string;
}

interface Props {
  order: OrderView;
  viewerRole: ViewerRole;
  initialEvents: OrderEventView[];
}

const PROGRESS_NOTE_MAX = 2000;

/** Ordered lifecycle milestones (the happy path). */
const STEPS = [
  { key: "placed", label: "Order placed", rank: 0 },
  { key: "paid", label: "Payment confirmed", rank: 1 },
  { key: "progress", label: "Work in progress", rank: 2 },
  { key: "delivered", label: "Work delivered", rank: 3 },
  { key: "accepted", label: "Accepted by buyer", rank: 4 },
  { key: "released", label: "Payment released", rank: 5 },
] as const;

const STATUS_RANK: Record<string, number> = {
  pending: 0,
  awaiting_payment: 0,
  payment_submitted: 0,
  paid: 1,
  in_progress: 2,
  reviewing: 2,
  awaiting_client: 2,
  work_submitted: 3,
  ready_for_review: 3,
  delivered: 3,
  accepted: 4,
  released: 5,
  completed: 5,
};

const NEGATIVE_TERMINAL = new Set(["expired", "cancelled", "disputed", "refunded", "archived"]);
const ACCEPTABLE_STATUSES = new Set(["delivered", "ready_for_review"]);

function humanizeStatus(status: string | null): string {
  if (!status) return "—";
  const overrides: Record<string, string> = {
    awaiting_payment: "Awaiting payment",
    payment_submitted: "Payment submitted",
    ready_for_review: "Ready for review",
    work_submitted: "Work submitted",
    awaiting_client: "Awaiting client",
    in_progress: "In progress",
  };
  if (overrides[status]) return overrides[status];
  return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, " ");
}

function actorLabel(role: OrderEventView["actorRole"]): string {
  return { buyer: "Buyer", creator: "Creator", admin: "Admin", system: "System" }[role];
}

function fmt(ts: string | null): string {
  if (!ts) return "";
  const d = new Date(ts);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleString();
}

export default function OrderDetailClient({ order, viewerRole, initialEvents }: Props) {
  const [status, setStatus] = useState(order.status);
  const [events, setEvents] = useState<OrderEventView[]>(initialEvents);

  const isNegativeTerminal = NEGATIVE_TERMINAL.has(status);
  const currentRank = STATUS_RANK[status] ?? 0;

  const steps = useMemo(() => {
    const reachedAt: (string | null)[] = [
      order.createdAt,
      order.paidAt,
      order.workSubmittedAt,
      order.deliveredAt ?? order.workSubmittedAt,
      order.acceptedAt,
      order.releasedAt,
    ];
    let currentAssigned = false;
    return STEPS.map((step, i) => {
      const reached = i === 0 ? true : Boolean(reachedAt[i]) || currentRank >= step.rank;
      let state: "done" | "current" | "upcoming";
      if (reached) {
        state = "done";
      } else if (!currentAssigned && !isNegativeTerminal) {
        state = "current";
        currentAssigned = true;
      } else {
        state = "upcoming";
      }
      return { ...step, state, at: reached ? reachedAt[i] : null };
    });
  }, [order, currentRank, isNegativeTerminal]);

  const txHash = order.payment?.txHash || null;
  const canPay = status === "pending" || status === "awaiting_payment" || status === "payment_submitted";
  const canCompose = viewerRole === "creator" || viewerRole === "admin";
  const canAccept = viewerRole === "buyer" && ACCEPTABLE_STATUSES.has(status);

  return (
    <section className="px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="text-center">
          <p className="qp-work-eyebrow">Order workspace · Polygon Mainnet</p>
          <h1 className="mt-3 font-sora text-2xl font-black text-white">
            <span className="font-mono text-lg text-[var(--qp-violet-300)]">{order.publicOrderId}</span>
          </h1>
          <p className="mt-2 text-sm text-muted">
            {order.serviceName}
            {order.serviceUsd != null ? ` — $${order.serviceUsd}` : ""}
          </p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-[var(--qp-surface)] px-4 py-2">
            {isNegativeTerminal ? (
              <AlertCircle size={16} className="text-red-400" />
            ) : status === "released" || status === "completed" ? (
              <CheckCircle2 size={16} className="text-green-400" />
            ) : (
              <Clock size={16} className="text-[var(--qp-violet-300)]" />
            )}
            <span className="text-sm font-bold text-white" data-testid="order-status">
              {humanizeStatus(status)}
            </span>
          </div>
        </div>

        {isNegativeTerminal && (
          <div
            className="mt-6 rounded-2xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-100"
            data-testid="order-terminal-banner"
          >
            This order is <b>{humanizeStatus(status)}</b>. No further lifecycle progress will occur.
            {status === "cancelled" && order.paymentExpiresAt
              ? " The payment window elapsed before a payment was confirmed."
              : ""}
          </div>
        )}

        {/* Lifecycle stepper */}
        <ol
          data-testid="lifecycle-stepper"
          className="mt-8 flex flex-col gap-5 md:flex-row md:gap-0"
        >
          {steps.map((step, i) => {
            const done = step.state === "done";
            const current = step.state === "current";
            const nodeCls = done
              ? "qp-step-node qp-step-node--done"
              : current
                ? "qp-step-node qp-step-node--current"
                : "qp-step-node";
            const lineDone = i > 0 && steps[i - 1].state === "done";
            return (
              <li
                key={step.key}
                className="relative flex flex-1 items-start gap-3 md:flex-col md:items-center md:text-center"
                data-step={step.key}
                data-state={step.state}
              >
                {/* mobile vertical connector */}
                {i < steps.length - 1 && (
                  <span
                    aria-hidden
                    className={`absolute left-4 top-9 -bottom-5 w-px md:hidden ${
                      done ? "bg-green-400/40" : "bg-white/10"
                    }`}
                  />
                )}
                {/* desktop horizontal connector (left half toward previous node) */}
                {i > 0 && (
                  <span
                    aria-hidden
                    className={`absolute right-1/2 top-4 hidden h-px w-full md:block ${
                      lineDone ? "bg-green-400/40" : "bg-white/10"
                    }`}
                  />
                )}
                <span className={nodeCls}>{done ? <Check size={16} /> : i + 1}</span>
                <span className="min-w-0 md:mt-2">
                  <span
                    className={`block text-sm font-bold ${
                      done ? "text-white" : current ? "text-white" : "text-muted"
                    }`}
                  >
                    {step.label}
                  </span>
                  {step.at && <span className="mt-0.5 block text-xs text-muted">{fmt(step.at)}</span>}
                  {current && !step.at && (
                    <span className="mt-0.5 block text-xs text-[var(--qp-violet-300)]">In progress</span>
                  )}
                </span>
              </li>
            );
          })}
        </ol>

        {/* Pay CTA (unpaid) */}
        {canPay && (
          <Link
            href={`/pay/${order.publicOrderId}`}
            className="qp-button qp-button--primary qp-button--block mt-8"
          >
            Go to payment →
          </Link>
        )}

        {/* Buyer accept (delivered / ready_for_review) */}
        {canAccept && (
          <AcceptWork
            publicOrderId={order.publicOrderId}
            onAccepted={(next) => setStatus(next)}
          />
        )}

        {/* Receipt + verify (paid orders with an on-chain tx) */}
        {txHash && (
          <div
            className="mt-8 rounded-2xl border border-green-400/30 bg-green-400/10 p-5"
            data-testid="order-receipt"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-black uppercase tracking-wider text-green-400">
                Payment receipt
              </p>
              <Link
                href="/receipts"
                className="inline-flex min-h-9 items-center rounded-lg border border-white/15 px-3 text-xs font-bold text-[var(--qp-text-secondary)] hover:bg-white/5"
              >
                View all receipts
              </Link>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <HashChip value={txHash} label="Tx" />
              {order.payment?.fromAddress && <HashChip value={order.payment.fromAddress} label="From" />}
            </div>
            {(order.payment?.blockNumber != null || order.payment?.confirmations != null) && (
              <div className="mt-2 space-y-2">
                {order.payment?.blockNumber != null && (
                  <Row label="Block" value={String(order.payment.blockNumber)} />
                )}
                {order.payment?.confirmations != null && (
                  <Row label="Confirmations" value={String(order.payment.confirmations)} />
                )}
              </div>
            )}
            <a
              href={`https://polygonscan.com/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl bg-verse-blue px-3 text-sm font-black text-black"
            >
              View on Polygonscan <ExternalLink size={14} />
            </a>
            <div className="mt-4 border-t border-green-400/20 pt-4">
              <InlineVerify txHash={txHash} showOrderLink={false} />
            </div>
          </div>
        )}

        {/* Order facts */}
        <div className="glass-panel-strong mt-8 space-y-3 rounded-2xl p-5 sm:p-6">
          <Row label="Service" value={order.serviceName} />
          {order.amountHuman && order.tokenSymbol && (
            <Row label="Amount" value={`${order.amountHuman} ${order.tokenSymbol}`} />
          )}
          <Row label="Created" value={fmt(order.createdAt)} />
          {order.paidAt && <Row label="Paid" value={fmt(order.paidAt)} />}
          <p className="rounded-2xl border border-white/10 bg-[var(--qp-surface)] p-4 text-xs leading-6 text-muted">
            Private brief and contact details are visible only inside the authenticated Creator Studio.
          </p>
        </div>

        {/* Creator compose box */}
        {canCompose && (
          <ProgressComposer
            publicOrderId={order.publicOrderId}
            onPosted={(ev) => setEvents((prev) => [...prev, ev])}
          />
        )}

        {/* Progress feed */}
        <div className="mt-8">
          <div className="flex items-center gap-2">
            <h2 className="font-sora text-lg font-black text-white">Progress</h2>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-0.5 text-[0.65rem] font-bold text-muted">
              <Lock size={11} /> Private to you &amp; the creator
            </span>
          </div>
          <ol className="mt-4 space-y-3" data-testid="progress-feed">
            {events.length === 0 && (
              <li className="rounded-2xl border border-dashed border-white/15 bg-[var(--qp-surface)] p-5 text-sm text-muted">
                No updates yet. Lifecycle changes and creator notes will appear here.
              </li>
            )}
            {events.map((ev) => (
              <li
                key={ev.id}
                data-testid="progress-event"
                data-event-type={ev.eventType}
                className="rounded-2xl border border-white/10 bg-[var(--qp-surface)] p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-2 text-xs font-bold text-[var(--qp-violet-300)]">
                    {ev.eventType === "progress_note" ? (
                      <MessageSquarePlus size={14} />
                    ) : (
                      <ShieldCheck size={14} />
                    )}
                    {ev.eventType === "progress_note"
                      ? `${actorLabel(ev.actorRole)} note`
                      : "Status update"}
                  </span>
                  <span className="text-xs text-muted">{fmt(ev.createdAt)}</span>
                </div>
                {ev.eventType === "status_change" ? (
                  <p className="mt-2 text-sm text-white">
                    {ev.fromStatus ? (
                      <>
                        <span className="text-muted">{humanizeStatus(ev.fromStatus)}</span>
                        {" → "}
                      </>
                    ) : null}
                    <span className="font-bold">{humanizeStatus(ev.toStatus)}</span>
                  </p>
                ) : (
                  <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-white">
                    {ev.note}
                  </p>
                )}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

function AcceptWork({
  publicOrderId,
  onAccepted,
}: {
  publicOrderId: string;
  onAccepted: (nextStatus: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function accept() {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch(`/api/orders/${publicOrderId}/accept`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Could not accept work. Please try again.");
        return;
      }
      onAccepted(data.status || "accepted");
      setMessage(
        data.release?.ok
          ? "Work accepted — payment release initiated."
          : "Work accepted. Thank you!",
      );
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-8 rounded-2xl border border-[var(--qp-violet-300)]/30 bg-[var(--qp-violet-strong)]/10 p-5">
      <p className="text-sm font-bold text-white">The creator delivered your work.</p>
      <p className="mt-1 text-sm text-muted">
        Review the delivery, then accept to release payment from custody.
      </p>
      <button
        type="button"
        onClick={accept}
        disabled={busy}
        data-testid="accept-work-button"
        className="mt-4 inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-green-400 px-5 font-black text-black disabled:opacity-50"
      >
        {busy ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
        Accept work &amp; release payment
      </button>
      {message && <p className="mt-3 text-sm text-green-300">{message}</p>}
      {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
    </div>
  );
}

function ProgressComposer({
  publicOrderId,
  onPosted,
}: {
  publicOrderId: string;
  onPosted: (event: OrderEventView) => void;
}) {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const trimmed = note.trim();

  async function submit() {
    if (!trimmed || busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/orders/${publicOrderId}/progress`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ note: trimmed }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          res.status === 429
            ? "You're posting too fast. Please wait a moment."
            : data.error || "Could not post note. Please try again.",
        );
        return;
      }
      if (data.event) onPosted(data.event as OrderEventView);
      setNote("");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-8 rounded-2xl border border-white/10 bg-[var(--qp-surface)] p-5">
      <label htmlFor="progress-note" className="text-sm font-bold text-white">
        Post a progress update
      </label>
      <p className="mt-1 text-xs text-muted">
        Visible to the buyer and admins only. Not shown on public receipts or /verify.
      </p>
      <textarea
        id="progress-note"
        data-testid="progress-compose"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        maxLength={PROGRESS_NOTE_MAX}
        rows={3}
        placeholder="Share what you've done, blockers, or next steps…"
        className="mt-3 w-full resize-y rounded-xl border border-white/10 bg-[rgba(8,8,14,.72)] p-3 text-sm text-white outline-none focus:border-[var(--qp-violet-300)]"
      />
      <div className="mt-2 flex items-center justify-between gap-3">
        <span className="text-xs text-muted">
          {note.length}/{PROGRESS_NOTE_MAX}
        </span>
        <button
          type="button"
          onClick={submit}
          disabled={!trimmed || busy}
          data-testid="progress-submit"
          className="qp-button qp-button--primary qp-button--sm"
        >
          {busy ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
          Post update
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-red-300">{error}</p>}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl bg-[rgba(8,8,14,.72)] p-3 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-sm text-muted">{label}</span>
      <span className="min-w-0 break-words font-mono text-sm text-white">
        <span className="hash-chip">{value}</span>
      </span>
    </div>
  );
}
