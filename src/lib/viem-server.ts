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
function dedupe(urls: (string | undefined)[]): string[] {
  return [...new Set(urls.map((u) => u?.trim()).filter((u): u is string => Boolean(u)))];
}

const POLYGON_RPCS = dedupe([
  POLYGON_RPC_URL,
  process.env.POLYGON_RPC_URL_FALLBACK,
  "https://polygon-bor-rpc.publicnode.com",
  "https://polygon-rpc.com",
  "https://polygon.llamarpc.com",
  "https://1rpc.io/matic",
]);

const BSC_RPCS = dedupe([
  process.env.BSC_RPC_URL,
  process.env.BSC_RPC_URL_FALLBACK,
  "https://bsc-dataseed.binance.org",
  "https://bsc.publicnode.com",
  "https://bsc-dataseed1.defibit.io",
]);

let _polygonClient: PublicClient | null = null;
let _bscClient: PublicClient | null = null;

function makeTransport(urls: string[]) {
  // rank:false keeps the configured order as priority (env URL first),
  // failing over to the next endpoint on error/timeout.
  return fallback(
    urls.map((u) => http(u, { timeout: 12_000 })),
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
