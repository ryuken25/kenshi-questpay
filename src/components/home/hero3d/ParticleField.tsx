"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { seeded } from "./hero3d.config";
import type { HeroQuality } from "./hero3d.config";

const PARTICLE_COLORS = [
  new THREE.Color("#b47aff"),
  new THREE.Color("#8a52d8"),
  new THREE.Color("#c9a4ff"),
];

export default function ParticleField({
  mobile = false,
  reducedMotion = false,
  quality = "high",
}: {
  mobile?: boolean;
  reducedMotion?: boolean;
  quality?: HeroQuality;
}) {
  // Much cleaner density than before — keep atmosphere, avoid sparkle noise.
  const count = quality === "low" ? (mobile ? 12 : 22) : mobile ? 18 : 36;
  const points = useRef<THREE.Points>(null);
  const localTime = useRef(0);

  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let index = 0; index < count; index += 1) {
      // Keep particles near the cube volume so edges stay clean.
      const radius = 1.35 + seeded(index, 2) * 1.55;
      const angle = seeded(index, 3) * Math.PI * 2;
      positions[index * 3] = Math.cos(angle) * radius;
      positions[index * 3 + 1] = (seeded(index, 4) - 0.5) * 1.9;
      positions[index * 3 + 2] = (seeded(index, 5) - 0.5) * 2.2;

      const color = PARTICLE_COLORS[index % PARTICLE_COLORS.length];
      colors[index * 3] = color.r;
      colors[index * 3 + 1] = color.g;
      colors[index * 3 + 2] = color.b;
    }

    const nextGeometry = new THREE.BufferGeometry();
    nextGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    nextGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return nextGeometry;
  }, [count]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame((_, delta) => {
    if (!reducedMotion) localTime.current += Math.min(delta, 1 / 20);
    if (!points.current) return;
    const t = localTime.current;
    points.current.rotation.y = t * 0.012;
    points.current.rotation.x = Math.sin(t * 0.05) * 0.01;
  });

  return (
    <points ref={points} geometry={geometry}>
      <pointsMaterial
        size={mobile ? 0.028 : 0.022}
        vertexColors
        transparent
        opacity={0.34}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </points>
  );
}
