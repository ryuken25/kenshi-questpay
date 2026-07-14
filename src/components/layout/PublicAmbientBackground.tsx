'use client';

/**
 * PublicAmbientBackground
 * Fixed-position ambient glow layer with violet radial gradient blobs and noise overlay.
 * Renders as a non-interactive overlay behind all page content (z-index: -2).
 */
export default function PublicAmbientBackground() {
  return (
    <div className="qp-public-ambient" aria-hidden="true">
      <div className="qp-public-ambient__glow qp-public-ambient__glow--1" />
      <div className="qp-public-ambient__glow qp-public-ambient__glow--2" />
      <div className="qp-public-ambient__noise" />
    </div>
  );
}
