"use client";

import { useEffect, useState, type MouseEvent } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, User } from "lucide-react";
import AuthModal, { type AuthIntent } from "@/components/auth/AuthModal";

const navLinks = [
  { href: "/services", label: "Products" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/for-creators", label: "For Creators" },
  { href: "/services#pricing", label: "Pricing" },
  { href: "/#about", label: "About" },
];

const linkClass = "qp-navbar__link";
const signInClass = "qp-button-nav-secondary";
const startSellingClass = "qp-button-nav-primary";

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

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const openAuth = (nextIntent: AuthIntent) => {
    setIntent(nextIntent);
    setOpen(false);
    setAuthOpen(true);
  };

  const handleNavClick = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
    setOpen(false);
    if (href !== "/how-it-works" || window.location.pathname !== "/how-it-works") return;
    event.preventDefault();
    window.history.replaceState(null, "", "/how-it-works");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const isAuthenticated = session?.authenticated ?? false;
  const isCreator = session?.roles.includes("creator") ?? false;
  const creatorDestination = isCreator ? "/studio" : "/onboarding?next=/studio";
  const creatorLabel = isCreator ? "Creator Studio" : "Start Selling";

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="qp-navbar"
        role="navigation"
        aria-label="Primary navigation"
      >
        <div className="qp-navbar__inner">
          <div className="contents">
            <Link href="/" className="flex min-h-11 items-center" aria-label="QuestPay home">
              <Image src="/brand/questpay/questpay-logo-horizontal.svg" alt="QuestPay" width={124} height={28} priority className="h-7 w-auto" />
            </Link>
            <div className="qp-navbar__links hidden md:flex">
              {navLinks.map((link) => <Link key={`${link.href}-${link.label}`} href={link.href} scroll onClick={(event) => handleNavClick(event, link.href)} className={linkClass}>{link.label}</Link>)}
            </div>
            <div className="flex items-center justify-self-end gap-2.5">
              {!authPage && !isAuthenticated ? (
                <>
                  <button type="button" aria-haspopup="dialog" onClick={() => openAuth("signin")} className={`hidden md:inline-flex ${signInClass}`}>Sign In</button>
                  <button type="button" aria-haspopup="dialog" onClick={() => openAuth("creator")} className={`hidden md:inline-flex ${startSellingClass}`}>Start Selling</button>
                </>
              ) : null}
              {!authPage && isAuthenticated ? (
                <>
                  <Link href="/account" className={`hidden md:inline-flex items-center gap-2 ${signInClass}`}><User size={15} /> Account</Link>
                  <Link href={creatorDestination} className={`hidden md:inline-flex ${startSellingClass}`}>{creatorLabel}</Link>
                </>
              ) : null}
              <button type="button" aria-label="Open menu" onClick={() => setOpen(!open)} className="grid size-11 place-items-center rounded-xl border border-[var(--qp-border-soft)] text-[var(--qp-text-primary)] md:hidden">{open ? <X /> : <Menu />}</button>
            </div>
          </div>
          {open ? (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="qp-navbar__mobile-menu space-y-2 border-t border-[var(--qp-border-soft)] bg-[var(--qp-bg-elevated)] py-4 md:hidden">
              {navLinks.map((link) => <Link key={`${link.href}-${link.label}`} href={link.href} scroll onClick={(event) => handleNavClick(event, link.href)} className="block min-h-12 rounded-xl px-3 py-3 text-base font-medium text-[var(--qp-text-secondary)] hover:bg-[var(--qp-surface-hover)] hover:text-white">{link.label}</Link>)}
              {!authPage && !isAuthenticated ? (
                <>
                  <button type="button" aria-haspopup="dialog" onClick={() => openAuth("signin")} className="block min-h-12 w-full rounded-xl border border-white/[.11] bg-white/[.03] px-3 py-3 text-left text-base font-semibold text-[var(--qp-text-primary)] hover:bg-[var(--qp-surface-hover)] hover:text-white">Sign In</button>
                  <button type="button" aria-haspopup="dialog" onClick={() => openAuth("creator")} className="block min-h-12 w-full rounded-xl border border-[#b89eff]/25 bg-[linear-gradient(180deg,#8a5cff_0%,#6c3ee8_100%)] px-3 py-3 text-left text-base font-bold text-white shadow-[0_10px_28px_rgba(100,56,220,.30),inset_0_1px_0_rgba(255,255,255,.18)]">Start Selling</button>
                </>
              ) : null}
              {!authPage && isAuthenticated ? (
                <>
                  <Link href="/account" onClick={() => setOpen(false)} className="block min-h-12 w-full rounded-xl border border-white/[.11] bg-white/[.03] px-3 py-3 text-left text-base font-semibold text-[var(--qp-text-primary)]">Account</Link>
                  <Link href={creatorDestination} onClick={() => setOpen(false)} className="block min-h-12 w-full rounded-xl border border-[#b89eff]/25 bg-[linear-gradient(180deg,#8a5cff_0%,#6c3ee8_100%)] px-3 py-3 text-left text-base font-bold text-white">{creatorLabel}</Link>
                </>
              ) : null}
            </motion.div>
          ) : null}
        </div>
      </motion.nav>
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} intent={intent} next={intent === "creator" ? "/studio" : undefined} />
    </>
  );
}
