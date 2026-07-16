import type { HeroQuality } from "./hero3d.config";

export default function SceneLights({ quality = "high" }: { quality?: HeroQuality }) {
  return (
    <>
      <ambientLight intensity={0.45} />
      <pointLight position={[-2.4, 2.6, 3.8]} color="#b070f0" intensity={22} distance={9} decay={2} />
      <pointLight position={[2.8, -0.8, 2]} color="#7c3fdb" intensity={14} distance={8} decay={2} />
      <directionalLight position={[3, 4, 5]} color="#c8a8f0" intensity={1.4} />
      {quality === "high" ? <pointLight position={[0, 0.25, -2.4]} color="#8240ee" intensity={8} distance={5} decay={2} /> : <pointLight position={[0, 0.25, -2.4]} color="#8240ee" intensity={5} distance={5} decay={2} />}
    </>
  );
}
