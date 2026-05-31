/**
 * End-to-end scenario test against a LIVE deployment (Base Sepolia).
 *
 *   npm run e2e:sepolia
 *
 * Generates (or reuses) a non-admin TEST wallet, funds it with gas from the
 * deployer, then drives every user-facing flow and asserts the result on-chain:
 *
 *   admin (deployer): funding gate → configure round → whitelist + KYC → vesting schedule
 *   user  (test):     USDC approve → purchase → claim (TGE) → ASSA approve → lock (veASSA)
 *                     → check voting power/tier → vesting release (TGE)
 *
 * The TEST key is saved to repo-root .env as TEST_PRIVATE_KEY (gitignored) so the
 * run is reproducible AND you can import that wallet into the portal to SEE the data.
 * Only the public address is printed — never the key.
 *
 * Not testable on a live chain (no time travel): linear-vesting progression past TGE
 * and lock withdrawal after expiry. Those are covered by the local Hardhat test suite.
 */
import { ethers, network } from "hardhat";
import type { Provider } from "ethers";
import { loadRegistry, banner } from "./lib";
import * as fs from "fs";
import * as path from "path";

const MONTH = 30 * 24 * 60 * 60;
const YEAR = 365 * 24 * 60 * 60;

let failures = 0;
function check(label: string, cond: boolean, detail = "") {
  console.log(`  ${cond ? "✓" : "✗"} ${label}${detail ? `  (${detail})` : ""}`);
  if (!cond) failures++;
}
function approx(a: bigint, b: bigint, tolerance: bigint) {
  return (a > b ? a - b : b - a) <= tolerance;
}

function getTestWallet(provider: Provider) {
  let pk = process.env.TEST_PRIVATE_KEY;
  if (!pk) {
    const w = ethers.Wallet.createRandom();
    pk = w.privateKey;
    const ENV = path.resolve(__dirname, "..", "..", ".env");
    let env = fs.readFileSync(ENV, "utf8");
    env += `\nTEST_PRIVATE_KEY=${pk}\n`;
    fs.writeFileSync(ENV, env);
    fs.chmodSync(ENV, 0o600);
    console.log("  · generated TEST wallet → saved TEST_PRIVATE_KEY to .env");
  }
  return new ethers.Wallet(pk, provider);
}

