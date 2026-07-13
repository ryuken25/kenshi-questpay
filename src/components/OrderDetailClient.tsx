"use client";

import { useState, useEffect } from "react";
import { Copy, ExternalLink, Loader2, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { middle } from "@/lib/payment-utils-client";

interface Props {
  publicOrderId: string;
}

interface OrderResponse {
  publicOrderId: string;
  slug: string;
  serviceName: string;
  serviceUsd: number;
  serviceDescription?: string;
  status: string;
  receiveAddress: string;
  tokenSymbol: string;
  tokenAddress: string | null;
  tokenDecimals: number;
  amountHuman: string;
  createdAt: string;
  paidAt: string | null;
  payment: {
    tx_hash: string;
    from_address: string;
    to_address: string;
    token_symbol: string;
    amount_human: string;
    block_number: number;
    block_timestamp: string;
    confirmations: number;
    verified_at: string;
  } | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: "Pending payment", color: "text-yellow-400", icon: Clock },
  paid: { label: "Paid", color: "text-green-400", icon: CheckCircle2 },
  delivered: { label: "Delivered", color: "text-[var(--qp-violet-300)]", icon: CheckCircle2 },
  expired: { label: "Expired", color: "text-muted", icon: AlertCircle },
  cancelled: { label: "Cancelled", color: "text-red-400", icon: AlertCircle },
};

export default function OrderDetailClient({ publicOrderId }: Props) {
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchOrder() {
      try {
        const res = await fetch(`/api/orders/${publicOrderId}`);
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Order not found.");
          return;
        }
        setOrder(data);
      } catch {
        setError("Failed to load order.");
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

  if (error || !order) {
    return (
      <section className="px-4 py-20">
        <div className="mx-auto max-w-lg text-center">
          <AlertCircle className="mx-auto mb-4 h-16 w-16 text-red-400" />
          <h1 className="font-sora text-2xl font-bold text-white">{error || "Order not found"}</h1>
          <a href="/services" className="mt-6 inline-flex min-h-11 items-center rounded-2xl bg-verse-purple px-6 py-3 font-bold text-white">
            Browse Services
          </a>
        </div>
      </section>
    );
  }

  const statusCfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const StatusIcon = statusCfg.icon;

  return (
    <section className="px-4 py-14 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <div className="text-center mb-8">
          <div className={`inline-flex items-center gap-2 rounded-full px-4 py-2 bg-[var(--qp-surface)] ${statusCfg.color}`}>
            <StatusIcon size={18} />
            <span className="font-bold text-sm">{statusCfg.label}</span>
          </div>
          <h1 className="mt-4 font-sora text-2xl font-black text-white">
            Order <span className="font-mono text-[var(--qp-violet-300)] text-lg">{order.publicOrderId}</span>
          </h1>
          <p className="mt-2 text-sm text-muted">{order.serviceName} — ${order.serviceUsd}</p>
        </div>

        <div className="glass-panel-strong rounded-2xl p-5 sm:p-8 space-y-4">
          <Row label="Service" value={order.serviceName} />
          <Row label="Price" value={`$${order.serviceUsd} USDT`} />
          <Row label="Token" value={order.tokenSymbol} />
          <Row label="Amount" value={`${order.amountHuman} ${order.tokenSymbol}`} />
          <Row label="Created" value={new Date(order.createdAt).toLocaleString()} />
          <p className="rounded-2xl border border-white/10 bg-[var(--qp-surface)] p-4 text-sm leading-6 text-muted">Private brief and contact details are visible only inside the authenticated Creator Studio.</p>

          {order.payment && (
            <div className="rounded-2xl border border-green-400/30 bg-green-400/10 p-4">
              <p className="text-xs uppercase tracking-wider text-green-400 mb-3">Payment confirmed</p>
              <div className="space-y-2 text-sm">
                <Row label="Tx Hash" value={middle(order.payment.tx_hash, 10, 8)} />
                <Row label="From" value={middle(order.payment.from_address)} />
                <Row label="Block" value={String(order.payment.block_number)} />
                <Row label="Confirmations" value={String(order.payment.confirmations)} />
                <Row label="Verified" value={new Date(order.payment.verified_at).toLocaleString()} />
              </div>
              <a
                href={`https://polygonscan.com/tx/${order.payment.tx_hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-xl bg-verse-blue px-3 text-sm font-black text-black"
              >
                View on Polygonscan <ExternalLink size={14} />
              </a>
            </div>
          )}

          {order.status === "pending" && (
            <a
              href={`/pay/${publicOrderId}`}
              className="flex min-h-12 items-center justify-center rounded-2xl bg-verse-purple px-5 font-bold text-white"
            >
              Go to payment →
            </a>
          )}

          {order.status === "paid" && order.payment && (
            <a
              href={`/verify/${order.payment.tx_hash}`}
              className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-green-400 px-5 font-bold text-black"
            >
              <CheckCircle2 size={18} />
              Public verify page
            </a>
          )}
        </div>
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
