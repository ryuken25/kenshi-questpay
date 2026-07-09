"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";

const slides = [
  {
    id: 1,
    emoji: "📱",
    title: "DM Chaos",
    description: "Scattered requests across X, Discord, and email. No structure, no clarity, endless back-and-forth.",
    color: "from-red-500/20 to-orange-500/20",
    borderColor: "border-red-500/30",
  },
  {
    id: 2,
    emoji: "📋",
    title: "Clean Brief",
    description: "One structured form. Problem, deadline, expected output. Everything in one place.",
    color: "from-yellow-500/20 to-amber-500/20",
    borderColor: "border-yellow-500/30",
  },
  {
    id: 3,
    emoji: "💳",
    title: "Crypto Checkout",
    description: "Pay micro-commissions in Base Sepolia ETH. No PayPal, no Stripe, no middlemen.",
    color: "from-verse-purple/20 to-verse-blue/20",
    borderColor: "border-verse-purple/30",
  },
  {
    id: 4,
    emoji: "🎫",
    title: "NFT Service Pass",
    description: "Receive an on-chain ERC-1155 token as immutable proof of your commission.",
    color: "from-verse-blue/20 to-cyan-500/20",
    borderColor: "border-verse-blue/30",
  },
  {
    id: 5,
    emoji: "✅",
    title: "Creator Follow-up",
    description: "Brief delivered, work tracked, receipt on-chain. Transparent from start to finish.",
    color: "from-green-500/20 to-emerald-500/20",
    borderColor: "border-green-500/30",
  },
];

export default function PinnedStory() {
  const [active, setActive] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setActive((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const slide = slides[active];

  return (
    <section id="story" className="py-20 relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="font-sora text-3xl sm:text-4xl font-bold text-white mb-4">
            The <span className="gradient-text">Quest</span> Flow
          </h2>
          <p className="text-gray-400 font-inter">From chaos to clarity in five steps</p>
        </motion.div>

        {/* Slide display */}
        <motion.div
          key={slide.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className={`glass-panel rounded-2xl p-8 sm:p-12 bg-gradient-to-br ${slide.color} border ${slide.borderColor} mb-8`}
        >
          <div className="text-center">
            <span className="text-6xl mb-4 block">{slide.emoji}</span>
            <h3 className="font-sora text-2xl font-bold text-white mb-3">
              Step {slide.id}: {slide.title}
            </h3>
            <p className="text-gray-300 text-lg font-inter max-w-md mx-auto">
              {slide.description}
            </p>
          </div>
        </motion.div>

        {/* Step indicators */}
        <div className="flex justify-center gap-3">
          {slides.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setActive(i)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                i === active
                  ? "bg-verse-purple w-8"
                  : "bg-white/20 hover:bg-white/40"
              }`}
            />
          ))}
        </div>

        {/* Step labels */}
        <div className="flex justify-center gap-4 mt-6 flex-wrap">
          {slides.map((s, i) => (
            <span
              key={s.id}
              onClick={() => setActive(i)}
              className={`text-xs font-mono cursor-pointer transition-colors ${
                i === active ? "text-verse-purple" : "text-gray-600"
              }`}
            >
              {s.emoji} {s.title}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
