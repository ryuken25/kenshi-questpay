"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http, injected } from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { useState, type ReactNode } from "react";
import { APP_CONFIG } from "@/lib/config";

export function Web3Provider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [config] = useState(() =>
    createConfig({
      chains: [baseSepolia],
      connectors: [injected()],
      transports: {
        [baseSepolia.id]: http(APP_CONFIG.rpcUrl),
      },
    })
  );

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
