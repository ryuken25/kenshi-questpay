"use client";
import { useState } from "react";
import { ChevronDown, Wallet } from "lucide-react";
import { useAccount } from "wagmi";
import { shortAddress } from "@/lib/wallet";
import WalletModal from "./WalletModal";

export default function WalletButton() {
  const [open, setOpen] = useState(false);
  const { address, isConnected, chain } = useAccount();
  const wrongChain = isConnected && chain?.id !== 137;
  return <>
    <button type="button" onClick={() => setOpen(true)} className={`inline-flex min-h-11 items-center gap-2 rounded-xl border px-4 text-sm font-bold transition ${wrongChain ? "border-amber-400/40 bg-amber-400/10 text-amber-200" : isConnected ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-100" : "border-verse-purple/30 bg-verse-purple/20 text-white"}`}>
      <Wallet size={16}/><span>{wrongChain ? "Switch to Polygon" : isConnected ? shortAddress(address) : "Connect Wallet"}</span>{isConnected ? <ChevronDown size={14}/> : null}
    </button>
    <WalletModal isOpen={open} onClose={() => setOpen(false)} />
  </>;
}
