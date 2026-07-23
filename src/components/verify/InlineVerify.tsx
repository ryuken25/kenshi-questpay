"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { Loader2, Share2, ShieldCheck } from "lucide-react";
import VerifyResult, { type VerifyResultData } from "./VerifyResult";

const HASH_RE = /^0x[a-fA-F0-9]{64}$/;

interface InlineVerifyProps {
  /** Polygon tx hash to verify in place. */
  txHash: string;
  /** Also render a shareable "Public verify" deep link to /verify?tx=…. Default true. */
  showPublicLink?: boolean;
  /** Show the "View order →" link inside the result. Turn off when already on the order page. */
  showOrderLink?: boolean;
  className?: string;
}

/**
 * Inline receipt verifier. Renders a "Verify" button that calls
 * `GET /api/verify/<tx>` in place and renders the shared <VerifyResult>
 * without navigating away, plus an optional shareable "Public verify" deep
 * link. No hash pasting, no verification logic — UI only.
 */
export default function InlineVerify({
  txHash,
  showPublicLink = true,
  showOrderLink = true,
  className = "",
}: InlineVerifyProps) {
  const [result, setResult] = useState<VerifyResultData | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const runVerify = useCallback(async () => {
    setOpen(true);
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`/api/verify/${txHash}`);
      const data = (await res.json()) as VerifyResultData;
      setResult({ ...data, txHash: data.txHash || txHash });
    } catch {
      setResult({ ok: false, txHash, reason: "Request failed. Please try again." });
    } finally {
      setLoading(false);
    }
  }, [txHash]);

  const invalid = !HASH_RE.test(txHash);

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={runVerify}
          disabled={invalid || loading}
          data-testid="inline-verify-button"
          className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-green-400 px-4 text-sm font-black text-black disabled:opacity-50"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
          {open ? "Re-verify" : "Verify"}
        </button>
        {showPublicLink && !invalid && (
          <Link
            href={`/verify?tx=${txHash}`}
            data-testid="public-verify-link"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/15 px-4 text-sm font-bold text-[var(--qp-text-secondary)] hover:bg-white/5"
          >
            <Share2 size={15} /> Public verify
          </Link>
        )}
      </div>

      {open && (
        <VerifyResult
          txHash={txHash}
          result={result}
          loading={loading}
          showOrderLink={showOrderLink}
          compact
        />
      )}
    </div>
  );
}
