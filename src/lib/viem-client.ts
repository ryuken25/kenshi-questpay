import { createPublicClient, http } from "viem";
import { polygon } from "viem/chains";
import { APP_CONFIG } from "./config";
export const publicClient = createPublicClient({ chain: polygon, transport: http(APP_CONFIG.rpcUrl) });
