/**
 * Centralized token metadata — single source of truth.
 * Used by: 3D hero scene, checkout, service details, marketing pages.
 * Never hardcode token lists in individual components.
 */

export type TokenId = "pol" | "usdt" | "verse" | "usdc";

export type PaymentAssetMeta = {
  id: TokenId;
  canonicalName: string;
  displaySymbol: string;
  networkDisplayName: string;
  contractAddress?: `0x${string}`;
  decimals: number;
  logoPath: string;
  logoPathSvg: string;
  explorerTokenUrl?: string;
  enabled: boolean;
  /** 3D scene colors */
  body: string;
  rim: string;
  emissive: string;
};

export const PAYMENT_ASSETS: Record<TokenId, PaymentAssetMeta> = {
  pol: {
    id: "pol",
    canonicalName: "Polygon",
    displaySymbol: "POL",
    networkDisplayName: "Polygon",
    contractAddress: undefined,
    decimals: 18,
    logoPath: "/brand/tokens/polygon/polygon-pol-mark-512.png",
    logoPathSvg: "/brand/tokens/polygon/polygon-pol-mark.svg",
    enabled: true,
    body: "#1a0d2e",
    rim: "#8247e5",
    emissive: "#b88aff",
  },
  usdt: {
    id: "usdt",
    canonicalName: "Tether",
    displaySymbol: "USDT",
    networkDisplayName: "Polygon",
    contractAddress: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F" as `0x${string}`,
    decimals: 6,
    logoPath: "/brand/tokens/tether/usdt-mark-512.png",
    logoPathSvg: "/brand/tokens/tether/usdt-mark.svg",
    explorerTokenUrl: "https://polygonscan.com/token/0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
    enabled: true,
    body: "#042e22",
    rim: "#26a17b",
    emissive: "#78f2c8",
  },
  verse: {
    id: "verse",
    canonicalName: "VERSE",
    displaySymbol: "VERSE",
    networkDisplayName: "Polygon",
    contractAddress: "0x0d696fA6f6AC85f0475d6Fa692B3C9f820bc0f8A" as `0x${string}`,
    decimals: 18,
    logoPath: "/brand/tokens/verse/verse-mark-512.png",
    logoPathSvg: "/brand/tokens/verse/verse-mark.svg",
    explorerTokenUrl: "https://polygonscan.com/token/0x0d696fA6f6AC85f0475d6Fa692B3C9f820bc0f8A",
    enabled: true,
    body: "#1a0938",
    rim: "#7c5cff",
    emissive: "#d09aff",
  },
  usdc: {
    id: "usdc",
    canonicalName: "USD Coin",
    displaySymbol: "USDC",
    networkDisplayName: "Polygon",
    contractAddress: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174" as `0x${string}`,
    decimals: 6,
    logoPath: "/brand/tokens/circle/usdc-mark-512.png",
    logoPathSvg: "/brand/tokens/circle/usdc-mark.svg",
    explorerTokenUrl: "https://polygonscan.com/token/0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
    enabled: true,
    body: "#052044",
    rim: "#2775ca",
    emissive: "#82c9ff",
  },
};

export const ENABLED_TOKENS: TokenId[] = Object.entries(PAYMENT_ASSETS)
  .filter(([, meta]) => meta.enabled)
  .map(([id]) => id as TokenId);

export const ENABLED_TOKEN_SYMBOLS: string[] = ENABLED_TOKENS.map((id) => PAYMENT_ASSETS[id].displaySymbol);

/** Get token display string for marketing/checkout */
export function getTokenDisplay(id: TokenId): string {
  const meta = PAYMENT_ASSETS[id];
  return meta.displaySymbol;
}

/** Get all enabled token symbols as comma-separated string */
export function getEnabledTokenString(): string {
  return ENABLED_TOKEN_SYMBOLS.join(", ");
}
