/**
 * Deploy a real Gnosis Safe (v1.4.1) multisig on Base Sepolia via the canonical
 * SafeProxyFactory — no Safe SDK, just the on-chain factory (predictable).
 *
 *   npm run deploy:safe:sepolia
 *
 * Owners default to the keys this repo already controls (deployer + SAFE_PRIVATE_KEY
 * + TEST_PRIVATE_KEY), threshold 2 — a faithful 2-of-3 multisig that the rehearsal
 * scripts can actually sign with. In production the owners are the real signers'
 * hardware wallets. Records the proxy as "Safe" in the deployment registry.
 */
import { ethers } from "hardhat";
import { recordContract, loadRegistry, banner } from "./lib";

// Safe v1.4.1 canonical deployments (same address on Base Sepolia — verified present).
const SAFE_SINGLETON = "0x29fcB43b46531BcA003ddC8FCB67FFE91900C762"; // SafeL2
const PROXY_FACTORY = "0x4e1DCf7AD4e460CfD30791CCC4F9c8a4f820ec67";
const FALLBACK_HANDLER = "0xfd0732Dc9E303f09fCEf3a7388Ad10A83459Ec99";

const SAFE_ABI = [
  "function setup(address[] _owners,uint256 _threshold,address to,bytes data,address fallbackHandler,address paymentToken,uint256 payment,address paymentReceiver)",
];
const FACTORY_ABI = [
  "function createProxyWithNonce(address _singleton,bytes initializer,uint256 saltNonce) returns (address proxy)",
  "event ProxyCreation(address indexed proxy, address singleton)",
];

async function main() {
  banner("Deploy Gnosis Safe (2-of-3)");
  const [deployer] = await ethers.getSigners();

  const existingSafe = loadRegistry().contracts.Safe;
  if (existingSafe) {
    console.log("  • Safe already in registry:", existingSafe, "— delete it from the registry to redeploy. Skipping.");
    return;
  }

  const owners = [deployer.address];
  if (process.env.SAFE_PRIVATE_KEY) owners.push(new ethers.Wallet(process.env.SAFE_PRIVATE_KEY).address);
  if (process.env.TEST_PRIVATE_KEY) owners.push(new ethers.Wallet(process.env.TEST_PRIVATE_KEY).address);
  const threshold = owners.length >= 3 ? 2 : owners.length >= 2 ? 2 : 1;
  console.log(`  owners (${owners.length}): ${owners.join(", ")}\n  threshold: ${threshold}`);

  const safeIface = new ethers.Interface(SAFE_ABI);
  const initializer = safeIface.encodeFunctionData("setup", [
    owners,
    threshold,
    ethers.ZeroAddress,
    "0x",
    FALLBACK_HANDLER,
    ethers.ZeroAddress,
    0,
    ethers.ZeroAddress,
  ]);

  const factory = new ethers.Contract(PROXY_FACTORY, FACTORY_ABI, deployer);
  const saltNonce = BigInt(Date.now());
  const tx = await factory.createProxyWithNonce(SAFE_SINGLETON, initializer, saltNonce);
  const rcpt = await tx.wait();

  let proxy: string | undefined;
  for (const log of rcpt!.logs) {
    try {
      const p = factory.interface.parseLog(log);
      if (p && p.name === "ProxyCreation") {
        proxy = p.args.proxy as string;
        break;
      }
    } catch {
      /* not our event */
    }
  }
  if (!proxy) throw new Error("ProxyCreation event not found");

  console.log(`  ✅ Safe deployed: ${proxy}`);
  await recordContract("Safe", proxy);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
