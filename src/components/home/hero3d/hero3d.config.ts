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

export const CUBE_SIZE: [number, number, number] = [3.15, 2.75, 3.15];
export const CUBE_BASE_ROTATION: [number, number, number] = [-0.18, -0.62, 0.015];

export const ORBITS: OrbitConfig[] = [
  { id: "pol", texture: "/tokens/hero/pol-dark.png", body: "#251043", rim: "#7f43df", emissive: "#aa74ff", radius: [2.15, .58, 1.38], euler: [.12, 0, -.18], duration: 14.8, phase: .35, verticalOffset: -.04, size: .34, spin: [.08, .32, .06] },
  { id: "usdt", texture: "/tokens/hero/usdt-dark.png", body: "#073329", rim: "#249d7d", emissive: "#6bd7b3", radius: [2.38, .66, 1.55], euler: [-.08, .12, .08], duration: 13.9, phase: 2.2, verticalOffset: .09, size: .32, spin: [.05, .26, .04] },
  { id: "verse", texture: "/tokens/hero/verse-dark.png", body: "#28103d", rim: "#8040d2", emissive: "#ba82ff", radius: [2.62, .72, 1.72], euler: [.20, -.10, .22], duration: 18.4, phase: 4.15, verticalOffset: .02, size: .36, spin: [.04, .20, .03] },
  { id: "usdc", texture: "/tokens/hero/usdc-dark.png", body: "#09243c", rim: "#2c75b8", emissive: "#6db8ff", radius: [2.48, .64, 1.62], euler: [-.16, .04, -.10], duration: 16.2, phase: 5.65, verticalOffset: -.08, size: .33, spin: [.07, .24, .08] },
];

export const seeded = (index: number, salt = 0) => {
  const value = Math.sin(index * 91.733 + salt * 17.17) * 43758.5453;
  return value - Math.floor(value);
};
