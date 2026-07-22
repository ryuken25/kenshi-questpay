import "server-only";
import { createPublicClient, http, fallback, type PublicClient } from "viem";
import { polygon, bsc } from "viem/chains";
import { POLYGON_RPC_URL } from "./server-config";
import type { ChainKey } from "./services";

/**
 * Build a deduplicated, ordered RPC endpoint list: the operator-configured URL
 * first, then public fallbacks. Payment verification must not fail just because
 * one public RPC is rate-limiting — viem's fallback() transport fails over.
 * These clients are server-only, so requests are not subject to the browser CSP.
 */
/**
 * Build an ordered, deduped RPC endpoint list.
 * Priority: POLYGON_RPC_URLS (comma-separated, in order) → single POLYGON_RPC_URL
 * alias → hardcoded public fallbacks. Exported pure for unit testing.
 */
export function buildRpcUrls(
  csv: string | undefined,
  primary: string | undefined,
  fallbacks: string[],
): string[] {
  const fromCsv = (csv || "").split(",");
  const all = [...fromCsv, primary, ...fallbacks].map((u) => u?.trim());
  return [...new Set(all.filter((u): u is string => Boolean(u)))];
}

const POLYGON_RPCS = buildRpcUrls(
  process.env.POLYGON_RPC_URLS,
  POLYGON_RPC_URL, // alias / primary
  [
    "https://polygon-bor-rpc.publicnode.com",
    "https://polygon-rpc.com",
    "https://polygon.llamarpc.com",
    "https://1rpc.io/matic",
  ],
);

const BSC_RPCS = buildRpcUrls(
  process.env.BSC_RPC_URLS,
  process.env.BSC_RPC_URL,
  [
    "https://bsc-dataseed.binance.org",
    "https://bsc.publicnode.com",
    "https://bsc-dataseed1.defibit.io",
  ],
);

let _polygonClient: PublicClient | null = null;
let _bscClient: PublicClient | null = null;

function makeTransport(urls: string[]) {
  // rank:false keeps the configured order as priority (env URL first),
  // failing over to the next endpoint on error/timeout.
  // 4s per-endpoint timeout; fallback() fails over on timeout / 429 / 5xx / network error.
  return fallback(
    urls.map((u) => http(u, { timeout: 4_000 })),
    { rank: false, retryCount: 2 },
  );
}

/**
 * Server-side viem public client for Polygon mainnet.
 * Used by payment verification route handlers.
 */
export function getPolygonClient(): PublicClient {
  if (_polygonClient) return _polygonClient;
  _polygonClient = createPublicClient({
    chain: polygon,
    transport: makeTransport(POLYGON_RPCS),
  });
  return _polygonClient;
}

/** Server-side viem public client for BNB Smart Chain. Payments on this chain stay disabled (see services.ts) until verified end-to-end. */
export function getBscClient(): PublicClient {
  if (_bscClient) return _bscClient;
  _bscClient = createPublicClient({
    chain: bsc,
    transport: makeTransport(BSC_RPCS),
  });
  return _bscClient;
}

export function getChainClient(chainKey: ChainKey): PublicClient {
  return chainKey === "bnb" ? getBscClient() : getPolygonClient();
}
