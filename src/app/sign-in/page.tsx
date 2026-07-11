"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { AlertCircle, ArrowRight, CheckCircle2, Fingerprint, Link2, Loader2, Mail, ShieldCheck, Wallet } from "lucide-react";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Web3Provider } from "@/components/Web3Provider";

const flowSteps = [
  { title: "Connect", body: "Use wallet, Google, or secure email.", icon: Wallet },
  { title: "Link", body: "Optional: bind identities into one account.", icon: Link2 },
  { title: "Access", body: "Open orders, receipts, deliveries, or admin tools.", icon: Fingerprint },
];

const roles = [
  { title: "Creator admin", items: ["Manage products", "View orders", "Deliver work", "Analytics"] },
  { title: "Buyer", items: ["Buy services", "Track orders", "Open receipts", "Review delivery"] },
];

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--qp-bg)]" />}>
      <SignInContent />
    </Suspense>
  );
}

function SignInContent() {
  const router = useRouter();
  const params = useSearchParams();
  const error = params.get("error");
  const next = params.get("next");
  const [email, setEmail] = useState("");
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [walletLoading, setWalletLoading] = useState(false);
  const [googleAvailable, setGoogleAvailable] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/health/auth").then((r) => r.json()).then((d) => {
      setGoogleAvailable(d.providers?.googleConfigured ?? true);
    }).catch(() => {});
  }, []);

  const errorMessages: Record<string, string> = {
    provider_not_enabled: "Google sign-in is not configured yet. Use wallet or email instead.",
    oauth_callback_failed: "Google sign-in could not be completed. Please try again.",
    no_verified_email: "No verified email was returned. Please try a different method.",
    account_creation_failed: "Could not create your account. Please try again.",
    no_wallet: "No wallet was detected. Install MetaMask, Rabby, OKX, Coinbase Wallet, or use WalletConnect.",
  };

  const handleGoogle = () => {
    setBusy(true);
    router.push(`/api/auth/oauth${next ? `?next=${encodeURIComponent(next)}` : ""}`);
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: email.trim(), next }),
      });
      if (res.ok) setMagicLinkSent(true);
    } catch {
      setMagicLinkSent(true);
    }
    setBusy(false);
  };

  const handleWalletSignIn = async () => {
    setWalletLoading(true);
    try {
      if (!window.ethereum) {
        router.push("/sign-in?error=no_wallet");
        return;
      }
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      if (!accounts?.length) return;
      const address = accounts[0];

      const nonceRes = await fetch("/api/auth/wallet/nonce", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ address }),
      });
      const nonceData = await nonceRes.json();
      if (!nonceData.ok) return;

      const signature = await window.ethereum.request({
        method: "personal_sign",
        params: [nonceData.message, address],
      });

      const verifyRes = await fetch("/api/auth/wallet/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ address, signature, nonce: nonceData.nonce, message: nonceData.message }),
      });
      const verifyData = await verifyRes.json();
      if (verifyData.ok) router.push(verifyData.redirectTo);
    } catch {
      // user rejected or wallet unavailable
    }
    setWalletLoading(false);
  };

  return (
    <Web3Provider>
      <main className="min-h-screen overflow-hidden bg-[var(--qp-bg)] text-[var(--qp-text-primary)]">
        <Navbar authPage />
        <section className="relative px-4 pb-16 pt-24 sm:px-6 lg:px-8 lg:pb-20 lg:pt-28">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_38%_18%,rgba(124,92,255,.28),transparent_32%),radial-gradient(circle_at_76%_28%,rgba(66,215,245,.12),transparent_26%),linear-gradient(180deg,rgba(8,11,24,0)_0%,#080b18_86%)]" />
          <div className="pointer-events-none absolute inset-x-0 top-16 h-px bg-gradient-to-r from-transparent via-[#7c5cff]/60 to-transparent" />

          <div className="relative mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#8b72ff]/30 bg-[#7c5cff]/10 px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] text-[#cfc7ff]">
                <Image src="/brand/verse/verse-mark.svg" alt="" width={16} height={16} />
                Powered by VERSE
              </div>
              <h1 className="mt-6 max-w-3xl font-sora text-[clamp(2.35rem,7vw,5.35rem)] font-black leading-[0.98] tracking-[-0.055em] text-white">
                One account.<br />All QuestPay access.<br />
                <span className="gradient-text">Built for creators.</span>
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--qp-text-secondary)] sm:text-lg">
                Sign in with wallet, Google, or email to track orders, manage delivery, open receipts, and access creator tools from one secure QuestPay identity.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href="#login-options" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[var(--qp-violet-strong)] px-5 text-base font-bold text-white shadow-[0_0_34px_rgba(124,92,255,.34)] hover:bg-[var(--qp-violet)]">
                  Choose login option <ArrowRight className="ml-2" size={18} />
                </a>
                <a href="#auth-flow" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[var(--qp-border-default)] bg-[rgba(17,24,45,.78)] px-5 text-base font-semibold text-[var(--qp-text-primary)] hover:bg-[var(--qp-surface-hover)]">
                  See account flow
                </a>
              </div>
              <div className="mt-8 grid grid-cols-2 gap-3 text-sm text-[var(--qp-text-muted)] sm:grid-cols-4">
                {["Wallet + Google", "Role-based access", "Secure sessions", "No seed phrase"].map((item) => (
                  <div key={item} className="flex items-center gap-2 rounded-xl border border-[var(--qp-border-soft)] bg-white/[0.035] px-3 py-2">
                    <CheckCircle2 size={15} className="text-[#8b72ff]" /> {item}
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1, duration: 0.55 }} className="relative min-h-[420px] lg:min-h-[560px]">
              <CryptoCube />
            </motion.div>
          </div>
        </section>

        <section className="relative px-4 pb-16 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-4 lg:grid-cols-[1fr_.82fr_1fr]" id="auth-flow">
            <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="rounded-[1.5rem] border border-[#7c5cff]/20 bg-[#090d1b]/80 p-5 shadow-[0_0_60px_rgba(124,92,255,.08)]">
              <h2 className="font-sora text-sm font-bold uppercase tracking-[0.12em] text-[#a793ff]">Auth flow / simple & unified</h2>
              <div className="mt-4 space-y-3">
                {flowSteps.map((step, index) => {
                  const Icon = step.icon;
                  return (
                    <div key={step.title} className="rounded-2xl border border-[var(--qp-border-soft)] bg-[rgba(17,24,45,.7)] p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-bold text-[#b9abff]">{index + 1}. {step.title}</p>
                          <p className="mt-1 text-sm leading-6 text-[var(--qp-text-muted)]">{step.body}</p>
                        </div>
                        <div className="grid size-14 place-items-center rounded-2xl border border-[#7c5cff]/30 bg-[#7c5cff]/12 text-[#c1b6ff]"><Icon size={24} /></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="rounded-[1.5rem] border border-[#7c5cff]/20 bg-[#090d1b]/80 p-5">
              <h2 className="font-sora text-sm font-bold uppercase tracking-[0.12em] text-[#a793ff]">Role system / strict</h2>
              <div className="mt-4 space-y-4">
                <div className="rounded-2xl border border-[var(--qp-border-soft)] bg-[rgba(17,24,45,.7)] p-4">
                  <p className="text-sm font-bold uppercase text-[#c1b6ff]">Super admins</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--qp-text-muted)]">Root identities are verified server-side before admin access is granted.</p>
                </div>
                {roles.map((role) => (
                  <div key={role.title} className="rounded-2xl border border-[var(--qp-border-soft)] bg-[rgba(17,24,45,.7)] p-4">
                    <p className="text-sm font-bold uppercase text-[#c1b6ff]">{role.title}</p>
                    <ul className="mt-2 space-y-1 text-sm leading-6 text-[var(--qp-text-muted)]">
                      {role.items.map((item) => <li key={item}>• {item}</li>)}
                    </ul>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div id="login-options" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="rounded-[1.5rem] border border-[#7c5cff]/20 bg-[#090d1b]/80 p-5 shadow-[0_0_80px_rgba(124,92,255,.11)]">
              <h2 className="font-sora text-sm font-bold uppercase tracking-[0.12em] text-[#a793ff]">Login options</h2>

              {error && (
                <div className="mt-4 flex items-start gap-3 rounded-2xl border border-red-300/30 bg-red-400/10 p-4 text-sm font-medium leading-6 text-red-100">
                  <AlertCircle className="mt-0.5 shrink-0" size={18} />
                  <span>{errorMessages[error] || "Sign-in could not be completed."}</span>
                </div>
              )}

              <div className="mt-4 space-y-3">
                <button type="button" onClick={handleWalletSignIn} disabled={busy || walletLoading} className="auth-option group">
                  <span className="auth-option-icon">{walletLoading ? <Loader2 className="animate-spin" size={23} /> : <Wallet size={23} />}</span>
                  <span className="text-left"><span className="block font-bold text-white">{walletLoading ? "Waiting for signature" : "Connect Wallet"}</span><span className="block text-sm text-[var(--qp-text-muted)]">MetaMask, WalletConnect, Coinbase, OKX, Rabby.</span></span>
                </button>

                <button type="button" onClick={handleGoogle} disabled={busy || !googleAvailable} className="auth-option group disabled:cursor-not-allowed disabled:opacity-55">
                  <span className="auth-option-icon bg-white">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" fill="#EA4335"/></svg>
                  </span>
                  <span className="text-left"><span className="block font-bold text-white">{googleAvailable ? "Continue with Google" : "Google not configured"}</span><span className="block text-sm text-[var(--qp-text-muted)]">One-click secure login.</span></span>
                </button>

                <div className="rounded-2xl border border-[var(--qp-border-soft)] bg-[rgba(17,24,45,.72)] p-4">
                  <form onSubmit={handleMagicLink} className="space-y-3">
                    <label className="block text-sm font-semibold text-white">
                      Email magic link
                      <input name="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-[var(--qp-border-default)] bg-[var(--qp-bg-elevated)] px-4 text-base text-white placeholder:text-[var(--qp-text-subtle)] outline-none focus:border-[var(--qp-violet)] focus:ring-4 focus:ring-[var(--qp-focus-ring)]" placeholder="you@example.com" />
                    </label>
                    {magicLinkSent ? <p className="rounded-xl border border-green-300/30 bg-green-400/10 p-3 text-sm font-medium leading-6 text-green-100">If that email can receive a QuestPay sign-in link, it is on the way.</p> : null}
                    <button type="submit" disabled={busy} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-[var(--qp-border-default)] bg-[rgba(124,92,255,.16)] px-5 text-base font-semibold text-white hover:bg-[rgba(124,92,255,.24)] disabled:opacity-50">
                      <Mail size={18} /> Send secure link
                    </button>
                  </form>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-[#7c5cff]/20 bg-[#7c5cff]/10 p-4 text-sm leading-6 text-[var(--qp-text-muted)]">
                <ShieldCheck className="mr-2 inline text-[#c1b6ff]" size={17} /> One account, all access. QuestPay never asks for your seed phrase.
              </div>
            </motion.div>
          </div>
        </section>
        <Footer />
      </main>
    </Web3Provider>
  );
}

function CryptoCube() {
  return (
    <div className="qp-hero-stage" aria-hidden="true">
      <div className="qp-orbit qp-orbit-a"><Coin label="USDT" tone="green" /></div>
      <div className="qp-orbit qp-orbit-b"><Coin label="BTC" tone="orange" /></div>
      <div className="qp-orbit qp-orbit-c"><Coin label="POL" tone="purple" /></div>
      <div className="qp-orbit qp-orbit-d"><Coin label="VERSE" tone="violet" /></div>
      <div className="qp-cube-wrap">
        <div className="qp-cube">
          <div className="qp-cube-face qp-cube-front"><Image src="/brand/verse/verse-mark.svg" alt="" width={118} height={118} /></div>
          <div className="qp-cube-face qp-cube-back"><Image src="/brand/questpay/questpay-mark-mono.svg" alt="" width={104} height={104} /></div>
          <div className="qp-cube-face qp-cube-right" />
          <div className="qp-cube-face qp-cube-left" />
          <div className="qp-cube-face qp-cube-top" />
          <div className="qp-cube-face qp-cube-bottom" />
        </div>
      </div>
      <div className="qp-stage-ring" />
      <div className="qp-stage-glow" />
    </div>
  );
}

function Coin({ label, tone }: { label: string; tone: "green" | "orange" | "purple" | "violet" }) {
  return <div className={`qp-coin qp-coin-${tone}`}><span>{label}</span></div>;
}
