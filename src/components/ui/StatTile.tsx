import type { HTMLAttributes, ReactNode } from "react";

/**
 * Kenshi QuestPay DS — StatTile.
 * Big display-font metric over a muted caption, on a hairline glass surface.
 * Used in the hero and dashboard stat rows.
 */
export interface StatTileProps extends HTMLAttributes<HTMLDivElement> {
  value: ReactNode;
  label: ReactNode;
  /** Render the value in brand violet instead of white. */
  accent?: boolean;
  align?: "left" | "center" | "right";
}

export default function StatTile({
  value,
  label,
  accent = false,
  align = "left",
  className = "",
  style,
  ...rest
}: StatTileProps) {
  return (
    <div
      className={`qp-stat ${className}`.trim()}
      style={{ textAlign: align, ...style }}
      {...rest}
    >
      <span className={`qp-stat__value${accent ? " qp-stat__value--accent" : ""}`}>{value}</span>
      <span className="qp-stat__label">{label}</span>
    </div>
  );
}
