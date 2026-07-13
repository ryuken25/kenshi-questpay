"use client";

import { useEffect, useMemo, useRef } from "react";
import { Edges, useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { CUBE_BASE_ROTATION, CUBE_SIZE } from "./hero3d.config";

const HALF = { x: CUBE_SIZE[0] / 2, y: CUBE_SIZE[1] / 2, z: CUBE_SIZE[2] / 2 };

function SurfaceFractures() {
  const geometry = useMemo(() => {
    const front = HALF.z + .008;
    const top = HALF.y + .008;
    const side = HALF.x + .008;
    const segments = [
      // restrained front-face crystal seams
      [-1.12, .64, front, -.62, .28, front], [-.62, .28, front, -.92, -.46, front],
      [-.62, .28, front, -.14, .62, front], [.58, .68, front, .18, .20, front],
      [.18, .20, front, .74, -.52, front], [.18, .20, front, -.18, -.62, front],
      // top facets
      [-1.12, top, -.78, -.44, top, -.22], [-.44, top, -.22, -.82, top, .70],
      [-.44, top, -.22, .22, top, -.78], [.22, top, -.78, .92, top, -.28],
      [.92, top, -.28, .42, top, .72], [.42, top, .72, -.44, top, -.22],
      // narrow side accents
      [side, .64, -.74, side, .20, -.22], [side, .20, -.22, side, -.56, -.60],
      [side, .20, -.22, side, .60, .44], [side, .60, .44, side, -.36, .72],
    ];
    const next = new THREE.BufferGeometry();
    next.setAttribute("position", new THREE.Float32BufferAttribute(segments.flat(), 3));
    return next;
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <lineSegments geometry={geometry} renderOrder={3}>
      <lineBasicMaterial color="#be7cff" transparent opacity={.25} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
    </lineSegments>
  );
}

function TopFacets() {
  const geometries = useMemo(() => {
    const y = HALF.y + .004;
    const triangles = [
      [[-1.18, y, -.84], [-.44, y, -.22], [-.82, y, .70]],
      [[-1.16, y, -.82], [.22, y, -.78], [-.44, y, -.22]],
      [[.22, y, -.78], [.94, y, -.28], [-.44, y, -.22]],
      [[-.44, y, -.22], [.94, y, -.28], [.42, y, .72]],
      [[-.44, y, -.22], [.42, y, .72], [-.82, y, .70]],
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
        <mesh key={index} geometry={geometry} renderOrder={2}>
          <meshBasicMaterial
            color={index % 2 ? "#7f39d7" : "#4c176f"}
            transparent
            opacity={index % 2 ? .23 : .15}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            side={THREE.DoubleSide}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}

export default function VerseCube({ reducedMotion = false }: { reducedMotion?: boolean }) {
  const group = useRef<THREE.Group>(null);
  const localTime = useRef(0);
  const mark = useTexture("/brand/verse/verse-mark-purple-512.png");

  useEffect(() => {
    mark.colorSpace = THREE.SRGBColorSpace;
    mark.needsUpdate = true;
  }, [mark]);

  useFrame((_, delta) => {
    const node = group.current;
    if (!node) return;
    if (!reducedMotion) localTime.current += Math.min(delta, 1 / 20);
    const t = localTime.current;
    node.rotation.set(
      CUBE_BASE_ROTATION[0] + Math.sin(t * .20) * .012,
      CUBE_BASE_ROTATION[1] + Math.sin(t * .16) * .018,
      CUBE_BASE_ROTATION[2] + Math.sin(t * .14) * .005,
    );
    node.position.y = Math.sin(t * .68) * .045;
  });

  return (
    <group ref={group} rotation={CUBE_BASE_ROTATION}>
      {/* Dense obsidian core: visible before the invisible orbit occluder. */}
      <mesh scale={[.935, .935, .935]} renderOrder={-2}>
        <boxGeometry args={CUBE_SIZE} />
        <meshStandardMaterial color="#09030f" emissive="#210632" emissiveIntensity={.20} roughness={.34} metalness={.28} />
      </mesh>

      {/* Slightly larger depth-only body creates natural rear/front token occlusion. */}
      <mesh scale={[.968, .968, .968]} renderOrder={-1}>
        <boxGeometry args={CUBE_SIZE} />
        <meshBasicMaterial colorWrite={false} depthWrite depthTest />
      </mesh>

      {/* Obsidian-violet clear shell. No opaque logo plaque. */}
      <mesh renderOrder={1}>
        <boxGeometry args={CUBE_SIZE} />
        {Array.from({ length: 6 }, (_, index) => (
          <meshPhysicalMaterial
            key={index}
            attach={`material-${index}`}
            color={index === 2 ? "#391054" : index === 4 ? "#2d0a44" : index === 0 ? "#240832" : "#190522"}
            emissive={index === 4 ? "#430b67" : index === 2 ? "#4b1170" : "#250635"}
            emissiveIntensity={index === 4 ? .30 : index === 2 ? .30 : .18}
            transparent
            opacity={index === 2 ? .66 : .57}
            roughness={.19}
            metalness={.22}
            transmission={0}
            clearcoat={.72}
            clearcoatRoughness={.18}
            depthWrite={false}
            depthTest
          />
        ))}
        <Edges threshold={12} color="#c076ff" lineWidth={1.25} />
      </mesh>

      {/* Transparent Verse mark sits directly on the physical front face. */}
      <mesh position={[0, 0, HALF.z + .012]} renderOrder={4}>
        <planeGeometry args={[.92, .92]} />
        <meshBasicMaterial map={mark} transparent alphaTest={.025} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0, HALF.z + .009]} scale={1.16} renderOrder={3}>
        <planeGeometry args={[.92, .92]} />
        <meshBasicMaterial map={mark} color="#b65dff" transparent opacity={.28} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>

      <TopFacets />
      <SurfaceFractures />
    </group>
  );
}
