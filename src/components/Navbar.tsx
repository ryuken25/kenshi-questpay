"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { LayoutDashboard, Menu, X } from "lucide-react";
import WalletButton from "@/components/wallet/WalletButton";

const navLinks = [
  { href: "/services", label: "Services" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/verify", label: "Receipts" },
  { href: "/faq", label: "FAQ" },
];

const linkClass = "rounded-xl px-3 py-2 text-sm font-medium text-[var(--qp-text-secondary)] transition-colors hover:bg-[var(--qp-surface)] hover:text-white focus-visible:text-white";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="fixed left-0 right-0 top-0 z-50 border-b border-[var(--qp-border-soft)] bg-[rgba(8,11,24,.96)] backdrop-blur-md"
      role="navigation"
      aria-label="Primary navigation"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2 font-sora text-xl font-bold text-white">
            <Image src="/brand/questpay/questpay-mark.svg" alt="QuestPay" width={28} height={28} />
            <span>QuestPay</span>
          </Link>
          <div className="hidden items-center gap-2 md:flex">
            {navLinks.map((link) => <Link key={link.href} href={link.href} className={linkClass}>{link.label}</Link>)}
            <WalletButton />
            <Link href="/sign-in" className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[var(--qp-border-default)] bg-[var(--qp-surface)] px-3 text-sm font-semibold text-[var(--qp-text-primary)] hover:bg-[var(--qp-surface-hover)]"><LayoutDashboard size={15} />Sign in</Link>
            <Link href="/services" className="inline-flex min-h-10 items-center rounded-xl bg-[var(--qp-violet-strong)] px-4 py-2 text-sm font-bold text-white hover:bg-[var(--qp-violet)]">Start an Order</Link>
          </div>
          <button type="button" aria-label="Open menu" onClick={() => setOpen(!open)} className="rounded-xl border border-[var(--qp-border-soft)] p-2 text-[var(--qp-text-primary)] md:hidden">{open ? <X /> : <Menu />}</button>
        </div>
        {open ? (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-2 border-t border-[var(--qp-border-soft)] bg-[var(--qp-bg-elevated)] py-4 md:hidden">
            {navLinks.map((link) => <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className="block rounded-xl px-3 py-3 text-base font-medium text-[var(--qp-text-secondary)] hover:bg-[var(--qp-surface-hover)] hover:text-white">{link.label}</Link>)}
            <div className="px-3 py-2"><WalletButton /></div>
            <Link href="/sign-in" onClick={() => setOpen(false)} className="block rounded-xl px-3 py-3 text-base font-medium text-[var(--qp-text-secondary)] hover:bg-[var(--qp-surface-hover)] hover:text-white">Sign in</Link>
            <Link href="/services" onClick={() => setOpen(false)} className="block rounded-xl bg-[var(--qp-violet-strong)] px-3 py-3 text-center text-base font-bold text-white">Start an Order</Link>
          </motion.div>
        ) : null}
      </div>
    </motion.nav>
  );
}
