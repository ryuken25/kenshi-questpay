"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { briefSchema, type BriefFormData, type CreateOrderInput, CONTACT_METHOD_LABELS, type ContactMethod } from "@/lib/schemas";
import { NETWORKS, getEnabledTokensForChain, type ChainKey, type TokenSymbol } from "@/lib/services";
import type { AccountProfile } from "@/lib/profile";

interface Props {
  slug: string;
  serviceName: string;
  serviceUsd: number;
  profile: AccountProfile | null;
}

const inputClass =
  "w-full rounded-xl border border-[var(--qp-border-soft)] bg-base-lighter px-4 py-3 text-base text-[var(--qp-text-primary)] placeholder:text-[var(--qp-text-subtle)] outline-none transition-colors focus:border-verse-purple/50";

const CONTACT_METHODS = Object.keys(CONTACT_METHOD_LABELS) as ContactMethod[];

export default function CheckoutForm({ slug, serviceName, serviceUsd, profile }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<BriefFormData>({
    customerName: profile?.displayName || "",
    contactMethod: (profile?.contactMethod as ContactMethod) || "email",
    contactValue: profile?.contactValue || "",
    projectLink: "",
    deadline: "",
    mainProblem: "",
    expectedOutput: "",
    refLinks: "",
    notes: "",
  });
  const [chainKey, setChainKey] = useState<ChainKey>(
    profile?.preferredChain && NETWORKS[profile.preferredChain].status === "live" ? profile.preferredChain : "polygon",
  );
  const enabledTokens = useMemo(() => getEnabledTokensForChain(chainKey), [chainKey]);
  const [token, setToken] = useState<TokenSymbol>(enabledTokens[0]?.symbol || "USDT");
  const [saveDefaults, setSaveDefaults] = useState(false);
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

  const selectChain = (next: ChainKey) => {
    setChainKey(next);
    const nextTokens = getEnabledTokensForChain(next);
    if (nextTokens.length && !nextTokens.some((t) => t.symbol === token)) {
      setToken(nextTokens[0].symbol);
    }
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
        chainKey,
        tokenSymbol: token,
        saveProfileDefaults: saveDefaults,
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
    <form onSubmit={handleSubmit} className="glass-panel-strong space-y-6 rounded-2xl p-5 sm:p-8">
      {/* Your account */}
      <section className="space-y-3">
        <SectionTitle>Your account</SectionTitle>
        <div className="flex items-center gap-3 rounded-2xl border border-[var(--qp-border-soft)] bg-white/[0.02] p-3">
          <span className="grid size-10 place-items-center rounded-full bg-verse-purple/20 font-black text-white">
            {(profile?.displayName || "Q").slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate font-bold text-white">{profile?.displayName || "QuestPay account"}</p>
            <a href="/account" className="text-xs text-[#c1b6ff] hover:text-white">Edit profile</a>
          </div>
        </div>
      </section>

      {/* Payment setup */}
      <section className="space-y-3">
        <SectionTitle>Payment setup</SectionTitle>
        <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm leading-6 text-amber-100">
          <b>Payment safety gate:</b> orders create locked, server-authoritative quotes. Polygon supports USDT, USDC, POL, and VERSE. BNB Chain is visible but staged behind the payment gate until verification is upgraded.
        </div>
        <Field label="Network" required>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(NETWORKS) as ChainKey[]).map((key) => {
              const net = NETWORKS[key];
              const isLive = net.status === "live";
              return (
                <button
                  key={key}
                  type="button"
                  disabled={!isLive}
                  onClick={() => selectChain(key)}
                  data-selected={chainKey === key}
                  className="qp-choice"
                  title={isLive ? undefined : "Staged — not yet accepting payment"}
                >
                  <span className="qp-choice-icon">{net.name.slice(0, 1)}</span>
                  <span className="min-w-0 text-left">
                    <span className="block truncate font-bold">{net.name}</span>
                    <span className="block text-xs text-[var(--qp-text-muted)]">{isLive ? "Live" : "Staged"}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </Field>
        <Field label="Payment token" required>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {enabledTokens.map((t) => (
              <button
                key={t.symbol}
                type="button"
                onClick={() => setToken(t.symbol)}
                data-selected={token === t.symbol}
                className="qp-choice justify-center"
              >
                <span className="font-black">{t.symbol}</span>
              </button>
            ))}
          </div>
          {enabledTokens.length === 0 ? (
            <p className="mt-2 text-xs text-amber-200">No tokens are enabled on this network yet.</p>
          ) : null}
        </Field>
      </section>

      {/* Project details */}
      <section className="space-y-4">
        <SectionTitle>Project details</SectionTitle>
        <Field label="Project link">
          <input
            className={inputClass}
            value={form.projectLink}
            onChange={(e) => updateField("projectLink", e.target.value)}
            placeholder="https://..."
          />
        </Field>
        <Field label="Main Problem / Request" required error={errors.mainProblem}>
          <textarea
            className={`${inputClass} resize-none`}
            rows={4}
            value={form.mainProblem}
            onChange={(e) => updateField("mainProblem", e.target.value)}
            placeholder="Describe what you need help with..."
          />
        </Field>
        <Field label="Expected output">
          <textarea
            className={`${inputClass} resize-none`}
            rows={3}
            value={form.expectedOutput}
            onChange={(e) => updateField("expectedOutput", e.target.value)}
            placeholder="What should be delivered?"
          />
        </Field>
        <Field label="Reference links">
          <textarea
            className={`${inputClass} resize-none`}
            rows={2}
            value={form.refLinks}
            onChange={(e) => updateField("refLinks", e.target.value)}
            placeholder="Links, screenshots, docs..."
          />
        </Field>
      </section>

      {/* Contact & timing */}
      <section className="space-y-4">
        <SectionTitle>Contact & timing</SectionTitle>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Name / Handle" required error={errors.customerName}>
            <input
              className={inputClass}
              value={form.customerName}
              onChange={(e) => updateField("customerName", e.target.value)}
              placeholder="e.g., @ryuken"
            />
          </Field>
          <Field label="Contact method" required error={errors.contactMethod}>
            <select className={inputClass} value={form.contactMethod} onChange={(e) => updateField("contactMethod", e.target.value)}>
              {CONTACT_METHODS.map((m) => (
                <option key={m} value={m}>{CONTACT_METHOD_LABELS[m]}</option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Contact value" required error={errors.contactValue}>
          <input
            className={inputClass}
            value={form.contactValue}
            onChange={(e) => updateField("contactValue", e.target.value)}
            placeholder="user#1234, @handle, email@example.com"
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
        <label className="flex items-start gap-2 text-sm text-[var(--qp-text-muted)]">
          <input type="checkbox" checked={saveDefaults} onChange={(e) => setSaveDefaults(e.target.checked)} className="mt-1" />
          Save these contact details to my profile
        </label>
      </section>

      {error && (
        <div className="rounded-2xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={busy || enabledTokens.length === 0}
        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-verse-purple px-5 font-black text-white disabled:opacity-40"
      >
        {busy ? <Loader2 className="animate-spin" /> : `Continue to payment →`}
      </button>
    </form>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--qp-text-muted)]">{children}</h2>;
}

function Field({ label, required = false, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-semibold text-muted">
        {label} {required ? <span className="text-red-400">*</span> : null}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}
