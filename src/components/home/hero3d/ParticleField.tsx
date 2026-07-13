"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { seeded } from "./hero3d.config";

const PARTICLE_COLORS = [new THREE.Color("#b47aff"), new THREE.Color("#7d43d4"), new THREE.Color("#c9a4ff")];

export default function ParticleField({ mobile = false, reducedMotion = false }: { mobile?: boolean; reducedMotion?: boolean }) {
  const count = mobile ? 24 : 48;
  const points = useRef<THREE.Points>(null);
  const motes = useRef<Array<THREE.Mesh | null>>([]);
  const localTime = useRef(0);

  const { geometry, bases } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    for (let index = 0; index < count; index += 1) {
      const radius = 2.4 + seeded(index, 2) * 3.1;
      const angle = seeded(index, 3) * Math.PI * 2;
      positions[index * 3] = Math.cos(angle) * radius;
      positions[index * 3 + 1] = (seeded(index, 4) - .5) * 4.2;
      positions[index * 3 + 2] = (seeded(index, 5) - .5) * 5.5;
      const color = PARTICLE_COLORS[index % PARTICLE_COLORS.length];
      colors[index * 3] = color.r; colors[index * 3 + 1] = color.g; colors[index * 3 + 2] = color.b;
    }
    const nextGeometry = new THREE.BufferGeometry();
    nextGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    nextGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    const nextBases = Array.from({ length: mobile ? 8 : 11 }, (_, index) => ({
      x: (seeded(index, 11) - .5) * 5.7,
      y: (seeded(index, 12) - .5) * 2.9,
      z: (seeded(index, 13) - .5) * 3.4,
      phase: seeded(index, 14) * Math.PI * 2,
      speed: .18 + seeded(index, 15) * .22,
      size: .018 + seeded(index, 16) * .025,
    }));
    return { geometry: nextGeometry, bases: nextBases };
  }, [count, mobile]);

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
        <pointsMaterial size={mobile ? .042 : .036} vertexColors transparent opacity={.62} sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </points>
      {bases.map((base, index) => (
        <mesh key={index} ref={(node) => { motes.current[index] = node; }} position={[base.x, base.y, base.z]}>
          <sphereGeometry args={[base.size, 8, 8]} />
          <meshBasicMaterial color={index % 3 === 0 ? "#c9a4ff" : "#8d53e4"} transparent opacity={.72} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}
