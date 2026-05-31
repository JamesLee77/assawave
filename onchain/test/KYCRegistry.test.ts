import { expect } from "chai";
import { ethers } from "hardhat";
import { KYCRegistry } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("KYCRegistry", () => {
  let kyc: KYCRegistry;
  let admin: HardhatEthersSigner;
  let operator: HardhatEthersSigner;
  let alice: HardhatEthersSigner;
  let bob: HardhatEthersSigner;

  beforeEach(async () => {
    [admin, operator, alice, bob] = await ethers.getSigners();
    kyc = await (await ethers.getContractFactory("KYCRegistry")).deploy(admin.address);
  });

  it("operator can approve and revoke; count stays accurate", async () => {
    expect(await kyc.isKYCed(alice.address)).to.equal(false);
    await expect(kyc.setKYCed(alice.address, true))
      .to.emit(kyc, "KYCStatusChanged")
      .withArgs(alice.address, true, admin.address);
    expect(await kyc.isKYCed(alice.address)).to.equal(true);
    expect(await kyc.kycedCount()).to.equal(1n);

    // idempotent: re-approving is a no-op (count unchanged)
    await kyc.setKYCed(alice.address, true);
    expect(await kyc.kycedCount()).to.equal(1n);

    await kyc.setKYCed(alice.address, false);
    expect(await kyc.isKYCed(alice.address)).to.equal(false);
    expect(await kyc.kycedCount()).to.equal(0n);
  });

  it("batch approve sets many and counts correctly", async () => {
    await kyc.setKYCedBatch([alice.address, bob.address], true);
    expect(await kyc.isKYCed(alice.address)).to.equal(true);
    expect(await kyc.isKYCed(bob.address)).to.equal(true);
    expect(await kyc.kycedCount()).to.equal(2n);
  });

  it("only KYC_OPERATOR_ROLE may write", async () => {
    await expect(kyc.connect(alice).setKYCed(bob.address, true)).to.be.revertedWithCustomError(
      kyc,
      "AccessControlUnauthorizedAccount"
    );
    const role = await kyc.KYC_OPERATOR_ROLE();
    await kyc.grantRole(role, operator.address);
    await kyc.connect(operator).setKYCed(bob.address, true);
    expect(await kyc.isKYCed(bob.address)).to.equal(true);
  });

  it("rejects zero address", async () => {
    await expect(kyc.setKYCed(ethers.ZeroAddress, true)).to.be.revertedWith("KYC: account zero");
  });
});
