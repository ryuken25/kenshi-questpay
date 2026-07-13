"use client";

import Image from "next/image";
import { useEffect, useRef, type CSSProperties } from "react";

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
  frontDrift: number;
};
type ParticleLayer = "far" | "glow" | "spark";
type ParticleConfig = {
  baseX: number;
  baseY: number;
  amplitudeX: number;
  amplitudeY: number;
  speedX: number;
  speedY: number;
  pulseSpeed: number;
  phase: number;
  opacity: number;
  size: number;
};

const TOKENS: readonly TokenConfig[] = [
  { id: "verse", asset: "/brand/verse/verse-icon-official.png", radiusX: 226, radiusY: 68, offsetY: -6, phase: 4.2, speed: 0.218, direction: 1, baseScale: 0.82, frontDrift: -240 },
  { id: "usdt", asset: "/tokens/usdt.svg", radiusX: 196, radiusY: 58, offsetY: 12, phase: 0.25, speed: 0.276, direction: 1, baseScale: 0.88, frontDrift: 150 },
  { id: "usdc", asset: "/tokens/usdc.svg", radiusX: 215, radiusY: 72, offsetY: 26, phase: 2.2, speed: 0.237, direction: -1, baseScale: 0.82, frontDrift: 150 },
  { id: "pol", asset: "/tokens/pol.svg", radiusX: 168, radiusY: 82, offsetY: -2, phase: 1.5, speed: 0.304, direction: -1, baseScale: 0.76, frontDrift: -380 },
];

const STATIC_POSES: Record<TokenId, { x: number; y: number; front: boolean; scale: number }> = {
  verse: { x: -174, y: 54, front: true, scale: 0.76 },
  usdt: { x: 176, y: -52, front: false, scale: 0.72 },
  usdc: { x: 170, y: 66, front: true, scale: 0.82 },
  pol: { x: -118, y: -88, front: false, scale: 0.68 },
};

function particleSet(count: number, layer: ParticleLayer): readonly ParticleConfig[] {
  const isFar = layer === "far";
  const isSpark = layer === "spark";
  return Array.from({ length: count }, (_, index) => {
    const seed = index + (isFar ? 11 : isSpark ? 71 : 43);
    const spanX = isFar ? 500 : isSpark ? 400 : 360;
    const spanY = isFar ? 300 : isSpark ? 230 : 250;
    return {
      baseX: ((seed * 83) % spanX) - spanX / 2,
      baseY: ((seed * 47) % spanY) - spanY / 2,
      amplitudeX: (isSpark ? 28 : isFar ? 9 : 14) + ((seed * 7) % (isSpark ? 32 : 13)),
      amplitudeY: (isSpark ? 12 : isFar ? 7 : 10) + ((seed * 11) % (isSpark ? 18 : 12)),
      speedX: (isSpark ? 0.12 : 0.055) + (seed % 7) * (isSpark ? 0.013 : 0.008),
      speedY: (isSpark ? 0.1 : 0.045) + (seed % 5) * (isSpark ? 0.015 : 0.009),
      pulseSpeed: 0.18 + (seed % 9) * 0.027,
      phase: seed * 0.731,
      opacity: isSpark ? 0.3 : isFar ? 0.16 + (seed % 5) * 0.025 : 0.3 + (seed % 5) * 0.04,
      size: isSpark ? 34 + (seed % 3) * 12 : isFar ? 2.2 + (seed % 4) * 0.75 : 4.5 + (seed % 5) * 0.9,
    };
  });
}

