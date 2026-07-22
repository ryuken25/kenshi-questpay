import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

/**
 * Kenshi QuestPay DS — form primitives (Input, Textarea, Select, Checkbox).
 *
 * Labelled fields with the violet focus ring and inline error/hint, matching the
 * published DS. Styling comes from the existing `.qp-field / .qp-select /
 * .qp-textarea / .qp-label` classes in globals.css (which already match the DS
 * spec exactly), so these render identically and need no client JS for focus.
 */

function slugId(label?: ReactNode, explicit?: string): string | undefined {
  if (explicit) return explicit;
  if (typeof label !== "string") return undefined;
  return `qp-input-${label.replace(/\s+/g, "-").toLowerCase()}`;
}

interface FieldShellProps {
  id?: string;
  label?: ReactNode;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
}

function FieldShell({ id, label, required, error, hint, children }: FieldShellProps) {
  return (
    <div className="qp-field-group">
      {label && (
        <label htmlFor={id} className="qp-label">
          {label} {required && <span className="qp-label__required" aria-hidden="true">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <span className="qp-field-error" role="alert">
          {error}
        </span>
      ) : hint ? (
        <span className="qp-field-hint">{hint}</span>
      ) : null}
    </div>
  );
}

/* ── Input ─────────────────────────────────────────────────── */
export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "className"> {
  label?: ReactNode;
  error?: string;
  hint?: string;
}

export function Input({ label, required, error, hint, id, ...rest }: InputProps) {
  const inputId = slugId(label, id);
  return (
    <FieldShell id={inputId} label={label} required={required} error={error} hint={hint}>
      <input
        id={inputId}
        required={required}
        aria-invalid={error ? true : undefined}
        className={`qp-field${error ? " qp-field--error" : ""}`}
        {...rest}
      />
    </FieldShell>
  );
}

/* ── Textarea ──────────────────────────────────────────────── */
export interface TextareaProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "className"> {
  label?: ReactNode;
  error?: string;
  hint?: string;
}

export function Textarea({ label, required, error, hint, id, ...rest }: TextareaProps) {
  const inputId = slugId(label, id);
  return (
    <FieldShell id={inputId} label={label} required={required} error={error} hint={hint}>
      <textarea
        id={inputId}
        required={required}
        aria-invalid={error ? true : undefined}
        className={`qp-textarea${error ? " qp-field--error" : ""}`}
        {...rest}
      />
    </FieldShell>
  );
}

/* ── Select ────────────────────────────────────────────────── */
export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "className"> {
  label?: ReactNode;
  error?: string;
  hint?: string;
  children?: ReactNode;
}

export function Select({ label, required, error, hint, id, children, ...rest }: SelectProps) {
  const inputId = slugId(label, id);
  return (
    <FieldShell id={inputId} label={label} required={required} error={error} hint={hint}>
      <select
        id={inputId}
        required={required}
        aria-invalid={error ? true : undefined}
        className={`qp-select${error ? " qp-field--error" : ""}`}
        {...rest}
      >
        {children}
      </select>
    </FieldShell>
  );
}

/* ── Checkbox ──────────────────────────────────────────────── */
export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "className"> {
  label: ReactNode;
}

export function Checkbox({ label, id, ...rest }: CheckboxProps) {
  const inputId = slugId(typeof label === "string" ? label : undefined, id);
  return (
    <label className="qp-checkbox" htmlFor={inputId}>
      <input id={inputId} type="checkbox" {...rest} />
      <span className="qp-checkbox__label">{label}</span>
    </label>
  );
}
