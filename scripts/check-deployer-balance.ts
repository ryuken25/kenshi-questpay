import { JsonRpcProvider, formatEther, Wallet } from "ethers";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const envPath = resolve(process.cwd(), ".env.local");

if (!existsSync(envPath)) {
  throw new Error(".env.local not found. Run pnpm wallet:create first.");
}

const envText = readFileSync(envPath, "utf8");
const key = envText.match(/^DEPLOYER_PRIVATE_KEY=(.+)$/m)?.[1]?.trim();
const rpc = envText.match(/^BASE_SEPOLIA_RPC_URL=(.+)$/m)?.[1]?.trim() || "https://sepolia.base.org";

if (!key) throw new Error("DEPLOYER_PRIVATE_KEY missing in .env.local");

const provider = new JsonRpcProvider(rpc);
const wallet = new Wallet(key, provider);
const balance = await provider.getBalance(wallet.address);

console.log("");
console.log("Deployer address:", wallet.address);
console.log("Base Sepolia balance:", formatEther(balance), "ETH");
console.log("");

if (balance === 0n) {
  console.log("Balance is zero. Stop and wait for funding.");
  process.exit(1);
}
