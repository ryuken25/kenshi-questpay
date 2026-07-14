export type TokenId = "pol" | "usdt" | "verse" | "usdc";
export type HeroQuality = "high" | "low";

export type OrbitConfig = {
  id: TokenId;
  texture: string;
  body: string;
  rim: string;
  emissive: string;
  radius: [number, number, number];
  euler: [number, number, number];
  duration: number;
  phase: number;
  verticalOffset: number;
  size: number;
  spin: [number, number, number];
};

export const CUBE_SIZE: [number, number, number] = [2.04, 1.8768, 1.7748];
export const CUBE_BASE_ROTATION: [number, number, number] = [0.366519, -0.488692, 0];

export const ORBITS: OrbitConfig[] = [
  { id: "pol", texture: "/tokens/hero-kit/pol-logo-kit.png", body: "#2a0d50", rim: "#8247e5", emissive: "#b88aff", radius: [2.45, 1.18, 1.58], euler: [.16, -.16, -.16], duration: 22, phase: Math.PI, verticalOffset: -.03, size: .24, spin: [.08, .32, .06] },
  { id: "usdt", texture: "/tokens/hero-kit/usdt-logo-kit.png", body: "#042e22", rim: "#26a17b", emissive: "#78f2c8", radius: [2.45, 1.22, 1.62], euler: [-.12, .18, .12], duration: 23.5, phase: 0, verticalOffset: .04, size: .235, spin: [.05, .26, .04] },
  { id: "verse", texture: "/tokens/hero-kit/verse-logo-kit.png", body: "#240944", rim: "#7c5cff", emissive: "#d09aff", radius: [2.72, 1.62, 1.74], euler: [.18, -.14, .18], duration: 26, phase: Math.PI / 2, verticalOffset: .02, size: .255, spin: [.04, .20, .03] },
  { id: "usdc", texture: "/tokens/hero-kit/usdc-logo-kit.png", body: "#052044", rim: "#2775ca", emissive: "#82c9ff", radius: [2.58, 1.52, 1.68], euler: [-.18, .12, -.14], duration: 24.5, phase: (3 * Math.PI) / 2, verticalOffset: -.02, size: .24, spin: [.07, .24, .08] },
];

export const seeded = (index: number, salt = 0) => {
  const value = Math.sin(index * 91.733 + salt * 17.17) * 43758.5453;
  return value - Math.floor(value);
};
