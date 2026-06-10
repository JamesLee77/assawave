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
 *   8. BMEBurner           (no token role needed — it self-burns via public burn())
 *
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

  // Explicit nonce sequencing: some public RPCs (e.g. the Base Sepolia gateway)
  // lag `getTransactionCount("pending")` between rapid sequential deploys, so
  // hardhat-ethers reuses a stale nonce and the next deploy reverts
  // "nonce too low". Thread the nonce ourselves from the confirmed count.
  let nextNonce = await ethers.provider.getTransactionCount(deployer.address, "latest");
  const N = () => ({ nonce: nextNonce++ });

  // ---- USDC (mock on local) ----
  let usdc = cfg.usdc;
  if (!usdc) {
    const mock = await (await ethers.getContractFactory("MockUSDC")).deploy(N());
    await mock.waitForDeployment();
    usdc = await mock.getAddress();
    put("MockUSDC", usdc);
  } else {
    console.log(`  USDC (existing) ${usdc}`);
  }

  // ---- 1. ASSAToken ----
  const assa = await (await ethers.getContractFactory("ASSAToken")).deploy(deployer.address, N());
  await assa.waitForDeployment();
  put("ASSAToken", await assa.getAddress());

  // ---- 2. KYCRegistry ----
  const kyc = await (await ethers.getContractFactory("KYCRegistry")).deploy(deployer.address, N());
  await kyc.waitForDeployment();
  put("KYCRegistry", await kyc.getAddress());

  // ---- 3. Treasury ----
  const treasury = await (await ethers.getContractFactory("Treasury")).deploy(deployer.address, N());
  await treasury.waitForDeployment();
  put("Treasury", await treasury.getAddress());

  // ---- 4. ASSATimelock ----
  const signers = cfg.safeSigners && cfg.safeSigners.length > 0 ? cfg.safeSigners : [deployer.address];
  // On mainnet the timelock's proposer/executor MUST be the Safe contract itself.
  // Wiring the Safe's owner EOAs here would let any single key schedule AND execute,
  // collapsing the 2-of-3 multisig into 1-of-3. Checked against the LIVE chain id
  // so network aliases without a configured chainId can't slip past the guard.
  if ((await ethers.provider.getNetwork()).chainId === 8453n) {
    for (const s of signers) {
      if ((await ethers.provider.getCode(s)) === "0x") {
        throw new Error(
          `Timelock proposer/executor ${s} has no code on mainnet — pass the Safe contract address (SAFE_SIGNERS), never owner EOAs.`
        );
      }
    }
  }
  const timelock = await (await ethers.getContractFactory("ASSATimelock")).deploy(
    cfg.timelockMinDelay,
    signers, // proposers
    signers, // executors
    deployer.address, // optional admin (renounced during handoff)
    N()
  );
  await timelock.waitForDeployment();
  put("ASSATimelock", await timelock.getAddress());

  // ---- 5. TokenVesting ----
  const vesting = await (await ethers.getContractFactory("TokenVesting")).deploy(
    await assa.getAddress(),
    deployer.address,
    N()
  );
  await vesting.waitForDeployment();
  put("TokenVesting", await vesting.getAddress());

  // ---- 6. TokenSale ----
  const sale = await (await ethers.getContractFactory("TokenSale")).deploy(
    await assa.getAddress(),
    usdc,
    await treasury.getAddress(),
    deployer.address,
    N()
  );
  await sale.waitForDeployment();
  put("TokenSale", await sale.getAddress());

  // ---- 7. StakingLock (veASSA) ----
  const staking = await (await ethers.getContractFactory("StakingLock")).deploy(
    await assa.getAddress(),
    deployer.address,
    N()
  );
  await staking.waitForDeployment();
  put("StakingLock", await staking.getAddress());

  // ---- 8. BMEBurner ----
  let dexRouter = cfg.dexRouter;
  if (!dexRouter) {
    if (network.name === "base" || network.name === "baseSepolia") {
      console.log("  ⚠ BME skipped: set BASE_DEX_ROUTER to deploy BMEBurner on a live chain.");
    } else {
      const mockRouter = await (await ethers.getContractFactory("MockDexRouter")).deploy(N());
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
      deployer.address,
      N()
    );
    await bme.waitForDeployment();
    put("BMEBurner", await bme.getAddress());
    // No token role wiring: BMEBurner burns its own swapped balance via the
    // public ERC20Burnable.burn() path.
  }

  await saveRegistry(reg);
  console.log("\n✅ Phase 1 deploy complete. Next: funding gate → configure → handoff (see DEPLOYMENT.md).");
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
