import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { ASSAToken, StakingLock } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

const YEAR = 365 * 24 * 60 * 60;
const MAX = 4 * YEAR;

describe("StakingLock — historical voting power (checkpoints)", () => {
  let assa: ASSAToken;
  let lock: StakingLock;
  let admin: HardhatEthersSigner;
  let alice: HardhatEthersSigner;

  beforeEach(async () => {
    [admin, alice] = await ethers.getSigners();
    assa = await (await ethers.getContractFactory("ASSAToken")).deploy(admin.address);
    lock = await (await ethers.getContractFactory("StakingLock")).deploy(await assa.getAddress(), admin.address);
    await assa.mint(alice.address, ethers.parseUnits("1000000", 18));
    await assa.connect(alice).approve(await lock.getAddress(), ethers.MaxUint256);
  });

  it("votingPowerAt returns 0 before first checkpoint", async () => {
    const past = (await time.latest()) - 1000;
    expect(await lock.votingPowerAt(alice.address, past)).to.equal(0n);
    expect(await lock.lockHistoryLength(alice.address)).to.equal(0n);
  });

  it("reconstructs decayed power across lock changes", async () => {
    const amt1 = ethers.parseUnits("10000", 18);
    await lock.connect(alice).lock(amt1, MAX);
    const t1 = await time.latest();
    expect(await lock.lockHistoryLength(alice.address)).to.equal(1n);

    // snapshot at t1: ~full amount (4y lock)
    const vpAtT1 = await lock.votingPowerAt(alice.address, t1);
    expect(vpAtT1).to.be.closeTo(amt1, ethers.parseUnits("10", 18));

    // 1 year later, double the amount
    await time.increaseTo(t1 + YEAR);
    const amt2 = ethers.parseUnits("10000", 18);
    await lock.connect(alice).increaseAmount(amt2);
    const t2 = await time.latest();
    expect(await lock.lockHistoryLength(alice.address)).to.equal(2n);

    // querying the PAST (t1) must still reflect the old amount (10k), not 20k
    expect(await lock.votingPowerAt(alice.address, t1)).to.be.closeTo(amt1, ethers.parseUnits("10", 18));

    // at t2 the lock end is unchanged so ~3y remain on 20k → 20k * 3/4
    const vpAtT2 = await lock.votingPowerAt(alice.address, t2);
    expect(vpAtT2).to.be.closeTo(((amt1 + amt2) * 3n) / 4n, ethers.parseUnits("50", 18));
  });

  it("historical power past the lock end is 0; withdraw checkpoints to 0", async () => {
    const amt = ethers.parseUnits("5000", 18);
    await lock.connect(alice).lock(amt, YEAR);
    const t1 = await time.latest();
    const end = t1 + YEAR;

    // exactly at end → 0
    expect(await lock.votingPowerAt(alice.address, end)).to.equal(0n);

    await time.increaseTo(end + 1);
    await lock.connect(alice).withdraw();
    const tW = await time.latest();

    // after withdraw checkpoint, power is 0
    expect(await lock.votingPowerAt(alice.address, tW)).to.equal(0n);
    // but mid-lock historical query is still correct
    expect(await lock.votingPowerAt(alice.address, t1)).to.be.closeTo(amt / 4n, ethers.parseUnits("5", 18));
  });
});
