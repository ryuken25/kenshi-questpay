import type { HeroQuality } from "./hero3d.config";

export default function SceneLights({ quality = "high" }: { quality?: HeroQuality }) {
  return (
    <>
      <ambientLight intensity={0.22} />
      <pointLight position={[-2.4, 2.6, 3.8]} color="#7a4abf" intensity={8} distance={9} decay={2} />
      <pointLight position={[2.8, -0.8, 2]} color="#4c1d8a" intensity={4} distance={8} decay={2} />
      <directionalLight position={[3, 4, 5]} color="#9b7ac8" intensity={0.5} />
      {quality === "high" ? <pointLight position={[0, 0.25, -2.4]} color="#5a28b0" intensity={2.5} distance={5} decay={2} /> : null}
    </>
  );
}
