import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { ASSAToken, StakingLock, BMEBurner, MockUSDC, MockDexRouter } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("ASSA WAVE Smart Contracts Suite", () => {
  let assa: ASSAToken;
  let usdc: MockUSDC;
  let router: MockDexRouter;
  let lockup: StakingLock;
  let burner: BMEBurner;

  let admin: HardhatEthersSigner;
  let alice: HardhatEthersSigner;
  let bob: HardhatEthersSigner;
  let processor: HardhatEthersSigner;

  const INITIAL_MINT = ethers.parseUnits("1000000", 18); // 1M ASSA
  const LOCK_AMOUNT = ethers.parseUnits("10000", 18); // 10k ASSA
  const ONE_YEAR = 365 * 24 * 60 * 60;
  const FOUR_YEARS = 4 * ONE_YEAR;

  beforeEach(async () => {
    [admin, alice, bob, processor] = await ethers.getSigners();

    // 1. Deploy ASSAToken
    const ASSA = await ethers.getContractFactory("ASSAToken");
    assa = await ASSA.deploy(admin.address);

    // 2. Deploy MockUSDC
    const USDC = await ethers.getContractFactory("MockUSDC");
    usdc = await USDC.deploy() as unknown as MockUSDC;

    // 3. Deploy MockDexRouter
    const Router = await ethers.getContractFactory("MockDexRouter");
    router = await Router.deploy() as unknown as MockDexRouter;

    // 4. Deploy StakingLock (veASSA)
    const Lockup = await ethers.getContractFactory("StakingLock");
    lockup = await Lockup.deploy(await assa.getAddress(), admin.address);

    // 5. Deploy BMEBurner
    const Burner = await ethers.getContractFactory("BMEBurner");
    burner = await Burner.deploy(
      await assa.getAddress(),
      await usdc.getAddress(),
      await router.getAddress(),
      admin.address
    );

    // Setup roles
    const MINTER_ROLE = await assa.MINTER_ROLE();
    const BURNER_ROLE = await assa.BURNER_ROLE();
    const REVENUE_PROCESSOR_ROLE = await burner.REVENUE_PROCESSOR_ROLE();

    await assa.grantRole(MINTER_ROLE, admin.address);
    await assa.grantRole(BURNER_ROLE, await burner.getAddress());
    await burner.grantRole(REVENUE_PROCESSOR_ROLE, processor.address);

    // Fund accounts
    await assa.mint(alice.address, INITIAL_MINT);
    await assa.mint(bob.address, INITIAL_MINT);
    await assa.mint(await router.getAddress(), ethers.parseUnits("5000000", 18)); // Fund DEX pool

    await usdc.mint(processor.address, 100_000 * 10**6); // 100k USDC
  });

  describe("ASSAToken Utility Checks", () => {
    it("verify name, symbol, decimals, and cap", async () => {
      expect(await assa.name()).to.equal("ASSA WAVE");
      expect(await assa.symbol()).to.equal("ASSA");
      expect(await assa.decimals()).to.equal(18);
      expect(await assa.CAP()).to.equal(ethers.parseUnits("10000000000", 18));
    });

    it("respects standard minter cap", async () => {
      const CAP = await assa.CAP();
      const currentSupply = await assa.totalSupply();
      const amountToCap = CAP - currentSupply;

      await assa.mint(alice.address, amountToCap);
      expect(await assa.totalSupply()).to.equal(CAP);

      await expect(assa.mint(alice.address, 1n)).to.be.revertedWith("ASSAToken: cap exceeded");
    });
  });

  describe("StakingLock (veASSA) Locking Mechanisms", () => {
    it("lock transfers tokens to contract and starts linear decay", async () => {
      await assa.connect(alice).approve(await lockup.getAddress(), LOCK_AMOUNT);
      
      const tx = await lockup.connect(alice).lock(LOCK_AMOUNT, FOUR_YEARS);
      await expect(tx)
        .to.emit(lockup, "Locked")
        .withArgs(alice.address, LOCK_AMOUNT, await time.latest(), (await time.latest()) + FOUR_YEARS);

      const userLock = await lockup.locks(alice.address);
      expect(userLock.amount).to.equal(LOCK_AMOUNT);
      expect(await assa.balanceOf(alice.address)).to.equal(INITIAL_MINT - LOCK_AMOUNT);
      expect(await assa.balanceOf(await lockup.getAddress())).to.equal(LOCK_AMOUNT);

      // Voting power at block 0 is approximately lock_amount (due to MAX_LOCK_DURATION = 4 years)
      const vpStart = await lockup.votingPower(alice.address);
      expect(vpStart).to.be.closeTo(LOCK_AMOUNT, ethers.parseUnits("10", 18));

      // After 2 years, voting power should be approximately 50%
      await time.increase(2 * ONE_YEAR);
      const vpMid = await lockup.votingPower(alice.address);
      expect(vpMid).to.be.closeTo(LOCK_AMOUNT / 2n, ethers.parseUnits("10", 18));

      // After 4 years, voting power is exactly 0
      await time.increase(2 * ONE_YEAR);
      expect(await lockup.votingPower(alice.address)).to.equal(0n);
    });

    it("prevent locks shorter than 1 week or longer than 4 years", async () => {
      await assa.connect(alice).approve(await lockup.getAddress(), LOCK_AMOUNT);

      await expect(
        lockup.connect(alice).lock(LOCK_AMOUNT, 6 * 24 * 60 * 60) // 6 days
      ).to.be.revertedWith("StakingLock: lock duration below minimum");

      await expect(
        lockup.connect(alice).lock(LOCK_AMOUNT, FOUR_YEARS + 1)
      ).to.be.revertedWith("StakingLock: lock duration exceeds maximum");
    });

    it("withdraw fails before end, succeeds after end", async () => {
      await assa.connect(alice).approve(await lockup.getAddress(), LOCK_AMOUNT);
      await lockup.connect(alice).lock(LOCK_AMOUNT, ONE_YEAR);

      // Attempt immediate withdraw
      await expect(lockup.connect(alice).withdraw()).to.be.revertedWith("StakingLock: lock not yet expired");

      // Advance 1 year
      await time.increase(ONE_YEAR);

      // Succeeded withdraw
      const balBefore = await assa.balanceOf(alice.address);
      await expect(lockup.connect(alice).withdraw())
        .to.emit(lockup, "Withdrawn")
        .withArgs(alice.address, LOCK_AMOUNT);

      expect(await assa.balanceOf(alice.address)).to.equal(balBefore + LOCK_AMOUNT);
      const userLock = await lockup.locks(alice.address);
      expect(userLock.amount).to.equal(0n);
    });

    it("increaseAmount adds tokens to active lock position", async () => {
      await assa.connect(alice).approve(await lockup.getAddress(), LOCK_AMOUNT * 2n);
      await lockup.connect(alice).lock(LOCK_AMOUNT, ONE_YEAR);

      await expect(lockup.connect(alice).increaseAmount(LOCK_AMOUNT))
        .to.emit(lockup, "AmountIncreased")
        .withArgs(alice.address, LOCK_AMOUNT, LOCK_AMOUNT * 2n);

      const userLock = await lockup.locks(alice.address);
      expect(userLock.amount).to.equal(LOCK_AMOUNT * 2n);
    });

    it("increaseUnlockTime extends lockup deadline", async () => {
      await assa.connect(alice).approve(await lockup.getAddress(), LOCK_AMOUNT);
      await lockup.connect(alice).lock(LOCK_AMOUNT, ONE_YEAR);

      const userLockBefore = await lockup.locks(alice.address);
      const expectedNewEnd = Number(userLockBefore.end) + ONE_YEAR;

      await expect(lockup.connect(alice).increaseUnlockTime(ONE_YEAR))
        .to.emit(lockup, "UnlockTimeIncreased")
        .withArgs(alice.address, userLockBefore.end, expectedNewEnd);

      const userLockAfter = await lockup.locks(alice.address);
      expect(userLockAfter.end).to.equal(expectedNewEnd);
    });
  });

  describe("Governance & Multiplier Tier Weight Invariants", () => {
    it("determines tier levels correctly", async () => {
      await assa.connect(alice).approve(await lockup.getAddress(), ethers.MaxUint256);

      // Locked: 0 => Tier: NONE
      expect(await lockup.tierOf(alice.address)).to.equal(0n); // NONE

      // Lock 1,000 ASSA => BRONZE (threshold: 1,000)
      await lockup.connect(alice).lock(ethers.parseUnits("1000", 18), ONE_YEAR);
      expect(await lockup.tierOf(alice.address)).to.equal(1n); // BRONZE
      expect(await lockup.tierWeight(alice.address)).to.equal(110n); // 1.1x

      // Fast forward past expiration => NONE
      await time.increase(ONE_YEAR);
      expect(await lockup.tierOf(alice.address)).to.equal(0n);
      expect(await lockup.tierWeight(alice.address)).to.equal(100n); // 1.0x baseline
    });

    it("verifies higher tier boundaries", async () => {
      await assa.connect(alice).approve(await lockup.getAddress(), ethers.MaxUint256);
      await lockup.connect(alice).lock(ethers.parseUnits("10000", 18), ONE_YEAR);
      expect(await lockup.tierOf(alice.address)).to.equal(2n); // SILVER (threshold: 10k)
      expect(await lockup.tierWeight(alice.address)).to.equal(125n); // 1.25x

      await lockup.connect(alice).increaseAmount(ethers.parseUnits("90000", 18));
      expect(await lockup.tierOf(alice.address)).to.equal(3n); // GOLD (threshold: 100k)
      expect(await lockup.tierWeight(alice.address)).to.equal(150n); // 1.5x

      await lockup.connect(alice).increaseAmount(ethers.parseUnits("900000", 18));
      expect(await lockup.tierOf(alice.address)).to.equal(4n); // LEGEND (threshold: 1M)
      expect(await lockup.tierWeight(alice.address)).to.equal(200n); // 2.0x
    });

    it("strict negative invariant: no reward distribution channels", async () => {
      // Introspective check to prove no reward logic exists
      const abi = lockup.interface.fragments;
      const rewardKeywords = ["claimReward", "distribute", "yield", "rewardBalance", "apy", "interest"];
      
      for (const fragment of abi) {
        if (fragment.type === "function") {
          for (const keyword of rewardKeywords) {
            expect(fragment.name.toLowerCase()).to.not.contain(keyword.toLowerCase());
          }
        }
      }
    });
  });

  describe("BMEBurner Revenue Processing & Token Burning Pipeline", () => {
    it("processes USDC, performs DEX swap, and burns resulting $ASSA", async () => {
      const usdcAmt = 1_000 * 10**6; // 1,000 USDC
      // Swap rate is 10 ASSA per USDC (exchangeRate = 10 * 10^12)
      // Expect output = 1,000 * 10 = 10,000 ASSA
      const expectedBurn = ethers.parseUnits("10000", 18);

      await usdc.connect(processor).approve(await burner.getAddress(), usdcAmt);

      const supplyBefore = await assa.totalSupply();
      const burnerBalBefore = await assa.balanceOf(await burner.getAddress());

      const deadline = (await time.latest()) + 600;
      const tx = await burner.connect(processor).processRevenue(usdcAmt, expectedBurn, deadline);

      await expect(tx)
        .to.emit(burner, "RevenueProcessed")
        .withArgs(usdcAmt, expectedBurn, deadline);

      const supplyAfter = await assa.totalSupply();
      const burnerBalAfter = await assa.balanceOf(await burner.getAddress());

      // Supply must be reduced by exactly 10,000 ASSA
      expect(supplyBefore - supplyAfter).to.equal(expectedBurn);
      // Burner must hold 0 ASSA after swap-and-burn completion
      expect(burnerBalAfter).to.equal(burnerBalBefore);
    });

    it("reverts on slippage check violation", async () => {
      const usdcAmt = 1_000 * 10**6;
      const expectedBurn = ethers.parseUnits("10000", 18);
      const unrealisticSlippage = expectedBurn + 1n; // Slippage is slightly higher than actual output

      await usdc.connect(processor).approve(await burner.getAddress(), usdcAmt);

      const deadline = (await time.latest()) + 600;
      await expect(
        burner.connect(processor).processRevenue(usdcAmt, unrealisticSlippage, deadline)
      ).to.be.revertedWith("MockDexRouter: slippage limit exceeded");
    });
  });
});
