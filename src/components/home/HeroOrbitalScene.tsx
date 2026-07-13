"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

type TokenId = "verse" | "usdt" | "usdc" | "pol";
type TokenConfig = {
  id: TokenId;
  asset: string;
  radiusX: number;
  radiusY: number;
  offsetY: number;
  phase: number;
  speed: number;
  direction: 1 | -1;
  baseScale: number;
};

const TOKENS: readonly TokenConfig[] = [
  { id: "verse", asset: "/brand/verse/verse-icon-official.png", radiusX: 226, radiusY: 68, offsetY: -6, phase: 4.2, speed: 0.22, direction: 1, baseScale: 0.82 },
  { id: "usdt", asset: "/tokens/usdt.svg", radiusX: 196, radiusY: 58, offsetY: 12, phase: 0.25, speed: 0.28, direction: 1, baseScale: 0.88 },
  { id: "usdc", asset: "/tokens/usdc.svg", radiusX: 215, radiusY: 72, offsetY: 26, phase: 2.2, speed: 0.24, direction: -1, baseScale: 0.82 },
  { id: "pol", asset: "/tokens/pol.svg", radiusX: 168, radiusY: 82, offsetY: -2, phase: 1.5, speed: 0.31, direction: -1, baseScale: 0.76 },
];

const STATIC_POSES: Record<TokenId, { x: number; y: number; front: boolean; scale: number }> = {
  verse: { x: -174, y: 54, front: true, scale: 0.76 },
  usdt: { x: 176, y: -52, front: false, scale: 0.72 },
  usdc: { x: 170, y: 66, front: true, scale: 0.82 },
  pol: { x: -118, y: -88, front: false, scale: 0.68 },
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function smoothstep(edge0: number, edge1: number, value: number) {
  const x = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return x * x * (3 - 2 * x);
}

export default function HeroOrbitalScene({ variant = "home", className = "" }: { variant?: "home" | "signin"; className?: string }) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const rearRefs = useRef<Record<TokenId, HTMLDivElement | null>>({ verse: null, usdt: null, usdc: null, pol: null });
  const frontRefs = useRef<Record<TokenId, HTMLDivElement | null>>({ verse: null, usdt: null, usdc: null, pol: null });
  const timeRef = useRef(0);
  const lastRef = useRef<number | null>(null);
  const visibleRef = useRef(true);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const renderStatic = () => {
      const mobile = window.innerWidth < 768;
      const sceneScale = (mobile ? 0.7 : 1) * (variant === "signin" ? 0.64 : 1);
      TOKENS.forEach((token) => {
        const pose = STATIC_POSES[token.id];
        const rear = rearRefs.current[token.id];
        const front = frontRefs.current[token.id];
        if (!rear || !front) return;
        const transform = `translate3d(${pose.x * sceneScale}px, ${pose.y * sceneScale}px, 0) scale(${pose.scale * sceneScale})`;
        rear.style.transform = transform;
        front.style.transform = transform;
        rear.style.opacity = pose.front ? "0" : "0.8";
        front.style.opacity = pose.front ? "1" : "0";
      });
    };

    if (media.matches) {
      renderStatic();
      return;
    }

    const observer = new IntersectionObserver(([entry]) => {
      visibleRef.current = entry.isIntersecting;
      lastRef.current = null;
    }, { rootMargin: "160px", threshold: 0.01 });
    observer.observe(root);

    let raf = 0;
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (!visibleRef.current || document.hidden) {
        lastRef.current = null;
        return;
      }
      if (lastRef.current == null) {
        lastRef.current = now;
        return;
      }
      const dt = Math.min((now - lastRef.current) / 1000, 0.04);
      lastRef.current = now;
      timeRef.current += dt;

      const mobile = window.innerWidth < 768;
      const sceneScale = (mobile ? 0.7 : 1) * (variant === "signin" ? 0.64 : 1);
      for (const token of TOKENS) {
        const rear = rearRefs.current[token.id];
        const front = frontRefs.current[token.id];
        if (!rear || !front) continue;
        const angle = token.phase + timeRef.current * token.speed * token.direction;
        const z = Math.sin(angle);
        const x = Math.cos(angle) * token.radiusX * sceneScale;
        const y = (Math.sin(angle) * token.radiusY + token.offsetY) * sceneScale;
        const depth = (z + 1) / 2;
        const scale = token.baseScale * (0.86 + depth * 0.18) * sceneScale;
        const transform = `translate3d(${x}px, ${y}px, 0) scale(${scale}) rotate(${angle * 18}deg)`;
        const baseOpacity = 0.72 + depth * 0.28;
        const frontMix = smoothstep(-0.16, 0.16, z);
        rear.style.transform = transform;
        front.style.transform = transform;
        rear.style.opacity = String((1 - frontMix) * baseOpacity);
        front.style.opacity = String(frontMix * baseOpacity);
      }
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [variant]);

  const tokenLayer = (depth: "rear" | "front") => (
    <div className={`qp-orbit-token-layer qp-orbit-token-layer--${depth}`}>
      {TOKENS.map((token) => (
        <div
          key={`${depth}-${token.id}`}
          ref={(node) => { (depth === "rear" ? rearRefs : frontRefs).current[token.id] = node; }}
          className={`qp-orbit-token qp-orbit-token--${token.id}`}
        >
          <Image src={token.asset} alt="" width={58} height={58} />
        </div>
      ))}
    </div>
  );

  return (
    <div ref={rootRef} className={`qp-orbit-scene qp-orbit-scene--${variant} ${className}`} aria-hidden="true" data-testid="hero-orbital-scene">
      <div className="qp-orbit-scene__ambient" />
      <div className="qp-orbit-ring qp-orbit-ring--rear" />
      {tokenLayer("rear")}
      <div className="qp-cube-float-wrap">
        <div className="qp-cube-asset-wrap">
          <Image className="qp-cube-asset" src="/illustrations/questpay-hero-cube-clean.svg" alt="" width={580} height={540} priority={variant === "home"} />
          <div className="qp-cube-edge-glow" />
          <div className="qp-cube-mark-wrap">
            <Image className="qp-cube-mark-asset" src="/brand/verse/verse-icon-official.png" alt="" width={96} height={96} priority={variant === "home"} />
          </div>
        </div>
      </div>
      <div className="qp-orbit-ring qp-orbit-ring--front" />
      {tokenLayer("front")}
    </div>
  );
}
