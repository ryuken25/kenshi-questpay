"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { LayoutDashboard, Menu, Wallet, X } from "lucide-react";
import AuthModal, { type AuthIntent } from "@/components/auth/AuthModal";

const navLinks = [
  { href: "/services", label: "Products" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/#for-creators", label: "For Creators" },
  { href: "/services", label: "Pricing" },
  { href: "/faq", label: "About" },
];

const linkClass = "rounded-xl px-3 py-2 text-sm font-medium text-[var(--qp-text-secondary)] transition-colors hover:bg-[var(--qp-surface)] hover:text-white focus-visible:text-white";

type NavbarProps = {
  authPage?: boolean;
};

export default function Navbar({ authPage = false }: NavbarProps) {
  const [open, setOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [intent, setIntent] = useState<AuthIntent>("signin");

  const openAuth = (nextIntent: AuthIntent) => {
    setIntent(nextIntent);
    setOpen(false);
    setAuthOpen(true);
  };

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="fixed left-0 right-0 top-0 z-50 border-b border-[var(--qp-border-soft)] bg-[rgba(5,6,10,.94)] backdrop-blur-md"
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
              {navLinks.map((link) => <Link key={`${link.href}-${link.label}`} href={link.href} className={linkClass}>{link.label}</Link>)}
              {!authPage ? <button type="button" onClick={() => openAuth("wallet")} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[var(--qp-violet-strong)] px-4 py-2 text-sm font-bold text-white shadow-[0_10px_28px_rgba(96,57,220,.34)] hover:bg-[var(--qp-violet)]"><Wallet size={15} /> Connect Wallet</button> : null}
              {!authPage ? <button type="button" onClick={() => openAuth("signin")} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[var(--qp-border-default)] bg-[var(--qp-surface)] px-3 text-sm font-semibold text-[var(--qp-text-primary)] hover:bg-[var(--qp-surface-hover)]"><LayoutDashboard size={15} /> Sign in</button> : null}
            </div>
            <button type="button" aria-label="Open menu" onClick={() => setOpen(!open)} className="grid size-11 place-items-center rounded-xl border border-[var(--qp-border-soft)] text-[var(--qp-text-primary)] md:hidden">{open ? <X /> : <Menu />}</button>
          </div>
          {open ? (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-2 border-t border-[var(--qp-border-soft)] bg-[var(--qp-bg-elevated)] py-4 md:hidden">
              {navLinks.map((link) => <Link key={`${link.href}-${link.label}`} href={link.href} onClick={() => setOpen(false)} className="block rounded-xl px-3 py-3 text-base font-medium text-[var(--qp-text-secondary)] hover:bg-[var(--qp-surface-hover)] hover:text-white">{link.label}</Link>)}
              {!authPage ? <button type="button" onClick={() => openAuth("wallet")} className="block min-h-12 w-full rounded-xl bg-[var(--qp-violet-strong)] px-3 py-3 text-left text-base font-bold text-white">Connect Wallet</button> : null}
              {!authPage ? <button type="button" onClick={() => openAuth("signin")} className="block min-h-12 w-full rounded-xl px-3 py-3 text-left text-base font-medium text-[var(--qp-text-secondary)] hover:bg-[var(--qp-surface-hover)] hover:text-white">Sign in</button> : null}
              <button type="button" onClick={() => openAuth("creator")} className="block min-h-12 w-full rounded-xl border border-[var(--qp-border-default)] bg-[var(--qp-surface)] px-3 py-3 text-left text-base font-bold text-white">Start Selling</button>
            </motion.div>
          ) : null}
        </div>
      </motion.nav>
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} intent={intent} next={intent === "creator" ? "/studio" : undefined} />
    </>
  );
}
