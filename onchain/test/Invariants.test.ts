import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { ASSAToken, TokenSale, TokenVesting, StakingLock, MockUSDC } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

/**
 * Property/invariant suite. Uses a seeded PRNG (mulberry32) so failures are
 * reproducible — no Foundry/fast-check toolchain required.
 *
 * Core invariants (Contract Spec §7):
 *   1. totalSupply <= CAP always.
 *   4. sale sold <= round cap.
 *   3. vesting claimed <= total; vested monotonic and within [0, total].
 *   5. veASSA: votingPower <= amount, == 0 at/after end, no reward path.
 */

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const MONTH = 30 * 24 * 60 * 60;
const YEAR = 365 * 24 * 60 * 60;
const MAX_LOCK = 4 * YEAR;

describe("Invariant / property fuzz suite", () => {
  let admin: HardhatEthersSigner;
  let alice: HardhatEthersSigner;
  const rnd = mulberry32(0xa55a0001);

  const randInt = (min: number, max: number) => min + Math.floor(rnd() * (max - min + 1));
  const randTokens = (minWhole: number, maxWhole: number) =>
    ethers.parseUnits(String(randInt(minWhole, maxWhole)), 18);

  before(async () => {
    [admin, alice] = await ethers.getSigners();
  });

  it("INV-1: ASSAToken never exceeds the 10B cap", async () => {
    const assa = await (await ethers.getContractFactory("ASSAToken")).deploy(admin.address);
    const CAP = await assa.CAP();

    let supply = 0n;
    for (let i = 0; i < 40; i++) {
      // mint a random amount that stays under cap
      const headroom = CAP - supply;
      if (headroom === 0n) break;
      const amt = randTokens(1, 100_000_000); // up to 100M per mint
      const mintAmt = amt < headroom ? amt : headroom;
      await assa.mint(alice.address, mintAmt);
      supply += mintAmt;
      expect(await assa.totalSupply()).to.equal(supply);
      expect(await assa.totalSupply()).to.be.lte(CAP);
    }

    // exceeding cap by 1 must revert
    const left = CAP - (await assa.totalSupply());
    await assa.mint(alice.address, left); // fill to cap
    await expect(assa.mint(alice.address, 1n)).to.be.revertedWith("ASSAToken: cap exceeded");
  });

  it("INV-3: vesting is monotonic and bounded by total across random schedules", async () => {
    const assa = await (await ethers.getContractFactory("ASSAToken")).deploy(admin.address);
    const vesting = await (await ethers.getContractFactory("TokenVesting")).deploy(
      await assa.getAddress(),
      admin.address
    );
    await assa.mint(await vesting.getAddress(), ethers.parseUnits("9000000000", 18));

    for (let i = 0; i < 12; i++) {
      const total = randTokens(1_000, 50_000_000);
      const tgeBps = randInt(0, 10_000);
      const cliff = randInt(0, 2 * YEAR);
      const duration = tgeBps === 10_000 ? randInt(0, 2 * YEAR) : randInt(MONTH, 3 * YEAR);
      const id = await vesting.createSchedule.staticCall(alice.address, total, tgeBps, cliff, duration, false, 0);
      await vesting.createSchedule(alice.address, total, tgeBps, cliff, duration, false, 0);

      const start = Number((await vesting.getSchedule(id)).start);
      const horizon = start + cliff + duration + MONTH;
      let prev = 0n;
      for (let k = 0; k <= 6; k++) {
        const t = start + Math.floor(((horizon - start) * k) / 6);
        if (t > (await time.latest())) await time.increaseTo(t);
        const vested = await vesting.vestedOf(id);
        expect(vested).to.be.gte(prev); // monotonic non-decreasing
        expect(vested).to.be.lte(total); // bounded by total
        prev = vested;
      }
      // fully vested at the end
      expect(await vesting.vestedOf(id)).to.equal(total);
    }
  });

  it("INV-4: sale soldTokens never exceeds the round hard cap", async () => {
    const assa = await (await ethers.getContractFactory("ASSAToken")).deploy(admin.address);
    const usdc = (await (await ethers.getContractFactory("MockUSDC")).deploy()) as unknown as MockUSDC;
    const sale = await (await ethers.getContractFactory("TokenSale")).deploy(
      await assa.getAddress(),
      await usdc.getAddress(),
      admin.address,
      admin.address
    );
    const cap = ethers.parseUnits("100000", 18);
    const now = await time.latest();
    await sale.configureRound(0, "R", 50_000n, cap, now, now + YEAR, 0, MONTH, 0, true);
    await sale.setWhitelist(0, [alice.address], true);
    await assa.mint(await sale.getAddress(), cap);
    await usdc.mint(alice.address, 10_000_000 * 10 ** 6);
    await usdc.connect(alice).approve(await sale.getAddress(), ethers.MaxUint256);

    for (let i = 0; i < 30; i++) {
      const round = await sale.getRound(0);
      const remaining = round.hardCapTokens - round.soldTokens;
      if (remaining === 0n) break;
      let amt = randTokens(1, 9_000);
      if (amt > remaining) amt = remaining;
      await sale.connect(alice).purchase(0, amt);
      const after = await sale.getRound(0);
      expect(after.soldTokens).to.be.lte(after.hardCapTokens);
    }
    // one token over the cap must revert
    const round = await sale.getRound(0);
    if (round.soldTokens === round.hardCapTokens) {
      await expect(sale.connect(alice).purchase(0, 1n)).to.be.revertedWith("Sale: exceeds round cap");
    }
  });

  it("INV-5: veASSA voting power <= amount and decays to 0 at end (random locks)", async () => {
    const assa = await (await ethers.getContractFactory("ASSAToken")).deploy(admin.address);

    for (let i = 0; i < 15; i++) {
      const lock = await (await ethers.getContractFactory("StakingLock")).deploy(
        await assa.getAddress(),
        admin.address
      );
      const amt = randTokens(1_000, 1_000_000);
      await assa.mint(alice.address, amt);
      await assa.connect(alice).approve(await lock.getAddress(), amt);

      const dur = randInt(7 * 24 * 60 * 60, MAX_LOCK);
      await lock.connect(alice).lock(amt, dur);
      const start = await time.latest();
      const end = start + dur;

      // sample a few points in [start, end)
      for (let k = 0; k < 4; k++) {
        const t = start + Math.floor((dur * k) / 4);
        if (t > (await time.latest())) await time.increaseTo(t);
        const vp = await lock.votingPower(alice.address);
        expect(vp).to.be.lte(amt); // never more than principal
        // live and historical formulas agree exactly when no change since checkpoint
        expect(await lock.votingPowerAt(alice.address, await time.latest())).to.equal(vp);
      }

      // at/after end → exactly 0
      await time.increaseTo(end);
      expect(await lock.votingPower(alice.address)).to.equal(0n);
      expect(await lock.votingPowerAt(alice.address, end)).to.equal(0n);
    }
  });

  it("INV-5b: veASSA exposes no reward/yield/emission function (static ABI scan)", async () => {
    const lock = await (await ethers.getContractFactory("StakingLock")).deploy(
      (await (await ethers.getContractFactory("ASSAToken")).deploy(admin.address)).getAddress(),
      admin.address
    );
    const banned = ["claimreward", "distribute", "yield", "reward", "apy", "interest", "harvest", "emission", "pendingreward"];
    for (const frag of lock.interface.fragments) {
      if (frag.type === "function") {
        const name = (frag as any).name.toLowerCase();
        for (const b of banned) expect(name).to.not.contain(b);
      }
    }
  });
});
