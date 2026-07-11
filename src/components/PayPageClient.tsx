"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, Copy, ExternalLink, Loader2, Wallet } from "lucide-react";
import { NETWORKS, chainKeyFromId, type TokenSymbol } from "@/lib/services";

interface OrderData {
  public_order_id: string;
  slug: string;
  status: string;
  receive_address: string;
  chain_id: number;
  token_symbol: string;
  token_address: string | null;
  token_decimals: number;
  amount_human: string;
  amount_raw: string;
  usd_price: number;
  customer_name: string | null;
}

interface Props {
  publicOrderId: string;
  order: OrderData | null;
  serviceName?: string;
}

const REAL_PAYMENTS_ENABLED = process.env.NEXT_PUBLIC_ENABLE_REAL_PAYMENTS === "true";

export default function PayPageClient({ publicOrderId, order, serviceName }: Props) {
  const router = useRouter();
  const [txHash, setTxHash] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);

  const receiveAddress = order?.receive_address || "";
  const tokenSymbol = (order?.token_symbol || "USDT") as TokenSymbol;
  const amountHuman = order?.amount_human || "";
  const tokenAddress = order?.token_address;
  const chainKey = chainKeyFromId(order?.chain_id);
  const network = NETWORKS[chainKey];
  const eip681Uri = order
    ? tokenSymbol === "POL"
      ? `ethereum:${receiveAddress}@${network.chainId}?value=${order.amount_raw}`
      : `ethereum:${tokenAddress}@${network.chainId}/transfer?address=${receiveAddress}&uint256=${order.amount_raw}`
    : "";

  useEffect(() => {
    if (!eip681Uri) return;
    const fetchQr = async () => {
      try {
        const res = await fetch(`/api/qr?data=${encodeURIComponent(eip681Uri)}`);
        if (res.ok) setQrDataUrl(await res.text());
      } catch {
        // QR is a convenience only; manual address still renders.
      }
    };
    fetchQr();
  }, [eip681Uri]);

  const verifyPayment = useCallback(
    async (hash?: string) => {
      const tx = (hash || txHash).trim();
      if (!tx) {
        setStatus("Paste a transaction hash first.");
        return;
      }
      setBusy(true);
      setStatus(`Verifying payment on ${network.name}...`);
      try {
        const res = await fetch(`/api/orders/${publicOrderId}/verify-payment`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ txHash: tx }),
        });
        const data = await res.json();
        if (data.ok) {
          setStatus("Payment verified. Redirecting...");
          router.push(`/orders/${publicOrderId}/success?tx=${tx}`);
        } else {
          setStatus(data.reason || "Verification failed. Make sure the transaction has enough confirmations.");
        }
      } catch (e: unknown) {
        setStatus(e instanceof Error ? e.message : "Verification request failed.");
      } finally {
        setBusy(false);
      }
    },
    [txHash, publicOrderId, router, network.name],
  );

  if (!order) {
    return (
      <section className="px-4 py-20">
        <div className="mx-auto max-w-lg text-center">
          <AlertCircle className="mx-auto mb-4 h-16 w-16 text-red-400" />
          <h1 className="font-sora text-2xl font-bold text-white">Order not found</h1>
          <p className="mt-2 text-muted">This order does not exist or has expired.</p>
          <a href="/services" className="mt-6 inline-flex min-h-11 items-center rounded-2xl bg-verse-purple px-6 py-3 font-bold text-white">Browse Services</a>
        </div>
      </section>
    );
  }

  if (order.status === "paid" || order.status === "delivered") {
    return (
      <section className="px-4 py-20">
        <div className="mx-auto max-w-lg text-center">
          <CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-green-400" />
          <h1 className="font-sora text-2xl font-bold text-white">Already paid</h1>
          <p className="mt-2 text-muted">This order has been paid.</p>
          <button onClick={() => router.push(`/orders/${publicOrderId}`)} className="mt-6 inline-flex min-h-11 items-center rounded-2xl bg-verse-blue px-6 py-3 font-bold text-black">View order</button>
        </div>
      </section>
    );
  }

  const copyAddress = () => {
    navigator.clipboard.writeText(receiveAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const payWithWallet = async () => {
    if (!REAL_PAYMENTS_ENABLED) {
      setStatus("Payments are being upgraded. Wallet payment stays disabled until the real-payment gate is PASS.");
      return;
    }
    setStatus("Wallet payment will be enabled after the production payment gate passes.");
  };

  return (
    <section className="px-4 py-14 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-[#8FEAFF]">Pay on {network.name}</p>
          <h1 className="mt-3 font-sora text-3xl font-black text-white">{serviceName || "Service"} — <span className="gradient-text">${order.usd_price}</span></h1>
          <p className="mt-2 text-sm text-muted">Send <b className="text-white">{amountHuman} {tokenSymbol}</b> to the address below.</p>
        </div>

        <div className="glass-panel-strong space-y-6 rounded-2xl p-5 sm:p-8">
          <div className="grid gap-5 lg:grid-cols-[220px_1fr]">
            <div className="rounded-2xl bg-white p-3 text-center">
              {qrDataUrl ? <div dangerouslySetInnerHTML={{ __html: qrDataUrl }} className="mx-auto w-full max-w-[220px]" /> : <div className="grid h-[196px] place-items-center"><Loader2 className="animate-spin text-black" /></div>}
              <p className="mt-2 text-xs text-black">EIP-681 QR</p>
            </div>
            <div className="space-y-3 text-sm">
              <InfoRow label="Token" value={tokenSymbol} />
              <InfoRow label="Exact amount" value={`${amountHuman} ${tokenSymbol}`} />
              <div className="rounded-2xl bg-[var(--qp-surface)] p-3">
                <p className="text-xs uppercase tracking-wider text-muted">Receive address</p>
                <div className="mt-1 flex items-center gap-2 break-all font-mono text-sm text-white">
                  <span className="hash-chip">{receiveAddress}</span>
                  <button onClick={copyAddress} className="shrink-0 rounded-lg bg-white/10 p-2">{copied ? <CheckCircle2 size={14} className="text-green-400" /> : <Copy size={14} />}</button>
                </div>
              </div>
              <a href={`${network.explorer}/address/${receiveAddress}`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[var(--qp-surface)] px-3 text-xs text-muted hover:text-white">View on {network.name.includes("BNB") ? "BscScan" : "Polygonscan"} <ExternalLink size={12} /></a>
            </div>
          </div>

          <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-100">Payments are being upgraded. Do not send real funds until the production real-payment gate is PASS.</div>
          <button onClick={payWithWallet} disabled={busy || !REAL_PAYMENTS_ENABLED} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-verse-blue px-5 font-black text-black disabled:opacity-40"><Wallet size={18} />{REAL_PAYMENTS_ENABLED ? (busy ? "Processing..." : `Pay ${amountHuman} ${tokenSymbol} with Wallet`) : "Wallet payment temporarily disabled"}</button>

          <div className="rounded-3xl border border-white/10 bg-[rgba(8,11,24,.42)] p-4">
            <p className="mb-2 text-sm font-bold text-secondary">Already sent? Paste your tx hash:</p>
            <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
              <input className="w-full rounded-xl border border-[var(--qp-border-soft)] bg-base-lighter px-4 py-3 text-base text-[var(--qp-text-primary)] placeholder:text-[var(--qp-text-subtle)] outline-none focus:border-verse-purple/50" value={txHash} onChange={(e) => setTxHash(e.target.value)} placeholder="0x..." />
              <button onClick={() => verifyPayment()} disabled={busy || !txHash} className="rounded-2xl bg-green-400 px-5 py-3 font-black text-black disabled:opacity-40">{busy ? <Loader2 className="animate-spin" /> : "Verify Tx"}</button>
            </div>
          </div>

          {status && <div className="rounded-2xl border border-white/10 bg-[var(--qp-surface)] p-4 text-sm text-secondary">{status}</div>}
        </div>
      </div>
    </section>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl bg-[var(--qp-surface)] p-3"><p className="text-xs uppercase tracking-wider text-muted">{label}</p><p className="mt-1 font-mono text-sm text-white">{value}</p></div>;
}
