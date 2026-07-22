import type { HTMLAttributes, ReactNode } from "react";

/**
 * Kenshi QuestPay DS — Badge (status pill).
 *
 * Tones map to the QuestPay semantic colors. `dot` adds a glowing status dot
 * (live/delivered states); `mono` switches to JetBrains Mono for on-chain or
 * numeric labels. Styling lives in globals.css (.qp-badge) so this stays a
 * server-renderable component with no client JS.
 */
export type BadgeTone = "neutral" | "violet" | "success" | "warning" | "danger" | "info";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  dot?: boolean;
  mono?: boolean;
  children?: ReactNode;
}

export default function Badge({
  tone = "neutral",
  dot = false,
  mono = false,
  children,
  className = "",
  ...rest
}: BadgeProps) {
  const classes = [
    "qp-badge",
    tone !== "neutral" ? `qp-badge--${tone}` : "",
    mono ? "qp-badge--mono" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={classes} {...rest}>
      {dot && <span className="qp-badge__dot" aria-hidden="true" />}
      {children}
    </span>
  );
}
