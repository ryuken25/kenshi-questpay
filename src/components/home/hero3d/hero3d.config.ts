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

export const CUBE_SIZE: [number, number, number] = [2.6, 1.75, 2.05];
export const CUBE_BASE_ROTATION: [number, number, number] = [-0.20, -0.48, 0.012];

export const ORBITS: OrbitConfig[] = [
  { id: "pol", texture: "/tokens/hero/pol-dark.png", body: "#251043", rim: "#a65cff", emissive: "#c58cff", radius: [2.55, 1.18, 1.58], euler: [.12, 0, -.18], duration: 14.8, phase: .35, verticalOffset: -.04, size: .24, spin: [.08, .32, .06] },
  { id: "usdt", texture: "/tokens/hero/usdt-dark.png", body: "#06382d", rim: "#35c99c", emissive: "#78f2c8", radius: [2.78, 1.28, 1.72], euler: [-.08, .12, .08], duration: 13.9, phase: 2.2, verticalOffset: .09, size: .235, spin: [.05, .26, .04] },
  { id: "verse", texture: "/tokens/hero/verse-dark.png", body: "#28103d", rim: "#9a55ef", emissive: "#d09aff", radius: [3.02, 1.46, 1.90], euler: [.20, -.10, .22], duration: 18.4, phase: 4.15, verticalOffset: .02, size: .255, spin: [.04, .20, .03] },
  { id: "usdc", texture: "/tokens/hero/usdc-dark.png", body: "#092b49", rim: "#3d91df", emissive: "#82c9ff", radius: [2.86, 1.32, 1.82], euler: [-.16, .04, -.10], duration: 16.2, phase: 5.65, verticalOffset: -.08, size: .24, spin: [.07, .24, .08] },
];

export const seeded = (index: number, salt = 0) => {
  const value = Math.sin(index * 91.733 + salt * 17.17) * 43758.5453;
  return value - Math.floor(value);
};
