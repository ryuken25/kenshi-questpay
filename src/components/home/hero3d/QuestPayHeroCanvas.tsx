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
  const [aspect, setAspect] = useState(1.5);

  // Responsive camera presets based on measured container aspect ratio
  const camera = useMemo(() => {
    if (variant === "signin") return { position: [0, 0, 7.6] as [number, number, number], fov: 34, near: .1, far: 40 };
    // Cleaner framing: slightly farther + lower FOV so the scene reads premium, not cramped.
    if (aspect >= 1.35) return { position: [0, 0.05, 7.15] as [number, number, number], fov: 34, near: .1, far: 40 };
    if (aspect >= 0.9) return { position: [0, 0.04, 7.45] as [number, number, number], fov: 37, near: .1, far: 40 };
    return { position: [0, 0.02, 8.15] as [number, number, number], fov: 42, near: .1, far: 40 };
  }, [aspect, variant]);

  // ResizeObserver for container-aware scaling
  useEffect(() => {
    const node = container.current;
    if (!node) return;
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) setAspect(width / height);
      }
    });
    ro.observe(node);
    return () => ro.disconnect();
  }, []);

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
          className="pointer-events-none qp-hero3d__canvas"
          style={{ pointerEvents: "none", background: "transparent" }}
          dpr={mobile ? [1, 1.35] : [1, 1.6]}
          camera={camera}
          gl={{
            alpha: true,
            antialias: true,
            // Keep edges soft against the page background.
            premultipliedAlpha: false,
            preserveDrawingBuffer: false,
            powerPreference: "high-performance",
          }}
          performance={{ min: .6 }}
          frameloop={active ? "always" : "demand"}
          onCreated={({ gl, scene }) => {
            // Fully transparent clear so page bg shows through.
            gl.setClearColor(0x000000, 0);
            gl.setClearAlpha(0);
            gl.outputColorSpace = THREE.SRGBColorSpace;
            gl.toneMapping = THREE.NoToneMapping;
            scene.background = null;
            scene.fog = null;
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
