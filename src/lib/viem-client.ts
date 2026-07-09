import { createPublicClient, createWalletClient, custom, http } from "viem";
import { baseSepolia } from "viem/chains";
import { APP_CONFIG } from "./config";

export const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(APP_CONFIG.rpcUrl),
});

export function getWalletClient() {
  if (typeof window !== "undefined" && window.ethereum) {
    return createWalletClient({
      chain: baseSepolia,
      transport: custom(window.ethereum),
    });
  }
  return null;
}
