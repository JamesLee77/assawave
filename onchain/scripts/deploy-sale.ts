import { ethers } from "hardhat";
import { recordContract, loadRegistry, getNetConfig, banner } from "./lib";

function fromRegistry(key: string): string | undefined {
  return loadRegistry().contracts[key];
}

async function main() {
  banner("Deploy TokenSale");
  const [deployer] = await ethers.getSigners();
  const cfg = getNetConfig();

  const token = process.env.ASSA_TOKEN || fromRegistry("ASSAToken");
  const usdc = process.env.USDC_ADDRESS || cfg.usdc || fromRegistry("MockUSDC");
  const treasury = process.env.TREASURY || fromRegistry("Treasury") || deployer.address;
  if (!token) throw new Error("Missing ASSAToken: set ASSA_TOKEN or deploy the token first.");
  if (!usdc) throw new Error("Missing USDC: set USDC_ADDRESS or deploy a MockUSDC first.");

  console.log(`  ASSAToken: ${token}\n  USDC: ${usdc}\n  Treasury: ${treasury}`);

  const sale = await (await ethers.getContractFactory("TokenSale")).deploy(token, usdc, treasury, deployer.address);
  await sale.waitForDeployment();
  const addr = await sale.getAddress();
  console.log(`  TokenSale: ${addr}`);
  await recordContract("TokenSale", addr);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
