export const APP_CONFIG = {
  name: process.env.NEXT_PUBLIC_APP_NAME || "Kenshi QuestPay",
  chainId: Number(process.env.NEXT_PUBLIC_CHAIN_ID || 84532),
  chainName: process.env.NEXT_PUBLIC_CHAIN_NAME || "Base Sepolia",
  rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || "https://sepolia.base.org",
  blockExplorer: process.env.NEXT_PUBLIC_BLOCK_EXPLORER || "https://sepolia.basescan.org",
  contractAddress: (process.env.NEXT_PUBLIC_KENSHI_SERVICE_PASS_ADDRESS || "") as `0x${string}`,
  creator: {
    github: process.env.NEXT_PUBLIC_CREATOR_GITHUB || "",
    x: process.env.NEXT_PUBLIC_CREATOR_X || "",
    discord: process.env.NEXT_PUBLIC_CREATOR_DISCORD || "",
    email: process.env.NEXT_PUBLIC_CREATOR_EMAIL || "",
  },
} as const;

export const PACKAGES = [
  { id: 1, name: "Quick Fix", price: "0.0001", priceWei: 100000000000000n, description: "Small bug fix or minor tweak", emoji: "⚡" },
  { id: 2, name: "Mini Quest", price: "0.0002", priceWei: 200000000000000n, description: "Small feature or component", emoji: "🎯" },
  { id: 3, name: "Standard", price: "0.0003", priceWei: 300000000000000n, description: "Medium feature or page build", emoji: "⚔️" },
  { id: 4, name: "Boss Battle", price: "0.0004", priceWei: 400000000000000n, description: "Complex feature or integration", emoji: "🐉" },
  { id: 5, name: "Legendary", price: "0.0005", priceWei: 500000000000000n, description: "Full project or major build", emoji: "👑" },
] as const;

export const CONTRACT_ABI = [
  {
    name: "buyPass",
    type: "function",
    stateMutability: "payable",
    inputs: [
      { name: "packageId", type: "uint256" },
      { name: "briefHashOrCid", type: "string" },
    ],
    outputs: [],
  },
  {
    name: "packages",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "", type: "uint256" }],
    outputs: [
      { name: "priceWei", type: "uint256" },
      { name: "active", type: "bool" },
    ],
  },
  {
    name: "ServicePassPurchased",
    type: "event",
    inputs: [
      { name: "buyer", type: "address", indexed: true },
      { name: "packageId", type: "uint256", indexed: true },
      { name: "briefHashOrCid", type: "string", indexed: false },
      { name: "priceWei", type: "uint256", indexed: false },
      { name: "timestamp", type: "uint256", indexed: false },
    ],
  },
] as const;
