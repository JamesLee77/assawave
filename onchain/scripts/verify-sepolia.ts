/**
 * Batch-verify the deployed Phase-1 contracts on Basescan.
 *
 *   BASESCAN_API_KEY=... npm run verify:all:sepolia
 *
 * Reads addresses from deployments/<network>.json and verifies each with the exact
 * constructor args used at deploy time (admin = registry.deployer). Re-runnable:
 * "already verified" is treated as success.
 */
import hre, { ethers } from "hardhat";
import { loadRegistry, banner } from "./lib";

// Returns false only for a genuine verification rejection. "Not in registry"
// (skipped) and "already verified" are benign and count as success, so the
// caller can fail the whole run on a real ✗ instead of exiting green.
async function verify(name: string, address: string | undefined, constructorArguments: unknown[]): Promise<boolean> {
  if (!address) {
    console.log(`  • ${name}: not in registry, skipping`);
    return true;
  }
  try {
    await hre.run("verify:verify", { address, constructorArguments });
    console.log(`  ✓ ${name} verified — ${address}`);
    return true;
  } catch (e) {
    const msg = (e as Error).message || String(e);
    if (/already verified/i.test(msg)) {
      console.log(`  • ${name} already verified — ${address}`);
      return true;
    }
    console.log(`  ✗ ${name} (${address}): ${msg.split("\n")[0]}`);
    return false;
  }
}

async function main() {
  banner("Verify on Basescan");
  const reg = loadRegistry();
  const c = reg.contracts;
  const admin = reg.deployer;
  if (!admin) throw new Error("No deployer in registry.");

  // Must match the constructor values used at deploy time. The deployed delay is
  // authoritative, so read it live (this is what makes the 60s testnet timelock
  // verify without anyone remembering TIMELOCK_MIN_DELAY=60). An explicit env var
  // wins if the delay was changed post-deploy; the 48h mainnet floor is the last resort.
  let minDelay = Number(process.env.TIMELOCK_MIN_DELAY || 0);
  if (!minDelay && c.ASSATimelock) {
    try {
      minDelay = Number(await (await ethers.getContractAt("ASSATimelock", c.ASSATimelock)).getMinDelay());
    } catch {
      /* unreachable node or not yet deployed — fall through to the default below */
    }
  }
  if (!minDelay) minDelay = 48 * 3600;
  const signers = process.env.SAFE_SIGNERS ? process.env.SAFE_SIGNERS.split(",") : [admin];

  const ok: boolean[] = [];
  ok.push(await verify("MockUSDC", c.MockUSDC, []));
  ok.push(await verify("ASSAToken", c.ASSAToken, [admin]));
  ok.push(await verify("KYCRegistry", c.KYCRegistry, [admin]));
  ok.push(await verify("Treasury", c.Treasury, [admin]));
  ok.push(await verify("ASSATimelock", c.ASSATimelock, [minDelay, signers, signers, admin]));
  ok.push(await verify("TokenVesting", c.TokenVesting, [c.ASSAToken, admin]));
  ok.push(await verify("TokenSale", c.TokenSale, [c.ASSAToken, c.MockUSDC, c.Treasury, admin]));
  ok.push(await verify("StakingLock", c.StakingLock, [c.ASSAToken, admin]));

  if (ok.includes(false)) {
    throw new Error("One or more contracts failed verification — see the ✗ lines above.");
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
