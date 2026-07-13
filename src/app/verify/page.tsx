"use client";

import { useState } from "react";
import { CheckCircle2, Copy, ExternalLink, Loader2, XCircle, Search } from "lucide-react";
import { middle } from "@/lib/payment-utils-client";
import PublicShell from "@/components/PublicShell";

interface VerifyResult {
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
  order?: { public_order_id: string; slug: string; status: string } | null;
}

export default function VerifyPage() {
  const [txHash, setTxHash] = useState("");
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    const tx = txHash.trim();
    if (!tx) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`/api/verify/${tx}`);
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ ok: false, txHash: tx, reason: "Request failed." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <PublicShell>
      <main className="min-screen-safe px-4 py-24 text-[var(--qp-text-primary)] sm:px-6 lg:px-8">
      <section className="mx-auto max-w-2xl rounded-[2rem] border border-white/10 bg-[var(--qp-surface)] p-5 shadow-2xl sm:p-8">
        <p className="font-mono text-xs font-black uppercase tracking-[0.22em] text-[var(--qp-violet-300)]">
          QuestPay Public Verify
        </p>
        <h1 className="mt-3 font-sora text-3xl font-black tracking-[-0.05em] sm:text-5xl">
          On-chain payment proof
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          This page is stateless. It re-checks Polygon mainnet live and verifies receiver, token, amount, status, and confirmations.
        </p>

        <form onSubmit={handleVerify} className="mt-6 flex gap-2">
          <input
            className="w-full rounded-xl border border-[var(--qp-border-soft)] bg-base-lighter px-4 py-3 text-base text-[var(--qp-text-primary)] placeholder:text-[var(--qp-text-subtle)] outline-none focus:border-verse-purple/50"
            value={txHash}
            onChange={(e) => setTxHash(e.target.value)}
            placeholder="Paste Polygon tx hash: 0x..."
          />
          <button
            type="submit"
            disabled={loading || !txHash}
            className="flex min-h-12 items-center gap-2 rounded-2xl bg-verse-purple px-5 font-black text-white disabled:opacity-40"
          >
            {loading ? <Loader2 className="animate-spin" /> : <Search size={18} />}
            Verify
          </button>
        </form>

        {loading && (
          <div className="mt-8 flex items-center gap-3 rounded-2xl bg-[var(--qp-surface)] p-5">
            <Loader2 className="animate-spin" /> Verifying on Polygon...
          </div>
        )}

        {result && (
          <div
            className={`mt-8 rounded-2xl border p-5 ${
              result.ok
                ? "border-green-400/30 bg-green-400/10"
                : "border-red-400/30 bg-red-400/10"
            }`}
          >
            <div className="mb-5 flex items-center gap-3">
              {result.ok ? (
                <CheckCircle2 className="text-green-400" />
              ) : (
                <XCircle className="text-red-400" />
              )}
              <b>{result.ok ? "Payment verified" : "Verification failed"}</b>
            </div>
            {!result.ok && <p className="text-sm text-red-100">{result.reason}</p>}
            {result.ok && (
              <div className="space-y-3 text-sm">
                <Row label="Token" value={result.token || ""} />
                <Row label="Amount" value={result.amountHuman || ""} />
                <Row label="From" value={middle(result.from || "")} raw={result.from} />
                <Row label="To" value={middle(result.to || "")} raw={result.to} />
                <Row label="Block" value={result.blockNumber ? String(result.blockNumber) : ""} />
                <Row
                  label="Time"
                  value={
                    result.blockTimestamp
                      ? new Date(result.blockTimestamp * 1000).toLocaleString()
                      : ""
                  }
                />
                <Row label="Confirmations" value={result.confirmations ? String(result.confirmations) : ""} />
                {result.order && (
                  <Row label="Order" value={result.order.public_order_id} />
                )}
                <div className="flex flex-wrap items-center gap-3 rounded-xl bg-[rgba(8,8,14,.72)] p-3">
                  <code className="hash-chip text-[var(--qp-violet-300)]">{middle(txHash, 10, 8)}</code>
                  <button
                    onClick={() => navigator.clipboard.writeText(txHash)}
                    className="rounded-lg bg-white/10 p-2"
                  >
                    <Copy size={14} />
                  </button>
                  <a
                    href={`https://polygonscan.com/tx/${txHash}`}
                    target="_blank"
                    className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-verse-blue px-3 font-black text-black"
                  >
                    Polygonscan <ExternalLink size={14} />
                  </a>
                </div>
              </div>
            )}
          </div>
        )}
      </section>
      </main>
    </PublicShell>
  );
}

function Row({ label, value, raw }: { label: string; value: string; raw?: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl bg-[rgba(8,8,14,.72)] p-3 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-muted">{label}</span>
      <span className="flex min-w-0 items-center gap-2 font-mono text-white">
        <span className="hash-chip">{value}</span>
        {raw && (
          <button onClick={() => navigator.clipboard.writeText(raw)} className="rounded-lg bg-white/10 p-2">
            <Copy size={14} />
          </button>
        )}
      </span>
    </div>
  );
}
