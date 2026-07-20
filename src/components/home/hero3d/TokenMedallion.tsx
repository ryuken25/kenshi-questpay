"use client";

import { useEffect, useRef } from "react";
import { useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { OrbitConfig } from "./hero3d.config";

/**
 * Premium metallic coin medallion:
 * - thick beveled disc
 * - embossed logo face
 * - bright outer rim outline
 * - soft under-glow (no full-frame postprocessing)
 */
export default function TokenMedallion({
  config,
  reducedMotion = false,
}: {
  config: OrbitConfig;
  reducedMotion?: boolean;
}) {
  const spinGroup = useRef<THREE.Group>(null);
  const localTime = useRef(0);
  const texture = useTexture(config.texture);

  useEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.anisotropy = 8;
    texture.needsUpdate = true;
  }, [texture]);

  useFrame((_, delta) => {
    const node = spinGroup.current;
    if (!node || reducedMotion) return;
    const safeDelta = delta > 0.15 ? 0 : Math.min(delta, 1 / 12);
    localTime.current += safeDelta;
    const t = localTime.current + config.phase;
    node.rotation.x = 0.08 + Math.sin(t * (0.5 + config.spin[0])) * (0.08 + config.spin[0] * 0.12);
    node.rotation.y = -0.18 + Math.cos(t * (0.42 + config.spin[1])) * (0.12 + config.spin[1] * 0.1);
    node.rotation.z = 0.02 + Math.sin(t * (0.55 + config.spin[2])) * (0.05 + config.spin[2] * 0.1);
  });

  const r = config.size;
  const thickness = Math.max(0.085, r * 0.42);

  return (
    <group ref={spinGroup} rotation={[0.08, -0.18, 0.02]}>
      {/* Core metallic body */}
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow={false}>
        <cylinderGeometry args={[r, r, thickness, 64]} />
        <meshStandardMaterial
          color={config.body}
          emissive={config.rim}
          emissiveIntensity={0.28}
          metalness={0.78}
          roughness={0.28}
        />
      </mesh>

      {/* Beveled rim ring */}
      <mesh>
        <torusGeometry args={[r * 0.985, Math.max(0.014, r * 0.08), 12, 64]} />
        <meshStandardMaterial
          color={config.rim}
          emissive={config.emissive}
          emissiveIntensity={0.55}
          metalness={0.85}
          roughness={0.22}
        />
      </mesh>

      {/* Bright outline edge */}
      <mesh>
        <torusGeometry args={[r * 1.01, Math.max(0.008, r * 0.035), 10, 64]} />
        <meshBasicMaterial color={config.emissive} transparent opacity={0.7} toneMapped={false} />
      </mesh>

      {/* Front embossed logo face */}
      <mesh position={[0, 0, thickness / 2 + 0.004]}>
        <circleGeometry args={[r * 0.78, 64]} />
        <meshStandardMaterial
          map={texture}
          emissiveMap={texture}
          emissive={config.emissive}
          emissiveIntensity={0.95}
          roughness={0.3}
          metalness={0.18}
          transparent
        />
      </mesh>

      {/* Front face plate under logo for raised-coin look */}
      <mesh position={[0, 0, thickness / 2 + 0.0015]}>
        <circleGeometry args={[r * 0.86, 64]} />
        <meshStandardMaterial
          color={config.body}
          emissive={config.rim}
          emissiveIntensity={0.18}
          metalness={0.7}
          roughness={0.26}
        />
      </mesh>

      {/* Back logo face */}
      <mesh position={[0, 0, -thickness / 2 - 0.004]} rotation={[0, Math.PI, 0]}>
        <circleGeometry args={[r * 0.78, 64]} />
        <meshStandardMaterial
          map={texture}
          emissiveMap={texture}
          emissive={config.emissive}
          emissiveIntensity={0.65}
          roughness={0.32}
          metalness={0.18}
          transparent
        />
      </mesh>

      {/* Soft under-glow discs */}
      <mesh position={[0, 0, -thickness * 0.72]} scale={1.22}>
        <circleGeometry args={[r, 48]} />
        <meshBasicMaterial
          color={config.rim}
          transparent
          opacity={0.09}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[0, 0, -thickness * 0.78]} scale={1.42}>
        <circleGeometry args={[r, 48]} />
        <meshBasicMaterial
          color={config.emissive}
          transparent
          opacity={0.04}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}
