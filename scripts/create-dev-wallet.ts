import { Wallet } from "ethers";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const envPath = resolve(process.cwd(), ".env.local");
const wallet = Wallet.createRandom();

let envText = existsSync(envPath) ? readFileSync(envPath, "utf8") : "";

if (/^DEPLOYER_PRIVATE_KEY=/m.test(envText)) {
  console.log("");
  console.log("DEPLOYER_PRIVATE_KEY already exists in .env.local");
  console.log("Refusing to overwrite it automatically.");
  console.log("Delete it manually if you intentionally want a new throwaway deployer.");
  console.log("");
  process.exit(1);
}

if (envText.length > 0 && !envText.endsWith("\n")) envText += "\n";
envText += `DEPLOYER_PRIVATE_KEY=${wallet.privateKey}\n`;
envText += `BASE_SEPOLIA_RPC_URL=https://sepolia.base.org\n`;

writeFileSync(envPath, envText, { encoding: "utf8", mode: 0o600 });

console.log("");
console.log("# Faucet Funding Needed");
console.log("");
console.log("Repo: kenshi-questpay");
console.log("Network: Base Sepolia");
console.log("Purpose: Deploy KenshiServicePass testnet contract");
console.log("Funding target: 0.05 Base Sepolia testnet ETH");
console.log("");
console.log("Send Base Sepolia testnet ETH to:");
console.log("");
console.log(`\`${wallet.address}\``);
console.log("");
console.log("I already stored the throwaway deployer private key in local `.env.local`.");
console.log("I will not deploy until you reply: `funded`.");
console.log("");
console.log("Do not send me any real seed phrase, mnemonic, or private key.");
console.log("Faucet/funding only needs the public address above.");
console.log("");
