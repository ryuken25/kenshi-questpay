"use client";

import Link from "next/link";
import { CheckCircle2, Copy, ExternalLink, Loader2, XCircle } from "lucide-react";
import { middle } from "@/lib/payment-utils-client";

/**
 * Shape returned by `GET /api/verify/[txHash]`.
 *
 * This is the ONE shared result contract consumed by every verify surface
 * (the /verify page, the /verify/[txHash] page, and the inline receipt widget).
 * No verification logic lives here — this component only renders the payload.
 */
export interface VerifyResultData {
  ok: boolean;
  reason?: string;
  txHash: string;
  from?: string;
  to?: string;
  token?: string;
  amountHuman?: string;
  blockNumber?: number;
  blockTimestamp?: number;
  confirmations?: number;
  explorer?: string;
  verifiedAt?: string;
  note?: string;
  order?: { public_order_id: string; slug: string; status: string } | null;
}

interface VerifyResultProps {
  /** Hash under inspection — drives display, copy, and the explorer fallback link. */
  txHash: string;
  /** Payload from the verify endpoint; `null` while idle. */
  result: VerifyResultData | null;
  /** True while the verify request is in flight. */
  loading?: boolean;
  /** Render a "View order →" link when the result is tied to an order. Default true. */
  showOrderLink?: boolean;
  /** Tighter paddings for embedded / inline surfaces. */
  compact?: boolean;
  className?: string;
}

function copyText(value: string) {
  if (typeof navigator !== "undefined" && navigator.clipboard) {
    navigator.clipboard.writeText(value);
  }
}

export default function VerifyResult({
  txHash,
  result,
  loading = false,
  showOrderLink = true,
  compact = false,
  className = "",
}: VerifyResultProps) {
  if (loading) {
    return (
      <div
        role="status"
        aria-live="polite"
        className={`mt-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-[rgba(8,8,14,.72)] p-4 text-sm text-[var(--qp-text-secondary)] ${className}`}
      >
        <Loader2 className="animate-spin shrink-0" size={18} /> Verifying on-chain…
      </div>
    );
  }

  if (!result) return null;

  const pad = compact ? "p-4" : "p-5";
  const hash = result.txHash || txHash;
  const explorerUrl = result.explorer || `https://polygonscan.com/tx/${hash}`;

  if (!result.ok) {
    return (
      <div
        role="alert"
        className={`mt-4 rounded-2xl border border-red-400/30 bg-red-400/10 ${pad} ${className}`}
      >
        <div className="flex items-center gap-3">
          <XCircle className="shrink-0 text-red-400" size={20} />
          <b className="text-white">Verification failed</b>
        </div>
        <p className="mt-2 break-words text-sm text-red-100">
          {result.reason || "This transaction does not match a QuestPay payment."}
        </p>
        <a
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl bg-white/10 px-3 text-xs font-bold text-white"
        >
          View on explorer <ExternalLink size={13} />
        </a>
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={`mt-4 rounded-2xl border border-green-400/30 bg-green-400/10 ${pad} ${className}`}
    >
      <div className="mb-4 flex items-center gap-3">
        <CheckCircle2 className="shrink-0 text-green-400" size={20} />
        <b className="text-white">Payment verified</b>
      </div>

      <div className="space-y-2.5 text-sm">
        {result.token && <Row label="Token" value={result.token} />}
        {result.amountHuman && <Row label="Amount" value={result.amountHuman} />}
        {result.from && <Row label="From" value={middle(result.from)} raw={result.from} />}
        {result.to && <Row label="To" value={middle(result.to)} raw={result.to} />}
        {result.blockNumber != null && <Row label="Block" value={String(result.blockNumber)} />}
        {result.blockTimestamp != null && (
          <Row label="Time" value={new Date(result.blockTimestamp * 1000).toLocaleString()} />
        )}
        {result.confirmations != null && (
          <Row label="Confirmations" value={String(result.confirmations)} />
        )}
        {result.order?.public_order_id && <Row label="Order" value={result.order.public_order_id} />}

        <div className="flex flex-wrap items-center gap-2 rounded-xl bg-[rgba(8,8,14,.72)] p-3">
          <code className="hash-chip min-w-0 flex-1 text-[var(--qp-violet-300)]">
            {middle(hash, 10, 8)}
          </code>
          <button
            type="button"
            onClick={() => copyText(hash)}
            aria-label="Copy transaction hash"
            className="shrink-0 rounded-lg bg-white/10 p-2"
          >
            <Copy size={14} />
          </button>
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl bg-verse-blue px-3 text-xs font-black text-black"
          >
            Explorer <ExternalLink size={13} />
          </a>
        </div>

        {showOrderLink && result.order?.public_order_id && (
          <Link
            href={`/orders/${result.order.public_order_id}`}
            className="inline-flex min-h-11 items-center rounded-xl bg-white/10 px-3 text-xs font-bold text-white"
          >
            View order →
          </Link>
        )}

        {result.note && (
          <p className="pt-1 text-xs leading-5 text-[var(--qp-text-muted)]">{result.note}</p>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, raw }: { label: string; value: string; raw?: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl bg-[rgba(8,8,14,.72)] p-3 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-[var(--qp-text-muted)]">{label}</span>
      <span className="flex min-w-0 items-center gap-2 font-mono text-white">
        <span className="hash-chip min-w-0">{value}</span>
        {raw && (
          <button
            type="button"
            onClick={() => copyText(raw)}
            aria-label={`Copy ${label}`}
            className="shrink-0 rounded-lg bg-white/10 p-2"
          >
            <Copy size={13} />
          </button>
        )}
      </span>
    </div>
  );
}
