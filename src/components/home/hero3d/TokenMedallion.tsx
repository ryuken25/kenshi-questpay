"use client";

import { useEffect, useRef } from "react";
import { useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { OrbitConfig } from "./hero3d.config";

export default function TokenMedallion({ config, reducedMotion = false }: { config: OrbitConfig; reducedMotion?: boolean }) {
  const spinGroup = useRef<THREE.Group>(null);
  const localTime = useRef(0);
  const texture = useTexture(config.texture);

  useEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
  }, [texture]);

  useFrame((_, delta) => {
    const node = spinGroup.current;
    if (!node || reducedMotion) return;
    const safeDelta = Math.min(delta, 1 / 20);
    localTime.current += safeDelta;
    const t = localTime.current + config.phase;
    node.rotation.x += safeDelta * (config.spin[0] + Math.sin(t * .81) * .018);
    node.rotation.y += safeDelta * config.spin[1];
    node.rotation.z += safeDelta * (config.spin[2] + Math.cos(t * .63) * .016);
  });

  const thickness = .10;
  return (
    <group ref={spinGroup} rotation={[.08 + config.phase * .018, config.phase * .07, -.04]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[config.size, config.size, thickness, 48]} />
        <meshStandardMaterial color={config.body} emissive={config.rim} emissiveIntensity={.24} metalness={.48} roughness={.27} />
      </mesh>
      <mesh position={[0, 0, thickness / 2 + .003]}>
        <circleGeometry args={[config.size * .88, 48]} />
        <meshStandardMaterial map={texture} emissiveMap={texture} emissive={config.emissive} emissiveIntensity={.26} roughness={.32} metalness={.12} />
      </mesh>
      <mesh position={[0, 0, -thickness / 2 - .003]} rotation={[0, Math.PI, 0]}>
        <circleGeometry args={[config.size * .88, 48]} />
        <meshStandardMaterial map={texture} emissiveMap={texture} emissive={config.emissive} emissiveIntensity={.18} roughness={.36} metalness={.12} />
      </mesh>
      <mesh>
        <torusGeometry args={[config.size * .965, .018, 8, 48]} />
        <meshBasicMaterial color={config.rim} transparent opacity={.72} toneMapped={false} />
      </mesh>
    </group>
  );
}
