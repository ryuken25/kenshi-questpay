"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import AuthPanel from "@/components/auth/AuthPanel";

export type AuthIntent = "signin" | "wallet" | "creator" | "checkout";

export default function AuthModal({ open, onClose, intent = "signin", next }: { open: boolean; onClose: () => void; intent?: AuthIntent; next?: string }) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", onKey); };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] grid place-items-center bg-black/78 px-4 py-6 backdrop-blur-xl" role="dialog" aria-modal="true" aria-label="QuestPay sign in">
      <button aria-label="Close sign in" onClick={onClose} className="absolute right-4 top-4 grid size-11 place-items-center rounded-full border border-white/10 bg-white/5 text-white hover:bg-white/10"><X size={20} /></button>
      <div className="max-h-[92svh] w-full max-w-lg overflow-y-auto rounded-[1.6rem]">
        <AuthPanel compact intent={intent} next={next} />
      </div>
    </div>,
    document.body,
  );
}
