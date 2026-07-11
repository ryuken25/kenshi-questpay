"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowRight, ArrowLeft } from "lucide-react";
import { CONTACT_METHOD_LABELS, type ContactMethod } from "@/lib/schemas";
import type { ChainKey } from "@/lib/services";

const inputClass =
  "w-full rounded-xl border border-[var(--qp-border-soft)] bg-base-lighter px-4 py-3 text-base text-[var(--qp-text-primary)] placeholder:text-[var(--qp-text-subtle)] outline-none transition-colors focus:border-verse-purple/50";

const CONTACT_METHODS = Object.keys(CONTACT_METHOD_LABELS) as ContactMethod[];

interface FormState {
  displayName: string;
  publicHandle: string;
  organization: string;
  contactMethod: ContactMethod;
  contactValue: string;
  preferredChain: ChainKey;
  timezone: string;
}

export default function OnboardingForm({ next, initialDisplayName }: { next: string; initialDisplayName?: string }) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const detectedTimezone = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    } catch {
      return "";
    }
  }, []);
  const [form, setForm] = useState<FormState>({
    displayName: initialDisplayName ?? "",
    publicHandle: "",
    organization: "",
    contactMethod: "email",
    contactValue: "",
    preferredChain: "polygon",
    timezone: detectedTimezone,
  });

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((prev) => ({ ...prev, [key]: value }));

  const step1Valid = form.displayName.trim().length >= 2;
  const step2Valid = form.contactValue.trim().length >= 3;

  const goNext = () => {
    if (!step1Valid) return;
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!step1Valid || !step2Valid) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/profile/onboarding", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          displayName: form.displayName.trim(),
          publicHandle: form.publicHandle.trim(),
          organization: form.organization.trim(),
          contactMethod: form.contactMethod,
          contactValue: form.contactValue.trim(),
          preferredChain: form.preferredChain,
          timezone: form.timezone.trim(),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Could not save your profile. Please try again.");
        setBusy(false);
        return;
      }
      router.push(next);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="glass-panel-strong space-y-5 rounded-2xl p-5 sm:p-8">
      <div className="flex items-center gap-2" role="progressbar" aria-valuenow={step} aria-valuemin={1} aria-valuemax={2} aria-label="Onboarding progress">
        <span className={`h-1.5 flex-1 rounded-full ${step >= 1 ? "bg-verse-purple" : "bg-white/10"}`} />
        <span className={`h-1.5 flex-1 rounded-full ${step >= 2 ? "bg-verse-purple" : "bg-white/10"}`} />
      </div>
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--qp-text-muted)]">
        Step {step} of 2 — {step === 1 ? "Your profile" : "Order defaults"}
      </p>

      {step === 1 ? (
        <div className="space-y-4">
          <Field label="Display name" required>
            <input className={inputClass} value={form.displayName} onChange={(e) => update("displayName", e.target.value)} placeholder="How should we address you?" autoFocus />
          </Field>
          <Field label="Public handle" hint="Optional — shown on public receipts if you choose.">
            <input className={inputClass} value={form.publicHandle} onChange={(e) => update("publicHandle", e.target.value)} placeholder="@yourhandle" />
          </Field>
          <Field label="Organization / studio" hint="Optional">
            <input className={inputClass} value={form.organization} onChange={(e) => update("organization", e.target.value)} placeholder="Optional" />
          </Field>
          <button type="button" onClick={goNext} disabled={!step1Valid} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-verse-purple px-5 font-black text-white disabled:opacity-40">
            Continue <ArrowRight size={18} />
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <Field label="Contact method" required>
            <select className={inputClass} value={form.contactMethod} onChange={(e) => update("contactMethod", e.target.value as ContactMethod)}>
              {CONTACT_METHODS.map((m) => (
                <option key={m} value={m}>{CONTACT_METHOD_LABELS[m]}</option>
              ))}
            </select>
          </Field>
          <Field label="Contact value" required>
            <input className={inputClass} value={form.contactValue} onChange={(e) => update("contactValue", e.target.value)} placeholder="user#1234, @handle, email@example.com" autoFocus />
          </Field>
          <Field label="Preferred network" required>
            <select className={inputClass} value={form.preferredChain} onChange={(e) => update("preferredChain", e.target.value as ChainKey)}>
              <option value="polygon">Polygon</option>
              <option value="bnb">BNB Chain</option>
            </select>
          </Field>
          <Field label="Timezone" hint="Optional — helps creators know when you're around.">
            <input className={inputClass} value={form.timezone} onChange={(e) => update("timezone", e.target.value)} placeholder="e.g., Asia/Jakarta" />
          </Field>

          {error ? <div className="rounded-2xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200">{error}</div> : null}

          <div className="flex gap-3">
            <button type="button" onClick={() => setStep(1)} className="flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-[var(--qp-border-default)] px-5 font-bold text-white">
              <ArrowLeft size={18} /> Back
            </button>
            <button type="submit" disabled={busy || !step2Valid} className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-verse-purple px-5 font-black text-white disabled:opacity-40">
              {busy ? <Loader2 className="animate-spin" size={18} /> : "Finish setup"}
            </button>
          </div>
        </div>
      )}
    </form>
  );
}

function Field({ label, required = false, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 flex items-center justify-between text-sm font-semibold text-muted">
        <span>{label} {required ? <span className="text-red-400">*</span> : null}</span>
      </label>
      {children}
      {hint ? <p className="mt-1 text-xs text-[var(--qp-text-subtle)]">{hint}</p> : null}
    </div>
  );
}
