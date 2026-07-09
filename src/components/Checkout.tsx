"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useAccount, useConnect, useWriteContract, useWaitForTransactionReceipt, injected } from "wagmi";
import { parseEther } from "viem";
import { Loader2, Wallet, Shield, Send } from "lucide-react";
import { PACKAGES, APP_CONFIG, CONTRACT_ABI } from "@/lib/config";
import { briefSchema, type BriefFormData } from "@/lib/schemas";

interface CheckoutProps {
  selectedPackage: number | null;
  onTxSuccess: (receipt: {
    packageId: number;
    buyerAddress: string;
    txHash: string;
    network: string;
    briefId: string;
  }) => void;
}

export default function Checkout({ selectedPackage, onTxSuccess }: CheckoutProps) {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { writeContract, data: txHash, isPending, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  const [form, setForm] = useState<BriefFormData>({
    handle: "",
    contactMethod: "",
    contactValue: "",
    projectLink: "",
    packageId: selectedPackage || 1,
    deadline: "",
    mainProblem: "",
    expectedOutput: "",
    refLinks: "",
    notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [briefId, setBriefId] = useState<string>("");

  useEffect(() => {
    if (selectedPackage) {
      setForm((prev) => ({ ...prev, packageId: selectedPackage }));
    }
  }, [selectedPackage]);

  useEffect(() => {
    if (isSuccess && txHash) {
      const pkg = PACKAGES.find((p) => p.id === form.packageId);
      onTxSuccess({
        packageId: form.packageId,
        buyerAddress: address || "",
        txHash,
        network: APP_CONFIG.chainName,
        briefId: briefId,
      });
    }
  }, [isSuccess, txHash]);

  const generateBriefId = useCallback((handle: string, problem: string) => {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
    const data = `${handle}:${problem}:${Date.now()}`;
    // Simple hash for display
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    const shortHash = Math.abs(hash).toString(16).slice(0, 8).padStart(8, "0");
    return `questpay:${dateStr}:${shortHash}`;
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = briefSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const key = issue.path[0] as string;
        fieldErrors[key] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    const id = generateBriefId(form.handle, form.mainProblem);
    setBriefId(id);

    const pkg = PACKAGES.find((p) => p.id === form.packageId);
    if (!pkg) return;

    // Hash the brief ID for on-chain storage
    const encoder = new TextEncoder();
    const data = encoder.encode(id);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const briefHash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

    writeContract({
      address: APP_CONFIG.contractAddress,
      abi: CONTRACT_ABI,
      functionName: "buyPass",
      args: [BigInt(form.packageId), briefHash],
      value: pkg.priceWei,
    });
  };

  const updateField = (field: keyof BriefFormData, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  return (
    <section id="checkout" className="py-20 relative">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8 sm:mb-12"
        >
          <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-verse-blue">Package → Brief → Wallet → Receipt</p>
          <h2 className="font-sora text-3xl sm:text-4xl font-bold text-white mb-4 mt-3">
            <span className="gradient-text">Checkout</span> Desk
          </h2>
          <p className="text-gray-400 font-inter">Fill your brief, connect wallet, and pay on Base Sepolia.</p>
          <div className="mt-5 grid grid-cols-4 gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-2 text-[10px] font-bold text-gray-400 sm:text-xs">
            {['Package','Brief','Wallet','Receipt'].map((step, i) => <span key={step} className="rounded-xl bg-black/20 px-2 py-2">{i + 1}. {step}</span>)}
          </div>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          onSubmit={handleSubmit}
          className="glass-panel rounded-2xl p-6 sm:p-8 space-y-6"
        >
          {/* Contact Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1 font-inter">
                Name / Handle <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.handle}
                onChange={(e) => updateField("handle", e.target.value)}
                placeholder="e.g., @ryuken"
                className="w-full px-4 py-3 rounded-xl bg-base-lighter border border-white/5 text-white placeholder-gray-600 focus:border-verse-purple/50 focus:outline-none transition-colors font-inter text-sm"
              />
              {errors.handle && <p className="text-red-400 text-xs mt-1">{errors.handle}</p>}
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1 font-inter">
                Contact Method <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.contactMethod}
                onChange={(e) => updateField("contactMethod", e.target.value)}
                placeholder="e.g., Discord, X DM, Email"
                className="w-full px-4 py-3 rounded-xl bg-base-lighter border border-white/5 text-white placeholder-gray-600 focus:border-verse-purple/50 focus:outline-none transition-colors font-inter text-sm"
              />
              {errors.contactMethod && <p className="text-red-400 text-xs mt-1">{errors.contactMethod}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1 font-inter">
              Contact Value <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.contactValue}
              onChange={(e) => updateField("contactValue", e.target.value)}
              placeholder="e.g., user#1234, @handle, email@example.com"
              className="w-full px-4 py-3 rounded-xl bg-base-lighter border border-white/5 text-white placeholder-gray-600 focus:border-verse-purple/50 focus:outline-none transition-colors font-inter text-sm"
            />
            {errors.contactValue && <p className="text-red-400 text-xs mt-1">{errors.contactValue}</p>}
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1 font-inter">Project Link</label>
            <input
              type="text"
              value={form.projectLink || ""}
              onChange={(e) => updateField("projectLink", e.target.value)}
              placeholder="https://..."
              className="w-full px-4 py-3 rounded-xl bg-base-lighter border border-white/5 text-white placeholder-gray-600 focus:border-verse-purple/50 focus:outline-none transition-colors font-inter text-sm"
            />
          </div>

          {/* Package Selection */}
          <div>
            <label className="block text-sm text-gray-400 mb-2 font-inter">
              Package <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {PACKAGES.map((pkg) => (
                <button
                  key={pkg.id}
                  type="button"
                  onClick={() => updateField("packageId", pkg.id)}
                  className={`min-h-14 rounded-xl px-3 py-3 text-left transition-all text-xs font-mono ${
                    form.packageId === pkg.id
                      ? "bg-verse-purple/30 border border-verse-purple text-white"
                      : "bg-base-lighter border border-white/5 text-gray-500 hover:border-verse-purple/30"
                  }`}
                >
                  <span className="block text-lg mb-1">{pkg.emoji}</span>
                  {pkg.price}
                </button>
              ))}
            </div>
            {errors.packageId && <p className="text-red-400 text-xs mt-1">{errors.packageId}</p>}
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1 font-inter">Deadline</label>
            <input
              type="text"
              value={form.deadline || ""}
              onChange={(e) => updateField("deadline", e.target.value)}
              placeholder="e.g., 3 days, next Friday, ASAP"
              className="w-full px-4 py-3 rounded-xl bg-base-lighter border border-white/5 text-white placeholder-gray-600 focus:border-verse-purple/50 focus:outline-none transition-colors font-inter text-sm"
            />
          </div>

          {/* Main Problem */}
          <div>
            <label className="block text-sm text-gray-400 mb-1 font-inter">
              Main Problem / Request <span className="text-red-400">*</span>
            </label>
            <textarea
              value={form.mainProblem}
              onChange={(e) => updateField("mainProblem", e.target.value)}
              placeholder="Describe what you need help with..."
              rows={4}
              className="w-full px-4 py-3 rounded-xl bg-base-lighter border border-white/5 text-white placeholder-gray-600 focus:border-verse-purple/50 focus:outline-none transition-colors font-inter text-sm resize-none"
            />
            {errors.mainProblem && <p className="text-red-400 text-xs mt-1">{errors.mainProblem}</p>}
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1 font-inter">Expected Output</label>
            <textarea
              value={form.expectedOutput || ""}
              onChange={(e) => updateField("expectedOutput", e.target.value)}
              placeholder="What should the deliverable look like?"
              rows={2}
              className="w-full px-4 py-3 rounded-xl bg-base-lighter border border-white/5 text-white placeholder-gray-600 focus:border-verse-purple/50 focus:outline-none transition-colors font-inter text-sm resize-none"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1 font-inter">Reference Links</label>
            <input
              type="text"
              value={form.refLinks || ""}
              onChange={(e) => updateField("refLinks", e.target.value)}
              placeholder="Any reference URLs..."
              className="w-full px-4 py-3 rounded-xl bg-base-lighter border border-white/5 text-white placeholder-gray-600 focus:border-verse-purple/50 focus:outline-none transition-colors font-inter text-sm"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1 font-inter">Additional Notes</label>
            <textarea
              value={form.notes || ""}
              onChange={(e) => updateField("notes", e.target.value)}
              placeholder="Anything else..."
              rows={2}
              className="w-full px-4 py-3 rounded-xl bg-base-lighter border border-white/5 text-white placeholder-gray-600 focus:border-verse-purple/50 focus:outline-none transition-colors font-inter text-sm resize-none"
            />
          </div>

          {/* Privacy notice */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-verse-purple/5 border border-verse-purple/10">
            <Shield className="w-5 h-5 text-verse-purple flex-shrink-0 mt-0.5" />
            <p className="text-xs text-gray-400 font-inter">
              <strong className="text-white">Privacy:</strong> Your brief is never stored on-chain. 
              Only a SHA-256 hash is sent to the contract. The full brief stays between you and the creator.
            </p>
          </div>

          {/* Wallet + Submit */}
          <div className="space-y-4">
            {!isConnected ? (
              <button
                type="button"
                onClick={() => connect({ connector: injected() })}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-verse-purple to-verse-blue text-white font-sora font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
              >
                <Wallet className="w-5 h-5" />
                Connect Wallet
              </button>
            ) : (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-sm text-green-400 font-mono">
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </span>
              </div>
            )}

            {isConnected && (
              <button
                type="submit"
                disabled={isPending || isConfirming || !APP_CONFIG.contractAddress}
                className="w-full py-4 rounded-xl bg-verse-purple text-white font-sora font-semibold flex items-center justify-center gap-2 hover:bg-verse-purple/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed glow-purple"
              >
                {isPending || isConfirming ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {isPending ? "Confirm in Wallet..." : "Confirming..."}
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Pay {PACKAGES.find((p) => p.id === form.packageId)?.price} ETH & Submit
                  </>
                )}
              </button>
            )}

            {!APP_CONFIG.contractAddress && isConnected && (
              <p className="text-xs text-yellow-400 text-center font-inter">
                ⚠️ Contract not deployed yet. Deploy first, then set NEXT_PUBLIC_KENSHI_SERVICE_PASS_ADDRESS.
              </p>
            )}

            {writeError && (
              <p className="text-xs text-red-400 text-center font-inter">
                Error: {writeError.message.slice(0, 100)}
              </p>
            )}
          </div>
        </motion.form>
      </div>
    </section>
  );
}
