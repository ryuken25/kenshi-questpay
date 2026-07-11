"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, User } from "lucide-react";
import AuthModal, { type AuthIntent } from "@/components/auth/AuthModal";

const navLinks = [
  { href: "/services", label: "Products" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/#for-creators", label: "For Creators" },
  { href: "/services", label: "Pricing" },
  { href: "/faq", label: "About" },
];

const linkClass = "text-[13px] font-medium tracking-[-.01em] text-[#b8b8c7] transition-colors hover:text-white focus-visible:text-white";
const signInClass = "min-h-[42px] items-center rounded-[14px] border border-white/[.11] bg-white/[.03] px-[17px] text-[13px] font-semibold text-[#f5f4fa] transition-colors hover:border-[#a07aff]/40 hover:bg-white/[.06]";
const startSellingClass = "min-h-[42px] items-center rounded-[14px] border border-[#b89eff]/25 bg-[linear-gradient(180deg,#8a5cff_0%,#6c3ee8_100%)] px-[19px] text-[13px] font-bold text-white shadow-[0_10px_28px_rgba(100,56,220,.30),inset_0_1px_0_rgba(255,255,255,.18)] transition-transform hover:-translate-y-px";

type NavbarProps = {
  authPage?: boolean;
};

type SessionState = { authenticated: boolean; roles: string[] } | null;

export default function Navbar({ authPage = false }: NavbarProps) {
  const [open, setOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [intent, setIntent] = useState<AuthIntent>("signin");
  const [session, setSession] = useState<SessionState>(null);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((d) => setSession({ authenticated: Boolean(d.authenticated), roles: d.roles ?? [] }))
      .catch(() => setSession({ authenticated: false, roles: [] }));
  }, []);

  const openAuth = (nextIntent: AuthIntent) => {
    setIntent(nextIntent);
    setOpen(false);
    setAuthOpen(true);
  };

  const isAuthenticated = session?.authenticated ?? false;

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="fixed left-0 right-0 top-0 z-50 border-b border-[rgba(130,98,255,.10)] bg-[rgba(5,6,10,.82)] backdrop-blur-[18px] backdrop-saturate-150"
        role="navigation"
        aria-label="Primary navigation"
      >
        <div className="mx-auto w-[min(100%_-_40px,1440px)]">
          <div className="grid h-[72px] grid-cols-[auto_1fr_auto] items-center gap-4 sm:gap-8">
            <Link href="/" className="flex items-center gap-2 font-sora text-xl font-bold text-white">
              <Image src="/brand/questpay/questpay-mark.svg" alt="QuestPay" width={28} height={28} />
              <span>QuestPay</span>
            </Link>
            <div className="hidden items-center justify-center gap-[clamp(20px,2.1vw,34px)] md:flex">
              {navLinks.map((link) => <Link key={`${link.href}-${link.label}`} href={link.href} className={linkClass}>{link.label}</Link>)}
            </div>
            <div className="flex items-center justify-self-end gap-2.5">
              {!authPage && !isAuthenticated ? (
                <>
                  <button type="button" onClick={() => openAuth("signin")} className={`hidden md:inline-flex ${signInClass}`}>Sign In</button>
                  <button type="button" onClick={() => openAuth("creator")} className={`hidden md:inline-flex ${startSellingClass}`}>Start Selling</button>
                </>
              ) : null}
              {!authPage && isAuthenticated ? (
                <Link href="/account" className={`hidden md:inline-flex items-center gap-2 ${signInClass}`}>
                  <User size={15} /> Account
                </Link>
              ) : null}
              <button type="button" aria-label="Open menu" onClick={() => setOpen(!open)} className="grid size-11 place-items-center rounded-xl border border-[var(--qp-border-soft)] text-[var(--qp-text-primary)] md:hidden">{open ? <X /> : <Menu />}</button>
            </div>
          </div>
          {open ? (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-2 border-t border-[var(--qp-border-soft)] bg-[var(--qp-bg-elevated)] py-4 md:hidden">
              {navLinks.map((link) => <Link key={`${link.href}-${link.label}`} href={link.href} onClick={() => setOpen(false)} className="block rounded-xl px-3 py-3 text-base font-medium text-[var(--qp-text-secondary)] hover:bg-[var(--qp-surface-hover)] hover:text-white">{link.label}</Link>)}
              {!authPage && !isAuthenticated ? (
                <>
                  <button type="button" onClick={() => openAuth("signin")} className="block min-h-12 w-full rounded-xl border border-white/[.11] bg-white/[.03] px-3 py-3 text-left text-base font-semibold text-[var(--qp-text-primary)] hover:bg-[var(--qp-surface-hover)] hover:text-white">Sign In</button>
                  <button type="button" onClick={() => openAuth("creator")} className="block min-h-12 w-full rounded-xl border border-[#b89eff]/25 bg-[linear-gradient(180deg,#8a5cff_0%,#6c3ee8_100%)] px-3 py-3 text-left text-base font-bold text-white shadow-[0_10px_28px_rgba(100,56,220,.30),inset_0_1px_0_rgba(255,255,255,.18)]">Start Selling</button>
                </>
              ) : null}
              {!authPage && isAuthenticated ? (
                <Link href="/account" onClick={() => setOpen(false)} className="block min-h-12 w-full rounded-xl border border-white/[.11] bg-white/[.03] px-3 py-3 text-left text-base font-semibold text-[var(--qp-text-primary)]">Account</Link>
              ) : null}
            </motion.div>
          ) : null}
        </div>
      </motion.nav>
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} intent={intent} next={intent === "creator" ? "/studio" : undefined} />
    </>
  );
}
