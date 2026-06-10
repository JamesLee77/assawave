import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";

const HOUR = 60 * 60;
const FLOOR = 48 * HOUR;

/**
 * The 48h delay floor only arms on Base mainnet (chainid 8453), which tests can't
 * run on — so the floor paths are exercised through TimelockHarness, an
 * ASSATimelock subclass that forces enforcement ON.
 */
describe("ASSATimelock — 48h delay floor", () => {
  async function deployHarness(minDelay: number) {
    const [admin] = await ethers.getSigners();
    const factory = await ethers.getContractFactory("TimelockHarness");
    const tl = await factory.deploy(minDelay, [admin.address], [admin.address], ethers.ZeroAddress);
    await tl.waitForDeployment();
    return tl;
  }

  it("pins the governance constants: floor = 48h, mainnet chain id = 8453", async () => {
    const [admin] = await ethers.getSigners();
    const tl = await (
      await ethers.getContractFactory("ASSATimelock")
    ).deploy(FLOOR, [admin.address], [admin.address], ethers.ZeroAddress);
    // A one-digit typo here (e.g. 84532 = Base Sepolia) would silently disable
    // the mainnet floor while every harness-based test still passed.
    expect(await tl.MAINNET_CHAIN_ID()).to.equal(8453n);
    expect(await tl.MIN_DELAY_FLOOR()).to.equal(BigInt(FLOOR));
  });

  it("constructor rejects a delay below the floor when mainnet enforcement is on", async () => {
    await expect(deployHarness(60)).to.be.revertedWith("Timelock: below 48h floor");
  });

  it("constructor accepts the floor delay when mainnet enforcement is on", async () => {
    const tl = await deployHarness(FLOOR);
    expect(await tl.getMinDelay()).to.equal(BigInt(FLOOR));
  });

  it("updateDelay below the floor reverts when mainnet enforcement is on", async () => {
    const tl = await deployHarness(FLOOR);
    await expect(tl.updateDelay(60)).to.be.revertedWith("Timelock: below 48h floor");
  });

  it("updateDelay at/above the floor passes the floor check (self-call still required)", async () => {
    const tl = await deployHarness(FLOOR);
    // The floor gate passes; OZ then rejects the non-self caller — proving a
    // >= floor value is not blocked by the floor itself.
    await expect(tl.updateDelay(72 * HOUR)).to.be.revertedWithCustomError(
      tl,
      "TimelockUnauthorizedCaller"
    );
  });

  it("governance can raise the delay via schedule→execute but can never lower it below the floor", async () => {
    const tl = await deployHarness(FLOOR);
    const target = await tl.getAddress();

    // Raise 48h → 72h through the real self-call path.
    const raise = tl.interface.encodeFunctionData("updateDelay", [72 * HOUR]);
    const salt1 = ethers.id("raise-delay");
    await tl.schedule(target, 0, raise, ethers.ZeroHash, salt1, FLOOR);
    await time.increase(FLOOR + 1);
    await tl.execute(target, 0, raise, ethers.ZeroHash, salt1);
    expect(await tl.getMinDelay()).to.equal(BigInt(72 * HOUR));

    // A scheduled proposal to drop below the floor must revert at execution.
    const lower = tl.interface.encodeFunctionData("updateDelay", [HOUR]);
    const salt2 = ethers.id("lower-delay");
    await tl.schedule(target, 0, lower, ethers.ZeroHash, salt2, 72 * HOUR);
    await time.increase(72 * HOUR + 1);
    await expect(
      tl.execute(target, 0, lower, ethers.ZeroHash, salt2)
    ).to.be.revertedWith("Timelock: below 48h floor");

    // Lowering back to EXACTLY the floor is allowed (>= boundary, live path).
    const toFloor = tl.interface.encodeFunctionData("updateDelay", [FLOOR]);
    const salt3 = ethers.id("lower-to-floor");
    await tl.schedule(target, 0, toFloor, ethers.ZeroHash, salt3, 72 * HOUR);
    await time.increase(72 * HOUR + 1);
    await tl.execute(target, 0, toFloor, ethers.ZeroHash, salt3);
    expect(await tl.getMinDelay()).to.equal(BigInt(FLOOR));
  });

  it("non-mainnet chains remain exempt from the floor (short delays allowed)", async () => {
    const [admin] = await ethers.getSigners();
    const tl = await (
      await ethers.getContractFactory("ASSATimelock")
    ).deploy(60, [admin.address], [admin.address], ethers.ZeroAddress);
    expect(await tl.getMinDelay()).to.equal(60n);
    // Floor is OFF on chainid 31337 → a below-floor updateDelay fails only on
    // the self-call requirement, not the floor.
    await expect(tl.updateDelay(1)).to.be.revertedWithCustomError(tl, "TimelockUnauthorizedCaller");
  });
});
