"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { AlertCircle, Loader2, Mail, ShieldCheck, Wallet } from "lucide-react";

const errorMessages: Record<string, string> = {
  provider_not_enabled: "Google sign-in is temporarily unavailable. Use your wallet or secure email link.",
  oauth_callback_failed: "Google sign-in could not be completed. Please try again.",
  no_verified_email: "No verified email was returned. Please try a different method.",
  account_creation_failed: "Could not create your account. Please try again.",
  no_wallet: "No wallet was detected. Install MetaMask, Rabby, OKX, Coinbase Wallet, or use WalletConnect.",
};

export default function AuthPanel({ next, error, compact = false, intent = "signin" }: { next?: string | null; error?: string | null; compact?: boolean; intent?: "signin" | "wallet" | "creator" }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [walletLoading, setWalletLoading] = useState(false);
  const [googleAvailable, setGoogleAvailable] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/health/auth")
      .then((r) => r.json())
      .then((d) => setGoogleAvailable(d.providers?.googleConfigured ?? true))
      .catch(() => {});
  }, []);

  const safeNext = intent === "creator" && !next ? "/studio" : next;

  const handleGoogle = () => {
    setBusy(true);
    router.push(`/api/auth/oauth${safeNext ? `?next=${encodeURIComponent(safeNext)}` : ""}`);
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: email.trim(), next: safeNext }),
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
      const signature = await window.ethereum.request({ method: "personal_sign", params: [nonceData.message, address] });
      const verifyRes = await fetch("/api/auth/wallet/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ address, signature, nonce: nonceData.nonce, message: nonceData.message }),
      });
      const verifyData = await verifyRes.json();
      if (verifyData.ok) router.push(safeNext || verifyData.redirectTo);
    } catch {
      // User rejected signature or wallet was unavailable.
    }
    setWalletLoading(false);
  };

  return (
    <div className={`w-full ${compact ? "max-w-md" : "max-w-lg"} rounded-[1.5rem] border border-[#7c5cff]/22 bg-[#090d1b]/95 p-5 shadow-[0_24px_90px_rgba(0,0,0,.45)] sm:p-6`}>
      <div className="mb-5 flex items-center gap-3">
        <Image src="/brand/questpay/questpay-mark.svg" alt="QuestPay" width={42} height={42} />
        <div>
          <p className="font-sora text-xl font-black text-white">QuestPay</p>
          <p className="text-sm text-[var(--qp-text-muted)]">One secure account for orders, receipts, and creator work.</p>
        </div>
      </div>

      <h1 className="font-sora text-3xl font-black tracking-[-.03em] text-white">Sign in</h1>
      <p className="mt-3 text-base leading-7 text-[var(--qp-text-secondary)]">Connect wallet, continue with Google, or receive a secure email link.</p>

      {error ? (
        <div role="alert" className="mt-4 flex items-start gap-3 rounded-2xl border border-red-300/30 bg-red-400/10 p-4 text-sm font-medium leading-6 text-red-100">
          <AlertCircle className="mt-0.5 shrink-0" size={18} />
          <span>{errorMessages[error] || "Sign-in could not be completed."}</span>
        </div>
      ) : null}

      <div className="mt-5 space-y-3">
        <button type="button" onClick={handleWalletSignIn} disabled={busy || walletLoading} className="auth-option group" autoFocus={intent === "wallet"}>
          <span className="auth-option-icon">{walletLoading ? <Loader2 className="animate-spin" size={23} /> : <Wallet size={23} />}</span>
          <span className="text-left"><span className="block font-bold text-white">{walletLoading ? "Waiting for signature" : "Connect Wallet"}</span><span className="block text-sm text-[var(--qp-text-muted)]">Message signature only. No auth transaction.</span></span>
        </button>
        <button type="button" onClick={handleGoogle} disabled={busy || !googleAvailable} className="auth-option group disabled:cursor-not-allowed disabled:opacity-55">
          <span className="auth-option-icon bg-white"><GoogleIcon /></span>
          <span className="text-left"><span className="block font-bold text-white">{googleAvailable ? "Continue with Google" : "Google temporarily unavailable"}</span><span className="block text-sm text-[var(--qp-text-muted)]">Use wallet or secure email if Google is unavailable.</span></span>
        </button>
        <form onSubmit={handleMagicLink} className="rounded-2xl border border-[var(--qp-border-soft)] bg-[rgba(17,24,45,.72)] p-4">
          <label className="block text-sm font-semibold text-white">
            Email magic link
            <input name="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-[var(--qp-border-default)] bg-[var(--qp-bg-elevated)] px-4 text-base text-white placeholder:text-[var(--qp-text-subtle)] outline-none focus:border-[var(--qp-violet)] focus:ring-4 focus:ring-[var(--qp-focus-ring)]" placeholder="you@example.com" />
          </label>
          {magicLinkSent ? <p aria-live="polite" className="mt-3 rounded-xl border border-green-300/30 bg-green-400/10 p-3 text-sm font-medium leading-6 text-green-100">If that email can receive a QuestPay sign-in link, it is on the way.</p> : null}
          <button type="submit" disabled={busy} className="mt-3 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-[var(--qp-border-default)] bg-[rgba(124,92,255,.16)] px-5 text-base font-semibold text-white hover:bg-[rgba(124,92,255,.24)] disabled:opacity-50"><Mail size={18} /> Send secure link</button>
        </form>
      </div>

      <div className="mt-5 rounded-2xl border border-[#7c5cff]/20 bg-[#7c5cff]/10 p-4 text-sm leading-6 text-[var(--qp-text-muted)]">
        <ShieldCheck className="mr-2 inline text-[#c1b6ff]" size={17} /> Verified identities can link to one account. QuestPay never asks for seed phrases.
      </div>
      <p className="mt-4 text-center text-xs leading-5 text-[var(--qp-text-subtle)]">By continuing, use QuestPay according to the <Link href="/terms" className="text-[#c1b6ff] hover:text-white">Terms</Link> and <Link href="/privacy" className="text-[#c1b6ff] hover:text-white">Privacy Policy</Link>.</p>
    </div>
  );
}

function GoogleIcon() {
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" fill="#EA4335"/></svg>;
}
