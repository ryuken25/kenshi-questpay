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
  // Tighter, cleaner orbits so medallions stay inside the soft vignette.
  { id: "pol", texture: "/brand/tokens/polygon/polygon-pol-mark-512.png", body: "#1a0d2e", rim: "#8247e5", emissive: "#b88aff", radius: [2.05, 1.02, 1.34], euler: [.14, -.14, -.12], duration: 24, phase: Math.PI, verticalOffset: -.02, size: .22, spin: [.06, .26, .04] },
  { id: "usdt", texture: "/brand/tokens/tether/usdt-mark-512.png", body: "#042e22", rim: "#26a17b", emissive: "#78f2c8", radius: [2.08, 1.06, 1.38], euler: [-.10, .16, .10], duration: 25.5, phase: 0, verticalOffset: .03, size: .215, spin: [.04, .22, .03] },
  { id: "verse", texture: "/brand/tokens/verse/verse-mark-512.png", body: "#1a0938", rim: "#7c5cff", emissive: "#d09aff", radius: [2.28, 1.34, 1.48], euler: [.16, -.12, .14], duration: 28, phase: Math.PI / 2, verticalOffset: .01, size: .23, spin: [.03, .18, .02] },
  { id: "usdc", texture: "/brand/tokens/circle/usdc-mark-512.png", body: "#052044", rim: "#2775ca", emissive: "#82c9ff", radius: [2.16, 1.28, 1.42], euler: [-.14, .10, -.12], duration: 26.5, phase: (3 * Math.PI) / 2, verticalOffset: -.015, size: .22, spin: [.05, .2, .05] },
];

export const seeded = (index: number, salt = 0) => {
  const value = Math.sin(index * 91.733 + salt * 17.17) * 43758.5453;
  return value - Math.floor(value);
};
