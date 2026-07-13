"use client";

import { type RefObject, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import AuthPanel from "@/components/auth/AuthPanel";

export type AuthIntent = "signin" | "wallet" | "creator" | "checkout";

type Props = {
  open: boolean;
  onClose: () => void;
  onAuthenticated?: () => void | Promise<void>;
  intent?: AuthIntent;
  next?: string;
  returnFocusRef?: RefObject<HTMLElement>;
};

export default function AuthModal({ open, onClose, onAuthenticated, intent = "signin", next, returnFocusRef }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousActiveRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    previousActiveRef.current = document.activeElement as HTMLElement | null;
    const returnTarget = returnFocusRef?.current || previousActiveRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusTimer = window.setTimeout(() => {
      const first = dialogRef.current?.querySelector<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])');
      first?.focus();
    }, 0);

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    window.addEventListener("keydown", onKey);

    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
      window.setTimeout(() => returnTarget?.focus(), 0);
    };
  }, [open, onClose, returnFocusRef]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="qp-auth-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div ref={dialogRef} className="qp-auth-dialog" role="dialog" aria-modal="true" aria-labelledby="questpay-auth-title">
        <button type="button" aria-label="Close sign in" onClick={onClose} className="qp-auth-dialog__close"><X size={20} /></button>
        <h2 id="questpay-auth-title" className="sr-only">QuestPay sign in</h2>
        <AuthPanel compact bare intent={intent} next={next} onAuthenticated={onAuthenticated} />
      </div>
    </div>,
    document.body,
  );
}
