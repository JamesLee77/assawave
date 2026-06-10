/**
 * Populate the Base Sepolia deployment with demo data so the portal shows
 * something for a connected wallet. Run AFTER deploy:full:sepolia.
 *
 *   DEMO_WALLET=0xYourMetaMaskAddress npm run configure:sepolia
 *
 * What it does (deployer holds all admin roles post-deploy):
 *   1. Mints $ASSA to TokenSale (round cap) and TokenVesting (schedule total) — the funding gate.
 *   2. Seeds DEMO_WALLET with $ASSA (dashboard balance + stake testing) and MockUSDC (sale purchases).
 *   3. Configures sale round 0 (Private R1, 0.05 USDC/ASSA, 10% TGE, 6mo linear), whitelists + KYCs DEMO_WALLET.
 *   4. Creates a vesting schedule for DEMO_WALLET (1M ASSA, 10% TGE, 6mo linear).
 */
import { ethers, network } from "hardhat";
import { loadRegistry, banner } from "./lib";

const MONTH = 30 * 24 * 60 * 60;

async function main() {
  banner("Configure testnet demo data");
  const demo = process.env.DEMO_WALLET;
  if (!demo || !ethers.isAddress(demo)) {
    throw new Error("Set DEMO_WALLET=0x... (the wallet you'll connect in the portal).");
  }
  const c = loadRegistry().contracts;
  if (!c.ASSAToken) throw new Error(`No deployment registry for ${network.name}. Deploy first.`);

  const [deployer] = await ethers.getSigners();
  console.log(`  deployer: ${deployer.address}\n  demo wallet: ${demo}`);

  const assa = await ethers.getContractAt("ASSAToken", c.ASSAToken);
  const sale = await ethers.getContractAt("TokenSale", c.TokenSale);
  const vesting = await ethers.getContractAt("TokenVesting", c.TokenVesting);
  const usdc = await ethers.getContractAt("MockUSDC", c.MockUSDC);
  const kyc = await ethers.getContractAt("KYCRegistry", c.KYCRegistry);

  // Public Base Sepolia RPCs under-estimate gas on ERC20Votes mints (checkpoint
  // SSTORE), causing OOG. Pin an explicit limit to skip estimateGas. They also
  // lag `getTransactionCount("pending")` between rapid sends → "nonce too low";
  // thread the nonce ourselves. gx() is evaluated only when a tx is actually
  // sent (guarded mints that skip don't consume a nonce).
  let nextNonce = await ethers.provider.getTransactionCount(deployer.address, "latest");
  const gx = () => ({ gasLimit: 600_000, nonce: nextNonce++ });

  const A = (n: string) => ethers.parseUnits(n, 18); // ASSA (18dec)
  const U = (n: string) => ethers.parseUnits(n, 6); // USDC (6dec)

  const ROUND_CAP = A("10000000"); // 10M ASSA round hard cap
  const VEST_TOTAL = A("1000000"); // 1M ASSA vesting schedule
  const DEMO_ASSA = A("50000"); // 50k ASSA to demo wallet
  const DEMO_USDC = U("5000"); // 5k MockUSDC to demo wallet
  const PRICE = U("0.05"); // 0.05 USDC per 1 ASSA  → 50_000

  // 1. Funding gate — pre-fund Sale + Vesting with ASSA.
  console.log("  · mint ASSA → TokenSale (round cap)");
  if ((await assa.balanceOf(c.TokenSale)) < ROUND_CAP) await (await assa.mint(c.TokenSale, ROUND_CAP, gx())).wait();
  console.log("  · mint ASSA → TokenVesting (schedule total)");
  if ((await assa.balanceOf(c.TokenVesting)) < VEST_TOTAL) await (await assa.mint(c.TokenVesting, VEST_TOTAL, gx())).wait();

  // 2. Seed the demo wallet.
  console.log("  · mint ASSA → demo wallet (50k)");
  if ((await assa.balanceOf(demo)) < DEMO_ASSA) await (await assa.mint(demo, DEMO_ASSA, gx())).wait();
  console.log("  · mint MockUSDC → demo wallet (5k)");
  if ((await usdc.balanceOf(demo)) < DEMO_USDC) await (await usdc.mint(demo, DEMO_USDC, gx())).wait();

  // 3. Configure sale round 0 + gate the demo wallet.
  const now = (await ethers.provider.getBlock("latest"))!.timestamp;
  console.log("  · configureRound(0) Private R1");
  if ((await sale.getRoundCount()) === 0n) {
    await (
      await sale.configureRound(
        0,
        "Private R1",
        PRICE,
        ROUND_CAP,
        now - 300, // started 5 min ago (safely open)
        now + 12 * MONTH, // open for 12 months
        0, // cliff
        6 * MONTH, // 6mo linear
        1000, // 10% TGE
        true, // active
        gx()
      )
    ).wait();
  }
  console.log("  · whitelist + KYC demo wallet for round 0");
  await (await sale.setWhitelist(0, [demo], true, gx())).wait();
  await (await kyc.setKYCed(demo, true, gx())).wait();

  // 4. Vesting schedule for the demo wallet (1M, 10% TGE, 0 cliff, 6mo linear).
  console.log("  · createSchedule for demo wallet (1M ASSA)");
  if ((await vesting.scheduleCountOf(demo)) === 0n) {
    await (await vesting.createSchedule(demo, VEST_TOTAL, 1000, 0, 6 * MONTH, false, 2, gx())).wait();
  }

  console.log(`\n✅ Configured. Connect ${demo} in the portal:`);
  console.log("   Dashboard → 50k ASSA balance");
  console.log("   Sale (R1) → whitelisted, 5k USDC to buy; ~10% claimable at TGE");
  console.log("   Vesting   → 1 schedule, 1M ASSA, ~100k claimable now");
  console.log("   Stake     → lock your 50k ASSA for veASSA weight");
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
