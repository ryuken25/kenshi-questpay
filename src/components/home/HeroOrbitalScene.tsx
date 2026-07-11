"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";

type OrbitTokenId = "usdt" | "usdc" | "verse" | "pol";
type TokenTone = "green" | "blue" | "violet" | "purple";
type CubeFace = "front" | "back" | "right" | "left" | "top" | "bottom";

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
  scale: number;
  opacity: number;
  isFront: boolean;
  rotation: number;
};

const homeTokens: OrbitTokenConfig[] = [
  { id: "usdt", label: "USDT", tone: "green", speed: 0.72, phase: 0.25, radiusX: 194, radiusY: 54, depthRadius: 138, verticalOffset: -18, baseScale: 1, direction: 1 },
  { id: "usdc", label: "USDC", tone: "blue", speed: 0.58, phase: 2.35, radiusX: 216, radiusY: 76, depthRadius: 146, verticalOffset: 34, baseScale: 1.02, direction: -1 },
  { id: "verse", label: "VERSE", tone: "violet", speed: 0.48, phase: 4.3, radiusX: 238, radiusY: 64, depthRadius: 152, verticalOffset: 4, baseScale: 0.94, direction: 1 },
  { id: "pol", label: "POL", tone: "purple", speed: 0.84, phase: 1.55, radiusX: 162, radiusY: 86, depthRadius: 116, verticalOffset: -6, baseScale: 0.88, direction: -1 },
];

const signinTokens: OrbitTokenConfig[] = [
  { id: "usdt", label: "USDT", tone: "green", speed: 0.42, phase: 0.45, radiusX: 108, radiusY: 38, depthRadius: 70, verticalOffset: -6, baseScale: 0.86, direction: 1 },
  { id: "verse", label: "VERSE", tone: "violet", speed: 0.36, phase: 3.4, radiusX: 122, radiusY: 46, depthRadius: 82, verticalOffset: 12, baseScale: 0.82, direction: -1 },
];

const CUBE_FACES: CubeFace[] = ["front", "back", "right", "left", "top", "bottom"];

function faceTransform(face: CubeFace, distance: number): string {
  switch (face) {
    case "front":
      return `translateZ(${distance}px)`;
    case "back":
      return `rotateY(180deg) translateZ(${distance}px)`;
    case "right":
      return `rotateY(90deg) translateZ(${distance}px)`;
    case "left":
      return `rotateY(-90deg) translateZ(${distance}px)`;
    case "top":
      return `rotateX(90deg) translateZ(${distance}px)`;
    case "bottom":
      return `rotateX(-90deg) translateZ(${distance}px)`;
  }
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function getPose(config: OrbitTokenConfig, elapsedSeconds: number, orbitScale: number): Pose {
  const angle = config.phase + elapsedSeconds * config.speed * config.direction;
  const zBase = Math.sin(angle) * config.depthRadius;
  const x = Math.cos(angle) * config.radiusX * orbitScale;
  const y = (Math.sin(angle) * config.radiusY + config.verticalOffset) * orbitScale;
  const depth01 = (zBase + config.depthRadius) / (config.depthRadius * 2);

  return {
    id: config.id,
    label: config.label,
    tone: config.tone,
    x,
    y,
    scale: config.baseScale * lerp(0.78, 1.1, depth01),
    opacity: lerp(0.58, 1, depth01),
    isFront: zBase >= 34,
    rotation: angle * 38,
  };
}

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const media = window.matchMedia(query);
    const update = () => setMatches(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [query]);
  return matches;
}

