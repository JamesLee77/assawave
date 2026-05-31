import { expect } from "chai";
import { ethers } from "hardhat";
import { ASSAToken, Treasury } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("Treasury — role-gated vault with bucket accounting", () => {
  let assa: ASSAToken;
  let treasury: Treasury;
  let admin: HardhatEthersSigner;
  let spender: HardhatEthersSigner;
  let alice: HardhatEthersSigner;

  const FUND = ethers.parseUnits("10000000", 18);
  const ECO = ethers.id("ECOSYSTEM");

  beforeEach(async () => {
    [admin, spender, alice] = await ethers.getSigners();
    assa = await (await ethers.getContractFactory("ASSAToken")).deploy(admin.address);
    treasury = await (await ethers.getContractFactory("Treasury")).deploy(admin.address);
    await assa.mint(await treasury.getAddress(), FUND);
  });

  it("withdraw against a bucket is capped by its allocation", async () => {
    await treasury.setBucketAllocation(ECO, ethers.parseUnits("1000000", 18));

    await expect(
      treasury.withdraw(ECO, await assa.getAddress(), alice.address, ethers.parseUnits("600000", 18))
    )
      .to.emit(treasury, "Withdrawn")
      .withArgs(ECO, await assa.getAddress(), alice.address, ethers.parseUnits("600000", 18));

    expect(await treasury.released(ECO)).to.equal(ethers.parseUnits("600000", 18));
    expect(await treasury.bucketRemaining(ECO)).to.equal(ethers.parseUnits("400000", 18));

    // exceeding the bucket cap reverts
    await expect(
      treasury.withdraw(ECO, await assa.getAddress(), alice.address, ethers.parseUnits("500000", 18))
    ).to.be.revertedWith("Treasury: exceeds bucket");
  });

  it("cannot set allocation below already-released", async () => {
    await treasury.setBucketAllocation(ECO, ethers.parseUnits("1000000", 18));
    await treasury.withdraw(ECO, await assa.getAddress(), alice.address, ethers.parseUnits("700000", 18));
    await expect(treasury.setBucketAllocation(ECO, ethers.parseUnits("600000", 18))).to.be.revertedWith(
      "Treasury: below released"
    );
  });

  it("unbucketed withdraw (bucket=0) skips the cap check", async () => {
    await treasury.withdraw(ethers.ZeroHash, await assa.getAddress(), alice.address, FUND);
    expect(await assa.balanceOf(alice.address)).to.equal(FUND);
  });

  it("only TREASURY_ROLE can withdraw; admin can grant", async () => {
    await expect(
      treasury.connect(spender).withdraw(ethers.ZeroHash, await assa.getAddress(), alice.address, 1n)
    ).to.be.revertedWithCustomError(treasury, "AccessControlUnauthorizedAccount");

    await treasury.grantRole(await treasury.TREASURY_ROLE(), spender.address);
    await treasury.connect(spender).withdraw(ethers.ZeroHash, await assa.getAddress(), alice.address, 1n);
    expect(await assa.balanceOf(alice.address)).to.equal(1n);
  });
});
