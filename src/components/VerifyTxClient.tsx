"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import VerifyResult, { type VerifyResultData } from "@/components/verify/VerifyResult";

interface Props {
  txHash: string;
}

export default function VerifyTxClient({ txHash }: Props) {
  const [result, setResult] = useState<VerifyResultData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function verify() {
      setLoading(true);
      try {
        const res = await fetch(`/api/verify/${txHash}`);
        const data = (await res.json()) as VerifyResultData;
        if (active) setResult({ ...data, txHash: data.txHash || txHash });
      } catch {
        if (active) setResult({ ok: false, txHash, reason: "Request failed. Please try again." });
      } finally {
        if (active) setLoading(false);
      }
    }
    verify();
    return () => {
      active = false;
    };
  }, [txHash]);

  return (
    <div className="min-h-screen bg-[var(--qp-bg)] text-white">
      <section className="mx-auto max-w-2xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-white/10 bg-[var(--qp-surface)] p-5 shadow-2xl sm:p-8">
          <p className="font-mono text-xs font-black uppercase tracking-[0.22em] text-[var(--qp-violet-300)]">
            QuestPay Public Verify
          </p>
          <h1 className="mt-3 font-sora text-3xl font-black tracking-[-0.05em] sm:text-5xl">
            On-chain payment proof
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted">
            Verifying transaction on Polygon mainnet.
          </p>

          <div className="mt-4 overflow-hidden rounded-xl bg-[rgba(8,8,14,.72)] p-3">
            <code className="hash-chip block text-sm text-[var(--qp-violet-300)]">{txHash}</code>
          </div>

          <VerifyResult txHash={txHash} result={result} loading={loading} />

          <div className="mt-6">
            <Link href="/verify" className="text-sm text-muted hover:text-[#C1B6FF]">
              ← Verify another transaction
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
