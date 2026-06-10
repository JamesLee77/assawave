/**
 * Shared deploy helpers: network config resolution + address-registry persistence.
 *
 * The registry lives at onchain/deployments/<network>.json and is the single source
 * of truth for deployed addresses (consumed by verify scripts, the portal contracts.ts,
 * and the backend wrangler vars).
 */
import { ethers, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

export type NetConfig = {
  /** Existing USDC token. If undefined (local), a MockUSDC is deployed. */
  usdc?: string;
  /** Existing DEX router for BME. If undefined (local), a MockDexRouter is deployed. */
  dexRouter?: string;
  /** Timelock proposers/executors (Safe). Defaults to [deployer] on local. */
  safeSigners?: string[];
  /** Timelock min delay in seconds. 48h on live chains; short on local. */
  timelockMinDelay: number;
};

const CANONICAL_BASE_USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

export function getNetConfig(): NetConfig {
  const name = network.name;
  const env = process.env;
  if (name === "base") {
    return {
      usdc: env.USDC_ADDRESS || CANONICAL_BASE_USDC,
      dexRouter: env.BASE_DEX_ROUTER, // Aerodrome/Uniswap router — required for BME on mainnet
      safeSigners: env.SAFE_SIGNERS ? env.SAFE_SIGNERS.split(",").map((s) => s.trim()).filter(Boolean) : undefined,
      timelockMinDelay: Number(env.TIMELOCK_MIN_DELAY || 48 * 3600),
    };
  }
  if (name === "baseSepolia") {
    return {
      usdc: env.USDC_ADDRESS, // sandbox USDC if set; else a mock is deployed
      dexRouter: env.BASE_DEX_ROUTER,
      safeSigners: env.SAFE_SIGNERS ? env.SAFE_SIGNERS.split(",").map((s) => s.trim()).filter(Boolean) : undefined,
      timelockMinDelay: Number(env.TIMELOCK_MIN_DELAY || 48 * 3600),
    };
  }
  // hardhat / localhost
  return { timelockMinDelay: 60 };
}

export function registryPath(): string {
  const dir = path.resolve(__dirname, "..", "deployments");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, `${network.name}.json`);
}

export type Registry = {
  network: string;
  chainId: number;
  deployer: string;
  updatedAt: string;
  contracts: Record<string, string>;
};

export function loadRegistry(): Registry {
  const p = registryPath();
  if (fs.existsSync(p)) {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  }
  return { network: network.name, chainId: 0, deployer: "", updatedAt: "", contracts: {} };
}

export async function saveRegistry(reg: Registry): Promise<void> {
  reg.network = network.name;
  reg.chainId = Number((await ethers.provider.getNetwork()).chainId);
  reg.updatedAt = new Date().toISOString();
  fs.writeFileSync(registryPath(), JSON.stringify(reg, null, 2) + "\n");
  console.log(`  ↳ registry written: ${registryPath()}`);
}

export async function recordContract(name: string, address: string): Promise<void> {
  const reg = loadRegistry();
  const [deployer] = await ethers.getSigners();
  reg.deployer = deployer.address;
  reg.contracts[name] = address;
  await saveRegistry(reg);
}

export function banner(title: string): void {
  console.log(`\n=== ${title} ===`);
  console.log(`  network: ${network.name}`);
}
