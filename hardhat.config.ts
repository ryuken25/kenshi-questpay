import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000001";
// Dedicated key for deploying/operating the QuestPayReceipt NFT. Falls back to a
// throwaway dummy key so config load never fails when the secret is absent.
const NFT_MINTER_PRIVATE_KEY = process.env.NFT_MINTER_PRIVATE_KEY || DEPLOYER_PRIVATE_KEY;

const config: HardhatUserConfig = {
  solidity: {
    // Bumped to 0.8.28 (from 0.8.20) because @openzeppelin/contracts ^5.6 requires
    // ^0.8.24. Existing contracts use pragma ^0.8.20, which remains compatible.
    version: "0.8.28",
    settings: {
      optimizer: { enabled: true, runs: 200 },
      // OZ ^5.6 emits `mcopy`/transient-storage opcodes that require the Cancun EVM.
      // Polygon PoS (post-Napoli) and Base both support Cancun.
      evmVersion: "cancun",
    },
  },
  networks: {
    baseSepolia: {
      url: process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org",
      accounts: [DEPLOYER_PRIVATE_KEY],
      chainId: 84532,
    },
    polygonAmoy: {
      url: process.env.POLYGON_AMOY_RPC_URL || "https://rpc-amoy.polygon.technology",
      accounts: [NFT_MINTER_PRIVATE_KEY],
      chainId: 80002,
    },
    polygon: {
      url: process.env.POLYGON_RPC_URL || "https://polygon-bor-rpc.publicnode.com",
      accounts: [NFT_MINTER_PRIVATE_KEY],
      chainId: 137,
    },
  },
};

export default config;
