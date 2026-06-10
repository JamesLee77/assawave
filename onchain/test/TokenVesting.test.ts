import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { ASSAToken, TokenVesting } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

const MONTH = 30 * 24 * 60 * 60;
const BPS = 10_000n;

describe("TokenVesting — TGE + cliff + linear accounting (Spec §3.3)", () => {
  let assa: ASSAToken;
  let vesting: TokenVesting;
  let admin: HardhatEthersSigner;
  let alice: HardhatEthersSigner;
  let bob: HardhatEthersSigner;

  const FUND = ethers.parseUnits("100000000", 18); // 100M ASSA into vesting

  beforeEach(async () => {
    [admin, alice, bob] = await ethers.getSigners();
    assa = await (await ethers.getContractFactory("ASSAToken")).deploy(admin.address);
    vesting = await (await ethers.getContractFactory("TokenVesting")).deploy(
      await assa.getAddress(),
      admin.address
    );
    await assa.mint(await vesting.getAddress(), FUND);
  });

  // expected vested per Spec §3.3
  function expectedVested(total: bigint, tgeBps: bigint, cliff: number, duration: number, t: number, start: number): bigint {
    if (t < start) return 0n;
    const tge = (total * tgeBps) / BPS;
    const cliffEnd = start + cliff;
    if (t < cliffEnd) return tge;
    const linearEnd = cliffEnd + duration;
    if (t >= linearEnd) return total;
    const linearPortion = total - tge;
    return tge + (linearPortion * BigInt(t - cliffEnd)) / BigInt(duration);
  }

  it("R1 profile (0% TGE, 6m cliff, 18m linear): cliff gates, linear post-cliff", async () => {
    const total = ethers.parseUnits("1000000", 18);
    await vesting.createSchedule(alice.address, total, 0, 6 * MONTH, 18 * MONTH, false, 1);
    const s = await vesting.getSchedule(0);
    const start = Number(s.start);

    // before cliff: nothing
    await time.increaseTo(start + 3 * MONTH);
    expect(await vesting.releasable(0)).to.equal(0n);

    // at cliff: still 0 (linear just begins)
    await time.increaseTo(start + 6 * MONTH);
    expect(await vesting.releasable(0)).to.be.closeTo(0n, ethers.parseUnits("5", 18));

    // half of linear window (cliff + 9m): ~50%
    await time.increaseTo(start + 6 * MONTH + 9 * MONTH);
    expect(await vesting.releasable(0)).to.be.closeTo(total / 2n, ethers.parseUnits("50", 18));

    // fully vested
    await time.increaseTo(start + 6 * MONTH + 18 * MONTH);
    expect(await vesting.releasable(0)).to.equal(total);
  });

  it("R3 profile (10% TGE, 0 cliff, 6m linear): TGE unlocks immediately", async () => {
    const total = ethers.parseUnits("600000", 18);
    await vesting.createSchedule(alice.address, total, 1000, 0, 6 * MONTH, false, 3);
    const s = await vesting.getSchedule(0);
    const start = Number(s.start);

    // at start: 10% TGE
    expect(await vesting.releasable(0)).to.be.closeTo(total / 10n, ethers.parseUnits("100", 18));

    // half linear: 10% + 45% = 55%
    await time.increaseTo(start + 3 * MONTH);
    expect(await vesting.releasable(0)).to.be.closeTo((total * 55n) / 100n, ethers.parseUnits("100", 18));

    // end: 100%
    await time.increaseTo(start + 6 * MONTH);
    expect(await vesting.releasable(0)).to.equal(total);
  });

  it("release transfers vested tokens and never exceeds total (claimed <= total)", async () => {
    const total = ethers.parseUnits("1000000", 18);
    await vesting.createSchedule(alice.address, total, 2000, 0, 12 * MONTH, false, 2);
    const start = Number((await vesting.getSchedule(0)).start);

    await time.increaseTo(start + 6 * MONTH);
    const before = await assa.balanceOf(alice.address);
    await vesting.connect(alice).release(0);
    const after = await assa.balanceOf(alice.address);
    expect(after - before).to.be.gt(0n);

    // claim everything at end
    await time.increaseTo(start + 12 * MONTH + 1);
    await vesting.connect(alice).release(0);
    expect(await assa.balanceOf(alice.address)).to.equal(total);

    const sched = await vesting.getSchedule(0);
    expect(sched.claimed).to.equal(total);
    // nothing left
    await expect(vesting.connect(alice).release(0)).to.be.revertedWith("Vesting: nothing releasable");
  });

  it("releaseAll sweeps every schedule of the beneficiary", async () => {
    const t1 = ethers.parseUnits("100000", 18);
    const t2 = ethers.parseUnits("250000", 18);
    await vesting.createSchedule(alice.address, t1, 10000, 0, 0, false, 5); // 100% TGE
    await vesting.createSchedule(alice.address, t2, 10000, 0, 0, false, 5); // 100% TGE
    expect(await vesting.scheduleCountOf(alice.address)).to.equal(2n);

    await vesting.connect(alice).releaseAll();
    expect(await assa.balanceOf(alice.address)).to.equal(t1 + t2);
  });

  it("revoke freezes unvested remainder; vested stays claimable", async () => {
    const total = ethers.parseUnits("1000000", 18);
    await vesting.createSchedule(alice.address, total, 0, 0, 10 * MONTH, true, 6);
    const start = Number((await vesting.getSchedule(0)).start);

    await time.increaseTo(start + 5 * MONTH); // ~50% vested
    const outstandingBefore = await vesting.totalOutstanding();
    await vesting.revoke(0);

    const sched = await vesting.getSchedule(0);
    expect(sched.revoked).to.equal(true);
    // total frozen near 50%
    expect(sched.total).to.be.closeTo(total / 2n, ethers.parseUnits("5000", 18));
    // outstanding dropped by the unvested portion
    expect(await vesting.totalOutstanding()).to.be.lt(outstandingBefore);

    // beneficiary can still claim the frozen (vested) amount, but no more grows
    await time.increaseTo(start + 10 * MONTH);
    await vesting.connect(alice).release(0);
    expect(await assa.balanceOf(alice.address)).to.equal(sched.total);
  });

  it("revoke freezes vested value exactly: no re-vesting curve is applied to the frozen total", async () => {
    // 50% TGE + 6m cliff: vested is exactly the 500k TGE for the whole cliff window
    const total = ethers.parseUnits("1000000", 18);
    await vesting.createSchedule(alice.address, total, 5000, 6 * MONTH, 6 * MONTH, true, 1);

    await time.increase(3 * MONTH); // inside the cliff
    await vesting.revoke(0); // freeze at the 500k TGE

    // pre-fix the curve re-applied to the frozen total returned 250k here
    expect(await vesting.releasable(0)).to.equal(total / 2n);
    await vesting.connect(alice).release(0);
    expect(await assa.balanceOf(alice.address)).to.equal(total / 2n);
  });

  it("release/releasable never revert after a claim-then-revoke (frozen schedules stop re-vesting)", async () => {
    const total = ethers.parseUnits("1000000", 18);
    await vesting.createSchedule(alice.address, total, 5000, 6 * MONTH, 6 * MONTH, true, 1);

    await vesting.connect(alice).release(0); // claim the 500k TGE immediately
    expect(await assa.balanceOf(alice.address)).to.equal(total / 2n);

    await time.increase(3 * MONTH); // still inside the cliff: vestedNow == claimed
    await vesting.revoke(0); // freeze at 500k (== claimed)

    // pre-fix: vested re-curved to 250k < claimed 500k → both calls underflow-reverted
    expect(await vesting.releasable(0)).to.equal(0n);
    await expect(vesting.connect(alice).release(0)).to.be.revertedWith("Vesting: nothing releasable");

    // far future: nothing ever re-vests beyond the frozen total
    await time.increase(24 * MONTH);
    expect(await vesting.releasable(0)).to.equal(0n);
    expect(await vesting.vestedOf(0)).to.equal(total / 2n);
  });

  it("revoke guards: non-revocable and double-revoke are rejected", async () => {
    const total = ethers.parseUnits("100", 18);
    await vesting.createSchedule(alice.address, total, 0, 0, 10 * MONTH, false, 1);
    await expect(vesting.revoke(0)).to.be.revertedWith("Vesting: not revocable");

    await vesting.createSchedule(alice.address, total, 0, 0, 10 * MONTH, true, 1);
    await vesting.revoke(1);
    await expect(vesting.revoke(1)).to.be.revertedWith("Vesting: already revoked");
  });

  it("releaseAll handles a mix of live and revoked schedules", async () => {
    const total = ethers.parseUnits("1000000", 18);
    await vesting.createSchedule(alice.address, total, 0, 0, 10 * MONTH, true, 1); // revoked at ~50%
    await vesting.createSchedule(alice.address, total, 0, 0, 10 * MONTH, false, 2); // stays live
    const start = Number((await vesting.getSchedule(0)).start);

    await time.increaseTo(start + 5 * MONTH);
    await vesting.revoke(0); // freeze schedule 0 near 50%

    await time.increaseTo(start + 10 * MONTH); // schedule 1 fully vested
    await vesting.connect(alice).releaseAll();

    const frozen = (await vesting.getSchedule(0)).total;
    expect(await assa.balanceOf(alice.address)).to.equal(BigInt(frozen) + total);
  });

  it("recoverERC20 cannot claw back tokens owed to beneficiaries", async () => {
    const total = ethers.parseUnits("80000000", 18); // 80M owed of 100M funded
    await vesting.createSchedule(alice.address, total, 0, 0, 12 * MONTH, false, 2);
    // surplus = 100M - 80M = 20M
    await expect(
      vesting.recoverERC20(await assa.getAddress(), bob.address, ethers.parseUnits("20000001", 18))
    ).to.be.revertedWith("Vesting: exceeds surplus");
    await vesting.recoverERC20(await assa.getAddress(), bob.address, ethers.parseUnits("20000000", 18));
    expect(await assa.balanceOf(bob.address)).to.equal(ethers.parseUnits("20000000", 18));
  });

  it("rejects invalid schedules", async () => {
    await expect(vesting.createSchedule(ethers.ZeroAddress, 1, 0, 0, MONTH, false, 0)).to.be.revertedWith("Vesting: beneficiary zero");
    await expect(vesting.createSchedule(alice.address, 0, 0, 0, MONTH, false, 0)).to.be.revertedWith("Vesting: total zero");
    await expect(vesting.createSchedule(alice.address, 1, 10001, 0, MONTH, false, 0)).to.be.revertedWith("Vesting: tgeBps > 100%");
    await expect(vesting.createSchedule(alice.address, 1, 0, 0, 0, false, 0)).to.be.revertedWith("Vesting: zero-length linear");
  });

  it("only VESTING_ADMIN can create schedules", async () => {
    await expect(
      vesting.connect(alice).createSchedule(alice.address, 1, 0, 0, MONTH, false, 0)
    ).to.be.revertedWithCustomError(vesting, "AccessControlUnauthorizedAccount");
  });
});
