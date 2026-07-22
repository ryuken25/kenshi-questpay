"use client";

import { motion, type Variants } from "framer-motion";
import Link from "next/link";
import { ArrowRight, CircleCheck, FileLock2, ReceiptText } from "lucide-react";
import CreatorIntentButton from "@/components/CreatorIntentButton";
import HeroOrbitalScene from "@/components/home/HeroOrbitalScene";
import { Eyebrow } from "@/components/ui";
import { SITE } from "@/lib/site";

const trustItems = [
  { label: "Escrow-protected", icon: CircleCheck },
  { label: "Private briefs", icon: FileLock2 },
  { label: "Public receipt proof", icon: ReceiptText },
];

const heroContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } }
};
const heroItem: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } }
};

export default function PremiumHomeHero() {
  return (
    <section className="qp-home-hero">
      <div className="qp-home-hero__light" />
      <motion.div variants={heroContainer} initial="hidden" animate="show" className="qp-home-hero__grid">
        <motion.div variants={heroItem} className="qp-home-hero__content">
          <Eyebrow verse style={{ marginBottom: 24 }}>Powered by VERSE</Eyebrow>

          <h1 className="qp-hero-title">
            <span className="qp-hero-title__line">Creator services.</span>
            <span className="qp-hero-title__line">Paid with crypto.</span>
            <span className="qp-hero-title__line qp-hero-title__accent">Built for creators.</span>
          </h1>
          <p className="qp-hero-copy">
            Turn a clear brief into a paid, trackable order with on-chain crypto payment, private delivery details, and public on-chain proof.
          </p>

          <div className="qp-hero-actions">
            <Link href="/services" className="qp-button qp-button--primary">
              Explore Services
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <CreatorIntentButton className="qp-button qp-button--secondary" />
          </div>

          <div className="qp-hero-trust">
            {trustItems.map(({ label, icon: Icon }) => (
              <span
                key={label}
                className="qp-hero-trust__item"
                style={{ gap: 8, fontSize: 13, fontWeight: 600, color: "var(--qp-text-muted)" }}
              >
                <Icon className="qp-hero-trust__icon" style={{ width: 15, height: 15 }} aria-hidden="true" />
                {label}
              </span>
            ))}
          </div>
          <p className="qp-community-note qp-community-note--desktop">
            <span className="qp-network-note">Polygon live · BNB Chain staged behind payment gate · USDT, USDC, VERSE &amp; POL</span><br />
            {SITE.disclaimer}
          </p>
        </motion.div>

        <motion.div variants={heroItem} className="qp-home-hero__visual">
          <HeroOrbitalScene variant="home" />
        </motion.div>
        <motion.p variants={heroItem} className="qp-community-note qp-community-note--mobile">
          <span className="qp-network-note">Polygon live · BNB Chain staged behind payment gate · USDT, USDC, VERSE &amp; POL</span><br />
          {SITE.disclaimer}
        </motion.p>
      </motion.div>
    </section>
  );
}
