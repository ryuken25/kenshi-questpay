"use client";

import { useState, useEffect, useRef } from "react";
import { ShieldCheck, Link2, ChevronRight, Check, Clock3, LockKeyhole } from "lucide-react";
import AuthModal from "@/components/auth/AuthModal";
import type { ServicePackage } from "@/lib/services";
import { ENABLED_TOKEN_SYMBOLS } from "@/lib/token-metadata";

type Step = "project" | "details" | "review";

type DraftData = {
  version: number;
  serviceSlug: string;
  currentStep: Step;
  values: {
    projectGoal: string;
    projectLink: string;
    contactMethod: string;
    contactValue: string;
    extraContext: string;
    targetDevice: string;
    deadline: string;
  };
  returnUrl: string;
  updatedAt: string;
};

const DRAFT_KEY = "questpay_checkout_draft";
const DRAFT_EXPIRY_MS = 1000 * 60 * 60 * 24; // 24 hours

function saveDraft(data: DraftData) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
  } catch {}
}

function loadDraft(slug: string): DraftData | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const data: DraftData = JSON.parse(raw);
    if (data.serviceSlug !== slug) return null;
    const age = Date.now() - new Date(data.updatedAt).getTime();
    if (age > DRAFT_EXPIRY_MS) {
      localStorage.removeItem(DRAFT_KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

function clearDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {}
}

const inputClass = "w-full rounded-xl border border-[var(--qp-border-soft)] bg-[var(--qp-surface)] px-4 py-3 text-sm text-[var(--qp-text-primary)] placeholder:text-[var(--qp-text-subtle)] focus:border-[var(--qp-violet-400)] focus:outline-none focus:ring-2 focus:ring-[var(--qp-focus-ring)] transition-colors min-h-[48px]";
const labelClass = "block text-sm font-medium text-[var(--qp-text-secondary)] mb-1.5";

export default function CheckoutBriefForm({ service, next, authenticated, profileEmail, profileName }: {
  service: ServicePackage;
  next: string;
  authenticated: boolean;
  profileEmail?: string;
  profileName?: string;
}) {
  const [step, setStep] = useState<Step>("project");
  const [authOpen, setAuthOpen] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const [values, setValues] = useState({
    projectGoal: "",
    projectLink: "",
    contactMethod: profileEmail ? "email" : "telegram",
    contactValue: profileEmail || "",
    extraContext: "",
    targetDevice: "",
    deadline: "",
  });

  // Restore draft on mount
  useEffect(() => {
    const draft = loadDraft(service.slug);
    if (draft) {
      setValues(draft.values);
      setStep(draft.currentStep);
      setSavedAt(new Date(draft.updatedAt).toLocaleTimeString());
    }
  }, [service.slug]);

  // Autosave
  useEffect(() => {
    const timer = setTimeout(() => {
      saveDraft({
        version: 1,
        serviceSlug: service.slug,
        currentStep: step,
        values,
        returnUrl: next,
        updatedAt: new Date().toISOString(),
      });
      setSavedAt(new Date().toLocaleTimeString());
    }, 800);
    return () => clearTimeout(timer);
  }, [values, step, service.slug, next]);

  const update = (key: keyof typeof values, val: string) => {
    setValues((prev) => ({ ...prev, [key]: val }));
  };

  const goalLength = values.projectGoal.trim().length;
  const canProceedProject = goalLength >= 10;
  const contactValue = values.contactValue.trim();
  const canProceedDetails = values.contactMethod === "email"
    ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactValue)
    : values.contactMethod === "telegram"
      ? /^@[A-Za-z0-9_]{5,}$/.test(contactValue)
      : contactValue.length >= 3;
  const minDeadline = new Date().toISOString().slice(0, 10);

  const handleReview = () => {
    if (!authenticated) {
      // Save draft and open auth
      saveDraft({
        version: 1,
        serviceSlug: service.slug,
        currentStep: "review",
        values,
        returnUrl: next,
        updatedAt: new Date().toISOString(),
      });
      setAuthOpen(true);
    } else {
      setStep("review");
    }
  };

  const handleAuthenticated = () => {
    setAuthOpen(false);
    // Reload to restore session
    window.location.assign(next);
  };

  const steps: { id: Step; label: string }[] = [
    { id: "project", label: "Project" },
    { id: "details", label: "Details" },
    { id: "review", label: "Review" },
  ];

  return (
    <div className="mx-auto max-w-2xl rounded-[1.75rem] border border-[var(--qp-border-soft)] bg-[linear-gradient(180deg,rgba(12,11,20,.96),rgba(5,5,10,.98))] p-4 shadow-[0_28px_80px_rgba(0,0,0,.32)] sm:p-7">
      <div className="mb-6 flex items-start gap-3 border-b border-[var(--qp-border-faint)] pb-5">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-[var(--qp-border-default)] bg-[rgba(135,82,255,.12)] text-[var(--qp-violet-300)]"><LockKeyhole size={18} /></span>
        <div>
          <p className="font-sora text-lg font-bold text-white">Start your private brief</p>
          <p className="mt-1 text-sm leading-6 text-muted">Three quick steps. Your draft saves automatically on this device.</p>
        </div>
      </div>
      {/* Step indicator */}
      <div className="mb-6 flex items-center gap-1.5" aria-label="Checkout progress">
        {steps.map((s, i) => (
          <div key={s.id} className="flex min-w-0 flex-1 items-center gap-1.5">
            <div aria-current={step === s.id ? "step" : undefined} className={`flex min-w-0 flex-1 items-center gap-1.5 rounded-xl border px-2 py-2 text-xs font-semibold sm:px-3 ${step === s.id ? "border-[var(--qp-border-strong)] bg-[rgba(135,82,255,.16)] text-[var(--qp-violet-200)]" : "border-transparent text-[var(--qp-text-subtle)]"}`}>
              <span className={`grid size-5 shrink-0 place-items-center rounded-full text-[10px] ${step === s.id ? "bg-[var(--qp-violet-500)] text-white" : "bg-[var(--qp-surface-raised)] text-[var(--qp-text-subtle)]"}`}>{i + 1}</span>
              <span className="truncate max-[360px]:sr-only">{s.label}</span>
            </div>
            {i < steps.length - 1 && <ChevronRight size={13} className="shrink-0 text-[var(--qp-text-subtle)]" />}
          </div>
        ))}
      </div>
      {savedAt && <p role="status" className="-mt-3 mb-5 flex items-center justify-end gap-1 text-[11px] text-subtle"><Check size={12} /> Draft saved {savedAt}</p>}

      {/* Service summary */}
      <div className="mb-6 rounded-2xl border border-[var(--qp-border-default)] bg-[rgba(135,82,255,.06)] p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-sora text-lg font-bold text-white">{service.name}</h2>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-muted"><Clock3 size={13} /> {service.delivery} · {service.revisions} revisions</p>
          </div>
          <div className="text-right">
            <p className="font-mono text-xl font-black text-white">${service.usd}</p>
            <p className="text-[10px] text-subtle">from · {ENABLED_TOKEN_SYMBOLS.join(", ")}</p>
          </div>
        </div>
      </div>

      {/* Step 1: Project */}
      {step === "project" && (
        <div className="space-y-5 qp-step-enter">
          <div>
            <label className={labelClass} htmlFor="goal">What should this service help you achieve? <span className="text-[var(--qp-danger)]">*</span></label>
            <textarea
              id="goal"
              className={`${inputClass} min-h-[120px] resize-y`}
              placeholder={`Describe your goal for: ${service.name}...`}
              value={values.projectGoal}
              onChange={(e) => update("projectGoal", e.target.value)}
              maxLength={2000}
              required
              aria-describedby="goal-help goal-count"
            />
            <div className="mt-1 flex items-start justify-between gap-3 text-[11px] text-subtle">
              <p id="goal-help">Be specific about the outcome. Your brief stays private.</p>
              <p id="goal-count" className={goalLength > 0 && goalLength < 10 ? "shrink-0 text-amber-300" : "shrink-0"}>{goalLength}/10 min</p>
            </div>
          </div>
          <div>
            <label className={labelClass} htmlFor="link">Project link or reference</label>
            <div className="relative">
              <Link2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--qp-text-subtle)]" />
              <input
                id="link"
                type="url"
                className={`${inputClass} pl-10`}
                placeholder="https://figma.com/..., github.com/..., or any URL"
                value={values.projectLink}
                onChange={(e) => update("projectLink", e.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="device">Target device (optional)</label>
              <select id="device" className={inputClass} value={values.targetDevice} onChange={(e) => update("targetDevice", e.target.value)}>
                <option value="">Any</option>
                <option value="mobile">Mobile</option>
                <option value="desktop">Desktop</option>
                <option value="both">Both</option>
              </select>
            </div>
            <div>
              <label className={labelClass} htmlFor="deadline">Desired deadline (optional)</label>
              <input id="deadline" type="date" min={minDeadline} className={inputClass} value={values.deadline} onChange={(e) => update("deadline", e.target.value)} />
            </div>
          </div>
          <div className="qp-checkout-actions">
            <button ref={triggerRef} type="button" disabled={!canProceedProject} onClick={() => setStep("details")} aria-describedby={!canProceedProject ? "project-cta-help" : undefined} className="qp-button qp-button--primary w-full min-h-[50px] disabled:opacity-45">
              Continue to contact details
            </button>
            {!canProceedProject && <p id="project-cta-help" className="mt-2 text-center text-xs text-subtle">Add at least 10 characters so the creator understands the goal.</p>}
          </div>
        </div>
      )}

      {/* Step 2: Details */}
      {step === "details" && (
        <div className="space-y-5 qp-step-enter">
          <div>
            <label className={labelClass} htmlFor="contact-method">Preferred contact method</label>
            <select id="contact-method" className={inputClass} value={values.contactMethod} onChange={(e) => update("contactMethod", e.target.value)}>
              <option value="email">Email</option>
              <option value="telegram">Telegram</option>
              <option value="discord">Discord</option>
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="contact-value">Contact value <span className="text-[var(--qp-danger)]">*</span></label>
            <input
              id="contact-value"
              className={inputClass}
              placeholder={values.contactMethod === "email" ? "you@example.com" : values.contactMethod === "telegram" ? "@username" : "username#0000"}
              value={values.contactValue}
              onChange={(e) => update("contactValue", e.target.value)}
              type={values.contactMethod === "email" ? "email" : "text"}
              inputMode={values.contactMethod === "email" ? "email" : "text"}
              autoComplete={values.contactMethod === "email" ? "email" : "off"}
              required
              aria-describedby="contact-help"
            />
            {profileEmail && values.contactMethod === "email" && (
              <p className="mt-1 text-[11px] text-[var(--qp-text-subtle)]">Prefilled from your profile</p>
            )}
            <p id="contact-help" className={`mt-1 text-[11px] ${contactValue && !canProceedDetails ? "text-amber-300" : "text-subtle"}`}>
              {values.contactMethod === "telegram" ? "Use your public username, for example @yourname." : values.contactMethod === "email" ? "We only use this for order updates." : "Use the username the creator should contact."}
            </p>
          </div>
          <div>
            <label className={labelClass} htmlFor="extra">Extra context (optional)</label>
            <textarea
              id="extra"
              className={`${inputClass} min-h-[80px] resize-y`}
              placeholder="Brand constraints, visual references, access notes..."
              value={values.extraContext}
              onChange={(e) => update("extraContext", e.target.value)}
              maxLength={1000}
            />
          </div>
          <div className="qp-checkout-actions flex gap-3">
            <button type="button" onClick={() => setStep("project")} className="qp-button qp-button--secondary min-h-[50px] px-6">Back</button>
            <button
              type="button"
              disabled={!canProceedDetails}
              onClick={handleReview}
              className="qp-button qp-button--primary flex-1 min-h-[50px] disabled:opacity-45"
            >
              {authenticated ? "Review" : "Save & Sign In"}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Review */}
      {step === "review" && authenticated && (
        <div className="space-y-5 qp-step-enter">
          <div className="rounded-2xl border border-[var(--qp-border-soft)] bg-[var(--qp-surface)] p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-[var(--qp-border-faint)] pb-2">
              <h3 className="font-sora text-sm font-bold text-white">Review your brief</h3>
              <button type="button" onClick={() => setStep("project")} className="text-xs text-[var(--qp-violet-300)] hover:underline">Edit</button>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-[var(--qp-text-subtle)]">Project goal</p>
              <p className="text-sm text-[var(--qp-text-primary)] mt-0.5">{values.projectGoal}</p>
            </div>
            {values.projectLink && (
              <div>
                <p className="text-[10px] uppercase tracking-wide text-[var(--qp-text-subtle)]">Reference link</p>
                <p className="text-sm text-[var(--qp-text-primary)] mt-0.5 break-all">{values.projectLink}</p>
              </div>
            )}
            <div>
              <p className="text-[10px] uppercase tracking-wide text-[var(--qp-text-subtle)]">Contact</p>
              <p className="text-sm text-[var(--qp-text-primary)] mt-0.5">{values.contactMethod}: {values.contactValue}</p>
            </div>
            {values.extraContext && (
              <div>
                <p className="text-[10px] uppercase tracking-wide text-[var(--qp-text-subtle)]">Extra context</p>
                <p className="text-sm text-[var(--qp-text-primary)] mt-0.5">{values.extraContext}</p>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-[var(--qp-violet-300)]/20 bg-[var(--qp-violet-soft)]/10 p-4">
            <div className="flex items-center gap-2 text-sm text-[var(--qp-violet-200)]">
              <ShieldCheck size={16} />
              <span className="font-medium">Privacy: Your brief is encrypted and never exposed on the public receipt.</span>
            </div>
          </div>

          {/* Submit to original CheckoutForm by redirecting to the actual order creation */}
          <form action={`/api/orders`} method="POST" className="qp-checkout-actions">
            <input type="hidden" name="serviceSlug" value={service.slug} />
            <input type="hidden" name="projectGoal" value={values.projectGoal} />
            <input type="hidden" name="projectLink" value={values.projectLink} />
            <input type="hidden" name="contactMethod" value={values.contactMethod} />
            <input type="hidden" name="contactValue" value={values.contactValue} />
            <input type="hidden" name="extraContext" value={values.extraContext} />
            <input type="hidden" name="targetDevice" value={values.targetDevice} />
            <input type="hidden" name="deadline" value={values.deadline} />
            <button
              type="submit"
              onClick={() => clearDraft()}
              className="qp-button qp-button--primary w-full min-h-[50px]"
            >
              Continue to secure quote
            </button>
          </form>

          <button type="button" onClick={() => setStep("details")} className="text-xs text-[var(--qp-text-subtle)] hover:text-[var(--qp-text-secondary)] w-full text-center">← Back to details</button>
        </div>
      )}

      {/* Auth modal for unauthenticated users */}
      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        onAuthenticated={handleAuthenticated}
        intent="signin"
        next={next}
        returnFocusRef={triggerRef}
      />
    </div>
  );
}
