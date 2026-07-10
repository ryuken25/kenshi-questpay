/**
 * QuestPay v2 service catalog.
 *
 * Shared between client and server. Prices are in USDT and are the
 * canonical source of truth for payment amounts.
 *
 * Token amounts on Polygon mainnet (chainId 137):
 *   USDT (6 decimals)  — always the exact USD price
 *   VERSE (18 decimals) — always the exact USD price (1:1 for simplicity)
 *   POL (18 decimals)   — only enabled if a POL_AMOUNT_USD env is set
 *                         (owner must set the POL price manually)
 */

export interface ServicePackage {
  slug: string;
  name: string;
  usd: number;
  description: string;
  emoji: string;
}

export const SERVICES: ServicePackage[] = [
  {
    slug: "micro-review",
    name: "Micro Review",
    usd: 1,
    description: "One short brief review or one actionable UI/code note.",
    emoji: "🔍",
  },
  {
    slug: "quick-fix",
    name: "Quick Fix",
    usd: 5,
    description: "One small bug, styling issue, or copy correction.",
    emoji: "⚡",
  },
  {
    slug: "mini-build",
    name: "Mini Build",
    usd: 15,
    description: "Small component or focused feature.",
    emoji: "🎯",
  },
  {
    slug: "standard-quest",
    name: "Standard Quest",
    usd: 40,
    description: "Medium page or integration task.",
    emoji: "⚔️",
  },
  {
    slug: "premium-quest",
    name: "Premium Quest",
    usd: 80,
    description: "Large feature or multi-page build.",
    emoji: "🐉",
  },
];

export function getServiceBySlug(slug: string): ServicePackage | undefined {
  return SERVICES.find((s) => s.slug === slug);
}

// ───────────────────────── Token configuration ─────────────────────────

export type TokenSymbol = "USDT" | "VERSE" | "POL";

export interface TokenConfig {
  kind: "native" | "erc20";
  symbol: TokenSymbol;
  label: string;
  address?: `0x${string}`;
  decimals: number;
  enabled: boolean;
}

/**
 * Polygon mainnet token addresses (chainId 137).
 * POL is only enabled when an explicit amount is configured server-side.
 */
export const TOKENS: Record<TokenSymbol, TokenConfig> = {
  USDT: {
    kind: "erc20",
    symbol: "USDT",
    label: "USDT (PoS)",
    address: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
    decimals: 6,
    enabled: true,
  },
  VERSE: {
    kind: "erc20",
    symbol: "VERSE",
    label: "fxVERSE",
    address: "0xc708d6f2153933daa50b2d0758955be0a93a8fec",
    decimals: 18,
    enabled: true,
  },
  POL: {
    kind: "native",
    symbol: "POL",
    label: "POL",
    decimals: 18,
    enabled: true, // enabled flag is checked per-order against amount availability
  },
};

/** The list of tokens offered at checkout (order matters for UI). */
export const CHECKOUT_TOKENS: TokenSymbol[] = ["USDT", "VERSE", "POL"];

export const POLYGON_CHAIN_ID = 137;
export const POLYGON_CHAIN_HEX = "0x89";
export const POLYGON_CHAIN_NAME = "Polygon Mainnet";
export const POLYGON_BLOCK_EXPLORER = "https://polygonscan.com";

export function polygonScanTx(tx: string): string {
  return `${POLYGON_BLOCK_EXPLORER}/tx/${tx}`;
}

export function polygonScanAddress(addr: string): string {
  return `${POLYGON_BLOCK_EXPLORER}/address/${addr}`;
}

/**
 * Returns the human-readable amount for a given service + token.
 * USDT and VERSE map 1:1 to the USD price.
 * POL requires a server-provided price; if not set, returns null.
 */
export function tokenAmountForService(
  service: ServicePackage,
  token: TokenSymbol,
  polAmountUsd?: string,
): string | null {
  if (token === "USDT" || token === "VERSE") {
    return String(service.usd);
  }
  if (token === "POL") {
    if (polAmountUsd && polAmountUsd !== "OWNER_SET" && Number(polAmountUsd) > 0) {
      return polAmountUsd;
    }
    return null;
  }
  return null;
}
