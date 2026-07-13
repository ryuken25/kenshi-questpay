"use client";

import { useEffect, useMemo, useRef } from "react";
import { RoundedBox, useTexture } from "@react-three/drei";
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

function VisibleEdgeGlow() {
  const geometries = useMemo(() => {
    const inset = .035;
    const left = -HALF.x + inset;
    const right = HALF.x - inset;
    const top = HALF.y - inset;
    const bottom = -HALF.y + inset;
    const front = HALF.z + .012;
    const back = -HALF.z + inset;
    const bright = [
      [left, top, front, right, top, front],
      [right, top, front, right, bottom, front],
      [right, bottom, front, left, bottom, front],
      [left, bottom, front, left, top, front],
    ];
    const structural = [
      [left, top, front, left, top, back],
      [right, top, front, right, top, back],
      [right, bottom, front, right, bottom, back],
      [left, top, back, right, top, back],
      [right, top, back, right, bottom, back],
    ];
    return [bright, structural].map((segments) => {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.Float32BufferAttribute(segments.flat(), 3));
      return geometry;
    });
  }, []);
  useEffect(() => () => geometries.forEach((geometry) => geometry.dispose()), [geometries]);
  return (
    <group renderOrder={5}>
      <lineSegments geometry={geometries[0]}>
        <lineBasicMaterial color="#e09aff" transparent opacity={.92} blending={THREE.AdditiveBlending} depthTest depthWrite={false} toneMapped={false} />
      </lineSegments>
      <lineSegments geometry={geometries[1]}>
        <lineBasicMaterial color="#a958e8" transparent opacity={.50} blending={THREE.AdditiveBlending} depthTest depthWrite={false} toneMapped={false} />
      </lineSegments>
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
      {/* Dense rounded obsidian core keeps the form solid, never wireframe-like. */}
      <RoundedBox args={CUBE_SIZE} radius={.04} smoothness={2} bevelSegments={2} creaseAngle={.18} scale={[.955, .955, .955]} renderOrder={-2}>
        <meshStandardMaterial color="#0d0316" emissive="#31064a" emissiveIntensity={.28} roughness={.28} metalness={.18} />
      </RoundedBox>

      {/* Depth-only body preserves natural front/rear token occlusion. */}
      <RoundedBox args={CUBE_SIZE} radius={.04} smoothness={2} bevelSegments={2} creaseAngle={.18} scale={[.985, .985, .985]} renderOrder={-1}>
        <meshBasicMaterial colorWrite={false} depthWrite depthTest />
      </RoundedBox>

      {/* Solid dark-glass shell: beveled silhouette, no transparent back-edge cage. */}
      <RoundedBox args={CUBE_SIZE} radius={.04} smoothness={2} bevelSegments={2} creaseAngle={.18} renderOrder={1}>
        <meshPhysicalMaterial
          color="#220735"
          emissive="#520d7d"
          emissiveIntensity={.31}
          transparent
          opacity={.91}
          roughness={.18}
          metalness={.14}
          transmission={0}
          clearcoat={.66}
          clearcoatRoughness={.16}
          depthWrite
          depthTest
        />
        <VisibleEdgeGlow />
      </RoundedBox>

      {/* Transparent Verse mark sits directly on the physical front face. */}
      <mesh position={[0, 0, HALF.z + .012]} renderOrder={4}>
        <planeGeometry args={[.92, .92]} />
        <meshBasicMaterial map={mark} transparent alphaTest={.025} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0, HALF.z + .009]} scale={1.12} renderOrder={3}>
        <planeGeometry args={[.92, .92]} />
        <meshBasicMaterial map={mark} color="#b65dff" transparent opacity={.24} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>

      {/* Reference has a quiet embossed Verse mark on the top face. */}
      <mesh position={[0, HALF.y + .012, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={4}>
        <planeGeometry args={[.86, .86]} />
        <meshBasicMaterial map={mark} color="#7d34ad" transparent opacity={.20} depthWrite={false} toneMapped={false} />
      </mesh>

      <TopFacets />
      <SurfaceFractures />
    </group>
  );
}
