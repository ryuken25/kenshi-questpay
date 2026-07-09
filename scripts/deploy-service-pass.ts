import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying KenshiServicePass with:", deployer.address);

  const KenshiServicePass = await ethers.getContractFactory("KenshiServicePass");
  const contract = await KenshiServicePass.deploy(deployer.address);
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("KenshiServicePass deployed to:", address);
  console.log("Update NEXT_PUBLIC_KENSHI_SERVICE_PASS_ADDRESS in .env.local with this address");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
