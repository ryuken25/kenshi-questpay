"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, type CSSProperties } from "react";

type TokenId = "usdt" | "usdc" | "verse" | "pol";
type DepthLayer = "front" | "rear";
type CubeFace = "front" | "back" | "right" | "left" | "top" | "bottom";

type TokenConfig = {
  id: TokenId;
  label: string;
  asset: string;
  phase: number;
  speed: number;
  direction: 1 | -1;
  radiusX: number;
  radiusY: number;
  depthRadius: number;
  offsetY: number;
};

const TOKENS: TokenConfig[] = [
  { id: "usdt", label: "USDT", asset: "/tokens/usdt.svg", phase: 0.25, speed: 0.48, direction: 1, radiusX: 198, radiusY: 54, depthRadius: 130, offsetY: -18 },
  { id: "usdc", label: "USDC", asset: "/tokens/usdc.svg", phase: 2.35, speed: 0.40, direction: -1, radiusX: 218, radiusY: 68, depthRadius: 142, offsetY: 24 },
  { id: "verse", label: "VERSE", asset: "/brand/verse/verse-icon-official.png", phase: 4.30, speed: 0.34, direction: 1, radiusX: 232, radiusY: 62, depthRadius: 150, offsetY: 4 },
  { id: "pol", label: "POL", asset: "/tokens/pol.svg", phase: 1.55, speed: 0.56, direction: -1, radiusX: 166, radiusY: 76, depthRadius: 112, offsetY: -4 },
];
const FACES: CubeFace[] = ["front", "back", "right", "left", "top", "bottom"];

function faceTransform(face: CubeFace, distance: number) {
  const turns: Record<CubeFace, string> = { front: "", back: "rotateY(180deg) ", right: "rotateY(90deg) ", left: "rotateY(-90deg) ", top: "rotateX(90deg) ", bottom: "rotateX(-90deg) " };
  return `${turns[face]}translateZ(${distance}px)`;
}
function clamp01(value: number) { return Math.min(1, Math.max(0, value)); }
function getLayer(previous: DepthLayer, z: number): DepthLayer {
  if (z >= 18) return "front";
  if (z <= -18) return "rear";
  return previous;
}

export default function HeroOrbitalScene({ variant = "home", className = "" }: { variant?: "home" | "signin"; className?: string }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const tokenRefs = useRef<Record<TokenId, HTMLDivElement | null>>({ usdt: null, usdc: null, verse: null, pol: null });
  const layerRefs = useRef<Record<TokenId, DepthLayer>>({ usdt: "front", usdc: "rear", verse: "rear", pol: "front" });
  const visibleRef = useRef(true);
  const runningRef = useRef(true);
  const timeOffsetRef = useRef(0);
  const lastNowRef = useRef<number | null>(null);
  const reducedMotion = useMemo(() => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches, []);
  const cubeSize = variant === "signin" ? 176 : 282;
  const half = cubeSize / 2;
  const sceneStyle = { "--qp-cube-size": `${cubeSize}px`, "--qp-scene-scale": variant === "signin" ? ".64" : "1" } as CSSProperties;

  useEffect(() => {
    const root = rootRef.current;
    if (!root || reducedMotion) return;
    const observer = new IntersectionObserver(([entry]) => {
      visibleRef.current = entry.isIntersecting;
      lastNowRef.current = null;
    }, { rootMargin: "180px", threshold: 0.01 });
    observer.observe(root);
    const onVisibility = () => { runningRef.current = !document.hidden; lastNowRef.current = null; };
    document.addEventListener("visibilitychange", onVisibility);

    let frame = 0;
    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      if (!runningRef.current || !visibleRef.current) return;
      if (lastNowRef.current == null) { lastNowRef.current = now; return; }
      const delta = Math.min(0.05, (now - lastNowRef.current) / 1000);
      lastNowRef.current = now;
      timeOffsetRef.current += delta;
      const mobileScale = window.innerWidth < 768 ? 0.70 : 1;
      const variantScale = variant === "signin" ? 0.64 : 1;
      for (const config of TOKENS) {
        const node = tokenRefs.current[config.id];
        if (!node) continue;
        const angle = config.phase + timeOffsetRef.current * config.speed * config.direction;
        const x = Math.cos(angle) * config.radiusX * mobileScale * variantScale;
        const y = (Math.sin(angle) * config.radiusY + config.offsetY) * mobileScale * variantScale;
        const z = Math.sin(angle) * config.depthRadius;
        const depth = clamp01((z + config.depthRadius) / (config.depthRadius * 2));
        const layer = getLayer(layerRefs.current[config.id], z);
        layerRefs.current[config.id] = layer;
        node.dataset.depth = layer;
        node.style.zIndex = layer === "front" ? "50" : "10";
        node.style.opacity = String(0.62 + depth * 0.38);
        node.style.filter = layer === "front" ? "saturate(1.02) brightness(1.02)" : "saturate(.78) brightness(.72)";
        node.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${(0.80 + depth * 0.24) * mobileScale * variantScale}) rotate(${angle * 24}deg)`;
      }
    };
    frame = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); document.removeEventListener("visibilitychange", onVisibility); };
  }, [reducedMotion, variant]);

  const cubeStyle: CSSProperties = { width: cubeSize, height: cubeSize, marginLeft: -half, marginTop: -half };
  return (
    <div ref={rootRef} className={`qp-hero-scene qp-hero-scene--${variant} ${className}`} style={sceneStyle} aria-hidden="true" data-testid="hero-orbital-scene">
      <div className="qp-cube-world">
        <div className="qp-orbit-ring qp-orbit-ring--rear" />
        {TOKENS.map((token) => (
          <div key={token.id} ref={(node) => { tokenRefs.current[token.id] = node; }} className={`qp-token qp-token--${token.id}`} data-depth={layerRefs.current[token.id]}>
            <Image src={token.asset} alt="" width={52} height={52} /><span>{token.label}</span>
          </div>
        ))}
        <div className="qp-cube-float">
          <div className="qp-cube-core3d" style={cubeStyle}>{FACES.map((face) => <div key={face} className="qp-cube-core-face" style={{ transform: faceTransform(face, half - 10) }} />)}</div>
          <div className="qp-cube-shell" style={cubeStyle}>{FACES.map((face) => <div key={face} className="qp-cube-shell-face" style={{ transform: faceTransform(face, half) }} />)}</div>
          <Image className="qp-cube-mark" src="/brand/verse/verse-icon-official.png" alt="" width={102} height={102} priority={variant === "home"} />
        </div>
        <div className="qp-orbit-ring qp-orbit-ring--front" />
      </div>
    </div>
  );
}
