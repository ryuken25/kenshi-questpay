"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { briefSchema, type BriefFormData, type CreateOrderInput } from "@/lib/schemas";
import { CHECKOUT_TOKENS, type TokenSymbol } from "@/lib/services";

interface Props {
  slug: string;
  serviceName: string;
  serviceUsd: number;
}

const inputClass =
  "w-full rounded-xl border border-[var(--qp-border-soft)] bg-base-lighter px-4 py-3 text-base text-[var(--qp-text-primary)] placeholder:text-[var(--qp-text-subtle)] outline-none transition-colors focus:border-verse-purple/50";

export default function CheckoutForm({ slug, serviceName, serviceUsd }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<BriefFormData>({
    customerName: "",
    contactMethod: "",
    contactValue: "",
    projectLink: "",
    deadline: "",
    mainProblem: "",
    expectedOutput: "",
    refLinks: "",
    notes: "",
  });
  const [token, setToken] = useState<TokenSymbol>("USDT");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const updateField = (field: keyof BriefFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field])
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const result = briefSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        fieldErrors[issue.path[0] as string] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setBusy(true);
    try {
      const payload: CreateOrderInput = {
        slug,
        tokenSymbol: token,
        brief: result.data,
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create order.");
        return;
      }

      // Redirect to the pay page
      router.push(`/pay/${data.publicOrderId}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Network error.";
      setError(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="glass-panel-strong space-y-5 rounded-2xl p-5 sm:p-8">
      <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm leading-6 text-amber-100">
        <b>Payment safety gate:</b> Orders create locked, server-authoritative quotes. Polygon supports USDT, USDC, POL, and VERSE. BNB Chain support is staged behind the payment gate until verification is upgraded.
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Name / Handle" error={errors.customerName}>
          <input
            className={inputClass}
            value={form.customerName}
            onChange={(e) => updateField("customerName", e.target.value)}
            placeholder="e.g., @ryuken"
          />
        </Field>
        <Field label="Contact Method" error={errors.contactMethod}>
          <input
            className={inputClass}
            value={form.contactMethod}
            onChange={(e) => updateField("contactMethod", e.target.value)}
            placeholder="Discord, X DM, Email"
          />
        </Field>
      </div>
      <Field label="Contact Value" error={errors.contactValue}>
        <input
          className={inputClass}
          value={form.contactValue}
          onChange={(e) => updateField("contactValue", e.target.value)}
          placeholder="user#1234, @handle, email@example.com"
        />
      </Field>
      <Field label="Project Link">
        <input
          className={inputClass}
          value={form.projectLink}
          onChange={(e) => updateField("projectLink", e.target.value)}
          placeholder="https://..."
        />
      </Field>
      <Field label="Deadline">
        <input
          className={inputClass}
          value={form.deadline}
          onChange={(e) => updateField("deadline", e.target.value)}
          placeholder="3 days, next Friday, ASAP"
        />
      </Field>

      <Field label="Payment token">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {CHECKOUT_TOKENS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setToken(t)}
              className={`min-h-12 rounded-xl border px-2 text-sm font-black ${
                token === t
                  ? "border-verse-blue bg-verse-blue/20 text-white"
                  : "border-[var(--qp-border-soft)] bg-base-lighter text-muted"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Main Problem / Request" error={errors.mainProblem}>
        <textarea
          className={`${inputClass} resize-none`}
          rows={4}
          value={form.mainProblem}
          onChange={(e) => updateField("mainProblem", e.target.value)}
          placeholder="Describe what you need help with..."
        />
      </Field>
      <Field label="Expected Output">
        <textarea
          className={`${inputClass} resize-none`}
          rows={3}
          value={form.expectedOutput}
          onChange={(e) => updateField("expectedOutput", e.target.value)}
          placeholder="What should be delivered?"
        />
      </Field>
      <Field label="Reference Links">
        <textarea
          className={`${inputClass} resize-none`}
          rows={2}
          value={form.refLinks}
          onChange={(e) => updateField("refLinks", e.target.value)}
          placeholder="Links, screenshots, docs..."
        />
      </Field>

      {error && (
        <div className="rounded-2xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={busy}
        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-verse-purple px-5 font-black text-white disabled:opacity-40"
      >
        {busy ? <Loader2 className="animate-spin" /> : `Continue to payment →`}
      </button>
    </form>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-semibold text-muted">
        {label} <span className="text-red-400">*</span>
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}
