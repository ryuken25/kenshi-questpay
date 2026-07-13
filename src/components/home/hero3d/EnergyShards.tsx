"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { seeded } from "./hero3d.config";
import type { HeroQuality } from "./hero3d.config";

export default function EnergyShards({ mobile = false, reducedMotion = false, quality = "high" }: { mobile?: boolean; reducedMotion?: boolean; quality?: HeroQuality }) {
  const refs = useRef<Array<THREE.Mesh | null>>([]);
  const localTime = useRef(0);
  const count = quality === "low" ? (mobile ? 2 : 3) : mobile ? 3 : 5;
  const shards = useMemo(() => Array.from({ length: count }, (_, index) => ({
    x: (seeded(index, 31) < .5 ? -1 : 1) * (2.15 + seeded(index, 32) * 1.7),
    y: (seeded(index, 33) - .5) * 2.8,
    z: (seeded(index, 34) - .5) * 2.6,
    phase: seeded(index, 35) * Math.PI * 2,
    scale: .055 + seeded(index, 36) * .07,
  })), [count]);

  useFrame((_, delta) => {
    if (!reducedMotion) localTime.current += Math.min(delta, 1 / 20);
    const t = localTime.current;
    shards.forEach((shard, index) => {
      const node = refs.current[index];
      if (!node) return;
      node.position.set(shard.x, shard.y + Math.sin(t * .18 + shard.phase) * .12, shard.z);
      node.rotation.set(t * (.04 + index * .006) + shard.phase, t * (.06 + index * .004), t * .025);
    });
  });

  return (
    <group>
      {shards.map((shard, index) => (
        <mesh key={index} ref={(node) => { refs.current[index] = node; }} position={[shard.x, shard.y, shard.z]} scale={[shard.scale * .55, shard.scale * 2.5, shard.scale]}>
          <tetrahedronGeometry args={[1, 0]} />
          <meshBasicMaterial color={index % 2 ? "#7d43d4" : "#c09aff"} transparent opacity={.42} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}
