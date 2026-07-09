"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    q: "What is QuestPay?",
    a: "QuestPay is a micro-commission checkout desk for creators. Instead of chaotic DMs and unclear requests, you submit a structured brief and pay with crypto. You receive an NFT Service Pass as on-chain proof of your commission.",
  },
  {
    q: "Why crypto? Why not PayPal or Stripe?",
    a: "Micro-commissions (under $5) are impractical with traditional payment processors due to fees. Crypto on Base Sepolia enables near-zero fee payments with transparent, immutable receipts.",
  },
  {
    q: "What is a Service Pass?",
    a: "An ERC-1155 NFT token minted to your wallet when you pay. It serves as immutable, on-chain proof that you submitted a commission. It's your receipt, but on the blockchain.",
  },
  {
    q: "Is my brief stored on-chain?",
    a: "No. Only a SHA-256 hash of your brief ID is stored on-chain. The full brief content stays private between you and the creator. We take privacy seriously.",
  },
  {
    q: "What network is this on?",
    a: "Base Sepolia — a Layer 2 testnet. This is for demo/contest purposes. In production, it would run on Base mainnet.",
  },
  {
    q: "Can I get a refund?",
    a: "Contact the creator directly via your provided contact method. The on-chain transaction is immutable, but the creator can process off-chain refunds.",
  },
  {
    q: "Do I need a wallet?",
    a: "Yes, you need a browser wallet like MetaMask or Rabby connected to Base Sepolia. The checkout will prompt you to connect if you haven't already.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="py-20 relative">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="font-sora text-3xl sm:text-4xl font-bold text-white mb-4">
            <span className="gradient-text">FAQ</span>
          </h2>
          <p className="text-gray-400 font-inter">Common questions, straight answers</p>
        </motion.div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="glass-panel rounded-xl overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full px-6 py-4 flex items-center justify-between text-left"
              >
                <span className="text-sm text-white font-inter font-medium">{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-gray-500 transition-transform ${
                    openIndex === i ? "rotate-180" : ""
                  }`}
                />
              </button>
              {openIndex === i && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-6 pb-4"
                >
                  <p className="text-sm text-gray-400 font-inter leading-relaxed">{faq.a}</p>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
