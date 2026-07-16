import type { HeroQuality } from "./hero3d.config";

export default function SceneLights({ quality = "high" }: { quality?: HeroQuality }) {
  return (
    <>
      <ambientLight intensity={0.30} />
      <pointLight position={[-2.4, 2.6, 3.8]} color="#9a5fea" intensity={14} distance={9} decay={2} />
      <pointLight position={[2.8, -0.8, 2]} color="#5c2dba" intensity={7} distance={8} decay={2} />
      <directionalLight position={[3, 4, 5]} color="#b89ce8" intensity={0.8} />
      {quality === "high" ? <pointLight position={[0, 0.25, -2.4]} color="#6b32d8" intensity={4} distance={5} decay={2} /> : null}
    </>
  );
}
