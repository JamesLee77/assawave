import { ethers } from "hardhat";
import { recordContract, loadRegistry, getNetConfig, banner } from "./lib";

function fromRegistry(key: string): string | undefined {
  return loadRegistry().contracts[key];
}

async function main() {
  banner("Deploy BMEBurner");
  const [deployer] = await ethers.getSigners();
  const cfg = getNetConfig();

  const token = process.env.ASSA_TOKEN || fromRegistry("ASSAToken");
  const usdc = process.env.USDC_ADDRESS || cfg.usdc || fromRegistry("MockUSDC");
  const router = process.env.BASE_DEX_ROUTER || cfg.dexRouter || fromRegistry("MockDexRouter");
  if (!token) throw new Error("Missing ASSAToken: set ASSA_TOKEN or deploy the token first.");
  if (!usdc) throw new Error("Missing USDC: set USDC_ADDRESS or deploy a MockUSDC first.");
  if (!router) throw new Error("Missing DEX router: set BASE_DEX_ROUTER (mainnet) — LP must be seeded first.");

  console.log(`  ASSAToken: ${token}\n  USDC: ${usdc}\n  Router: ${router}`);

  const bme = await (await ethers.getContractFactory("BMEBurner")).deploy(token, usdc, router, deployer.address);
  await bme.waitForDeployment();
  const addr = await bme.getAddress();
  console.log(`  BMEBurner: ${addr}`);
  await recordContract("BMEBurner", addr);
  // No token role needed: BMEBurner burns its own swapped balance via the
  // public ERC20Burnable.burn() path.
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
