"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AuthModal from "@/components/auth/AuthModal";

type SessionState = { authenticated: boolean; roles: string[] } | null;

export default function CreatorIntentButton({ className = "", children = "Start Selling" }: { className?: string; children?: React.ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState<SessionState>(null);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((response) => response.json())
      .then((data) => setSession({ authenticated: Boolean(data.authenticated), roles: data.roles ?? [] }))
      .catch(() => setSession({ authenticated: false, roles: [] }));
  }, []);

  const authenticated = session?.authenticated ?? false;
  const creator = session?.roles.includes("creator") ?? false;

  const activate = () => {
    if (!authenticated) {
      setOpen(true);
      return;
    }
    router.push(creator ? "/studio" : "/onboarding?next=/studio");
  };

  return (
    <>
      <button type="button" onClick={activate} aria-haspopup={authenticated ? undefined : "dialog"} className={className}>
        {creator ? "Creator Studio" : children}
      </button>
      <AuthModal open={open} onClose={() => setOpen(false)} intent="creator" next="/studio" />
    </>
  );
}
