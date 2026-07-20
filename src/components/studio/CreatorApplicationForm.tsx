"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

const inputClass =
  "mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-[rgba(8,8,14,.72)] px-4 text-base outline-none focus:border-[var(--qp-violet-500)]";

export default function CreatorApplicationForm() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [craft, setCraft] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [note, setNote] = useState("");
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const valid =
    displayName.trim().length >= 2 &&
    craft.trim().length >= 2 &&
    note.trim().length >= 20 &&
    agree;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/studio/applications", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          displayName: displayName.trim(),
          craft: craft.trim(),
          portfolioUrl: portfolioUrl.trim(),
          note: note.trim(),
          agree: true,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Could not submit application.");
        return;
      }
      router.push("/studio/request?submitted=1");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-8 space-y-4 rounded-[2rem] border border-white/10 bg-[var(--qp-surface)] p-6"
    >
      <label className="block">
        <span className="text-xs font-bold uppercase tracking-wider text-muted">Display name</span>
        <input
          name="displayName"
          required
          minLength={2}
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="How buyers should know you"
          className={inputClass}
        />
      </label>

      <label className="block">
        <span className="text-xs font-bold uppercase tracking-wider text-muted">
          Primary craft / services
        </span>
        <input
          name="craft"
          required
          minLength={2}
          value={craft}
          onChange={(e) => setCraft(e.target.value)}
          placeholder="e.g. UI review, landing polish, component builds"
          className={inputClass}
        />
      </label>

      <label className="block">
        <span className="text-xs font-bold uppercase tracking-wider text-muted">
          Portfolio / proof link
        </span>
        <input
          name="portfolio"
          type="url"
          value={portfolioUrl}
          onChange={(e) => setPortfolioUrl(e.target.value)}
          placeholder="https://"
          className={inputClass}
        />
      </label>

      <label className="block">
        <span className="text-xs font-bold uppercase tracking-wider text-muted">
          Why you want Creator Studio
        </span>
        <textarea
          name="note"
          required
          minLength={20}
          rows={5}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Brief pitch, typical delivery window, and payout wallet readiness."
          className="mt-2 w-full rounded-xl border border-white/10 bg-[rgba(8,8,14,.72)] px-4 py-3 text-base outline-none focus:border-[var(--qp-violet-500)]"
        />
      </label>

      <label className="flex items-start gap-3 rounded-xl border border-white/10 bg-[rgba(8,8,14,.45)] p-4 text-sm leading-6 text-[var(--qp-text-secondary)]">
        <input
          type="checkbox"
          name="agree"
          required
          checked={agree}
          onChange={(e) => setAgree(e.target.checked)}
          className="mt-1"
        />
        <span>
          I understand QuestPay uses temporary custody → buyer accept → server release, and I will
          only mark work submitted after delivering the agreed scope.
        </span>
      </label>

      {error && (
        <p className="rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-100">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="submit"
          disabled={!valid || busy}
          className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-verse-purple px-6 font-black disabled:opacity-50"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          Submit application
        </button>
        <a
          href="/for-creators"
          className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/10 px-6 font-bold text-[var(--qp-text-secondary)] hover:bg-white/5"
        >
          Learn more
        </a>
      </div>
    </form>
  );
}
