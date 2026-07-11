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
  { slug: "ui-review", name: "UI Review", usd: 3, description: "A concise review of one screen or page with prioritized actionable feedback.", outcome: "Five prioritized findings for one URL or screenshot set.", delivery: "24 hours", revisions: "One clarification question", included: ["One URL or screenshot set", "Five prioritized findings", "Actionable fix priority"], excluded: ["Implementation", "Unlimited screens"], requirements: ["URL or screenshots", "Main goal", "Target device"] },
  { slug: "quick-fix", name: "Quick Fix", usd: 8, description: "One small styling, responsiveness, content, or frontend behavior fix.", outcome: "A scoped fix with summary and verification notes.", delivery: "24-48 hours", revisions: "One revision", included: ["One clearly scoped issue", "Source change", "Summary"], excluded: ["Large refactors", "Backend rewrites"], requirements: ["Repository or file access", "Expected behavior", "Current bug evidence"] },
  { slug: "component-build", name: "Component Build", usd: 20, description: "One focused responsive component built inside an existing project.", outcome: "A production-ready UI component such as a modal, navbar, card, checkout panel, or dashboard widget.", delivery: "2-3 days", revisions: "One revision", included: ["One responsive component", "Basic states", "Integration notes"], excluded: ["Full page redesign", "Auth/payment backend"], requirements: ["Project stack", "Design reference", "Component content"] },
  { slug: "landing-polish", name: "Landing Page Polish", usd: 45, description: "A focused visual and responsive improvement pass for one landing page.", outcome: "A cleaner, more trustworthy page with mobile polish.", delivery: "3-5 days", revisions: "One revision", included: ["One page polish", "Responsive fixes", "Visual hierarchy pass"], excluded: ["New brand system", "Multi-page redesign"], requirements: ["Current page", "Target audience", "Brand constraints"] },
  { slug: "integration-sprint", name: "Integration Sprint", usd: 90, description: "One scoped integration such as wallet connection, payment state, API connection, or deployment repair.", outcome: "One working integration verified with a focused test plan.", delivery: "5-7 days", revisions: "One revision", included: ["One scoped integration", "Error handling", "Verification notes"], excluded: ["Audited smart contracts", "Unlimited debugging"], requirements: ["Repository access", "API or wallet requirements", "Acceptance criteria"] },
];

export function getServiceBySlug(slug: string): ServicePackage | undefined { return SERVICES.find((s) => s.slug === slug); }
export type TokenSymbol = "USDT" | "VERSE" | "POL";
export interface TokenConfig { kind: "native" | "erc20"; symbol: TokenSymbol; label: string; address?: `0x${string}`; decimals: number; enabled: boolean; coingeckoId?: string; }
export const TOKENS: Record<TokenSymbol, TokenConfig> = {
  USDT: { kind: "erc20", symbol: "USDT", label: "USDT (PoS)", address: (process.env.POLYGON_USDT_ADDRESS || "0xc2132D05D31c914a87C6611C10748AEb04B58e8F") as `0x${string}`, decimals: Number(process.env.POLYGON_USDT_DECIMALS || 6), enabled: true, coingeckoId: "tether" },
  VERSE: { kind: "erc20", symbol: "VERSE", label: "fxVERSE", address: (process.env.POLYGON_VERSE_ADDRESS || "0xc708d6f2153933daa50b2d0758955be0a93a8fec") as `0x${string}`, decimals: Number(process.env.POLYGON_VERSE_DECIMALS || 18), enabled: true, coingeckoId: "verse-bitcoin" },
  POL: { kind: "native", symbol: "POL", label: "POL", decimals: 18, enabled: true, coingeckoId: "polygon-ecosystem-token" },
};
export const CHECKOUT_TOKENS: TokenSymbol[] = ["USDT", "VERSE", "POL"];
export const POLYGON_CHAIN_ID = 137;
export const POLYGON_CHAIN_HEX = "0x89";
export const POLYGON_CHAIN_NAME = "Polygon Mainnet";
export const POLYGON_BLOCK_EXPLORER = "https://polygonscan.com";
export function polygonScanTx(tx: string): string { return `${POLYGON_BLOCK_EXPLORER}/tx/${tx}`; }
export function polygonScanAddress(addr: string): string { return `${POLYGON_BLOCK_EXPLORER}/address/${addr}`; }
