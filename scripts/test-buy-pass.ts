import hre from "hardhat";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

async function main() {
  const { ethers } = hre;
  const deployment = JSON.parse(readFileSync(resolve(process.cwd(), "deployments/base-sepolia.json"), "utf8"));
  const [buyer] = await ethers.getSigners();
  const contract = await ethers.getContractAt("KenshiServicePass", deployment.address);
  const briefId = `questpay:test:${Date.now().toString(16)}`;
  console.log("Buyer:", buyer.address);
  console.log("Contract:", deployment.address);
  const tx = await contract.buyPass(1, briefId, { value: ethers.parseEther("0.0001") });
  console.log("Test buy tx:", tx.hash);
  const receipt = await tx.wait();
  console.log("Status:", receipt?.status);
  console.log("Brief ID:", briefId);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
