"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { ORBITS, type OrbitConfig } from "./hero3d.config";
import TokenMedallion from "./TokenMedallion";

function initialPosition(config: OrbitConfig, radiusScale: number) {
  const angle = config.phase;
  return new THREE.Vector3(
    Math.cos(angle) * config.radius[0] * radiusScale,
    Math.sin(angle) * config.radius[1] * radiusScale + config.verticalOffset,
    Math.sin(angle) * config.radius[2] * radiusScale,
  ).applyEuler(new THREE.Euler(...config.euler));
}

function OrbitRing({ config, radiusScale }: { config: OrbitConfig; radiusScale: number }) {
  const geometry = useMemo(() => {
    const euler = new THREE.Euler(...config.euler);
    const points = Array.from({ length: 96 }, (_, index) => {
      const angle = (index / 96) * Math.PI * 2;
      return new THREE.Vector3(
        Math.cos(angle) * config.radius[0] * radiusScale,
        Math.sin(angle) * config.radius[1] * radiusScale + config.verticalOffset,
        Math.sin(angle) * config.radius[2] * radiusScale,
      ).applyEuler(euler);
    });
    const curve = new THREE.CatmullRomCurve3(points, true, "centripetal");
    return new THREE.TubeGeometry(curve, 128, .008, 5, true);
  }, [config, radiusScale]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <mesh geometry={geometry}>
      <meshBasicMaterial color={config.id === "usdt" ? "#65439b" : "#8450d4"} transparent opacity={config.id === "verse" ? .22 : .14} depthTest depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
    </mesh>
  );
}

export default function OrbitSystem({ mobile = false, reducedMotion = false }: { mobile?: boolean; reducedMotion?: boolean }) {
  const groups = useRef<Array<THREE.Group | null>>([]);
  const localTime = useRef(0);
  const radiusScale = mobile ? .82 : 1;
  const vectors = useMemo(() => ORBITS.map(() => new THREE.Vector3()), []);
  const eulers = useMemo(() => ORBITS.map((config) => new THREE.Euler(...config.euler)), []);

  useFrame((_, delta) => {
    if (!reducedMotion) localTime.current += Math.min(delta, 1 / 20);
    const time = localTime.current;
    ORBITS.forEach((config, index) => {
      const node = groups.current[index];
      if (!node) return;
      const angle = time * ((Math.PI * 2) / config.duration) + config.phase;
      vectors[index].set(
        Math.cos(angle) * config.radius[0] * radiusScale,
        Math.sin(angle) * config.radius[1] * radiusScale + config.verticalOffset + Math.sin(time * .53 + config.phase) * .025,
        Math.sin(angle) * config.radius[2] * radiusScale,
      ).applyEuler(eulers[index]);
      node.position.copy(vectors[index]);
    });
  });

  return (
    <group>
      {ORBITS.slice(0, 3).map((config) => <OrbitRing key={`ring-${config.id}`} config={config} radiusScale={radiusScale} />)}
      {ORBITS.map((config, index) => {
        const position = initialPosition(config, radiusScale);
        return (
          <group key={config.id} ref={(node) => { groups.current[index] = node; }} position={position}>
            <TokenMedallion config={config} reducedMotion={reducedMotion} />
          </group>
        );
      })}
    </group>
  );
}
