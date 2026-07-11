import "server-only";
import { createPublicClient, http, type PublicClient } from "viem";
import { polygon, bsc } from "viem/chains";
import { POLYGON_RPC_URL } from "./server-config";
import type { ChainKey } from "./services";

const BSC_RPC_URL = process.env.BSC_RPC_URL || "https://bsc-dataseed.binance.org";

let _polygonClient: PublicClient | null = null;
let _bscClient: PublicClient | null = null;

/**
 * Server-side viem public client for Polygon mainnet.
 * Used by payment verification route handlers.
 */
export function getPolygonClient(): PublicClient {
  if (_polygonClient) return _polygonClient;
  _polygonClient = createPublicClient({
    chain: polygon,
    transport: http(POLYGON_RPC_URL),
  });
  return _polygonClient;
}

/** Server-side viem public client for BNB Smart Chain. Payments on this chain stay disabled (see services.ts) until verified end-to-end. */
export function getBscClient(): PublicClient {
  if (_bscClient) return _bscClient;
  _bscClient = createPublicClient({
    chain: bsc,
    transport: http(BSC_RPC_URL),
  });
  return _bscClient;
}

export function getChainClient(chainKey: ChainKey): PublicClient {
  return chainKey === "bnb" ? getBscClient() : getPolygonClient();
}
