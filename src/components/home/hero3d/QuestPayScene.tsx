"use client";

import { Suspense } from "react";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import VerseCube from "./VerseCube";
import OrbitSystem from "./OrbitSystem";
import ParticleField from "./ParticleField";
import EnergyShards from "./EnergyShards";
import SceneLights from "./SceneLights";
import type { HeroQuality } from "./hero3d.config";

export default function QuestPayScene({ mobile = false, reducedMotion = false, variant = "home", quality = "high" }: { mobile?: boolean; reducedMotion?: boolean; variant?: "home" | "signin"; quality?: HeroQuality }) {
  const scale = variant === "signin" ? .72 : mobile ? .92 : .84;
  const cubeScale = mobile ? .82 : variant === "signin" ? .86 : 1;
  const compact = mobile || variant === "signin";
  return (
    <Suspense fallback={null}>
      <SceneLights quality={quality} />
      <group scale={scale} position={variant === "signin" ? [0, -.05, 0] : [0, 0, 0]}>
        <ParticleField mobile={compact} reducedMotion={reducedMotion} quality={quality} />
        <OrbitSystem mobile={compact} reducedMotion={reducedMotion} />
        <group scale={cubeScale}>
          <VerseCube reducedMotion={reducedMotion} />
        </group>
        <EnergyShards mobile={compact} reducedMotion={reducedMotion} quality={quality} />
      </group>
      {quality !== "low" ? (
        <EffectComposer multisampling={0} enableNormalPass={false}>
          <Bloom intensity={0.85} luminanceThreshold={.55} luminanceSmoothing={.18} mipmapBlur />
        </EffectComposer>
      ) : null}
    </Suspense>
  );
}
