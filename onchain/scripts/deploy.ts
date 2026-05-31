/**
 * Full Phase-1 deployment for ASSA WAVE.
 *
 * Order (DEVELOPMENT_PLAN §5 — Funding Gate):
 *   1. ASSAToken           (admin = deployer/EOA, holds MINTER for the funding gate)
 *   2. KYCRegistry
 *   3. Treasury
 *   4. ASSATimelock        (Safe → 48h timelock; admin handoff target)
 *   5. TokenVesting
 *   6. TokenSale           (USDC recipient = Treasury)
 *   7. StakingLock (veASSA)
 *   8. BMEBurner           (grant BURNER_ROLE on the token)
 *
 * Role wiring done here:
 *   - ASSAToken.BURNER_ROLE  → BMEBurner
 * Handoff (grant admin → Timelock/Safe, then renounce EOA) is a SEPARATE, gated step
 * performed AFTER the funding gate (mint + configure rounds/schedules). See DEPLOYMENT.md.
 *
 * On local chains, MockUSDC + MockDexRouter are deployed automatically.
 */
import { ethers, network } from "hardhat";
import { getNetConfig, loadRegistry, saveRegistry, banner } from "./lib";

async function main() {
  banner("ASSA WAVE — Phase 1 full deploy");
  const cfg = getNetConfig();
  const [deployer] = await ethers.getSigners();
  console.log(`  deployer: ${deployer.address}`);

  const reg = loadRegistry();
  reg.deployer = deployer.address;
  const put = (k: string, v: string) => {
    reg.contracts[k] = v;
    console.log(`  ${k.padEnd(14)} ${v}`);
  };

  // ---- USDC (mock on local) ----
  let usdc = cfg.usdc;
  if (!usdc) {
    const mock = await (await ethers.getContractFactory("MockUSDC")).deploy();
    await mock.waitForDeployment();
    usdc = await mock.getAddress();
    put("MockUSDC", usdc);
  } else {
    console.log(`  USDC (existing) ${usdc}`);
  }

  // ---- 1. ASSAToken ----
  const assa = await (await ethers.getContractFactory("ASSAToken")).deploy(deployer.address);
  await assa.waitForDeployment();
  put("ASSAToken", await assa.getAddress());

  // ---- 2. KYCRegistry ----
  const kyc = await (await ethers.getContractFactory("KYCRegistry")).deploy(deployer.address);
  await kyc.waitForDeployment();
  put("KYCRegistry", await kyc.getAddress());

  // ---- 3. Treasury ----
  const treasury = await (await ethers.getContractFactory("Treasury")).deploy(deployer.address);
  await treasury.waitForDeployment();
  put("Treasury", await treasury.getAddress());

  // ---- 4. ASSATimelock ----
  const signers = cfg.safeSigners && cfg.safeSigners.length > 0 ? cfg.safeSigners : [deployer.address];
  const timelock = await (await ethers.getContractFactory("ASSATimelock")).deploy(
    cfg.timelockMinDelay,
    signers, // proposers
    signers, // executors
    deployer.address // optional admin (renounced during handoff)
  );
  await timelock.waitForDeployment();
  put("ASSATimelock", await timelock.getAddress());

  // ---- 5. TokenVesting ----
  const vesting = await (await ethers.getContractFactory("TokenVesting")).deploy(
    await assa.getAddress(),
    deployer.address
  );
  await vesting.waitForDeployment();
  put("TokenVesting", await vesting.getAddress());

  // ---- 6. TokenSale ----
  const sale = await (await ethers.getContractFactory("TokenSale")).deploy(
    await assa.getAddress(),
    usdc,
    await treasury.getAddress(),
    deployer.address
  );
  await sale.waitForDeployment();
  put("TokenSale", await sale.getAddress());

  // ---- 7. StakingLock (veASSA) ----
  const staking = await (await ethers.getContractFactory("StakingLock")).deploy(
    await assa.getAddress(),
    deployer.address
  );
  await staking.waitForDeployment();
  put("StakingLock", await staking.getAddress());

  // ---- 8. BMEBurner ----
  let dexRouter = cfg.dexRouter;
  if (!dexRouter) {
    if (network.name === "base" || network.name === "baseSepolia") {
      console.log("  ⚠ BME skipped: set BASE_DEX_ROUTER to deploy BMEBurner on a live chain.");
    } else {
      const mockRouter = await (await ethers.getContractFactory("MockDexRouter")).deploy();
      await mockRouter.waitForDeployment();
      dexRouter = await mockRouter.getAddress();
      put("MockDexRouter", dexRouter);
    }
  }
  if (dexRouter) {
    const bme = await (await ethers.getContractFactory("BMEBurner")).deploy(
      await assa.getAddress(),
      usdc,
      dexRouter,
      deployer.address
    );
    await bme.waitForDeployment();
    put("BMEBurner", await bme.getAddress());

    // Role wiring: let the burner burn $ASSA.
    const BURNER_ROLE = await assa.BURNER_ROLE();
    await (await assa.grantRole(BURNER_ROLE, await bme.getAddress())).wait();
    console.log("  ↳ granted BURNER_ROLE → BMEBurner");
  }

  await saveRegistry(reg);
  console.log("\n✅ Phase 1 deploy complete. Next: funding gate → configure → handoff (see DEPLOYMENT.md).");
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
