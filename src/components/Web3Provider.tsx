"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http, injected } from "wagmi";
import { coinbaseWallet, walletConnect } from "wagmi/connectors";
import { polygon } from "wagmi/chains";
import { useState, type ReactNode } from "react";
import { APP_CONFIG } from "@/lib/config";

export function Web3Provider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [config] = useState(() => {
    const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
    return createConfig({
      chains: [polygon],
      connectors: [
        injected({ shimDisconnect: true }),
        coinbaseWallet({ appName: "Kenshi QuestPay" }),
        ...(projectId ? [walletConnect({ projectId, showQrModal: true, metadata: { name: "Kenshi QuestPay", description: "Polygon checkout and delivery workspace for creator services.", url: "https://kenshi-questpay.vercel.app", icons: ["https://kenshi-questpay.vercel.app/icons/icon-512.png"] } })] : []),
      ],
      transports: { [polygon.id]: http(APP_CONFIG.rpcUrl) },
      ssr: true,
    });
  });
  return <WagmiProvider config={config}><QueryClientProvider client={queryClient}>{children}</QueryClientProvider></WagmiProvider>;
}
