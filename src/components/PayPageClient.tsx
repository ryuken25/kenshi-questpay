"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Copy, ExternalLink, Loader2, Wallet, CheckCircle2, AlertCircle } from "lucide-react";
import { encodeFunctionData, parseUnits } from "viem";
import { middle } from "@/lib/payment-utils-client";
import type { TokenSymbol } from "@/lib/services";

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

const POLYGON_CHAIN_HEX = "0x89";

export default function PayPageClient({ publicOrderId, order, serviceName }: Props) {
  const router = useRouter();
  const [txHash, setTxHash] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);

  // If order not found or already paid
  if (!order) {
    return (
      <section className="px-4 py-20">
        <div className="mx-auto max-w-lg text-center">
          <AlertCircle className="mx-auto mb-4 h-16 w-16 text-red-400" />
          <h1 className="font-sora text-2xl font-bold text-white">Order not found</h1>
          <p className="mt-2 text-gray-400">This order does not exist or has expired.</p>
          <a href="/services" className="mt-6 inline-flex min-h-11 items-center rounded-2xl bg-verse-purple px-6 py-3 font-bold text-white">
            Browse Services
          </a>
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
          <p className="mt-2 text-gray-400">This order has been paid.</p>
          <button
            onClick={() => router.push(`/orders/${publicOrderId}`)}
            className="mt-6 inline-flex min-h-11 items-center rounded-2xl bg-verse-blue px-6 py-3 font-bold text-black"
          >
            View order →
          </button>
        </div>
      </section>
    );
  }

  const receiveAddress = order.receive_address;
  const tokenSymbol = order.token_symbol as TokenSymbol;
  const amountHuman = order.amount_human;
  const tokenAddress = order.token_address;
  const tokenDecimals = order.token_decimals;

  // Build EIP-681 URI
  const eip681Uri =
    tokenSymbol === "POL"
      ? `ethereum:${receiveAddress}@137?value=${order.amount_raw}`
      : `ethereum:${tokenAddress}@137/transfer?address=${receiveAddress}&uint256=${order.amount_raw}`;

  // Fetch QR code from a local API route (server-side generation)
  useEffect(() => {
    const fetchQr = async () => {
      try {
        const res = await fetch(`/api/qr?data=${encodeURIComponent(eip681Uri)}`);
        if (res.ok) {
          const svg = await res.text();
          setQrDataUrl(svg);
        }
      } catch {
        // ignore
      }
    };
    fetchQr();
  }, [eip681Uri]);

  const copyAddress = () => {
    navigator.clipboard.writeText(receiveAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Wallet payment ──
  const switchToPolygon = async (provider: any) => {
    try {
      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: POLYGON_CHAIN_HEX }],
      });
    } catch (err: any) {
      if (err?.code === 4902) {
        await provider.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: POLYGON_CHAIN_HEX,
              chainName: "Polygon Mainnet",
              nativeCurrency: { name: "POL", symbol: "POL", decimals: 18 },
              rpcUrls: ["https://polygon-bor-rpc.publicnode.com"],
              blockExplorerUrls: ["https://polygonscan.com"],
            },
          ],
        });
      } else {
        throw err;
      }
    }
  };

  const payWithWallet = async () => {
    const provider = (window as any).ethereum;
    if (!provider) {
      setStatus("No injected wallet found. Use Manual Pay instead.");
      return;
    }
    setBusy(true);
    setStatus("Opening wallet on Polygon mainnet...");
    try {
      await switchToPolygon(provider);
      const [from] = await provider.request({ method: "eth_requestAccounts" });
      const value = parseUnits(amountHuman, tokenDecimals);

      let hash: string;
      if (tokenSymbol === "POL") {
        hash = await provider.request({
          method: "eth_sendTransaction",
          params: [{ from, to: receiveAddress, value: `0x${value.toString(16)}` }],
        });
      } else {
        const data = encodeFunctionData({
          abi: [
            { type: "function", name: "transfer", stateMutability: "nonpayable", inputs: [{ type: "address" }, { type: "uint256" }], outputs: [{ type: "bool" }] },
          ],
          functionName: "transfer",
          args: [receiveAddress, value],
        });
        hash = await provider.request({
          method: "eth_sendTransaction",
          params: [{ from, to: tokenAddress, data }],
        });
      }

      setStatus(`Transaction sent: ${middle(hash, 10, 8)}. Verifying...`);
      setTxHash(hash);
      // Auto-verify
      await verifyPayment(hash);
    } catch (e: any) {
      setStatus(e?.message || "Wallet payment failed.");
    } finally {
      setBusy(false);
    }
  };

  // ── Verify payment (manual or after wallet) ──
  const verifyPayment = useCallback(
    async (hash?: string) => {
      const tx = (hash || txHash).trim();
      if (!tx) {
        setStatus("Paste a transaction hash first.");
        return;
      }
      setBusy(true);
      setStatus("Verifying payment on Polygon...");
      try {
        const res = await fetch(`/api/orders/${publicOrderId}/verify-payment`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ txHash: tx }),
        });
        const data = await res.json();

        if (data.ok) {
          setStatus("Payment verified! Redirecting...");
          router.push(`/orders/${publicOrderId}/success?tx=${tx}`);
        } else {
          setStatus(data.reason || "Verification failed. Make sure the transaction has 3+ confirmations.");
        }
      } catch (e: any) {
        setStatus(e?.message || "Verification request failed.");
      } finally {
        setBusy(false);
      }
    },
    [txHash, publicOrderId, router],
  );

  return (
    <section className="px-4 py-14 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <div className="text-center mb-8">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-verse-blue">
            Pay on Polygon Mainnet
          </p>
          <h1 className="mt-3 font-sora text-3xl font-black text-white">
            {serviceName || "Service"} — <span className="gradient-text">${order.usd_price}</span>
          </h1>
          <p className="mt-2 text-sm text-gray-400">
            Send <b className="text-white">{amountHuman} {tokenSymbol}</b> to the address below.
          </p>
        </div>

        <div className="glass-panel-strong rounded-2xl p-5 sm:p-8 space-y-6">
          {/* QR + payment details */}
          <div className="grid gap-5 lg:grid-cols-[220px_1fr]">
            <div className="rounded-2xl bg-white p-3 text-center">
              {qrDataUrl ? (
                <div dangerouslySetInnerHTML={{ __html: qrDataUrl }} className="mx-auto w-full max-w-[220px]" />
              ) : (
                <div className="grid h-[196px] place-items-center">
                  <Loader2 className="animate-spin text-black" />
                </div>
              )}
              <p className="mt-2 text-xs text-black">EIP-681 QR</p>
            </div>

            <div className="space-y-3 text-sm">
              <InfoRow label="Token" value={tokenSymbol} />
              <InfoRow label="Exact amount" value={`${amountHuman} ${tokenSymbol}`} />
              <div className="rounded-2xl bg-white/[0.04] p-3">
                <p className="text-xs uppercase tracking-wider text-gray-500">Receive address</p>
                <div className="mt-1 flex items-center gap-2 break-all font-mono text-sm text-white">
                  <span className="hash-chip">{receiveAddress}</span>
                  <button onClick={copyAddress} className="shrink-0 rounded-lg bg-white/10 p-2">
                    {copied ? <CheckCircle2 size={14} className="text-green-400" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
              <a
                href={`https://polygonscan.com/address/${receiveAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-white/5 px-3 text-xs text-gray-400 hover:text-white"
              >
                View on Polygonscan <ExternalLink size={12} />
              </a>
            </div>
          </div>

          {/* Wallet pay */}
          <button
            onClick={payWithWallet}
            disabled={busy}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-verse-blue px-5 font-black text-black disabled:opacity-40"
          >
            <Wallet size={18} />
            {busy ? "Processing..." : `Pay ${amountHuman} ${tokenSymbol} with Wallet`}
          </button>

          {/* Manual verify */}
          <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
            <p className="mb-2 text-sm font-bold text-gray-300">Already sent? Paste your tx hash:</p>
            <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
              <input
                className="w-full rounded-xl border border-white/5 bg-base-lighter px-4 py-3 text-base text-white placeholder-gray-600 outline-none focus:border-verse-purple/50"
                value={txHash}
                onChange={(e) => setTxHash(e.target.value)}
                placeholder="0x..."
              />
              <button
                onClick={() => verifyPayment()}
                disabled={busy || !txHash}
                className="rounded-2xl bg-green-400 px-5 py-3 font-black text-black disabled:opacity-40"
              >
                {busy ? <Loader2 className="animate-spin" /> : "Verify Tx"}
              </button>
            </div>
          </div>

          {status && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-gray-300">
              {status}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/[0.04] p-3">
      <p className="text-xs uppercase tracking-wider text-gray-500">{label}</p>
      <p className="mt-1 font-mono text-sm text-white">{value}</p>
    </div>
  );
}
