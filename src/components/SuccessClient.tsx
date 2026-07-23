"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle2, Copy, ExternalLink, Loader2 } from "lucide-react";
import { middle } from "@/lib/payment-utils-client";

interface Props {
  publicOrderId: string;
}

export default function SuccessClient({ publicOrderId }: Props) {
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrder() {
      try {
        const res = await fetch(`/api/orders/${publicOrderId}`);
        const data = await res.json();
        if (res.ok) setOrder(data);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    fetchOrder();
  }, [publicOrderId]);

  if (loading) {
    return (
      <section className="px-4 py-20 text-center">
        <Loader2 className="mx-auto animate-spin text-[var(--qp-violet-300)]" size={32} />
      </section>
    );
  }

  const payment = order?.payment;
  const txHash = payment?.tx_hash || "";

  return (
    <section className="px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="glass-panel-strong rounded-2xl p-5 sm:p-8 text-center"
        >
          <CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-green-400" />
          <h1 className="font-sora text-3xl font-bold text-white">Payment Verified</h1>
          <p className="mt-2 text-muted">
            Your payment has been confirmed on Polygon mainnet. A confirmation email is on the way.
          </p>

          {order && (
            <div className="mt-8 space-y-3 text-left">
              <Row label="Service" value={order.serviceName} />
              <Row label="Amount" value={`${order.amountHuman} ${order.tokenSymbol}`} />
              <Row label="Status" value={order.status} />
              {txHash && (
                <div className="rounded-2xl border border-[var(--qp-border-soft)] bg-[var(--qp-surface)] p-4">
                  <p className="mb-2 text-xs uppercase tracking-wider text-muted">Tx Hash</p>
                  <div className="flex flex-wrap items-center gap-3">
                    <code className="hash-chip text-sm text-[var(--qp-violet-300)]">{middle(txHash, 10, 8)}</code>
                    <button onClick={() => navigator.clipboard.writeText(txHash)} className="rounded-xl bg-white/10 p-2">
                      <Copy className="h-4 w-4" />
                    </button>
                    <a
                      href={`https://polygonscan.com/tx/${txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-verse-blue px-3 text-sm font-black text-black"
                    >
                      Polygonscan <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:flex-wrap">
                <a
                  href={`/orders/${publicOrderId}`}
                  className="flex min-h-11 w-full items-center justify-center rounded-2xl bg-[var(--qp-surface)] px-5 font-bold text-secondary sm:w-auto"
                >
                  View order →
                </a>
                {txHash && (
                  <a
                    href={`/verify/${txHash}`}
                    className="flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-green-400 px-5 font-bold text-black sm:w-auto"
                  >
                    <CheckCircle2 size={18} />
                    Public verify
                  </a>
                )}
                <Link
                  href="/services"
                  className="flex min-h-11 w-full items-center justify-center rounded-2xl bg-verse-purple px-5 font-bold text-white sm:w-auto"
                >
                  New quest →
                </Link>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl bg-[rgba(8,8,14,.72)] p-3 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-sm text-muted">{label}</span>
      <span className="font-mono text-sm text-white">
        <span className="hash-chip">{value}</span>
      </span>
    </div>
  );
}
