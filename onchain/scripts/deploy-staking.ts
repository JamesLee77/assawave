import { ethers } from "hardhat";
import { recordContract, loadRegistry, banner } from "./lib";

async function main() {
  banner("Deploy StakingLock (veASSA)");
  const [deployer] = await ethers.getSigners();
  const token = process.env.ASSA_TOKEN || loadRegistry().contracts["ASSAToken"];
  if (!token) throw new Error("Missing ASSAToken: set ASSA_TOKEN or deploy the token first.");
  console.log(`  using ASSAToken: ${token}`);

  const staking = await (await ethers.getContractFactory("StakingLock")).deploy(token, deployer.address);
  await staking.waitForDeployment();
  const addr = await staking.getAddress();
  console.log(`  StakingLock: ${addr}`);
  await recordContract("StakingLock", addr);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
