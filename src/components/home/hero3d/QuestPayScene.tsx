"use client";

import { Suspense } from "react";
import VerseCube from "./VerseCube";
import OrbitSystem from "./OrbitSystem";
import ParticleField from "./ParticleField";
import SceneLights from "./SceneLights";
import type { HeroQuality } from "./hero3d.config";

export default function QuestPayScene({
  mobile = false,
  reducedMotion = false,
  variant = "home",
  quality = "high",
}: {
  mobile?: boolean;
  reducedMotion?: boolean;
  variant?: "home" | "signin";
  quality?: HeroQuality;
}) {
  // Clean composition:
  // - no EffectComposer/Bloom (hard rectangular edge)
  // - no energy shards (visual clutter)
  // - fewer particles + centered framing
  const compact = mobile || variant === "signin";
  const scale = variant === "signin" ? 0.78 : mobile ? 0.9 : 0.88;
  const cubeScale = mobile ? 0.9 : variant === "signin" ? 0.92 : 1;

  return (
    <Suspense fallback={null}>
      <SceneLights quality={quality} />
      <group
        scale={scale}
        // Keep composition centered and slightly lower so soft mask has room
        position={variant === "signin" ? [0, -0.04, 0] : [0, -0.02, 0]}
      >
        <ParticleField mobile={compact} reducedMotion={reducedMotion} quality={quality} />
        <OrbitSystem mobile={compact} reducedMotion={reducedMotion} />
        <group scale={cubeScale}>
          <VerseCube reducedMotion={reducedMotion} />
        </group>
      </group>
    </Suspense>
  );
}