async function main() {
  banner("ASSA WAVE — live E2E scenario test");
  const c = loadRegistry().contracts;
  if (!c.ASSAToken) throw new Error(`No deployment registry for ${network.name}. Deploy first.`);

  const [deployer] = await ethers.getSigners();
  const test = getTestWallet(ethers.provider);
  console.log(`  deployer: ${deployer.address}\n  test wallet: ${test.address}`);

  const A = (n: string) => ethers.parseUnits(n, 18);
  const U = (n: string) => ethers.parseUnits(n, 6);
  const ROUND_CAP = A("10000000");
  const VEST_TOTAL = A("1000000");
  const SEED_ASSA = A("50000");
  const SEED_USDC = U("5000");
  const PRICE = U("0.05"); // USDC per ASSA
  const BUY = A("2000"); // buy 2000 ASSA → 100 USDC
  const LOCK = A("10000"); // lock 10k → SILVER tier

  const assa = await ethers.getContractAt("ASSAToken", c.ASSAToken);
  const sale = await ethers.getContractAt("TokenSale", c.TokenSale);
  const vesting = await ethers.getContractAt("TokenVesting", c.TokenVesting);
  const usdc = await ethers.getContractAt("MockUSDC", c.MockUSDC);
  const kyc = await ethers.getContractAt("KYCRegistry", c.KYCRegistry);
  const staking = await ethers.getContractAt("StakingLock", c.StakingLock);

  // ── 0. Gas for the test wallet ──────────────────────────────────────────────
  const need = ethers.parseEther("0.0006");
  if ((await ethers.provider.getBalance(test.address)) < need) {
    console.log("\n[0] fund test wallet with gas");
    await (await deployer.sendTransaction({ to: test.address, value: need })).wait();
  }

  // ── 1. Funding gate (admin) ─────────────────────────────────────────────────
  console.log("\n[1] funding gate (mint)");
  if ((await assa.balanceOf(c.TokenSale)) < ROUND_CAP) {
    await (await assa.mint(c.TokenSale, ROUND_CAP)).wait();
  }
  await (await assa.mint(c.TokenVesting, VEST_TOTAL)).wait();
  await (await assa.mint(test.address, SEED_ASSA)).wait();
  await (await usdc.mint(test.address, SEED_USDC)).wait();
  check("test seeded with ASSA", (await assa.balanceOf(test.address)) >= SEED_ASSA);
  check("test seeded with USDC", (await usdc.balanceOf(test.address)) >= SEED_USDC);
  check("supply under 10B cap", (await assa.totalSupply()) <= (await assa.CAP()));

  // ── 2. Configure round 0 + gate the test wallet (admin) ─────────────────────
  console.log("\n[2] configure sale round 0 + gating");
  if ((await sale.getRoundCount()) === 0n) {
    const now = (await ethers.provider.getBlock("latest"))!.timestamp;
    await (
      await sale.configureRound(0, "Private R1", PRICE, ROUND_CAP, now - 300, now + 12 * MONTH, 0, 6 * MONTH, 1000, true)
    ).wait();
  }
  await (await sale.setWhitelist(0, [test.address], true)).wait();
  await (await kyc.setKYCed(test.address, true)).wait();
  const round0 = await sale.getRound(0);
  check("round 0 active", round0.active, round0.name);
  check("test whitelisted", await sale.whitelist(0, test.address));
  check("test KYC'd", await kyc.isKYCed(test.address));

  // ── 3. Sale: purchase (user) ────────────────────────────────────────────────
  console.log("\n[3] sale purchase");
  const cost = await sale.quoteUsdc(0, BUY);
  const usdcBefore = await usdc.balanceOf(test.address);
  await (await usdc.connect(test).approve(c.TokenSale, cost)).wait();
  await (await sale.connect(test).purchase(0, BUY)).wait();
  const alloc = await sale.allocations(0, test.address);
  check("allocation recorded", alloc.totalAllocated === BUY, `${ethers.formatUnits(alloc.totalAllocated, 18)} ASSA`);
  check("USDC charged (100)", usdcBefore - (await usdc.balanceOf(test.address)) === cost, `${ethers.formatUnits(cost, 6)} USDC`);

  // ── 4. Sale: claim TGE (user) ───────────────────────────────────────────────
  console.log("\n[4] sale claim (TGE 10%)");
  const claimable = await sale.claimable(0, test.address);
  const assaBefore4 = await assa.balanceOf(test.address);
  await (await sale.connect(test).claim(0)).wait();
  const got4 = (await assa.balanceOf(test.address)) - assaBefore4;
  check("TGE ~10% claimable", approx(claimable, A("200"), A("1")), `${ethers.formatUnits(claimable, 18)} ASSA`);
  check("claim delivered TGE", approx(got4, A("200"), A("1")), `${ethers.formatUnits(got4, 18)} ASSA`);

  // ── 5. Stake: lock for veASSA (user) ────────────────────────────────────────
  console.log("\n[5] veASSA lock");
  const lockState = await staking.locks(test.address);
  if (lockState.amount === 0n) {
    await (await assa.connect(test).approve(c.StakingLock, LOCK)).wait();
    await (await staking.connect(test).lock(LOCK, YEAR)).wait();
  }
  const vp = await staking.votingPower(test.address);
  const tier = await staking.tierOf(test.address);
  const weight = await staking.tierWeight(test.address);
  check("locked 10k ASSA", (await staking.locks(test.address)).amount === LOCK);
  check("voting power ~2500 (1y/4y decay)", approx(vp, A("2500"), A("100")), `${ethers.formatUnits(vp, 18)}`);
  check("tier = SILVER (2)", tier === 2n, `tier=${tier}`);
  check("tier weight = 125", weight === 125n);

  // ── 6. Vesting: create schedule + release TGE (admin then user) ─────────────
  console.log("\n[6] vesting schedule + release (TGE 10%)");
  if ((await vesting.scheduleCountOf(test.address)) === 0n) {
    await (await vesting.createSchedule(test.address, VEST_TOTAL, 1000, 0, 6 * MONTH, false, 2)).wait();
  }
  const ids = await vesting.scheduleIdsOf(test.address);
  const sid = ids[ids.length - 1];
  const releasable = await vesting.releasable(sid);
  const assaBefore6 = await assa.balanceOf(test.address);
  await (await vesting.connect(test).release(sid)).wait();
  const got6 = (await assa.balanceOf(test.address)) - assaBefore6;
  check("schedule TGE ~100k releasable", approx(releasable, A("100000"), A("10")), `${ethers.formatUnits(releasable, 18)} ASSA`);
  check("release delivered TGE", approx(got6, A("100000"), A("10")), `${ethers.formatUnits(got6, 18)} ASSA`);

  // ── Summary ─────────────────────────────────────────────────────────────────
  console.log("\n" + "─".repeat(60));
  if (failures === 0) {
    console.log(`✅ ALL SCENARIOS PASSED. Import ${test.address} into the portal to view the data.`);
  } else {
    console.log(`❌ ${failures} assertion(s) FAILED.`);
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
