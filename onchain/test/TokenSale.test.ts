import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { ASSAToken, TokenSale, MockUSDC } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

const MONTH = 30 * 24 * 60 * 60;

describe("TokenSale — 3-round fixed-price USDC sale + self-vesting", () => {
  let assa: ASSAToken;
  let usdc: MockUSDC;
  let sale: TokenSale;
  let admin: HardhatEthersSigner;
  let treasury: HardhatEthersSigner;
  let alice: HardhatEthersSigner;
  let bob: HardhatEthersSigner;

  const SALE_FUND = ethers.parseUnits("50000000", 18); // 50M ASSA to the sale
  const PRICE = 50_000n; // 0.05 USDC per ASSA (6dec) → 1000 ASSA = 50 USDC

  async function openRound(opts?: { tgeBps?: number; cliff?: number; vest?: number; cap?: bigint }) {
    const now = await time.latest();
    await sale.configureRound(
      0,
      "Private R1",
      PRICE,
      opts?.cap ?? ethers.parseUnits("10000000", 18),
      now,
      now + 30 * MONTH,
      opts?.cliff ?? 0,
      opts?.vest ?? 6 * MONTH,
      opts?.tgeBps ?? 1000,
      true
    );
  }

  beforeEach(async () => {
    [admin, treasury, alice, bob] = await ethers.getSigners();
    assa = await (await ethers.getContractFactory("ASSAToken")).deploy(admin.address);
    usdc = (await (await ethers.getContractFactory("MockUSDC")).deploy()) as unknown as MockUSDC;
    sale = await (await ethers.getContractFactory("TokenSale")).deploy(
      await assa.getAddress(),
      await usdc.getAddress(),
      treasury.address,
      admin.address
    );
    await assa.mint(await sale.getAddress(), SALE_FUND);
    await usdc.mint(alice.address, 1_000_000 * 10 ** 6);
    await usdc.mint(bob.address, 1_000_000 * 10 ** 6);
  });

  it("purchase pulls USDC to treasury, records allocation, enforces whitelist", async () => {
    await openRound();
    const buyAmt = ethers.parseUnits("1000", 18);

    // not whitelisted → revert
    await usdc.connect(alice).approve(await sale.getAddress(), 50 * 10 ** 6);
    await expect(sale.connect(alice).purchase(0, buyAmt)).to.be.revertedWith("Sale: not whitelisted");

    await sale.setWhitelist(0, [alice.address], true);

    const tBefore = await usdc.balanceOf(treasury.address);
    await expect(sale.connect(alice).purchase(0, buyAmt))
      .to.emit(sale, "Purchased")
      .withArgs(0, alice.address, buyAmt, 50n * 10n ** 6n);

    // 50 USDC went straight to treasury
    expect((await usdc.balanceOf(treasury.address)) - tBefore).to.equal(50n * 10n ** 6n);
    const round = await sale.getRound(0);
    expect(round.soldTokens).to.equal(buyAmt);
  });

  it("enforces round hard cap", async () => {
    await openRound({ cap: ethers.parseUnits("1500", 18) });
    await sale.setWhitelist(0, [alice.address], true);
    await usdc.connect(alice).approve(await sale.getAddress(), 1_000_000 * 10 ** 6);

    await sale.connect(alice).purchase(0, ethers.parseUnits("1000", 18));
    await expect(
      sale.connect(alice).purchase(0, ethers.parseUnits("600", 18))
    ).to.be.revertedWith("Sale: exceeds round cap");
  });

  it("claim follows TGE + linear schedule and never exceeds allocation", async () => {
    await openRound({ tgeBps: 1000, cliff: 0, vest: 6 * MONTH });
    await sale.setWhitelist(0, [alice.address], true);
    await usdc.connect(alice).approve(await sale.getAddress(), 1_000_000 * 10 ** 6);

    const buyAmt = ethers.parseUnits("10000", 18);
    await sale.connect(alice).purchase(0, buyAmt);
    const start = await time.latest();

    // TGE 10% immediately claimable
    expect(await sale.claimable(0, alice.address)).to.be.closeTo(buyAmt / 10n, ethers.parseUnits("2", 18));

    // claim TGE
    await sale.connect(alice).claim(0);
    expect(await assa.balanceOf(alice.address)).to.be.closeTo(buyAmt / 10n, ethers.parseUnits("5", 18));

    // end → full allocation claimed in total
    await time.increaseTo(start + 6 * MONTH + 1);
    await sale.connect(alice).claim(0);
    expect(await assa.balanceOf(alice.address)).to.equal(buyAmt);
    await expect(sale.connect(alice).claim(0)).to.be.revertedWith("Sale: nothing claimable");
  });

  it("pause blocks purchase but never blocks claim", async () => {
    await openRound({ tgeBps: 2000 });
    await sale.setWhitelist(0, [alice.address], true);
    await usdc.connect(alice).approve(await sale.getAddress(), 1_000_000 * 10 ** 6);
    await sale.connect(alice).purchase(0, ethers.parseUnits("1000", 18));

    await sale.pause();
    await expect(sale.connect(alice).purchase(0, ethers.parseUnits("1", 18))).to.be.revertedWithCustomError(sale, "EnforcedPause");
    // claim still works while paused (TGE portion available)
    await sale.connect(alice).claim(0);
    expect(await assa.balanceOf(alice.address)).to.be.gt(0n);
  });

  it("price freeze: cannot reconfigure a round after it has sold", async () => {
    await openRound();
    await sale.setWhitelist(0, [alice.address], true);
    await usdc.connect(alice).approve(await sale.getAddress(), 1_000_000 * 10 ** 6);
    await sale.connect(alice).purchase(0, ethers.parseUnits("1000", 18));

    const now = await time.latest();
    await expect(
      sale.configureRound(0, "R1", 99_999n, ethers.parseUnits("1", 18), now, now + MONTH, 0, MONTH, 0, true)
    ).to.be.revertedWith("Sale: round frozen (sold>0)");
  });

  it("quoteUsdc matches charged amount", async () => {
    await openRound();
    expect(await sale.quoteUsdc(0, ethers.parseUnits("2000", 18))).to.equal(100n * 10n ** 6n);
  });

  it("rejects purchase outside the active window", async () => {
    const now = await time.latest();
    await sale.configureRound(0, "Future", PRICE, ethers.parseUnits("1000", 18), now + MONTH, now + 2 * MONTH, 0, MONTH, 0, true);
    await sale.setWhitelist(0, [alice.address], true);
    await usdc.connect(alice).approve(await sale.getAddress(), 1_000_000 * 10 ** 6);
    await expect(sale.connect(alice).purchase(0, ethers.parseUnits("10", 18))).to.be.revertedWith("Sale: round closed");
  });
});
