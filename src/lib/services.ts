export interface ServicePackage {
  slug: string;
  name: string;
  usd: number;
  description: string;
  outcome: string;
  delivery: string;
  revisions: string;
  included: string[];
  excluded: string[];
  requirements: string[];
}

export const SERVICES: ServicePackage[] = [
  { slug: "ux-quick-look", name: "UX Quick Look", usd: 1, description: "A fast starter sanity check with three concise UX notes and one priority recommendation.", outcome: "Three notes + one priority fix recommendation for one screen or flow.", delivery: "12-24 hours", revisions: "One clarification", included: ["One screen or short flow", "Three concise UX notes", "One priority recommendation"], excluded: ["Implementation", "Full audit", "Multiple pages"], requirements: ["URL or screenshot", "Main user goal", "Target device"] },
  { slug: "ui-review", name: "UI Review", usd: 3, description: "A concise review of one screen or page with prioritized actionable feedback.", outcome: "Five prioritized findings for one URL or screenshot set.", delivery: "24 hours", revisions: "One clarification question", included: ["One URL or screenshot set", "Five prioritized findings", "Actionable fix priority"], excluded: ["Implementation", "Unlimited screens"], requirements: ["URL or screenshots", "Main goal", "Target device"] },
  { slug: "quick-fix", name: "Quick Fix", usd: 8, description: "One small styling, responsiveness, content, or frontend behavior fix.", outcome: "A scoped fix with summary and verification notes.", delivery: "24-48 hours", revisions: "One revision", included: ["One clearly scoped issue", "Source change", "Summary"], excluded: ["Large refactors", "Backend rewrites"], requirements: ["Repository or file access", "Expected behavior", "Current bug evidence"] },
  { slug: "component-build", name: "Component Build", usd: 20, description: "One focused responsive component built inside an existing project.", outcome: "A production-ready UI component such as a modal, navbar, card, checkout panel, or dashboard widget.", delivery: "2-3 days", revisions: "One revision", included: ["One responsive component", "Basic states", "Integration notes"], excluded: ["Full page redesign", "Auth/payment backend"], requirements: ["Project stack", "Design reference", "Component content"] },
  { slug: "landing-polish", name: "Landing Page Polish", usd: 45, description: "A focused visual and responsive improvement pass for one landing page.", outcome: "A cleaner, more trustworthy page with mobile polish.", delivery: "3-5 days", revisions: "One revision", included: ["One page polish", "Responsive fixes", "Visual hierarchy pass"], excluded: ["New brand system", "Multi-page redesign"], requirements: ["Current page", "Target audience", "Brand constraints"] },
  { slug: "integration-sprint", name: "Integration Sprint", usd: 90, description: "One scoped integration such as wallet connection, payment state, API connection, or deployment repair.", outcome: "One working integration verified with a focused test plan.", delivery: "5-7 days", revisions: "One revision", included: ["One scoped integration", "Error handling", "Verification notes"], excluded: ["Audited smart contracts", "Unlimited debugging"], requirements: ["Repository access", "API or wallet requirements", "Acceptance criteria"] },
];

export function getServiceBySlug(slug: string): ServicePackage | undefined { return SERVICES.find((s) => s.slug === slug); }

export type ChainKey = "polygon" | "bnb";
export type TokenSymbol = "USDT" | "USDC" | "VERSE" | "POL";
export interface TokenConfig { kind: "native" | "erc20"; symbol: TokenSymbol; label: string; address?: `0x${string}`; decimals: number; enabled: boolean; coingeckoId?: string; chain: ChainKey; }

export const NETWORKS = {
  polygon: { key: "polygon", name: "Polygon Mainnet", chainId: 137, explorer: "https://polygonscan.com", status: "live" },
  bnb: { key: "bnb", name: "BNB Chain", chainId: 56, explorer: "https://bscscan.com", status: "payment-gated" },
} as const;

/** Reverse-lookup a stored numeric chain_id (from an order row) back to a ChainKey. Defaults to polygon for legacy rows. */
export function chainKeyFromId(chainId: number | null | undefined): ChainKey {
  return chainId === NETWORKS.bnb.chainId ? "bnb" : "polygon";
}

/**
 * Chain/token matrix. Every enabled pair MUST have a verified real contract
 * address — never invent one. BNB entries stay `enabled: false` (UI-visible
 * but not selectable) until a full server-side send/verify path against BSC
 * has actually been tested end-to-end; flipping them live is a deliberate,
 * separate change, not a default of "the chain exists so enable everything".
 */
