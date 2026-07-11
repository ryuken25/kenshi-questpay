"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

type OrbitTokenId = "usdt" | "btc" | "verse" | "pol";
type TokenTone = "green" | "orange" | "violet" | "purple";

type OrbitTokenConfig = {
  id: OrbitTokenId;
  label: string;
  tone: TokenTone;
  speed: number;
  phase: number;
  radiusX: number;
  radiusY: number;
  depthRadius: number;
  verticalOffset: number;
  baseScale: number;
  direction: 1 | -1;
};

type Pose = {
  id: OrbitTokenId;
  label: string;
  tone: TokenTone;
  x: number;
  y: number;
  z: number;
  scale: number;
  opacity: number;
  isFront: boolean;
  rotation: number;
};

const homeTokens: OrbitTokenConfig[] = [
  { id: "usdt", label: "USDT", tone: "green", speed: 0.72, phase: 0.25, radiusX: 186, radiusY: 54, depthRadius: 112, verticalOffset: -18, baseScale: 1, direction: 1 },
  { id: "btc", label: "BTC", tone: "orange", speed: 0.58, phase: 2.35, radiusX: 208, radiusY: 76, depthRadius: 126, verticalOffset: 34, baseScale: 1.04, direction: -1 },
  { id: "verse", label: "VERSE", tone: "violet", speed: 0.48, phase: 4.3, radiusX: 230, radiusY: 64, depthRadius: 132, verticalOffset: 4, baseScale: 0.94, direction: 1 },
  { id: "pol", label: "POL", tone: "purple", speed: 0.84, phase: 1.55, radiusX: 154, radiusY: 86, depthRadius: 96, verticalOffset: -6, baseScale: 0.88, direction: -1 },
];

const signinTokens: OrbitTokenConfig[] = [
  { id: "usdt", label: "USDT", tone: "green", speed: 0.42, phase: 0.45, radiusX: 108, radiusY: 38, depthRadius: 70, verticalOffset: -6, baseScale: 0.86, direction: 1 },
  { id: "verse", label: "VERSE", tone: "violet", speed: 0.36, phase: 3.4, radiusX: 122, radiusY: 46, depthRadius: 82, verticalOffset: 12, baseScale: 0.82, direction: -1 },
];

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function getPose(config: OrbitTokenConfig, elapsedSeconds: number): Pose {
  const angle = config.phase + elapsedSeconds * config.speed * config.direction;
  const x = Math.cos(angle) * config.radiusX;
  const y = Math.sin(angle) * config.radiusY + config.verticalOffset;
  const z = Math.sin(angle) * config.depthRadius;
  const depth01 = (z + config.depthRadius) / (config.depthRadius * 2);

  return {
    id: config.id,
    label: config.label,
    tone: config.tone,
    x,
    y,
    z,
    scale: config.baseScale * lerp(0.78, 1.1, depth01),
    opacity: lerp(0.58, 1, depth01),
    isFront: z >= 8,
    rotation: angle * 38,
  };
}

export default function HeroOrbitalScene({ variant = "home", className = "" }: { variant?: "home" | "signin"; className?: string }) {
  const [elapsed, setElapsed] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const tokens = variant === "home" ? homeTokens : signinTokens;

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (reducedMotion) return;
    let frame = 0;
    let start = performance.now();
    const tick = (now: number) => {
      setElapsed((now - start) / 1000);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    const onVisibility = () => {
      if (document.hidden) cancelAnimationFrame(frame);
      else {
        start = performance.now();
        frame = requestAnimationFrame(tick);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [reducedMotion]);

  const poses = useMemo(() => tokens.map((token) => getPose(token, reducedMotion ? token.phase : elapsed)), [elapsed, reducedMotion, tokens]);
  const rear = poses.filter((pose) => !pose.isFront);
  const front = poses.filter((pose) => pose.isFront);

  return (
    <div className={`qp-orbital-scene qp-orbital-scene--${variant} ${className}`} aria-hidden="true" data-testid="hero-orbital-scene">
      <div className="qp-scene-world">
        <div className="qp-depth-ring qp-depth-ring--back" />
        <TokenLayer poses={rear} layer="back" />
        <Cube variant={variant} />
        <div className="qp-depth-ring qp-depth-ring--front" />
        <TokenLayer poses={front} layer="front" />
        <div className="qp-scene-glow" />
      </div>
    </div>
  );
}

function TokenLayer({ poses, layer }: { poses: Pose[]; layer: "front" | "back" }) {
  return (
    <div className={`qp-token-layer qp-token-layer--${layer}`}>
      {poses.map((pose) => (
        <div
          key={`${layer}-${pose.id}`}
          className={`qp-token qp-token-${pose.tone}`}
          style={{
            transform: `translate3d(${pose.x}px, ${pose.y}px, ${pose.z}px) scale(${pose.scale}) rotateZ(${pose.rotation}deg)`,
            opacity: pose.opacity,
            filter: layer === "back" ? "saturate(.82) brightness(.78)" : "saturate(1.05) brightness(1.04)",
          }}
        >
          <span>{pose.label}</span>
        </div>
      ))}
    </div>
  );
}

function Cube({ variant }: { variant: "home" | "signin" }) {
  const markSize = variant === "home" ? 104 : 76;
  return (
    <div className={`qp-cube-group qp-cube-group--${variant}`}>
      <div className="qp-cube-core" />
      <div className="qp-cube-shell">
        <div className="qp-cube-plane qp-cube-plane-front">
          <div className="qp-cube-face-mark">
            <Image src="/brand/questpay/questpay-mark-mono.svg" alt="" width={markSize} height={markSize} priority={variant === "home"} />
          </div>
        </div>
        <div className="qp-cube-plane qp-cube-plane-back" />
        <div className="qp-cube-plane qp-cube-plane-right" />
        <div className="qp-cube-plane qp-cube-plane-left" />
        <div className="qp-cube-plane qp-cube-plane-top" />
        <div className="qp-cube-plane qp-cube-plane-bottom" />
      </div>
    </div>
  );
}
