import type { ButtonHTMLAttributes, ReactNode } from "react";

/**
 * Kenshi QuestPay DS — ChoiceTile.
 * Selectable network/token tile. `selected` gets the violet ring + corner glow;
 * `staged` renders the visible-but-not-selectable state used for chains that are
 * wired up but still behind the payment gate (e.g. BNB Chain).
 */
export interface ChoiceTileProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "disabled"> {
  selected?: boolean;
  /** Visible but not selectable — behind the payment gate. */
  staged?: boolean;
  icon?: ReactNode;
  /** Right-aligned caption, e.g. "Staged". */
  meta?: ReactNode;
  children?: ReactNode;
  className?: string;
}

export default function ChoiceTile({
  selected = false,
  staged = false,
  icon,
  meta,
  children,
  className = "",
  ...rest
}: ChoiceTileProps) {
  return (
    <button
      type="button"
      className={`qp-choice ${className}`.trim()}
      data-selected={selected ? "true" : undefined}
      data-staged={staged ? "true" : undefined}
      aria-pressed={selected}
      disabled={staged}
      {...rest}
    >
      {icon}
      <span>{children}</span>
      {meta && <span className="qp-choice__meta">{meta}</span>}
    </button>
  );
}
