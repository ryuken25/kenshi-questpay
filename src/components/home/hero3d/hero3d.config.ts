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
  // Tighter orbits + official logos for cleaner premium coin composition.
  { id: "pol", texture: "/brand/tokens/polygon/polygon-pol-mark-512.png", body: "#1a0d2e", rim: "#8247e5", emissive: "#c09bff", radius: [1.95, 0.98, 1.28], euler: [.12, -.12, -.10], duration: 24, phase: Math.PI, verticalOffset: -.02, size: .27, spin: [.05, .22, .03] },
  { id: "usdt", texture: "/brand/tokens/tether/usdt-mark-512.png", body: "#042e22", rim: "#26a17b", emissive: "#7dffcf", radius: [1.98, 1.02, 1.32], euler: [-.09, .14, .09], duration: 25.5, phase: 0, verticalOffset: .03, size: .265, spin: [.04, .2, .03] },
  { id: "verse", texture: "/brand/tokens/verse/verse-mark-512.png", body: "#1a0938", rim: "#8b5cff", emissive: "#dfb6ff", radius: [2.15, 1.24, 1.4], euler: [.14, -.11, .12], duration: 28, phase: Math.PI / 2, verticalOffset: .01, size: .28, spin: [.03, .17, .02] },
  { id: "usdc", texture: "/brand/tokens/circle/usdc-mark-512.png", body: "#052044", rim: "#2775ca", emissive: "#8ed2ff", radius: [2.05, 1.18, 1.34], euler: [-.12, .1, -.1], duration: 26.5, phase: (3 * Math.PI) / 2, verticalOffset: -.015, size: .27, spin: [.04, .18, .04] },
];

export const seeded = (index: number, salt = 0) => {
  const value = Math.sin(index * 91.733 + salt * 17.17) * 43758.5453;
  return value - Math.floor(value);
};
