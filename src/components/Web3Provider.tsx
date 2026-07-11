"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http, injected } from "wagmi";
import { coinbaseWallet, walletConnect } from "wagmi/connectors";
import { polygon, bsc } from "wagmi/chains";
import { useState, type ReactNode } from "react";
import { APP_CONFIG } from "@/lib/config";

const BSC_RPC_URL = process.env.NEXT_PUBLIC_BSC_RPC_URL || "https://bsc-dataseed.binance.org";

export function Web3Provider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [config] = useState(() => {
    const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
    return createConfig({
      // BNB Chain is wired here so wallets can already see/switch to it, but
      // no BNB token is enabled for payment yet (see services.ts) — network
      // visibility and live payment support are deliberately separate gates.
      chains: [polygon, bsc],
      connectors: [
        injected({ shimDisconnect: true }),
        coinbaseWallet({ appName: "Kenshi QuestPay" }),
        ...(projectId ? [walletConnect({ projectId, showQrModal: true, metadata: { name: "Kenshi QuestPay", description: "Polygon checkout and delivery workspace for creator services.", url: "https://kenshi-questpay.vercel.app", icons: ["https://kenshi-questpay.vercel.app/icons/icon-512.png"] } })] : []),
      ],
      transports: { [polygon.id]: http(APP_CONFIG.rpcUrl), [bsc.id]: http(BSC_RPC_URL) },
      ssr: true,
    });
  });
  return <WagmiProvider config={config}><QueryClientProvider client={queryClient}>{children}</QueryClientProvider></WagmiProvider>;
}
