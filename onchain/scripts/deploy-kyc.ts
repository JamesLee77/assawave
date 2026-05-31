import { ethers } from "hardhat";
import { recordContract, banner } from "./lib";

async function main() {
  banner("Deploy KYCRegistry");
  const [deployer] = await ethers.getSigners();
  const kyc = await (await ethers.getContractFactory("KYCRegistry")).deploy(deployer.address);
  await kyc.waitForDeployment();
  const addr = await kyc.getAddress();
  console.log(`  KYCRegistry: ${addr}`);
  await recordContract("KYCRegistry", addr);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