export default function HeroOrbitalScene({ variant = "home", className = "" }: { variant?: "home" | "signin"; className?: string }) {
  const [elapsed, setElapsed] = useState(0);
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const isMobile = useMediaQuery("(max-width: 767px)");
  const coarsePointer = useMediaQuery("(pointer: coarse)");
  const sceneRef = useRef<HTMLDivElement>(null);
  const parallaxRef = useRef<HTMLDivElement>(null);
  const tokens = variant === "home" ? homeTokens : signinTokens;

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

  // Pointer parallax — desktop only. Applied on a dedicated wrapper so it composes
  // with (rather than overrides) the CSS-driven breathing animation on qp-cube-world.
  useEffect(() => {
    const scene = sceneRef.current;
    const layer = parallaxRef.current;
    if (!scene || !layer || reducedMotion || coarsePointer) return;
    const onMove = (event: PointerEvent) => {
      const rect = scene.getBoundingClientRect();
      const nx = (event.clientX - rect.left) / rect.width - 0.5;
      const ny = (event.clientY - rect.top) / rect.height - 0.5;
      layer.style.transform = `rotateX(${(-ny * 4).toFixed(2)}deg) rotateY(${(nx * 4).toFixed(2)}deg)`;
    };
    const reset = () => {
      layer.style.transform = "";
    };
    scene.addEventListener("pointermove", onMove);
    scene.addEventListener("pointerleave", reset);
    return () => {
      scene.removeEventListener("pointermove", onMove);
      scene.removeEventListener("pointerleave", reset);
      reset();
    };
  }, [reducedMotion, coarsePointer]);

  const orbitScale = isMobile ? 0.695 : 1;
  const poses = useMemo(
    () => tokens.map((token) => getPose(token, reducedMotion ? token.phase : elapsed, orbitScale)),
    [elapsed, reducedMotion, tokens, orbitScale],
  );
  const rear = poses.filter((pose) => !pose.isFront);
  const front = poses.filter((pose) => pose.isFront);

  // Cube geometry (v3 CSS supplies face appearance + breathing; positions are supplied
  // here so the scene renders correctly regardless of the shared stylesheet's state).
  const baseCube = variant === "home" ? 282 : 176;
  const cubeSize = Math.round(isMobile ? baseCube * 0.695 : baseCube);
  const half = cubeSize / 2;
  const coreDistance = half - 10;
  const tokenDepth = half + 30;
  const markSize = variant === "home" ? 104 : 76;

  const cubeContainerStyle: CSSProperties = {
    position: "absolute",
    left: "50%",
    top: "50%",
    width: cubeSize,
    height: cubeSize,
    marginLeft: -half,
    marginTop: -half,
    transformStyle: "preserve-3d",
  };

  const ringStyle: CSSProperties | undefined =
    variant === "signin" ? { width: 280, height: 90, marginLeft: -140, marginTop: -45 } : undefined;

  const rootStyle: CSSProperties | undefined = variant === "signin" ? { minHeight: 300 } : undefined;

  return (
    <div
      ref={sceneRef}
      className={`qp-hero-scene qp-hero-scene--${variant} ${className}`}
      style={rootStyle}
      aria-hidden="true"
      data-testid="hero-orbital-scene"
    >
      <div className="qp-cube-world">
        <div ref={parallaxRef} className="qp-cube-parallax" style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d" }}>
          <div className="qp-orbit-rear qp-orbit-ring qp-orbit-ring--rear" style={ringStyle} />
          <TokenLayer poses={rear} layer="rear" depth={-tokenDepth} />
          <div className="qp-cube-core3d" style={cubeContainerStyle}>
            {CUBE_FACES.map((face) => (
              <div key={face} className="qp-cube-core-face" style={{ transform: faceTransform(face, coreDistance) }} />
            ))}
          </div>
          <div className="qp-cube-shell" style={cubeContainerStyle}>
            {CUBE_FACES.map((face) => (
              <div key={face} className="qp-cube-shell-face" style={{ transform: faceTransform(face, half) }} />
            ))}
          </div>
          <div
            className="qp-cube-mark"
            style={{ position: "absolute", left: "50%", top: "50%", transform: `translate(-50%, -50%) translateZ(${half + 1}px)` }}
          >
            <Image src="/brand/questpay/questpay-mark-mono.svg" alt="" width={markSize} height={markSize} priority={variant === "home"} />
          </div>
          <div className="qp-orbit-front qp-orbit-ring qp-orbit-ring--front" style={ringStyle} />
          <TokenLayer poses={front} layer="front" depth={tokenDepth} />
        </div>
      </div>
    </div>
  );
}

function TokenLayer({ poses, layer, depth }: { poses: Pose[]; layer: "front" | "rear"; depth: number }) {
  return (
    <div className={`qp-token-${layer}`} style={{ position: "absolute", left: "50%", top: "50%", transform: `translateZ(${depth}px)` }}>
      {poses.map((pose) => (
        <div
          key={`${layer}-${pose.id}`}
          className={`qp-token qp-token-${pose.tone}`}
          style={{
            transform: `translate3d(${pose.x}px, ${pose.y}px, 0) scale(${pose.scale}) rotateZ(${pose.rotation}deg)`,
            opacity: pose.opacity,
            filter: layer === "rear" ? "saturate(.82) brightness(.78)" : "saturate(1.05) brightness(1.04)",
          }}
        >
          <span>{pose.label}</span>
        </div>
      ))}
    </div>
  );
}
