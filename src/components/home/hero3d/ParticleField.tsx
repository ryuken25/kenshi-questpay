"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { seeded } from "./hero3d.config";
import type { HeroQuality } from "./hero3d.config";

const PARTICLE_COLORS = [new THREE.Color("#b47aff"), new THREE.Color("#7d43d4"), new THREE.Color("#c9a4ff")];

export default function ParticleField({ mobile = false, reducedMotion = false, quality = "high" }: { mobile?: boolean; reducedMotion?: boolean; quality?: HeroQuality }) {
  const count = quality === "low" ? (mobile ? 24 : 48) : mobile ? 42 : 96;
  const points = useRef<THREE.Points>(null);
  const motes = useRef<Array<THREE.Mesh | null>>([]);
  const localTime = useRef(0);

  const { geometry, bases } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    for (let index = 0; index < count; index += 1) {
      const radius = 2.0 + seeded(index, 2) * 3.8;
      const angle = seeded(index, 3) * Math.PI * 2;
      positions[index * 3] = Math.cos(angle) * radius;
      positions[index * 3 + 1] = (seeded(index, 4) - .5) * 3.8;
      positions[index * 3 + 2] = (seeded(index, 5) - .5) * 5.8;
      const color = PARTICLE_COLORS[index % PARTICLE_COLORS.length];
      colors[index * 3] = color.r; colors[index * 3 + 1] = color.g; colors[index * 3 + 2] = color.b;
    }
    const nextGeometry = new THREE.BufferGeometry();
    nextGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    nextGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    const moteCount = quality === "low" ? (mobile ? 5 : 9) : mobile ? 9 : 18;
    const nextBases = Array.from({ length: moteCount }, (_, index) => ({
      x: (seeded(index, 11) - .5) * 6.2,
      y: (seeded(index, 12) - .5) * 3.3,
      z: (seeded(index, 13) - .5) * 3.8,
      phase: seeded(index, 14) * Math.PI * 2,
      speed: .18 + seeded(index, 15) * .22,
      size: .016 + seeded(index, 16) * .030,
    }));
    return { geometry: nextGeometry, bases: nextBases };
  }, [count, mobile, quality]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame((_, delta) => {
    if (!reducedMotion) localTime.current += Math.min(delta, 1 / 20);
    const t = localTime.current;
    if (points.current) {
      points.current.rotation.y = t * .018;
      points.current.rotation.x = Math.sin(t * .07) * .018;
    }
    bases.forEach((base, index) => {
      const mote = motes.current[index];
      if (!mote) return;
      mote.position.set(
        base.x + Math.sin(t * base.speed + base.phase) * .16,
        base.y + Math.cos(t * base.speed * .83 + base.phase) * .13,
        base.z + Math.sin(t * base.speed * .61 + base.phase) * .09,
      );
      const pulse = .72 + Math.sin(t * .7 + base.phase) * .18;
      mote.scale.setScalar(pulse);
    });
  });

  return (
    <group>
      <points ref={points} geometry={geometry}>
        <pointsMaterial size={mobile ? .038 : .030} vertexColors transparent opacity={.76} sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </points>
      {bases.map((base, index) => (
        <mesh key={index} ref={(node) => { motes.current[index] = node; }} position={[base.x, base.y, base.z]}>
          <sphereGeometry args={[base.size, 8, 8]} />
          <meshBasicMaterial color={index % 3 === 0 ? "#e0c4ff" : "#a45cff"} transparent opacity={.78} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}
