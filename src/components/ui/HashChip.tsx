"use client";

import { useState, type ButtonHTMLAttributes } from "react";

/** Middle-truncate a hash/address: 0x1234abcd…9f8e7d6c */
export function truncateMiddle(value: string, head = 10, tail = 8): string {
  if (!value || value.length <= head + tail + 1) return value;
  return `${value.slice(0, head)}…${value.slice(-tail)}`;
}

/**
 * Kenshi QuestPay DS — HashChip.
 * Copyable mono chip for transaction hashes / wallet addresses. Truncates in
 * the middle and copies the full value on click.
 */
export interface HashChipProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "value"> {
  value: string;
  head?: number;
  tail?: number;
  label?: string;
}

export default function HashChip({
  value,
  head = 10,
  tail = 8,
  label,
  className = "",
  ...rest
}: HashChipProps) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard?.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      /* clipboard unavailable — leave the chip in its default state */
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      title={value}
      aria-label={`Copy ${label ? `${label} ` : ""}${value}`}
      className={`qp-hash ${className}`.trim()}
      {...rest}
    >
      {label && <span className="qp-hash__label">{label}</span>}
      <span className="qp-hash__value">{truncateMiddle(value, head, tail)}</span>
      <span className={`qp-hash__action${copied ? " qp-hash__action--copied" : ""}`}>
        {copied ? "Copied" : "Copy"}
      </span>
    </button>
  );
}
