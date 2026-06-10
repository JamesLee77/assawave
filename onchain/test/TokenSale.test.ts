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

  it("price freeze: a LIVE round cannot be reconfigured after it has sold; deactivating unlocks a correction", async () => {
    await openRound();
    await sale.setWhitelist(0, [alice.address, bob.address], true);
    await usdc.connect(alice).approve(await sale.getAddress(), 1_000_000 * 10 ** 6);
    await usdc.connect(bob).approve(await sale.getAddress(), 1_000_000 * 10 ** 6);
    await sale.connect(alice).purchase(0, ethers.parseUnits("1000", 18));

    const now = await time.latest();
    // active + sold → frozen (a buyer making soldTokens>0 must not lock in a misconfig forever)
    await expect(
      sale.configureRound(0, "R1", 99_999n, ethers.parseUnits("2000", 18), now, now + MONTH, 0, MONTH, 0, true)
    ).to.be.revertedWith("Sale: deactivate to reconfigure");

    // deactivate → correction allowed, but the cap can never drop below what was sold
    await expect(sale.setRoundActive(0, false)).to.emit(sale, "RoundActiveSet").withArgs(0, false);
    await expect(
      sale.configureRound(0, "R1", 99_999n, ethers.parseUnits("500", 18), now, now + MONTH, 0, MONTH, 0, true)
    ).to.be.revertedWith("Sale: cap below sold");
    await sale.configureRound(0, "R1 fixed", 99_999n, ethers.parseUnits("2000", 18), now, now + MONTH, 0, MONTH, 0, true);

    // existing buyer's allocation terms were frozen at purchase — untouched by the reconfigure
    const a = await sale.allocations(0, alice.address);
    expect(a.totalAllocated).to.equal(ethers.parseUnits("1000", 18));

    // soldTokens survives; the corrected price applies to new purchases
    await expect(sale.connect(bob).purchase(0, ethers.parseUnits("100", 18)))
      .to.emit(sale, "Purchased")
      .withArgs(0, bob.address, ethers.parseUnits("100", 18), 9_999_900n);
    expect((await sale.getRound(0)).soldTokens).to.equal(ethers.parseUnits("1100", 18));
  });

  it("a late same-round top-up cannot inherit the first purchase's elapsed vesting time", async () => {
    await openRound({ tgeBps: 0, cliff: 0, vest: 6 * MONTH });
    await sale.setWhitelist(0, [alice.address], true);
    await usdc.connect(alice).approve(await sale.getAddress(), ethers.MaxUint256);

    // dust purchase at round open froze the clock under the old design
    await sale.connect(alice).purchase(0, ethers.parseUnits("1", 18));
    await time.increase(12 * MONTH); // well past the 6-month linear window

    const big = ethers.parseUnits("10000", 18);
    await sale.connect(alice).purchase(0, big);

    // pre-fix: the whole 10001 was instantly claimable. With the weighted-average
    // re-anchor only the dust's value-time survives (≈2 ASSA here).
    expect(await sale.claimable(0, alice.address)).to.be.lt(ethers.parseUnits("11", 18));
  });

  it("claim never underflows after a top-up re-anchor: claimable floors at zero until the curve catches up", async () => {
    await openRound({ tgeBps: 0, cliff: 6 * MONTH, vest: 6 * MONTH });
    await sale.setWhitelist(0, [alice.address], true);
    await usdc.connect(alice).approve(await sale.getAddress(), ethers.MaxUint256);

    await sale.connect(alice).purchase(0, ethers.parseUnits("1000", 18));
    // fully vest the first tranche and claim it all
    await time.increase(12 * MONTH + 60);
    await sale.connect(alice).claim(0);
    expect(await assa.balanceOf(alice.address)).to.equal(ethers.parseUnits("1000", 18));

    // top-up: the re-anchored merged curve now lags what was already claimed
    await sale.connect(alice).purchase(0, ethers.parseUnits("1000", 18));
    expect(await sale.claimable(0, alice.address)).to.equal(0n); // must NOT revert
    await expect(sale.connect(alice).claim(0)).to.be.revertedWith("Sale: nothing claimable");

    // once the merged curve passes the claimed amount, claiming resumes; never exceeds allocation
    await time.increase(12 * MONTH);
    await sale.connect(alice).claim(0);
    expect(await assa.balanceOf(alice.address)).to.equal(ethers.parseUnits("2000", 18));
  });

  it("purchase reverts when the sale is not funded to cover all obligations", async () => {
    const sale2 = (await (await ethers.getContractFactory("TokenSale")).deploy(
      await assa.getAddress(),
      await usdc.getAddress(),
      treasury.address,
      admin.address
    )) as unknown as TokenSale;
    const now = await time.latest();
    await sale2.configureRound(0, "R", PRICE, ethers.parseUnits("10000", 18), now, now + MONTH, 0, MONTH, 0, true);
    await sale2.setWhitelist(0, [alice.address], true);
    await usdc.connect(alice).approve(await sale2.getAddress(), ethers.MaxUint256);

    // unfunded sale: USDC must not leave the buyer for unbacked allocations
    await expect(
      sale2.connect(alice).purchase(0, ethers.parseUnits("1000", 18))
    ).to.be.revertedWith("Sale: insufficient inventory");

    // fund exactly 1000 → covered purchase succeeds, the next one fails again
    await assa.mint(await sale2.getAddress(), ethers.parseUnits("1000", 18));
    await sale2.connect(alice).purchase(0, ethers.parseUnits("1000", 18));
    await expect(
      sale2.connect(alice).purchase(0, ethers.parseUnits("1", 18))
    ).to.be.revertedWith("Sale: insufficient inventory");
  });

  it("weighted-average re-anchor matches the exact formula across successive top-ups", async () => {
    await openRound({ tgeBps: 0, cliff: 0, vest: 6 * MONTH });
    await sale.setWhitelist(0, [alice.address], true);
    await usdc.connect(alice).approve(await sale.getAddress(), ethers.MaxUint256);

    const buys: Array<{ amt: bigint; ts: bigint }> = [];
    async function buy(amtWhole: number, jump: number) {
      if (jump > 0) await time.increase(jump);
      const amt = ethers.parseUnits(String(amtWhole), 18);
      await sale.connect(alice).purchase(0, amt);
      buys.push({ amt, ts: BigInt(await time.latest()) });
    }

    await buy(100, 0);
    await buy(200, MONTH); // top-up #1
    await buy(700, 2 * MONTH); // top-up #2

    // mirror the contract: iterated floor-division weighted average
    let start = buys[0].ts;
    let prev = buys[0].amt;
    for (let i = 1; i < buys.length; i++) {
      start = (start * prev + buys[i].ts * buys[i].amt) / (prev + buys[i].amt);
      prev += buys[i].amt;
    }

    const a = await sale.allocations(0, alice.address);
    expect(a.startTime).to.equal(start);
    expect(a.totalAllocated).to.equal(prev);
  });

  it("setRoundActive / setMaxPerBuyer reject an out-of-range roundId", async () => {
    await expect(sale.setRoundActive(99, true)).to.be.revertedWith("Sale: bad roundId");
    await expect(sale.setMaxPerBuyer(99, 1n)).to.be.revertedWith("Sale: bad roundId");
  });

  it("per-buyer cap bounds cumulative purchases when set", async () => {
    await openRound();
    await sale.setWhitelist(0, [alice.address], true);
    await usdc.connect(alice).approve(await sale.getAddress(), ethers.MaxUint256);

    await expect(sale.connect(alice).setMaxPerBuyer(0, 1n)).to.be.revertedWithCustomError(
      sale,
      "AccessControlUnauthorizedAccount"
    );

    await expect(sale.setMaxPerBuyer(0, ethers.parseUnits("1000", 18)))
      .to.emit(sale, "MaxPerBuyerSet")
      .withArgs(0, ethers.parseUnits("1000", 18));

    await sale.connect(alice).purchase(0, ethers.parseUnits("600", 18));
    await expect(
      sale.connect(alice).purchase(0, ethers.parseUnits("500", 18))
    ).to.be.revertedWith("Sale: exceeds buyer cap");
    await sale.connect(alice).purchase(0, ethers.parseUnits("400", 18)); // exactly at the cap
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
