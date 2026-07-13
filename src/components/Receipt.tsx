"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Copy, ExternalLink, FileText, Shield } from "lucide-react";
import { PACKAGES } from "@/lib/config";
import { middle } from "@/lib/payment-utils-client";

const polygonScanTx = (tx: string) => `https://polygonscan.com/tx/${tx}`;

interface ReceiptData {
  packageId: number;
  buyerAddress: string;
  txHash: string;
  network: string;
  briefId: string;
  token?: string;
  amount?: string;
  mode?: string;
}

interface ReceiptProps { receipt: ReceiptData | null; }

export default function Receipt({ receipt }: ReceiptProps) {
  if (!receipt) return null;
  const pkg = PACKAGES.find((p) => p.id === receipt.packageId);
  const copyToClipboard = (text: string) => navigator.clipboard.writeText(text);
  const isPolygon = receipt.network.toLowerCase().includes('polygon');
  const explorer = isPolygon ? polygonScanTx(receipt.txHash) : `https://sepolia.basescan.org/tx/${receipt.txHash}`;
  const verifyLink = `/verify?tx=${receipt.txHash}&package=${receipt.packageId}&token=${receipt.token || 'USDT'}`;

  return (
    <section id="receipt" className="relative py-16 sm:py-20">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} className="glass-panel-strong rounded-2xl p-5 glow-purple sm:p-8">
          <div className="mb-8 text-center">
            <CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-green-400" />
            <h2 className="font-sora mb-2 text-2xl font-bold text-white">Payment Verified</h2>
            <p className="text-muted">Save this receipt. The on-chain tx is the canonical proof.</p>
          </div>
          <div className="space-y-3">
            <Row label="Package" value={`${pkg?.name || receipt.packageId}`} />
            <Row label="Payment" value={`${receipt.amount || ''} ${receipt.token || ''}`.trim() || 'Verified'} />
            <Row label="Mode" value={receipt.mode || 'payment'} />
            <Row label="Buyer" value={middle(receipt.buyerAddress)} raw={receipt.buyerAddress} onCopy={copyToClipboard} />
            <Row label="Network" value={receipt.network} />
            <Row label="Brief ID" value={receipt.briefId} icon={<FileText className="h-3 w-3"/>} raw={receipt.briefId} onCopy={copyToClipboard} />
            <div className="rounded-2xl border border-[var(--qp-border-soft)] bg-[var(--qp-surface)] p-4">
              <p className="mb-2 text-xs uppercase tracking-wider text-muted">Tx Hash</p>
              <div className="flex flex-wrap items-center gap-3">
                <code className="hash-chip text-sm text-[var(--qp-violet-300)]">{middle(receipt.txHash, 10, 8)}</code>
                <button onClick={() => copyToClipboard(receipt.txHash)} className="rounded-xl bg-white/10 p-2"><Copy className="h-4 w-4" /></button>
                <a href={explorer} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-verse-blue px-3 text-sm font-black text-black">Explorer <ExternalLink className="h-4 w-4" /></a>
              </div>
            </div>
            {isPolygon && <a href={verifyLink} className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-green-400 px-4 font-black text-black"><Shield size={18}/> Open Public Verify Page</a>}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Row({ label, value, raw, onCopy, icon }: { label: string; value: string; raw?: string; onCopy?: (v:string)=>void; icon?: React.ReactNode }) {
  return <div className="flex flex-col gap-2 rounded-2xl border border-[var(--qp-border-soft)] bg-[var(--qp-surface)] p-4 sm:flex-row sm:items-center sm:justify-between"><span className="text-sm text-muted">{label}</span><span className="flex min-w-0 items-center gap-2 font-mono text-sm text-white">{icon}<span className="hash-chip">{value}</span>{raw && onCopy && <button onClick={()=>onCopy(raw)} className="shrink-0 rounded-lg bg-white/10 p-2"><Copy className="h-3 w-3"/></button>}</span></div>
}
