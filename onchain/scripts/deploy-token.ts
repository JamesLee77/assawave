import { ethers } from "hardhat";
import { recordContract, banner } from "./lib";

async function main() {
  banner("Deploy ASSAToken");
  const [deployer] = await ethers.getSigners();
  const assa = await (await ethers.getContractFactory("ASSAToken")).deploy(deployer.address);
  await assa.waitForDeployment();
  const addr = await assa.getAddress();
  console.log(`  ASSAToken: ${addr}`);
  await recordContract("ASSAToken", addr);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
