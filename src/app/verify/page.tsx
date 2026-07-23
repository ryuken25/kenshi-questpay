"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, Search } from "lucide-react";
import PublicShell from "@/components/PublicShell";
import VerifyResult, { type VerifyResultData } from "@/components/verify/VerifyResult";

const HASH_RE = /^0x[a-fA-F0-9]{64}$/;

export default function VerifyPage() {
  return (
    <PublicShell>
      <div className="min-screen-safe px-4 py-14 text-[var(--qp-text-primary)] sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <section className="mx-auto max-w-2xl rounded-[2rem] border border-white/10 bg-[var(--qp-surface)] p-5 shadow-2xl sm:p-8">
          <p className="font-mono text-xs font-black uppercase tracking-[0.22em] text-[var(--qp-violet-300)]">
            QuestPay Public Verify
          </p>
          <h1 className="mt-3 font-sora text-3xl font-black tracking-[-0.05em] sm:text-5xl">
            On-chain payment proof
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted">
            This page is stateless. It re-checks Polygon mainnet live and verifies receiver, token,
            amount, status, and confirmations.
          </p>

          <Suspense fallback={<FormFallback />}>
            <VerifyForm />
          </Suspense>
        </section>
      </div>
    </PublicShell>
  );
}

function FormFallback() {
  return (
    <div className="mt-6 h-12 animate-pulse rounded-xl bg-[rgba(8,8,14,.72)]" aria-hidden="true" />
  );
}

function VerifyForm() {
  const searchParams = useSearchParams();
  const txParam = (searchParams.get("tx") || "").trim();
  const validParam = HASH_RE.test(txParam);

  const [txHash, setTxHash] = useState(validParam ? txParam : "");
  const [result, setResult] = useState<VerifyResultData | null>(null);
  const [loading, setLoading] = useState(false);
  const autoRan = useRef("");

  const runVerify = useCallback(async (raw: string) => {
    const tx = raw.trim();
    if (!tx) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`/api/verify/${tx}`);
      const data = (await res.json()) as VerifyResultData;
      setResult({ ...data, txHash: data.txHash || tx });
    } catch {
      setResult({ ok: false, txHash: tx, reason: "Request failed. Please try again." });
    } finally {
      setLoading(false);
    }
  }, []);

  // Deep link: /verify?tx=0x… prefills the field and auto-runs verification once
  // per hash. A missing/invalid tx falls through to today's manual flow untouched.
  useEffect(() => {
    if (validParam && txParam && autoRan.current !== txParam) {
      autoRan.current = txParam;
      setTxHash(txParam);
      runVerify(txParam);
    }
  }, [validParam, txParam, runVerify]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    runVerify(txHash);
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-2 sm:flex-row">
        <input
          className="w-full min-w-0 rounded-xl border border-[var(--qp-border-soft)] bg-base-lighter px-4 py-3 text-base text-[var(--qp-text-primary)] placeholder:text-[var(--qp-text-subtle)] outline-none focus:border-verse-purple/50"
          value={txHash}
          onChange={(e) => setTxHash(e.target.value)}
          placeholder="Paste Polygon tx hash: 0x…"
          aria-label="Polygon transaction hash"
          spellCheck={false}
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={loading || !txHash.trim()}
          className="flex min-h-[52px] w-full shrink-0 items-center justify-center gap-2 rounded-2xl bg-verse-purple px-5 font-black text-white disabled:opacity-40 sm:min-h-12 sm:w-auto"
        >
          {loading ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
          Verify
        </button>
      </form>

      <VerifyResult txHash={result?.txHash || txHash} result={result} loading={loading} />
    </>
  );
}
