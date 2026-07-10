import "server-only";
import { createPublicClient, http, type PublicClient } from "viem";
import { polygon } from "viem/chains";
import { POLYGON_RPC_URL } from "./server-config";

let _client: PublicClient | null = null;

/**
 * Server-side viem public client for Polygon mainnet.
 * Used by payment verification route handlers.
 */
export function getPolygonClient(): PublicClient {
  if (_client) return _client;
  _client = createPublicClient({
    chain: polygon,
    transport: http(POLYGON_RPC_URL),
  });
  return _client;
}
