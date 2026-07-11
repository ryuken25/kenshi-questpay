import Link from "next/link";
import Image from "next/image";
import { Github } from "lucide-react";
import { SITE } from "@/lib/site";

export default function Footer() {
  const buildSha = (process.env.VERCEL_GIT_COMMIT_SHA || process.env.NEXT_PUBLIC_BUILD_SHA || "unknown").slice(0, 7);
  return (
    <footer role="contentinfo" className="border-t border-[var(--qp-border-soft)] bg-[var(--qp-bg-elevated)] py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center gap-2 md:justify-start">
              <Image src="/brand/questpay/questpay-mark.svg" alt="QuestPay" width={28} height={28} />
              <p className="font-sora text-lg font-bold text-[var(--qp-text-primary)]">QuestPay</p>
            </div>
            <p className="mt-1 text-sm text-[var(--qp-text-muted)]">A VERSE community project</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-3">
            <a href={SITE.creator.github || "https://github.com/ryuken25"} target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-[var(--qp-border-soft)] text-[var(--qp-text-muted)] hover:text-white"><Github className="h-5 w-5" /></a>
            <Link href="/services" className="text-sm text-[var(--qp-text-muted)] hover:text-white">Services</Link>
            <Link href="/how-it-works" className="text-sm text-[var(--qp-text-muted)] hover:text-white">How It Works</Link>
            <Link href="/privacy" className="text-sm text-[var(--qp-text-muted)] hover:text-white">Privacy</Link>
            <Link href="/terms" className="text-sm text-[var(--qp-text-muted)] hover:text-white">Terms</Link>
            <Link href="/studio/login" className="text-sm text-[var(--qp-text-muted)] hover:text-white">Creator Login</Link>
          </div>
        </div>
        <div className="mt-8 space-y-1 text-center">
          <p className="font-mono text-xs leading-5 text-[var(--qp-text-subtle)]">{SITE.realNetwork} · Build {buildSha}</p>
          <p className="text-sm leading-6 text-[var(--qp-text-muted)]">{SITE.disclaimer}</p>
        </div>
      </div>
    </footer>
  );
}
