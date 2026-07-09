"use client";

import { motion } from "framer-motion";
import { PACKAGES } from "@/lib/config";

interface PackagesProps {
  selectedPackage: number | null;
  onSelect: (id: number) => void;
}

export default function Packages({ selectedPackage, onSelect }: PackagesProps) {
  return (
    <section id="packages" className="relative px-4 py-14 sm:px-6 sm:py-18 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }} className="mb-8 text-center sm:mb-12">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-verse-blue">Base Sepolia testnet demo pricing</p>
          <h2 className="section-title mt-3 font-sora font-black text-white">
            Choose a <span className="gradient-text">Service Pass</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-gray-400 sm:text-base">
            Fixed demo packages make scope clear before wallet payment. Pick one, then the checkout form keeps the full brief private.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {PACKAGES.map((pkg, i) => (
            <motion.button
              type="button"
              key={pkg.id}
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: i * 0.04 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelect(pkg.id)}
              className={`min-h-[190px] w-full rounded-[1.5rem] p-5 text-left transition-all duration-300 ${
                selectedPackage === pkg.id
                  ? "glass-panel-strong border-2 border-verse-purple shadow-[0_0_38px_rgba(124,92,255,.22)]"
                  : "glass-panel hover:border-verse-purple/30 hover:bg-white/[0.04]"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="text-4xl">{pkg.emoji}</span>
                <span className="rounded-full bg-verse-blue/10 px-3 py-1 font-mono text-xs font-bold text-verse-blue">{pkg.price} ETH</span>
              </div>
              <h3 className="mt-4 font-sora text-lg font-black text-white">{pkg.name}</h3>
              <p className="mt-3 text-sm leading-6 text-gray-400">{pkg.description}</p>
              <div className="mt-4 flex items-center justify-between text-xs font-bold">
                <span className="text-gray-500">Package #{pkg.id}</span>
                <span className={selectedPackage === pkg.id ? "text-green-400" : "text-verse-purple"}>{selectedPackage === pkg.id ? "✓ Selected" : "Select →"}</span>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  );
}
