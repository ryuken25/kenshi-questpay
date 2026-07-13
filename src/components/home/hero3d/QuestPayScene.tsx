"use client";

import { Suspense } from "react";
import VerseCube from "./VerseCube";
import OrbitSystem from "./OrbitSystem";
import ParticleField from "./ParticleField";
import EnergyShards from "./EnergyShards";
import SceneLights from "./SceneLights";

export default function QuestPayScene({ mobile = false, reducedMotion = false, variant = "home" }: { mobile?: boolean; reducedMotion?: boolean; variant?: "home" | "signin" }) {
  const scale = variant === "signin" ? .68 : mobile ? .74 : .90;
  return (
    <Suspense fallback={null}>
      <SceneLights />
      <group scale={scale} position={variant === "signin" ? [0, -.05, 0] : [0, 0, 0]}>
        <ParticleField mobile={mobile || variant === "signin"} reducedMotion={reducedMotion} />
        <OrbitSystem mobile={mobile || variant === "signin"} reducedMotion={reducedMotion} />
        <VerseCube reducedMotion={reducedMotion} />
        <EnergyShards mobile={mobile || variant === "signin"} reducedMotion={reducedMotion} />
      </group>
    </Suspense>
  );
}
