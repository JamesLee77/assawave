/**
 * Batch-verify the deployed Phase-1 contracts on Basescan.
 *
 *   BASESCAN_API_KEY=... npm run verify:all:sepolia
 *
 * Reads addresses from deployments/<network>.json and verifies each with the exact
 * constructor args used at deploy time (admin = registry.deployer). Re-runnable:
 * "already verified" is treated as success.
 */
import hre from "hardhat";
import { loadRegistry, banner } from "./lib";

async function verify(name: string, address: string | undefined, constructorArguments: unknown[]) {
  if (!address) {
    console.log(`  • ${name}: not in registry, skipping`);
    return;
  }
  try {
    await hre.run("verify:verify", { address, constructorArguments });
    console.log(`  ✓ ${name} verified — ${address}`);
  } catch (e) {
    const msg = (e as Error).message || String(e);
    if (/already verified/i.test(msg)) console.log(`  • ${name} already verified — ${address}`);
    else console.log(`  ✗ ${name} (${address}): ${msg.split("\n")[0]}`);
  }
}

async function main() {
  banner("Verify on Basescan");
  const reg = loadRegistry();
  const c = reg.contracts;
  const admin = reg.deployer;
  if (!admin) throw new Error("No deployer in registry.");

  // Must match the values getNetConfig() used at deploy time.
  const minDelay = Number(process.env.TIMELOCK_MIN_DELAY || 48 * 3600);
  const signers = process.env.SAFE_SIGNERS ? process.env.SAFE_SIGNERS.split(",") : [admin];

  await verify("MockUSDC", c.MockUSDC, []);
  await verify("ASSAToken", c.ASSAToken, [admin]);
  await verify("KYCRegistry", c.KYCRegistry, [admin]);
  await verify("Treasury", c.Treasury, [admin]);
  await verify("ASSATimelock", c.ASSATimelock, [minDelay, signers, signers, admin]);
  await verify("TokenVesting", c.TokenVesting, [c.ASSAToken, admin]);
  await verify("TokenSale", c.TokenSale, [c.ASSAToken, c.MockUSDC, c.Treasury, admin]);
  await verify("StakingLock", c.StakingLock, [c.ASSAToken, admin]);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
