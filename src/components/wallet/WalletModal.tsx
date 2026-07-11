"use client";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Copy, ExternalLink, LogOut, ShieldCheck, X } from "lucide-react";
import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { polygon } from "wagmi/chains";
import { polygonScanAddress, shortAddress } from "@/lib/wallet";

export default function WalletModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { address, isConnected, chain } = useAccount();
  const { connectors, connect, error, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: switching } = useSwitchChain();
  useEffect(() => {
    if (!isOpen) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    const prev = document.body.style.overflow; document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", esc); document.body.style.overflow = prev; };
  }, [isOpen, onClose]);
  if (!isOpen || typeof document === "undefined") return null;
  return createPortal(<div className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/70 p-0 backdrop-blur-lg sm:items-center sm:p-4" onClick={(e)=>{ if(e.target===e.currentTarget) onClose(); }}>
    <div role="dialog" aria-modal="true" aria-label="Wallet connection" className="max-h-[88dvh] w-full overflow-y-auto rounded-t-3xl border border-white/10 bg-[#0d1224] p-5 text-white shadow-2xl sm:max-w-md sm:rounded-3xl sm:p-6">
      <div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#8FEAFF]">Polygon wallet</p><h2 className="mt-1 text-xl font-black">Connect Wallet</h2></div><button type="button" onClick={onClose} className="rounded-xl bg-white/10 p-2"><X size={18}/></button></div>
      <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-sm text-emerald-100"><ShieldCheck className="mr-2 inline" size={16}/>QuestPay will never ask for your seed phrase. Payments run only on Polygon.</div>
      {isConnected && address ? <div className="mt-5 space-y-3">
        <div className="rounded-2xl border border-white/10 bg-[var(--qp-surface)] p-4"><p className="text-xs text-muted">Connected wallet</p><p className="mt-1 font-mono text-sm">{shortAddress(address, 6)}</p><p className="mt-2 text-xs text-muted">Network: <span className={chain?.id===137 ? "text-emerald-300" : "text-amber-300"}>{chain?.id===137 ? "Polygon" : chain?.name || "Wrong network"}</span></p></div>
        {chain?.id !== 137 ? <button type="button" disabled={switching} onClick={() => switchChain({ chainId: polygon.id })} className="min-h-11 w-full rounded-xl bg-amber-400 px-4 font-black text-black">{switching ? "Switching..." : "Switch to Polygon"}</button> : null}
        <div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => navigator.clipboard.writeText(address)} className="min-h-11 rounded-xl bg-white/10 px-3 text-sm"><Copy className="mr-1 inline" size={14}/>Copy</button><a href={polygonScanAddress(address)} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-white/10 px-3 text-sm"><ExternalLink className="mr-1" size={14}/>Polygonscan</a></div>
        <button type="button" onClick={() => { disconnect(); onClose(); }} className="min-h-11 w-full rounded-xl border border-red-400/30 bg-red-400/10 px-4 font-bold text-red-100"><LogOut className="mr-2 inline" size={16}/>Disconnect</button>
      </div> : <div className="mt-5 space-y-3">
        <p className="text-sm font-bold text-secondary">Installed wallets</p>
        {connectors.map((connector) => <button key={connector.uid} type="button" disabled={isPending} onClick={() => connect({ connector, chainId: 137 })} className="flex min-h-12 w-full items-center justify-between rounded-2xl border border-white/10 bg-[var(--qp-surface)] px-4 text-left font-bold hover:bg-white/[0.08]"><span>{connector.name}</span><span className="text-xs text-muted">Polygon</span></button>)}
        <p className="pt-2 text-xs leading-5 text-muted">Mobile wallet / QR is available when WalletConnect project ID is configured.</p>
        {error ? <p className="rounded-xl border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-100">{error.message}</p> : null}
      </div>}
    </div>
  </div>, document.body);
}
