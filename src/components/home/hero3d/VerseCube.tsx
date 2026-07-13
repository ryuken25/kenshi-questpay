"use client";

import { useEffect, useMemo, useRef } from "react";
import { Edges, useTexture } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { CUBE_BASE_ROTATION, CUBE_SIZE } from "./hero3d.config";

function TopFacets() {
  const geometries = useMemo(() => {
    const triangles = [
      [[-1.42, 1.392, -1.30], [-.42, 1.404, -1.42], [-.72, 1.418, -.42]],
      [[-.40, 1.406, -1.42], [.72, 1.398, -1.34], [.18, 1.426, -.44]],
      [[.74, 1.401, -1.32], [1.42, 1.393, -.54], [.22, 1.421, -.42]],
      [[-1.38, 1.395, -.35], [-.72, 1.418, -.42], [-1.06, 1.407, .72]],
      [[-.68, 1.419, -.38], [.22, 1.426, -.42], [-.08, 1.438, .68]],
      [[.25, 1.425, -.40], [1.39, 1.397, -.48], [.84, 1.410, .78]],
    ];
    return triangles.map((triangle) => {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.Float32BufferAttribute(triangle.flat(), 3));
      geometry.computeVertexNormals();
      return geometry;
    });
  }, []);
  useEffect(() => () => geometries.forEach((geometry) => geometry.dispose()), [geometries]);
  return (
    <group>
      {geometries.map((geometry, index) => (
        <mesh key={index} geometry={geometry}>
          <meshBasicMaterial color={index % 2 ? "#7134ca" : "#512080"} transparent opacity={index % 2 ? .22 : .14} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}

export default function VerseCube({ reducedMotion = false }: { reducedMotion?: boolean }) {
  const group = useRef<THREE.Group>(null);
  const localTime = useRef(0);
  const [albedoMap, emissiveMap, roughnessMap] = useTexture([
    "/brand/verse/cube-front-verse-albedo.png",
    "/brand/verse/cube-front-verse-emissive.png",
    "/brand/verse/cube-front-verse-roughness.png",
  ]);
  const { gl } = useThree();

  useEffect(() => {
    const anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy());
    albedoMap.colorSpace = THREE.SRGBColorSpace;
    emissiveMap.colorSpace = THREE.SRGBColorSpace;
    roughnessMap.colorSpace = THREE.NoColorSpace;
    [albedoMap, emissiveMap, roughnessMap].forEach((texture) => {
      texture.anisotropy = anisotropy;
      texture.needsUpdate = true;
    });
  }, [albedoMap, emissiveMap, gl, roughnessMap]);

  useFrame((_, delta) => {
    const node = group.current;
    if (!node) return;
    if (!reducedMotion) localTime.current += Math.min(delta, 1 / 20);
    const t = localTime.current;
    node.rotation.set(
      CUBE_BASE_ROTATION[0] + Math.sin(t * .22) * .018,
      CUBE_BASE_ROTATION[1] + Math.sin(t * .18) * .026,
      CUBE_BASE_ROTATION[2] + Math.sin(t * .16) * .006,
    );
    node.position.y = Math.sin(t * .75) * .055;
  });

  return (
    <group ref={group} rotation={CUBE_BASE_ROTATION}>
      <mesh scale={[.94, .94, .94]} renderOrder={-2}>
        <boxGeometry args={CUBE_SIZE} />
        <meshStandardMaterial color="#120721" roughness={.48} metalness={.16} />
      </mesh>

      <mesh scale={[.97, .97, .97]} renderOrder={-1}>
        <boxGeometry args={CUBE_SIZE} />
        <meshBasicMaterial colorWrite={false} depthWrite depthTest />
      </mesh>

      <mesh>
        <boxGeometry args={CUBE_SIZE} />
        {[0, 1, 2, 3, 5].map((index) => (
          <meshPhysicalMaterial
            key={index}
            attach={`material-${index}`}
            color={index === 2 ? "#351052" : "#240a3f"}
            transparent
            opacity={index === 2 ? .42 : .36}
            roughness={.24}
            metalness={.10}
            transmission={0}
            thickness={.7}
            clearcoat={.48}
            clearcoatRoughness={.26}
            depthWrite={false}
            depthTest
          />
        ))}
        <meshStandardMaterial
          attach="material-4"
          map={albedoMap}
          emissiveMap={emissiveMap}
          roughnessMap={roughnessMap}
          emissive="#a85cff"
          emissiveIntensity={.34}
          color="#efe8f7"
          roughness={.42}
          metalness={.10}
        />
        <Edges threshold={15} color="#a969ff" lineWidth={1.1} />
      </mesh>

      <mesh position={[0, 0, 1.579]}>
        <planeGeometry args={[2.15, 1.9]} />
        <meshBasicMaterial color="#8a45ea" transparent opacity={.026} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>

      <TopFacets />
    </group>
  );
}
