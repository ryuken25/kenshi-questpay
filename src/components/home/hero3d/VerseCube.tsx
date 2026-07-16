"use client";

import { useEffect, useMemo, useRef } from "react";
import { Line, RoundedBox, useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { CUBE_BASE_ROTATION, CUBE_SIZE } from "./hero3d.config";

const HALF = { x: CUBE_SIZE[0] / 2, y: CUBE_SIZE[1] / 2, z: CUBE_SIZE[2] / 2 };

function GlassPanels() {
  const thickness = .047;
  const pad = .07;
  const common = { transparent: true, transmission: .28, roughness: .21, metalness: .13, ior: 1.45, thickness: .62, depthWrite: false } as const;
  return (
    <group renderOrder={2}>
      <RoundedBox args={[CUBE_SIZE[0] - pad, CUBE_SIZE[1] - pad, thickness]} radius={.025} smoothness={2} bevelSegments={1} position={[0, 0, HALF.z + .018]}>
        <meshPhysicalMaterial {...common} color="#19062f" opacity={.34} />
      </RoundedBox>
      <RoundedBox args={[CUBE_SIZE[0] - pad, CUBE_SIZE[2] - pad, thickness]} radius={.025} smoothness={2} bevelSegments={1} position={[0, HALF.y + .018, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <meshPhysicalMaterial {...common} color="#220744" opacity={.28} />
      </RoundedBox>
      <RoundedBox args={[CUBE_SIZE[2] - pad, CUBE_SIZE[1] - pad, thickness]} radius={.025} smoothness={2} bevelSegments={1} position={[HALF.x + .018, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <meshPhysicalMaterial {...common} color="#0e041b" opacity={.38} />
      </RoundedBox>
    </group>
  );
}

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
  const { bright, structural, hotPoints } = useMemo(() => {
    const inset = .028;
    const left = -HALF.x + inset;
    const right = HALF.x - inset;
    const top = HALF.y - inset;
    const bottom = -HALF.y + inset;
    const front = HALF.z + .014;
    const back = -HALF.z + inset;
    const toPoints = (segments: number[][]) => segments.flatMap(([x1, y1, z1, x2, y2, z2]) => [[x1, y1, z1], [x2, y2, z2]] as [number, number, number][]);
    const bright = toPoints([
      [left, top, front, right, top, front],
      [right, top, front, right, bottom, front],
      [right, bottom, front, left, bottom, front],
      [left, bottom, front, left, top, front],
      [left, top, front, left, top, back],
      [right, top, front, right, top, back],
      [right, bottom, front, right, bottom, back],
    ]);
    const structural = toPoints([
      [left, top, front, left, top, back],
      [right, top, front, right, top, back],
      [right, bottom, front, right, bottom, back],
      [left, top, back, right, top, back],
      [right, top, back, right, bottom, back],
    ]);
    const hotPoints = [ [left, top, front],[right, top, front],[left, bottom, front],[right, bottom, front] ].map(([x,y,z]) => new THREE.Vector3(x, y, z));
    return { bright, structural, hotPoints };
  }, []);

  return (
    <group renderOrder={6}>
      <Line points={bright} segments lineWidth={7} color="#b852ff" transparent opacity={.18} blending={THREE.AdditiveBlending} depthTest depthWrite={false} toneMapped={false} />
      <Line points={bright} segments lineWidth={3.2} color="#d070ff" transparent opacity={.42} blending={THREE.AdditiveBlending} depthTest depthWrite={false} toneMapped={false} />
      <Line points={bright} segments lineWidth={1.7} color="#f0d0ff" transparent={false} depthTest depthWrite={false} toneMapped={false} />
      <Line points={structural} segments lineWidth={4.5} color="#9038e0" transparent opacity={.10} blending={THREE.AdditiveBlending} depthTest depthWrite={false} toneMapped={false} />
      <Line points={structural} segments lineWidth={1} color="#c060f0" transparent opacity={.42} blending={THREE.AdditiveBlending} depthTest depthWrite={false} toneMapped={false} />
      {hotPoints.map((p, i) => (
        <group key={i} position={p}>
          <mesh renderOrder={7}>
            <circleGeometry args={[.045, 24]} />
            <meshBasicMaterial color="#f0d8ff" transparent opacity={.88} toneMapped={false} depthTest depthWrite={false} />
          </mesh>
          <pointLight color="#d090ff" intensity={3.5} distance={1.0} decay={2} />
        </group>
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
      {/* Dense rounded obsidian core keeps the form solid, never wireframe-like. */}
      <RoundedBox args={CUBE_SIZE} radius={.055} smoothness={2} bevelSegments={2} creaseAngle={.18} scale={[.955, .955, .955]} renderOrder={-2}>
        <meshStandardMaterial color="#10042a" emissive="#4a0c7a" emissiveIntensity={.38} roughness={.26} metalness={.20} />
      </RoundedBox>

      {/* Depth-only body preserves natural front/rear token occlusion. */}
      <RoundedBox args={CUBE_SIZE} radius={.055} smoothness={2} bevelSegments={2} creaseAngle={.18} scale={[.985, .985, .985]} renderOrder={-1}>
        <meshBasicMaterial colorWrite={false} depthWrite depthTest />
      </RoundedBox>

      {/* Solid dark-glass shell: beveled silhouette, no transparent back-edge cage. */}
      <RoundedBox args={CUBE_SIZE} radius={.055} smoothness={2} bevelSegments={2} creaseAngle={.18} renderOrder={1}>
        <meshPhysicalMaterial
          color="#1e0840"
          emissive="#5a1090"
          emissiveIntensity={.36}
          transparent
          opacity={.78}
          roughness={.16}
          metalness={.14}
          transmission={0}
          clearcoat={.72}
          clearcoatRoughness={.14}
          depthWrite
          depthTest
        />
        <VisibleEdgeGlow />
      </RoundedBox>
      <GlassPanels />

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
