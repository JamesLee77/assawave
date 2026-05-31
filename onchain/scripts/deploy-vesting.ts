import { ethers } from "hardhat";
import { recordContract, loadRegistry, banner } from "./lib";

function resolve(key: string, envName: string): string {
  const fromEnv = process.env[envName];
  if (fromEnv) return fromEnv;
  const reg = loadRegistry();
  const addr = reg.contracts[key];
  if (!addr) throw new Error(`Missing ${key}: set ${envName} or deploy it first (registry has none).`);
  return addr;
}

async function main() {
  banner("Deploy TokenVesting");
  const [deployer] = await ethers.getSigners();
  const token = resolve("ASSAToken", "ASSA_TOKEN");
  console.log(`  using ASSAToken: ${token}`);

  const vesting = await (await ethers.getContractFactory("TokenVesting")).deploy(token, deployer.address);
  await vesting.waitForDeployment();
  const addr = await vesting.getAddress();
  console.log(`  TokenVesting: ${addr}`);
  await recordContract("TokenVesting", addr);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
