import type { HTMLAttributes, ReactNode } from "react";

/**
 * Kenshi QuestPay DS — Card.
 * Glass surface. `strong` adds the violet corner-glow + violet-tinted border;
 * `glow` adds the outer violet bloom for focal panels.
 */
export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "strong";
  glow?: boolean;
  children?: ReactNode;
}

export default function Card({
  variant = "default",
  glow = false,
  children,
  className = "",
  ...rest
}: CardProps) {
  const classes = [
    variant === "strong" ? "qp-card--strong" : "qp-card",
    glow ? "glow-purple" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes} {...rest}>
      {children}
    </div>
  );
}
