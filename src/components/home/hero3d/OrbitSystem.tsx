"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { ORBITS } from "./hero3d.config";
import { createOrbitCurve, type BuiltOrbit } from "./orbitCurve";
import TokenMedallion from "./TokenMedallion";

declare global {
  interface Window {
    __QUESTPAY_HERO3D_DEBUG__?: {
      frame: number;
      tokens: Array<{ id: string; progress: number; x: number; y: number; z: number }>;
    };
  }
}

function OrbitRing({ built, tokenId }: { built: BuiltOrbit; tokenId: string }) {
  const coreColor = tokenId === "usdt" ? "#6a4e9a" : "#7a5cb0";
  return (
    <group>
      <mesh geometry={built.haloGeometry}>
        <meshBasicMaterial color={coreColor} transparent opacity={.04} depthTest depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </mesh>
      <mesh geometry={built.geometry}>
        <meshBasicMaterial
          color={coreColor}
          transparent
          opacity={tokenId === "verse" ? .26 : .18}
          depthTest
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

export default function OrbitSystem({ mobile = false, reducedMotion = false }: { mobile?: boolean; reducedMotion?: boolean }) {
  const radiusScale = mobile ? .88 : 1.15;
  const groups = useRef<Array<THREE.Group | null>>([]);
  const progresses = useRef(ORBITS.map((config) => ((config.phase / (Math.PI * 2)) % 1 + 1) % 1));
  const points = useMemo(() => ORBITS.map(() => new THREE.Vector3()), []);
  const resumeGuard = useRef(true);
  const debugState = useRef({
    frame: 0,
    tokens: ORBITS.map((config, index) => {
      const point = new THREE.Vector3();
      return { id: config.id, progress: progresses.current[index], x: point.x, y: point.y, z: point.z };
    }),
  });
  const builtOrbits = useMemo(() => ORBITS.map((config) => createOrbitCurve(config, radiusScale)), [radiusScale]);

  useEffect(() => () => builtOrbits.forEach(({ geometry, haloGeometry }) => {
    geometry.dispose();
    haloGeometry.dispose();
  }), [builtOrbits]);

  useEffect(() => {
    const debug = debugState.current;
    window.__QUESTPAY_HERO3D_DEBUG__ = debug;
    return () => {
      if (window.__QUESTPAY_HERO3D_DEBUG__ === debug) delete window.__QUESTPAY_HERO3D_DEBUG__;
    };
  }, []);

  useEffect(() => {
    const onVisibility = () => { if (!document.hidden) resumeGuard.current = true; };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  useFrame((_, delta) => {
    if (reducedMotion) return;
    if (resumeGuard.current) {
      resumeGuard.current = false;
      return;
    }
    const dt = delta > .15 ? 0 : Math.min(delta, 1 / 12);
    ORBITS.forEach((config, index) => {
      const node = groups.current[index];
      if (!node) return;
      progresses.current[index] = (progresses.current[index] + dt / config.duration) % 1;
      builtOrbits[index].curve.getPointAt(progresses.current[index], points[index]);
      node.position.copy(points[index]);
      const sample = debugState.current.tokens[index];
      sample.progress = progresses.current[index];
      sample.x = points[index].x;
      sample.y = points[index].y;
      sample.z = points[index].z;
    });
    debugState.current.frame += 1;
  });

  return (
    <group>
      {builtOrbits.map((built, index) => (
        <OrbitRing key={`ring-${ORBITS[index].id}`} built={built} tokenId={ORBITS[index].id} />
      ))}
      {ORBITS.map((config, index) => (
        <group
          key={config.id}
          ref={(node) => { groups.current[index] = node; }}
          position={builtOrbits[index].curve.getPointAt(progresses.current[index])}
        >
          <TokenMedallion config={config} reducedMotion={reducedMotion} />
        </group>
      ))}
    </group>
  );
}
