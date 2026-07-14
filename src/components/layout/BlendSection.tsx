import { type ReactNode } from 'react';

interface BlendSectionProps {
  /** HTML id attribute */
  id?: string;
  /** Additional CSS classes */
  className?: string;
  /** Horizontal position of the glow centre (CSS value, default '50%') */
  glowX?: string;
  /** Glow colour (CSS colour string) */
  glowColor?: string;
  /** Section children */
  children: ReactNode;
}

/**
 * BlendSection — reusable section wrapper that applies a soft masked radial-gradient
 * glow at a configurable x-position so sections blend into the continuous dark canvas.
 */
export default function BlendSection({
  id,
  className = '',
  glowX = '50%',
  glowColor = 'rgba(106,47,216,.075)',
  children,
}: BlendSectionProps) {
  return (
    <section
      id={id}
      className={`qp-blend-section ${className}`}
      style={
        {
          '--blend-x': glowX,
          '--blend-color': glowColor,
        } as React.CSSProperties
      }
    >
      {children}
    </section>
  );
}