export const CHAIN_TOKENS: Record<ChainKey, Partial<Record<TokenSymbol, TokenConfig>>> = {
  polygon: {
    USDT: { kind: "erc20", symbol: "USDT", label: "USDT (PoS)", address: (process.env.POLYGON_USDT_ADDRESS || "0xc2132D05D31c914a87C6611C10748AEb04B58e8F") as `0x${string}`, decimals: Number(process.env.POLYGON_USDT_DECIMALS || 6), enabled: true, coingeckoId: "tether", chain: "polygon" },
    USDC: { kind: "erc20", symbol: "USDC", label: "USDC (PoS)", address: (process.env.POLYGON_USDC_ADDRESS || "0x3c499c542cef5e3811e1192ce70d8cc03d5c3359") as `0x${string}`, decimals: Number(process.env.POLYGON_USDC_DECIMALS || 6), enabled: true, coingeckoId: "usd-coin", chain: "polygon" },
    VERSE: { kind: "erc20", symbol: "VERSE", label: "fxVERSE", address: (process.env.POLYGON_VERSE_ADDRESS || "0xc708d6f2153933daa50b2d0758955be0a93a8fec") as `0x${string}`, decimals: Number(process.env.POLYGON_VERSE_DECIMALS || 18), enabled: true, coingeckoId: "verse-bitcoin", chain: "polygon" },
    POL: { kind: "native", symbol: "POL", label: "POL", decimals: 18, enabled: true, coingeckoId: "polygon-ecosystem-token", chain: "polygon" },
  },
  bnb: {
    // Real, well-known BSC mainnet contracts — kept disabled until server-side
    // send/verify against BSC is proven, per the payment-gated network status.
    USDT: { kind: "erc20", symbol: "USDT", label: "USDT (BEP-20)", address: (process.env.BSC_USDT_ADDRESS || "0x55d398326f99059fF775485246999027B3197955") as `0x${string}`, decimals: Number(process.env.BSC_USDT_DECIMALS || 18), enabled: false, coingeckoId: "tether", chain: "bnb" },
    USDC: { kind: "erc20", symbol: "USDC", label: "USDC (BEP-20)", address: (process.env.BSC_USDC_ADDRESS || "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d") as `0x${string}`, decimals: Number(process.env.BSC_USDC_DECIMALS || 18), enabled: false, coingeckoId: "usd-coin", chain: "bnb" },
    // POL and VERSE are intentionally absent on BNB: no trusted bridged/official
    // contract has been verified for either asset on BNB Chain.
  },
};

/** Back-compat flat view of the Polygon matrix (existing call sites expect this shape). */
export const TOKENS: Record<TokenSymbol, TokenConfig> = CHAIN_TOKENS.polygon as Record<TokenSymbol, TokenConfig>;

export function getTokensForChain(chain: ChainKey): TokenConfig[] {
  return Object.values(CHAIN_TOKENS[chain] ?? {}).filter((t): t is TokenConfig => Boolean(t));
}

export function getEnabledTokensForChain(chain: ChainKey): TokenConfig[] {
  return getTokensForChain(chain).filter((t) => t.enabled);
}

export function getTokenConfig(chain: ChainKey, symbol: TokenSymbol): TokenConfig | undefined {
  return CHAIN_TOKENS[chain]?.[symbol];
}

/** True only for chain/token pairs that are both defined and enabled — the trusted matrix. */
export function isValidChainTokenPair(chain: ChainKey, symbol: TokenSymbol): boolean {
  return Boolean(getTokenConfig(chain, symbol)?.enabled);
}

export const CHECKOUT_TOKENS: TokenSymbol[] = ["USDT", "USDC", "POL", "VERSE"];
export const POLYGON_CHAIN_ID = 137;
export const POLYGON_CHAIN_HEX = "0x89";
export const POLYGON_CHAIN_NAME = "Polygon Mainnet";
export const POLYGON_BLOCK_EXPLORER = "https://polygonscan.com";
export const BNB_CHAIN_ID = 56;
export const BNB_BLOCK_EXPLORER = "https://bscscan.com";
export function polygonScanTx(tx: string): string { return `${POLYGON_BLOCK_EXPLORER}/tx/${tx}`; }
export function polygonScanAddress(addr: string): string { return `${POLYGON_BLOCK_EXPLORER}/address/${addr}`; }
export function explorerTxUrl(chain: ChainKey, tx: string): string { return `${NETWORKS[chain].explorer}/tx/${tx}`; }
export function explorerAddressUrl(chain: ChainKey, addr: string): string { return `${NETWORKS[chain].explorer}/address/${addr}`; }
