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
    const safeDelta = delta > .15 ? 0 : Math.min(delta, 1 / 12);
    localTime.current += safeDelta;
    const t = localTime.current + config.phase;
    node.rotation.x = .05 + Math.sin(t * (.58 + config.spin[0])) * (.10 + config.spin[0] * .18);
    node.rotation.y = -.15 + Math.cos(t * (.46 + config.spin[1])) * (.14 + config.spin[1] * .14);
    node.rotation.z = .02 + Math.sin(t * (.67 + config.spin[2])) * (.08 + config.spin[2] * .16);
  });

  const thickness = .10;
  return (
    <group ref={spinGroup} rotation={[.05, -.15, .02]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[config.size, config.size, thickness, 48]} />
        <meshStandardMaterial color={config.body} emissive={config.rim} emissiveIntensity={.34} metalness={.58} roughness={.22} />
      </mesh>
      <mesh position={[0, 0, thickness / 2 + .003]}>
        <circleGeometry args={[config.size * .88, 48]} />
        <meshStandardMaterial map={texture} emissiveMap={texture} emissive={config.emissive} emissiveIntensity={.38} roughness={.28} metalness={.16} />
      </mesh>
      <mesh position={[0, 0, -thickness / 2 - .003]} rotation={[0, Math.PI, 0]}>
        <circleGeometry args={[config.size * .88, 48]} />
        <meshStandardMaterial map={texture} emissiveMap={texture} emissive={config.emissive} emissiveIntensity={.28} roughness={.30} metalness={.16} />
      </mesh>
      <mesh>
        <torusGeometry args={[config.size * .965, .018, 8, 48]} />
        <meshBasicMaterial color={config.rim} transparent opacity={.88} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0, -.058]} scale={1.26}>
        <circleGeometry args={[config.size, 40]} />
        <meshBasicMaterial color={config.rim} transparent opacity={.12} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0, -.062]} scale={1.48}>
        <circleGeometry args={[config.size, 40]} />
        <meshBasicMaterial color={config.emissive} transparent opacity={.055} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  );
}