const PARTICLES: Record<ParticleLayer, readonly ParticleConfig[]> = {
  far: particleSet(28, "far"),
  glow: particleSet(9, "glow"),
  spark: particleSet(3, "spark"),
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
  const particleRefs = useRef<Record<ParticleLayer, Array<HTMLSpanElement | null>>>({ far: [], glow: [], spark: [] });
  const timeRef = useRef(0);
  const lastRef = useRef<number | null>(null);
  const visibleRef = useRef(true);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sceneScale = () => window.innerWidth < 768 ? 0.7 : 1;

    const renderParticles = (time: number, still = false) => {
      (Object.keys(PARTICLES) as ParticleLayer[]).forEach((layer) => {
        PARTICLES[layer].forEach((particle, index) => {
          const node = particleRefs.current[layer][index];
          if (!node) return;
          const t = still ? 0 : time;
          const scaleFactor = sceneScale();
          const x = (particle.baseX + Math.sin(t * particle.speedX + particle.phase) * particle.amplitudeX) * scaleFactor;
          const y = (particle.baseY + Math.cos(t * particle.speedY + particle.phase * 1.17) * particle.amplitudeY) * scaleFactor;
          const pulse = still ? 0 : Math.sin(t * particle.pulseSpeed + particle.phase * 0.83);
          const scale = 1 + pulse * (layer === "spark" ? 0.05 : 0.09);
          const rotation = layer === "spark" ? -17 + Math.sin(t * 0.09 + particle.phase) * 9 : 0;
          node.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale}) rotate(${rotation}deg)`;
          node.style.opacity = String(clamp(particle.opacity + pulse * (layer === "far" ? 0.045 : 0.09), 0.06, 0.58));
        });
      });
    };

    const renderStatic = () => {
      const scale = sceneScale();
      TOKENS.forEach((token) => {
        const pose = STATIC_POSES[token.id];
        const rear = rearRefs.current[token.id];
        const front = frontRefs.current[token.id];
        if (!rear || !front) return;
        const transform = `translate3d(${pose.x * scale}px, ${pose.y * scale}px, 0) scale(${pose.scale * scale})`;
        rear.style.transform = transform;
        front.style.transform = transform;
        rear.style.opacity = pose.front ? "0" : "0.8";
        front.style.opacity = pose.front ? "1" : "0";
      });
      renderParticles(0, true);
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

      const scaleFactor = sceneScale();
      TOKENS.forEach((token, index) => {
        const rear = rearRefs.current[token.id];
        const front = frontRefs.current[token.id];
        if (!rear || !front) return;
        const angle = token.phase + timeRef.current * token.speed * token.direction;
        const z = Math.sin(angle);
        const bob = Math.sin(timeRef.current * (0.7 + index * 0.08) + token.phase * 1.7) * (2.6 + index * 0.65);
        const frontArc = smoothstep(0, 0.82, z);
        const x = (Math.cos(angle) * token.radiusX + token.frontDrift * frontArc) * scaleFactor;
        const y = (Math.sin(angle) * token.radiusY + token.offsetY + bob) * scaleFactor;
        const depth = (z + 1) / 2;
        const scale = token.baseScale * (0.85 + depth * 0.2) * scaleFactor;
        const rotation = angle * 17 + Math.sin(timeRef.current * 0.22 + token.phase) * 4;
        const transform = `translate3d(${x}px, ${y}px, 0) scale(${scale}) rotate(${rotation}deg)`;
        const baseOpacity = 0.7 + depth * 0.3;
        const frontMix = smoothstep(-0.16, 0.16, z);
        rear.style.transform = transform;
        front.style.transform = transform;
        rear.style.opacity = String((1 - frontMix) * baseOpacity);
        front.style.opacity = String(frontMix * baseOpacity);
        rear.style.filter = `blur(${(1 - depth) * 0.35}px)`;
        front.style.filter = `blur(${(1 - depth) * 0.18}px)`;
      });
      renderParticles(timeRef.current);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, []);

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

  const particleLayer = (layer: ParticleLayer) => (
    <div className={`qp-particles qp-particles--${layer}`} data-particle-layer={layer}>
      {PARTICLES[layer].map((particle, index) => {
        const style = {
          width: particle.size,
          height: layer === "spark" ? 2 : particle.size,
          transform: `translate3d(${particle.baseX}px, ${particle.baseY}px, 0)`,
          opacity: particle.opacity,
        } satisfies CSSProperties;
        return <span key={`${layer}-${index}`} ref={(node) => { particleRefs.current[layer][index] = node; }} className={`qp-particle qp-particle--${layer}`} style={style} />;
      })}
    </div>
  );

  return (
    <div ref={rootRef} className={`qp-orbit-scene qp-orbit-scene--${variant} ${className}`} aria-hidden="true" data-testid="hero-orbital-scene">
      <div className="qp-orbit-scene__ambient" />
      {particleLayer("far")}
      <div className="qp-orbit-ring qp-orbit-ring--rear" />
      {tokenLayer("rear")}
      {particleLayer("glow")}
      <div className="qp-cube-float-wrap">
        <div className="qp-cube-asset-wrap">
          <Image className="qp-cube-asset" src="/illustrations/questpay-hero-cube-clean.svg" alt="" width={580} height={540} priority={variant === "home"} />
          <div className="qp-cube-core-shadow" />
          <div className="qp-cube-edge-glow" />
          <div className="qp-cube-mark-wrap">
            <Image className="qp-cube-mark-asset" src="/brand/verse/verse-mark-neon.svg" alt="" width={128} height={112} priority={variant === "home"} />
          </div>
        </div>
      </div>
      <div className="qp-orbit-ring qp-orbit-ring--front" />
      {tokenLayer("front")}
      {particleLayer("spark")}
    </div>
  );
}
