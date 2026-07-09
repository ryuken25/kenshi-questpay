"use client";

import { motion } from "framer-motion";
import { PACKAGES } from "@/lib/config";

interface PackagesProps {
  selectedPackage: number | null;
  onSelect: (id: number) => void;
}

export default function Packages({ selectedPackage, onSelect }: PackagesProps) {
  return (
    <section id="packages" className="py-20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="font-sora text-3xl sm:text-4xl font-bold text-white mb-4">
            Choose Your <span className="gradient-text">Quest</span>
          </h2>
          <p className="text-gray-400 font-inter max-w-lg mx-auto">
            Micro-commissions at transparent, fixed prices. Pick the package that fits your quest.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {PACKAGES.map((pkg, i) => (
            <motion.div
              key={pkg.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              onClick={() => onSelect(pkg.id)}
              className={`cursor-pointer rounded-2xl p-6 transition-all duration-300 ${
                selectedPackage === pkg.id
                  ? "glass-panel-strong border-2 border-verse-purple glow-purple scale-105"
                  : "glass-panel hover:border-verse-purple/30 hover:scale-102"
              }`}
            >
              <span className="text-4xl mb-4 block">{pkg.emoji}</span>
              <h3 className="font-sora text-lg font-bold text-white mb-1">{pkg.name}</h3>
              <p className="text-verse-blue font-mono text-lg font-semibold mb-2">
                {pkg.price} ETH
              </p>
              <p className="text-gray-500 text-sm font-inter">{pkg.description}</p>
              {selectedPackage === pkg.id && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-3 text-xs text-verse-purple font-mono text-center"
                >
                  ✓ Selected
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
