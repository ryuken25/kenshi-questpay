"use client";

import { Component, type ErrorInfo, type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { AdaptiveDpr, PerformanceMonitor } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import Hero3DFallback from "./Hero3DFallback";
import QuestPayScene from "./QuestPayScene";
import type { HeroQuality } from "./hero3d.config";
import { usePageVisibility, useReducedMotion } from "./usePageVisibility";

type Variant = "home" | "signin";

class CanvasErrorBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error("[hero3d] WebGL scene failed", error, info); }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

function supportsWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

export default function QuestPayHeroCanvas({ variant = "home" }: { variant?: Variant }) {
  const container = useRef<HTMLDivElement>(null);
  const pageVisible = usePageVisibility();
  const reducedMotion = useReducedMotion();
  const [inView, setInView] = useState(true);
  const [mobile, setMobile] = useState(false);
  const [webgl, setWebgl] = useState<boolean | null>(null);
  const [quality, setQuality] = useState<HeroQuality>("high");
  const camera = useMemo(() => {
    if (variant === "signin") return { position: [0, 0, 7.8] as [number, number, number], fov: 35, near: .1, far: 40 };
    return mobile
      ? { position: [0, 0, 7.8] as [number, number, number], fov: 35, near: .1, far: 40 }
      : { position: [0, 0, 7.2] as [number, number, number], fov: 35, near: .1, far: 40 };
  }, [mobile, variant]);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 767px)");
    const update = () => setMobile(query.matches);
    update(); query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const forced = new URLSearchParams(window.location.search).has("hero3dFallback");
    setWebgl(!forced && supportsWebGL());
  }, []);

  useEffect(() => {
    const node = container.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: .05, rootMargin: "120px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const fallback = <Hero3DFallback variant={variant} />;
  if (webgl !== true) return fallback;
  const active = pageVisible && inView && !reducedMotion;

  return (
    <div
      ref={container}
      className={`qp-hero3d qp-hero3d--${variant}`}
      data-testid="hero-orbital-scene"
      data-hero3d-engine="react-three-fiber"
      data-hero3d-active={active ? "true" : "false"}
      data-hero3d-reduced-motion={reducedMotion ? "true" : "false"}
      data-hero3d-token-count="4"
      data-hero3d-quality={quality}
      aria-label="Animated 3D QuestPay cube with orbiting crypto medallions"
      role="img"
    >
      <CanvasErrorBoundary fallback={fallback}>
        <Canvas
          className="pointer-events-none"
          style={{ pointerEvents: "none" }}
          dpr={mobile ? [1, 1.75] : [1, 2]}
          camera={camera}
          gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
          performance={{ min: .6 }}
          frameloop={active ? "always" : "demand"}
          onCreated={({ gl }) => {
            gl.setClearColor(new THREE.Color("#0a0612"), 0);
            gl.outputColorSpace = THREE.SRGBColorSpace;
          }}
        >
          <AdaptiveDpr />
          <PerformanceMonitor
            flipflops={3}
            onDecline={() => setQuality("low")}
            onIncline={() => setQuality("high")}
          />
          <QuestPayScene mobile={mobile} reducedMotion={reducedMotion} variant={variant} quality={quality} />
        </Canvas>
      </CanvasErrorBoundary>
    </div>
  );
}
