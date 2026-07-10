"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { CheckCircle2, Copy, ExternalLink, Loader2, XCircle } from "lucide-react";
import { TokenSymbol, polygonScanTx } from "@/config/payments";
import { middle, verifyPolygonPayment, type VerifyResult } from "@/lib/payment-utils";

function VerifyInner() {
  const params = useSearchParams();
  const tx = params.get('tx') || '';
  const packageId = Number(params.get('package') || '1');
  const token = (params.get('token') || 'USDT') as TokenSymbol;
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!tx) return;
    setLoading(true);
    verifyPolygonPayment(tx, packageId, token).then(setResult).finally(() => setLoading(false));
  }, [tx, packageId, token]);

  return (
    <main className="min-h-screen bg-[#0B0D14] px-4 py-10 text-white sm:px-6 lg:px-8">
      <section className="mx-auto max-w-2xl rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 shadow-2xl sm:p-8">
        <p className="font-mono text-xs font-black uppercase tracking-[0.22em] text-verse-blue">QuestPay Public Verify</p>
        <h1 className="mt-3 font-sora text-3xl font-black tracking-[-0.05em] sm:text-5xl">On-chain payment proof</h1>
        <p className="mt-3 text-sm leading-6 text-gray-400">This page is stateless. It re-checks Polygon mainnet live via public RPC and verifies receiver, token, amount, status, and recency.</p>

        {!tx && <div className="mt-8 rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-5 text-yellow-100">Missing tx hash. Use `/verify?tx=0x...&package=1&token=USDT`.</div>}
        {loading && <div className="mt-8 flex items-center gap-3 rounded-2xl bg-white/5 p-5"><Loader2 className="animate-spin"/> Verifying on Polygon...</div>}
        {result && <div className={`mt-8 rounded-2xl border p-5 ${result.ok ? 'border-green-400/30 bg-green-400/10' : 'border-red-400/30 bg-red-400/10'}`}>
          <div className="mb-5 flex items-center gap-3">{result.ok ? <CheckCircle2 className="text-green-400"/> : <XCircle className="text-red-400"/>}<b>{result.ok ? 'Payment verified' : 'Verification failed'}</b></div>
          {!result.ok && <p className="text-sm text-red-100">{result.reason}</p>}
          {result.ok && <div className="space-y-3 text-sm">
            <Row label="Token" value={result.token || token}/>
            <Row label="Amount" value={result.amount || ''}/>
            <Row label="From" value={middle(result.from || '')} raw={result.from}/>
            <Row label="To" value={middle(result.to || '')} raw={result.to}/>
            <Row label="Block" value={String(result.blockNumber || '')}/>
            <Row label="Time" value={result.timestamp ? new Date(result.timestamp * 1000).toLocaleString() : ''}/>
            <div className="flex flex-wrap items-center gap-3 rounded-xl bg-black/20 p-3"><code className="hash-chip text-verse-blue">{middle(tx, 10, 8)}</code><button onClick={()=>navigator.clipboard.writeText(tx)} className="rounded-lg bg-white/10 p-2"><Copy size={14}/></button><a href={polygonScanTx(tx)} target="_blank" className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-verse-blue px-3 font-black text-black">Polygonscan <ExternalLink size={14}/></a></div>
          </div>}
        </div>}
      </section>
    </main>
  );
}

function Row({ label, value, raw }: { label: string; value: string; raw?: string }) { return <div className="flex flex-col gap-1 rounded-xl bg-black/20 p-3 sm:flex-row sm:items-center sm:justify-between"><span className="text-gray-500">{label}</span><span className="flex min-w-0 items-center gap-2 font-mono text-white"><span className="hash-chip">{value}</span>{raw && <button onClick={()=>navigator.clipboard.writeText(raw)} className="rounded-lg bg-white/10 p-2"><Copy size={14}/></button>}</span></div> }

export default function VerifyPage() { return <Suspense fallback={<main className="min-h-screen bg-[#0B0D14] text-white">Loading...</main>}><VerifyInner /></Suspense>; }
