"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { CircleCheck, FileLock2, ReceiptText } from "lucide-react";
import CreatorIntentButton from "@/components/CreatorIntentButton";
import HeroOrbitalScene from "@/components/home/HeroOrbitalScene";
import { SITE } from "@/lib/site";

const trustItems = [
  { label: "Direct creator pay", icon: CircleCheck },
  { label: "Private briefs", icon: FileLock2 },
  { label: "Public receipt proof", icon: ReceiptText },
];

export default function PremiumHomeHero() {
  return (
    <section className="qp-home-hero">
      <div className="qp-home-hero__light" />
      <div className="qp-home-hero__grid">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }} className="qp-home-hero__content">
          <div className="qp-powered-badge">
            <Image src="/brand/verse/verse-v-glow.svg" alt="" width={12} height={11} />
            <span>Powered by VERSE</span>
          </div>

          <h1 className="qp-hero-title">
            <span className="qp-hero-title__line">Creator services.</span>
            <span className="qp-hero-title__line">Paid with crypto.</span>
            <span className="qp-hero-title__line qp-hero-title__accent">Built for creators.</span>
          </h1>
          <p className="qp-hero-copy">
            Turn a clear brief into a paid, trackable order with direct crypto payment, private delivery details, and public on-chain proof.
          </p>

          <div className="qp-hero-actions">
            <Link href="/services" className="qp-button qp-button--primary">Explore Services</Link>
            <CreatorIntentButton className="qp-button qp-button--secondary" />
          </div>

          <div className="qp-hero-trust">
            {trustItems.map(({ label, icon: Icon }) => (
              <span key={label} className="qp-hero-trust__item"><Icon className="qp-hero-trust__icon" aria-hidden="true" />{label}</span>
            ))}
          </div>
          <p className="qp-community-note qp-community-note--desktop">
            <span className="qp-network-note">Polygon live · BNB Chain staged behind payment gate · USDT, USDC, VERSE &amp; POL</span><br />
            {SITE.disclaimer}
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.55 }} className="qp-home-hero__visual">
          <HeroOrbitalScene variant="home" />
        </motion.div>
        <p className="qp-community-note qp-community-note--mobile">
          <span className="qp-network-note">Polygon live · BNB Chain staged behind payment gate · USDT, USDC, VERSE &amp; POL</span><br />
          {SITE.disclaimer}
        </p>
      </div>
    </section>
  );
}
