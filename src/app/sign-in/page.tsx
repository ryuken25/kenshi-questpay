"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Wallet, Mail, AlertCircle, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Web3Provider } from "@/components/Web3Provider";

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
      // enumeration-safe
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
      if (verifyData.ok) {
        router.push(verifyData.redirectTo);
      }
    } catch {
      // user rejected or error
    }
    setWalletLoading(false);
  };

  return (
    <Web3Provider>
      <main className="min-h-screen bg-[var(--qp-bg)] text-[var(--qp-text-primary)]">
        <Navbar />
        <section className="mx-auto max-w-md px-4 pb-20 pt-28">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="glass-panel-strong rounded-[2rem] p-6 sm:p-8">
            <h1 className="font-sora text-3xl font-black text-[var(--qp-text-primary)]">Sign in</h1>
            <p className="mt-3 text-base leading-7 text-[var(--qp-text-secondary)]">One account. Use Google, email, or your wallet to track orders, link identities, access deliveries, or manage creator work.</p>

            {error && (
              <div className="mt-5 flex items-start gap-3 rounded-xl border border-red-300/30 bg-red-400/10 p-4 text-sm font-medium leading-6 text-red-100">
                <AlertCircle className="mt-0.5 shrink-0" size={18} />
                <span>{errorMessages[error] || "Sign-in could not be completed."}</span>
              </div>
            )}

            {/* Google */}
            <button
              type="button"
              onClick={handleGoogle}
              disabled={busy || !googleAvailable}
              className="mt-6 flex min-h-[52px] w-full items-center justify-center gap-3 rounded-xl bg-white px-5 text-base font-bold text-[#172033] shadow-lg transition hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" fill="#EA4335"/></svg>
              {googleAvailable ? "Continue with Google" : "Google not configured"}
            </button>

            {/* Wallet */}
            <button
              type="button"
              onClick={handleWalletSignIn}
              disabled={busy || walletLoading}
              className="mt-3 flex min-h-[52px] w-full items-center justify-center gap-3 rounded-xl px-5 text-base font-bold text-white shadow-lg transition hover:shadow-xl disabled:opacity-50"
              style={{ background: "linear-gradient(110deg, #3978ff, #7c5cff 55%, #a855f7)" }}
            >
              {walletLoading ? <Loader2 className="animate-spin" size={20} /> : <Wallet size={20} />}
              {walletLoading ? "Waiting for signature..." : "Continue with Wallet"}
            </button>

            {/* Divider */}
            <div className="my-5 flex items-center gap-3 text-sm text-[var(--qp-text-muted)]">
              <span className="h-px flex-1 bg-[var(--qp-border-soft)]" />
              or use email
              <span className="h-px flex-1 bg-[var(--qp-border-soft)]" />
            </div>

            {/* Magic link */}
            {magicLinkSent ? (
              <div className="rounded-xl border border-green-300/30 bg-green-400/10 p-4 text-sm font-medium leading-6 text-green-100">
                If that email can receive a QuestPay sign-in link, it is on the way.
              </div>
            ) : (
              <form onSubmit={handleMagicLink} className="space-y-3">
                <label className="block text-sm font-semibold text-[var(--qp-text-primary)]">
                  Email address
                  <input
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-2 min-h-12 w-full rounded-xl border border-[var(--qp-border-default)] bg-[var(--qp-bg-elevated)] px-4 text-base text-[var(--qp-text-primary)] placeholder:text-[var(--qp-text-subtle)] outline-none focus:border-[var(--qp-violet)] focus:ring-4 focus:ring-[var(--qp-focus-ring)]"
                    placeholder="you@example.com"
                  />
                </label>
                <button type="submit" disabled={busy} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-[var(--qp-border-default)] bg-[var(--qp-surface)] px-5 text-base font-semibold text-[var(--qp-text-primary)] hover:bg-[var(--qp-surface-hover)] disabled:opacity-50">
                  <Mail size={18} /> Send secure link
                </button>
              </form>
            )}

            <p className="mt-6 text-center text-sm leading-6 text-[var(--qp-text-muted)]">
              Wallet sign-in uses a message signature.<br />It does not create a transaction or cost gas.
            </p>
          </motion.div>
        </section>
        <Footer />
      </main>
    </Web3Provider>
  );
}
