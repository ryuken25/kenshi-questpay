"use client";

import { motion } from "framer-motion";
import { CheckCircle2, ExternalLink, Copy, FileText } from "lucide-react";
import { APP_CONFIG, PACKAGES } from "@/lib/config";

interface ReceiptData {
  packageId: number;
  buyerAddress: string;
  txHash: string;
  network: string;
  briefId: string;
}

interface ReceiptProps {
  receipt: ReceiptData | null;
}

export default function Receipt({ receipt }: ReceiptProps) {
  if (!receipt) return null;

  const pkg = PACKAGES.find((p) => p.id === receipt.packageId);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <section id="receipt" className="py-20 relative">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="glass-panel-strong rounded-2xl p-8 glow-purple"
        >
          <div className="text-center mb-8">
            <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h2 className="font-sora text-2xl font-bold text-white mb-2">Quest Accepted! ⚔️</h2>
            <p className="text-gray-400 font-inter">Your Service Pass has been minted on-chain.</p>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-white/5">
              <span className="text-sm text-gray-500 font-inter">Package</span>
              <span className="text-sm text-white font-mono">
                {pkg?.emoji} {pkg?.name} — {pkg?.price} ETH
              </span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-white/5">
              <span className="text-sm text-gray-500 font-inter">Buyer</span>
              <span className="text-sm text-white font-mono flex items-center gap-2">
                {receipt.buyerAddress.slice(0, 6)}...{receipt.buyerAddress.slice(-4)}
                <button onClick={() => copyToClipboard(receipt.buyerAddress)}>
                  <Copy className="w-3 h-3 text-gray-500 hover:text-white" />
                </button>
              </span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-white/5">
              <span className="text-sm text-gray-500 font-inter">Tx Hash</span>
              <a
                href={`${APP_CONFIG.blockExplorer}/tx/${receipt.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-verse-blue font-mono flex items-center gap-2 hover:underline"
              >
                {receipt.txHash.slice(0, 10)}...{receipt.txHash.slice(-6)}
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-white/5">
              <span className="text-sm text-gray-500 font-inter">Network</span>
              <span className="text-sm text-white font-mono">{receipt.network}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-white/5">
              <span className="text-sm text-gray-500 font-inter">Brief ID</span>
              <span className="text-sm text-verse-purple font-mono flex items-center gap-2">
                <FileText className="w-3 h-3" />
                {receipt.briefId}
              </span>
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="text-sm text-gray-500 font-inter">Status</span>
              <span className="text-sm text-green-400 font-mono flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                Confirmed
              </span>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-xs text-gray-600 font-inter">
              Save your Brief ID for reference. The creator will follow up via your provided contact method.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
