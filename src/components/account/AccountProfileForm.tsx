"use client";

import { useState } from "react";
import { Loader2, Check } from "lucide-react";
import { CONTACT_METHOD_LABELS, type ContactMethod } from "@/lib/schemas";
import type { ChainKey } from "@/lib/services";
import type { AccountProfile } from "@/lib/profile";

const inputClass =
  "w-full rounded-xl border border-[var(--qp-border-soft)] bg-base-lighter px-4 py-3 text-base text-[var(--qp-text-primary)] placeholder:text-[var(--qp-text-subtle)] outline-none transition-colors focus:border-verse-purple/50";

const CONTACT_METHODS = Object.keys(CONTACT_METHOD_LABELS) as ContactMethod[];

export default function AccountProfileForm({ profile }: { profile: AccountProfile | null }) {
  const [displayName, setDisplayName] = useState(profile?.displayName ?? "");
  const [publicHandle, setPublicHandle] = useState(profile?.publicHandle ?? "");
  const [organization, setOrganization] = useState(profile?.organization ?? "");
  const [contactMethod, setContactMethod] = useState<ContactMethod>((profile?.contactMethod as ContactMethod) ?? "email");
  const [contactValue, setContactValue] = useState(profile?.contactValue ?? "");
  const [preferredChain, setPreferredChain] = useState<ChainKey>(profile?.preferredChain ?? "polygon");
  const [timezone, setTimezone] = useState(profile?.timezone ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const valid = displayName.trim().length >= 2 && contactValue.trim().length >= 3;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    setBusy(true);
    setError("");
    setSaved(false);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          displayName: displayName.trim(),
          publicHandle: publicHandle.trim(),
          organization: organization.trim(),
          contactMethod,
          contactValue: contactValue.trim(),
          preferredChain,
          timezone: timezone.trim(),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Could not save your profile.");
        return;
      }
      setSaved(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-[2rem] border border-[var(--qp-border-soft)] bg-[var(--qp-surface)] p-6">
      <h2 className="font-sora text-xl font-black text-white">Profile</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-semibold text-muted">Display name <span className="text-red-400">*</span></label>
          <input className={inputClass} value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-muted">Public handle</label>
          <input className={inputClass} value={publicHandle} onChange={(e) => setPublicHandle(e.target.value)} placeholder="@yourhandle" />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-semibold text-muted">Organization / studio</label>
        <input className={inputClass} value={organization} onChange={(e) => setOrganization(e.target.value)} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-semibold text-muted">Contact method <span className="text-red-400">*</span></label>
          <select className={inputClass} value={contactMethod} onChange={(e) => setContactMethod(e.target.value as ContactMethod)}>
            {CONTACT_METHODS.map((m) => (
              <option key={m} value={m}>{CONTACT_METHOD_LABELS[m]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-muted">Contact value <span className="text-red-400">*</span></label>
          <input className={inputClass} value={contactValue} onChange={(e) => setContactValue(e.target.value)} />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-semibold text-muted">Preferred network</label>
          <select className={inputClass} value={preferredChain} onChange={(e) => setPreferredChain(e.target.value as ChainKey)}>
            <option value="polygon">Polygon</option>
            <option value="bnb">BNB Chain</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-muted">Timezone</label>
          <input className={inputClass} value={timezone} onChange={(e) => setTimezone(e.target.value)} placeholder="e.g., Asia/Jakarta" />
        </div>
      </div>

      {error ? <div className="rounded-2xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200">{error}</div> : null}

      <button type="submit" disabled={busy || !valid} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-verse-purple px-5 font-black text-white disabled:opacity-40">
        {busy ? <Loader2 className="animate-spin" size={18} /> : saved ? <Check size={18} /> : null}
        {busy ? "Saving..." : saved ? "Saved" : "Save changes"}
      </button>
    </form>
  );
}
