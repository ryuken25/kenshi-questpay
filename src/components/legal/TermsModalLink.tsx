"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

const sections = [
  ["Scope", "Each service package defines its deliverable, delivery target, included revisions, required inputs, and exclusions. Out-of-scope requests require a revised scope."],
  ["Payment", "Payments are sent to a QuestPay-controlled receive address on Polygon (custodial escrow), not directly to the creator. The server verifies the transfer on-chain and releases the funds to the creator wallet after you accept the delivered work."],
  ["Network responsibility", "Send only the selected token on the network and to the receiver shown in the locked quote. Transfers made with another asset, network, or receiver may be unrecoverable."],
  ["Privacy", "Private briefs, contact details, references, and internal delivery notes stay off-chain and are excluded from public receipts."],
  ["Refunds and cancellations", "On-chain payments are irreversible. Refunds and cancellations are handled case-by-case according to the agreed service scope and creator communication."],
  ["Account safety", "QuestPay never asks for a seed phrase or private key. A wallet message signature authenticates an account; it is not a payment transaction."],
] as const;

export default function TermsModalLink({ children = "Terms", className = "" }: { children?: ReactNode; className?: string }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKeyDown);
    requestAnimationFrame(() => closeRef.current?.focus());
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>{children}</button>
      {mounted && open ? createPortal(
        <div className="fixed inset-0 z-[10000] grid place-items-center overflow-y-auto bg-black/80 p-3 backdrop-blur-sm sm:p-6" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="terms-modal-title" className="relative my-auto max-h-[min(88svh,760px)] w-full max-w-2xl overflow-y-auto rounded-[1.75rem] border border-[rgba(178,133,255,.28)] bg-[linear-gradient(180deg,rgba(19,15,31,.99),rgba(5,5,11,.99))] p-5 text-white shadow-[0_28px_100px_rgba(0,0,0,.72)] sm:p-8">
            <button ref={closeRef} type="button" onClick={() => setOpen(false)} aria-label="Close terms" className="absolute right-4 top-4 grid size-11 place-items-center rounded-xl border border-white/10 bg-white/[.04] text-white hover:bg-white/[.1]"><X size={20} /></button>
            <p className="font-mono text-xs font-black uppercase tracking-[.2em] text-[var(--qp-violet-300)]">QuestPay legal</p>
            <h2 id="terms-modal-title" className="mt-3 pr-14 font-sora text-3xl font-black tracking-[-.04em] sm:text-4xl">Terms of Service</h2>
            <p className="mt-3 max-w-xl text-sm leading-7 text-[var(--qp-text-muted)]">The practical boundaries for scoped creator work, direct crypto payments, private briefs, and public proof.</p>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {sections.map(([title, text]) => <article key={title} className="rounded-2xl border border-white/[.08] bg-black/25 p-4"><h3 className="font-sora text-sm font-bold text-white">{title}</h3><p className="mt-2 text-sm leading-6 text-[var(--qp-text-muted)]">{text}</p></article>)}
            </div>
            <button type="button" onClick={() => setOpen(false)} className="mt-7 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-[linear-gradient(180deg,#8b5cff,#6c3ee8)] px-5 font-bold text-white sm:w-auto">I understand</button>
          </section>
        </div>,
        document.body,
      ) : null}
    </>
  );
}
