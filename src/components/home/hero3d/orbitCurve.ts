import * as THREE from "three";
import type { OrbitConfig } from "./hero3d.config";

export type BuiltOrbit = {
  curve: THREE.CatmullRomCurve3;
  geometry: THREE.TubeGeometry;
};

export function createOrbitCurve(config: OrbitConfig, radiusScale: number): BuiltOrbit {
  const euler = new THREE.Euler(...config.euler);
  const points = Array.from({ length: 128 }, (_, index) => {
    const angle = (index / 128) * Math.PI * 2;
    return new THREE.Vector3(
      Math.cos(angle) * config.radius[0] * radiusScale,
      Math.sin(angle) * config.radius[1] * radiusScale + config.verticalOffset,
      Math.sin(angle) * config.radius[2] * radiusScale,
    ).applyEuler(euler);
  });
  const curve = new THREE.CatmullRomCurve3(points, true, "centripetal");
  curve.arcLengthDivisions = 384;
  curve.updateArcLengths();
  return { curve, geometry: new THREE.TubeGeometry(curve, 192, 0.008, 5, true) };
}
