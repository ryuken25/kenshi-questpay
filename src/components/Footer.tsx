"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Github } from "@/components/icons/BrandIcons";
import TermsModalLink from "@/components/legal/TermsModalLink";
import { SITE } from "@/lib/site";

function TelegramMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-current">
      <path d="M21.7 3.35 18.46 19.1c-.24 1.11-.89 1.38-1.8.86l-4.93-3.64-2.38 2.3c-.26.26-.48.48-.99.48l.35-5.02 9.14-8.26c.4-.35-.09-.55-.62-.2L5.94 12.74 1.08 11.2C.02 10.87 0 10.15 1.3 9.64L20.28 2.3c.88-.32 1.65.21 1.42 1.05Z" />
    </svg>
  );
}

const iconClass = "inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-[var(--qp-border-soft)] text-[var(--qp-text-muted)] transition hover:border-white/20 hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--qp-focus-ring)]";
const textLinkClass = "inline-flex min-h-11 min-w-11 items-center justify-center text-sm text-[var(--qp-text-muted)] transition hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--qp-focus-ring)]";

export default function Footer() {
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((response) => response.json())
      .then((data) => setAuthenticated(Boolean(data.authenticated)))
      .catch(() => setAuthenticated(false));
  }, []);

  return (
    <footer role="contentinfo" className="border-t border-[var(--qp-border-soft)] bg-[var(--qp-bg-elevated)] py-9">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-7 px-4 sm:px-6 md:flex-row lg:px-8">
        <div className="text-center md:text-left">
          <Image src="/brand/questpay/questpay-logo-horizontal.svg" alt="QuestPay" width={124} height={28} className="mx-auto h-7 w-auto md:mx-0" />
          <p className="mt-2 text-sm text-[var(--qp-text-muted)]">© {new Date().getFullYear()} ryuken25</p>
          {/* VERSE ecosystem attribution on every page. The community disclaimer
              intentionally lives in the hero, not here (footer stays minimal). */}
          <p className="mt-1 text-xs text-[var(--qp-text-muted)]">
            Built for the <span className="font-semibold text-[var(--qp-violet-300)]">VERSE</span> ecosystem · Payments on Polygon
          </p>
        </div>

        <div className="flex max-w-2xl flex-wrap items-center justify-center gap-x-5 gap-y-2 md:justify-end">
          <a href={SITE.creator.github || "https://github.com/ryuken25"} target="_blank" rel="noopener noreferrer" aria-label="ryuken25 on GitHub" className={iconClass}><Github className="h-5 w-5" /></a>
          <a href="https://t.me/kenshi25" target="_blank" rel="noopener noreferrer" aria-label="Contact Kenshi on Telegram" title="@kenshi25" className={iconClass}><TelegramMark /></a>
          <Link href="/faq" className={textLinkClass}>FAQ</Link>
          <Link href="/verify" className={textLinkClass}>Verify receipt</Link>
          <Link href="/privacy" className={textLinkClass}>Privacy</Link>
          <TermsModalLink className={textLinkClass}>Terms</TermsModalLink>
          <Link href={authenticated ? "/account" : "/sign-in"} className={textLinkClass}>{authenticated ? "Account" : "Sign in"}</Link>
        </div>
      </div>
    </footer>
  );
}
