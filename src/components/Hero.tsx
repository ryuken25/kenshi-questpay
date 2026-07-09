"use client";

import { motion } from "framer-motion";

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-verse-purple/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-verse-blue/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Text */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-panel text-xs text-verse-purple mb-6 font-mono">
              <span className="w-2 h-2 rounded-full bg-verse-purple animate-pulse" />
              VIBE CODING WITH VERSE — July 2025
            </div>

            <h1 className="font-sora text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              <span className="text-white">Skip the DM Chaos.</span>
              <br />
              <span className="gradient-text">Get a Clean Brief.</span>
              <br />
              <span className="text-white">Pay with Crypto.</span>
            </h1>

            <p className="text-gray-400 text-lg mb-8 max-w-lg font-inter leading-relaxed">
              Micro-commission checkout for creators. Submit a structured brief, pay with Base Sepolia ETH, 
              and receive an NFT Service Pass as proof of your quest.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="#checkout"
                className="px-8 py-3 rounded-xl bg-verse-purple text-white font-sora font-semibold text-sm hover:bg-verse-purple/80 transition-all glow-purple text-center"
              >
                Start Your Quest →
              </a>
              <a
                href="#packages"
                className="px-8 py-3 rounded-xl glass-panel text-gray-300 font-sora font-semibold text-sm hover:border-verse-purple/50 transition-all text-center"
              >
                View Packages
              </a>
            </div>
          </motion.div>

          {/* Right: Animated QuestPass Card */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex justify-center"
          >
            <div className="relative">
              <div className="w-80 h-[420px] rounded-2xl glass-panel-strong glow-purple animate-float p-6 flex flex-col justify-between">
                {/* Card top */}
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="font-sora font-bold text-sm gradient-text">QUESTPASS™</span>
                    <span className="text-xs text-gray-500 font-mono">NFT</span>
                  </div>
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-verse-purple to-verse-blue flex items-center justify-center text-3xl mb-4">
                    ⚔️
                  </div>
                  <h3 className="font-sora text-white text-lg font-semibold mb-1">Service Pass #0001</h3>
                  <p className="text-gray-500 text-xs font-mono">Base Sepolia • ERC-1155</p>
                </div>

                {/* Card details */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-t border-white/5">
                    <span className="text-xs text-gray-500">Package</span>
                    <span className="text-xs text-white font-mono">Standard ⚔️</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-t border-white/5">
                    <span className="text-xs text-gray-500">Price</span>
                    <span className="text-xs text-verse-blue font-mono">0.0003 ETH</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-t border-white/5">
                    <span className="text-xs text-gray-500">Status</span>
                    <span className="text-xs text-green-400 font-mono flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                      Active
                    </span>
                  </div>
                </div>

                {/* Card bottom */}
                <div className="pt-4 border-t border-white/5">
                  <p className="text-[10px] text-gray-600 font-mono truncate">
                    questpay:20250709:a3f8b2c1
                  </p>
                </div>
              </div>

              {/* Glow behind card */}
              <div className="absolute inset-0 -z-10 bg-verse-purple/20 rounded-2xl blur-[60px] scale-110" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
