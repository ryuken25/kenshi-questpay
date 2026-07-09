import hre from "hardhat";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

async function main() {
  const { ethers } = hre;
  const [deployer] = await ethers.getSigners();
  console.log("Deploying KenshiServicePass with:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Deployer balance:", ethers.formatEther(balance), "ETH");

  const KenshiServicePass = await ethers.getContractFactory("KenshiServicePass");
  const contract = await KenshiServicePass.deploy(deployer.address);
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  const tx = contract.deploymentTransaction();
  console.log("KenshiServicePass deployed to:", address);
  console.log("Deploy tx:", tx?.hash || "unknown");

  mkdirSync(resolve(process.cwd(), "deployments"), { recursive: true });
  writeFileSync(resolve(process.cwd(), "deployments/base-sepolia.json"), JSON.stringify({
    network: "baseSepolia",
    chainId: 84532,
    contract: "KenshiServicePass",
    address,
    deployer: deployer.address,
    txHash: tx?.hash || null,
    deployedAt: new Date().toISOString()
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
