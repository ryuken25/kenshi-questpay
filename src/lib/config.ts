export const APP_CONFIG = {
  name: process.env.NEXT_PUBLIC_APP_NAME || "Kenshi QuestPay",
  chainId: 137,
  chainName: "Polygon Mainnet",
  rpcUrl: process.env.NEXT_PUBLIC_POLYGON_RPC_URL || process.env.NEXT_PUBLIC_RPC_URL || "https://polygon-rpc.com",
  blockExplorer: "https://polygonscan.com",
  creator: {
    github: process.env.NEXT_PUBLIC_CREATOR_GITHUB || "",
    x: process.env.NEXT_PUBLIC_CREATOR_X || "",
    discord: process.env.NEXT_PUBLIC_CREATOR_DISCORD || "",
    email: process.env.NEXT_PUBLIC_CREATOR_EMAIL || "",
  },
} as const;

export const PACKAGES = [
  { id: 1, name: "UI Review", price: "3", priceWei: 0n, description: "A concise review of one screen or page." },
  { id: 2, name: "Quick Fix", price: "8", priceWei: 0n, description: "One small frontend fix." },
  { id: 3, name: "Component Build", price: "20", priceWei: 0n, description: "One focused responsive component." },
  { id: 4, name: "Landing Page Polish", price: "45", priceWei: 0n, description: "Focused landing page polish." },
  { id: 5, name: "Integration Sprint", price: "90", priceWei: 0n, description: "One scoped integration." },
] as const;
