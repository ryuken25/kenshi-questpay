import Image from "next/image";
import type { ComponentPropsWithRef, ReactNode } from "react";

/**
 * Kenshi QuestPay DS — Eyebrow.
 * Mono UPPERCASE pill with wide tracking, optionally prefixed by the VERSE mark
 * (e.g. "POWERED BY VERSE", "REAL PAYMENT LADDER").
 *
 * Accepts a `ref` (React 19 passes it as a plain prop) so the motion layer can
 * measure the pill for the overflow-only marquee.
 */
export interface EyebrowProps extends ComponentPropsWithRef<"span"> {
  /** Show the VERSE glyph before the label. */
  verse?: boolean;
  children?: ReactNode;
}

export default function Eyebrow({ verse = false, children, className = "", ...rest }: EyebrowProps) {
  return (
    <span className={`qp-eyebrow ${className}`.trim()} {...rest}>
      {verse && (
        <Image src="/brand/verse/verse-v-glow.svg" alt="" width={12} height={11} aria-hidden="true" />
      )}
      {children}
    </span>
  );
}
