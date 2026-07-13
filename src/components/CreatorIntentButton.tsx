"use client";

import { useState } from "react";
import AuthModal from "@/components/auth/AuthModal";

export default function CreatorIntentButton({ className = "" }: { className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        Start Selling
      </button>
      <AuthModal open={open} onClose={() => setOpen(false)} intent="creator" next="/studio" />
    </>
  );
}
