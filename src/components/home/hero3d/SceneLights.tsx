export default function SceneLights() {
  return (
    <>
      <ambientLight intensity={0.34} />
      <pointLight position={[-2.4, 2.6, 3.8]} color="#b66fff" intensity={18} distance={9} decay={2} />
      <pointLight position={[2.8, -0.8, 2]} color="#6c28d9" intensity={10} distance={8} decay={2} />
      <directionalLight position={[3, 4, 5]} color="#d7b4ff" intensity={1.1} />
      <pointLight position={[0, 0.25, -2.4]} color="#7f35ee" intensity={6} distance={5} decay={2} />
    </>
  );
}
