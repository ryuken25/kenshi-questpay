import hre from "hardhat";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Deploys the soulbound QuestPayReceipt NFT.
 *
 * Usage:
 *   npx hardhat run scripts/deploy/deploy-receipt.ts --network polygonAmoy
 *   npx hardhat run scripts/deploy/deploy-receipt.ts --network polygon
 *
 * Env (all optional, read from process.env — never hardcode secrets):
 *   NFT_MINTER_PRIVATE_KEY  deployer/admin key (falls back to DEPLOYER_PRIVATE_KEY in hardhat.config)
 *   NFT_MINTER_ADDRESS      if set, the deployer grants MINTER_ROLE to this address after deploy
 *                           (lets a dedicated backend signer mint while admin keeps role control)
 */
async function main() {
  const { ethers, network } = hre;
  const [deployer] = await ethers.getSigners();

  const chainId = network.config.chainId ?? Number((await ethers.provider.getNetwork()).chainId);
  console.log(`Network: ${network.name} (chainId ${chainId})`);
  console.log("Deploying QuestPayReceipt with:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Deployer balance:", ethers.formatEther(balance));

  const Factory = await ethers.getContractFactory("QuestPayReceipt");
  const contract = await Factory.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  const tx = contract.deploymentTransaction();
  console.log("QuestPayReceipt deployed to:", address);
  console.log("Deploy tx:", tx?.hash || "unknown");

  // Optionally grant MINTER_ROLE to a dedicated backend minter.
  const extraMinter = process.env.NFT_MINTER_ADDRESS;
  let minterGranted: string | null = null;
  if (extraMinter && ethers.isAddress(extraMinter) && extraMinter.toLowerCase() !== deployer.address.toLowerCase()) {
    const MINTER_ROLE = await contract.MINTER_ROLE();
    const grantTx = await contract.grantRole(MINTER_ROLE, extraMinter);
    await grantTx.wait();
    minterGranted = ethers.getAddress(extraMinter);
    console.log("Granted MINTER_ROLE to:", minterGranted);
  }

  const outDir = resolve(process.cwd(), "deployments");
  mkdirSync(outDir, { recursive: true });
  const outFile = resolve(outDir, `${network.name}-receipt.json`);
  writeFileSync(
    outFile,
    JSON.stringify(
      {
        network: network.name,
        chainId,
        contract: "QuestPayReceipt",
        address,
        deployer: deployer.address,
        admin: deployer.address,
        extraMinter: minterGranted,
        txHash: tx?.hash || null,
        deployedAt: new Date().toISOString(),
      },
      null,
      2
    )
  );
  console.log("Wrote deployment record:", outFile);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
