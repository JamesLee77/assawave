import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { ASSAToken, TokenSale, TokenVesting, Treasury, ASSATimelock, MockUSDC } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

const MONTH = 30 * 24 * 60 * 60;

describe("Edge cases & admin paths", () => {
  let admin: HardhatEthersSigner;
  let alice: HardhatEthersSigner;
  let bob: HardhatEthersSigner;

  beforeEach(async () => {
    [admin, alice, bob] = await ethers.getSigners();
  });

  describe("ASSAToken", () => {
    let assa: ASSAToken;
    beforeEach(async () => {
      assa = await (await ethers.getContractFactory("ASSAToken")).deploy(admin.address);
    });

    it("burnFrom honors allowances (no role can bypass)", async () => {
      await assa.mint(alice.address, ethers.parseUnits("100", 18));
      await assa.connect(alice).approve(bob.address, ethers.parseUnits("40", 18));
      await assa.connect(bob).burnFrom(alice.address, ethers.parseUnits("40", 18));
      expect(await assa.balanceOf(alice.address)).to.equal(ethers.parseUnits("60", 18));

      // allowance exhausted → any further burnFrom reverts
      await expect(assa.connect(bob).burnFrom(alice.address, 1n)).to.be.revertedWithCustomError(
        assa,
        "ERC20InsufficientAllowance"
      );
    });

    it("recoverERC20 rescues stray tokens but not self", async () => {
      const usdc = (await (await ethers.getContractFactory("MockUSDC")).deploy()) as unknown as MockUSDC;
      await usdc.mint(await assa.getAddress(), 1_000 * 10 ** 6);
      await assa.recoverERC20(await usdc.getAddress(), bob.address, 1_000 * 10 ** 6);
      expect(await usdc.balanceOf(bob.address)).to.equal(1_000n * 10n ** 6n);

      await expect(assa.recoverERC20(await assa.getAddress(), bob.address, 1n)).to.be.revertedWith(
        "ASSAToken: cannot recover self"
      );
      await expect(assa.recoverERC20(await usdc.getAddress(), ethers.ZeroAddress, 1n)).to.be.revertedWith(
        "ASSAToken: to zero"
      );
    });

    it("delegation enables ERC20Votes vote weight", async () => {
      await assa.mint(alice.address, ethers.parseUnits("1000", 18));
      await assa.connect(alice).delegate(alice.address);
      expect(await assa.getVotes(alice.address)).to.equal(ethers.parseUnits("1000", 18));
    });
  });

  describe("ASSATimelock", () => {
    it("deploys on local chain with relaxed delay and exposes 48h floor constant", async () => {
      const tl = (await (await ethers.getContractFactory("ASSATimelock")).deploy(
        60, // 60s, allowed on hardhat (chainId 31337)
        [admin.address],
        [admin.address],
        admin.address
      )) as unknown as ASSATimelock;
      expect(await tl.MIN_DELAY_FLOOR()).to.equal(48n * 60n * 60n);
      expect(await tl.getMinDelay()).to.equal(60n);
    });
  });

  describe("TokenSale admin", () => {
    let assa: ASSAToken;
    let usdc: MockUSDC;
    let sale: TokenSale;
    beforeEach(async () => {
      assa = await (await ethers.getContractFactory("ASSAToken")).deploy(admin.address);
      usdc = (await (await ethers.getContractFactory("MockUSDC")).deploy()) as unknown as MockUSDC;
      sale = await (await ethers.getContractFactory("TokenSale")).deploy(
        await assa.getAddress(),
        await usdc.getAddress(),
        admin.address,
        admin.address
      );
    });

    it("setRoundActive toggles; setTreasury updates recipient", async () => {
      const now = await time.latest();
      await sale.configureRound(0, "R", 50_000n, ethers.parseUnits("1000", 18), now, now + MONTH, 0, MONTH, 0, true);
      await sale.setRoundActive(0, false);
      expect((await sale.getRound(0)).active).to.equal(false);

      await expect(sale.setTreasury(bob.address)).to.emit(sale, "TreasuryUpdated");
      expect(await sale.treasury()).to.equal(bob.address);
    });

    it("rejects dust purchases that round USDC cost to zero", async () => {
      const now = await time.latest();
      await sale.configureRound(0, "R", 50_000n, ethers.parseUnits("1000", 18), now, now + MONTH, 0, MONTH, 0, true);
      await sale.setWhitelist(0, [alice.address], true);
      await assa.mint(await sale.getAddress(), ethers.parseUnits("1000", 18));
      await usdc.mint(alice.address, 1_000_000);
      await usdc.connect(alice).approve(await sale.getAddress(), ethers.MaxUint256);
      // 1 wei of ASSA → cost = 1*50000/1e18 = 0 → dust
      await expect(sale.connect(alice).purchase(0, 1n)).to.be.revertedWith("Sale: dust amount");
    });

    it("recoverERC20 only returns ASSA surplus above buyer obligations", async () => {
      const now = await time.latest();
      await sale.configureRound(0, "R", 50_000n, ethers.parseUnits("10000", 18), now, now + MONTH, 0, MONTH, 0, true);
      await sale.setWhitelist(0, [alice.address], true);
      await assa.mint(await sale.getAddress(), ethers.parseUnits("10000", 18));
      await usdc.mint(alice.address, 1_000_000_000);
      await usdc.connect(alice).approve(await sale.getAddress(), ethers.MaxUint256);
      await sale.connect(alice).purchase(0, ethers.parseUnits("1000", 18)); // owes 1000

      // surplus = 10000 - 1000 = 9000
      await expect(
        sale.recoverERC20(await assa.getAddress(), bob.address, ethers.parseUnits("9001", 18))
      ).to.be.revertedWith("Sale: exceeds surplus");
      await sale.recoverERC20(await assa.getAddress(), bob.address, ethers.parseUnits("9000", 18));
      expect(await assa.balanceOf(bob.address)).to.equal(ethers.parseUnits("9000", 18));
    });
  });

  describe("TokenVesting recover (non-ASSA)", () => {
    it("recovers an unrelated token fully", async () => {
      const assa = await (await ethers.getContractFactory("ASSAToken")).deploy(admin.address);
      const vesting = (await (await ethers.getContractFactory("TokenVesting")).deploy(
        await assa.getAddress(),
        admin.address
      )) as unknown as TokenVesting;
      const usdc = (await (await ethers.getContractFactory("MockUSDC")).deploy()) as unknown as MockUSDC;
      await usdc.mint(await vesting.getAddress(), 500 * 10 ** 6);
      await vesting.recoverERC20(await usdc.getAddress(), bob.address, 500 * 10 ** 6);
      expect(await usdc.balanceOf(bob.address)).to.equal(500n * 10n ** 6n);
    });
  });

  describe("Treasury recover", () => {
    it("admin recover escape hatch works", async () => {
      const assa = await (await ethers.getContractFactory("ASSAToken")).deploy(admin.address);
      const treasury = (await (await ethers.getContractFactory("Treasury")).deploy(admin.address)) as unknown as Treasury;
      await assa.mint(await treasury.getAddress(), ethers.parseUnits("100", 18));
      await treasury.recover(await assa.getAddress(), bob.address, ethers.parseUnits("100", 18));
      expect(await assa.balanceOf(bob.address)).to.equal(ethers.parseUnits("100", 18));
    });
  });
});
