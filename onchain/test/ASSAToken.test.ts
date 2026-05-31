import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { ASSAToken, MockUSDC } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

/**
 * Focused unit suite for the $ASSA token itself — fills the negative/revert and
 * EIP-2612 permit paths not exercised by the integration tests, and pins the
 * token's security-relevant behavior before mainnet deploy.
 */
describe("ASSAToken — token unit & security paths", () => {
  let assa: ASSAToken;
  let admin: HardhatEthersSigner;
  let alice: HardhatEthersSigner;
  let bob: HardhatEthersSigner;

  const ONE = ethers.parseUnits("1", 18);

  beforeEach(async () => {
    [admin, alice, bob] = await ethers.getSigners();
    assa = await (await ethers.getContractFactory("ASSAToken")).deploy(admin.address);
  });

  describe("metadata & cap", () => {
    it("exposes correct name/symbol/decimals and a 10B hard cap", async () => {
      expect(await assa.name()).to.equal("ASSA WAVE");
      expect(await assa.symbol()).to.equal("ASSA");
      expect(await assa.decimals()).to.equal(18);
      expect(await assa.CAP()).to.equal(ethers.parseUnits("10000000000", 18));
      expect(await assa.totalSupply()).to.equal(0n); // no premint
    });
  });

  describe("constructor", () => {
    it("reverts when admin is the zero address", async () => {
      const factory = await ethers.getContractFactory("ASSAToken");
      await expect(factory.deploy(ethers.ZeroAddress)).to.be.revertedWith("ASSAToken: admin zero");
    });

    it("grants ADMIN + MINTER + BURNER to the admin only", async () => {
      const ADMIN = await assa.DEFAULT_ADMIN_ROLE();
      const MINTER = await assa.MINTER_ROLE();
      const BURNER = await assa.BURNER_ROLE();
      expect(await assa.hasRole(ADMIN, admin.address)).to.equal(true);
      expect(await assa.hasRole(MINTER, admin.address)).to.equal(true);
      expect(await assa.hasRole(BURNER, admin.address)).to.equal(true);
      // a non-admin holds nothing
      expect(await assa.hasRole(MINTER, alice.address)).to.equal(false);
      expect(await assa.hasRole(BURNER, alice.address)).to.equal(false);
    });
  });

  describe("mint authorization", () => {
    it("MINTER can mint within the cap", async () => {
      await assa.mint(alice.address, ethers.parseUnits("100", 18));
      expect(await assa.balanceOf(alice.address)).to.equal(ethers.parseUnits("100", 18));
    });

    it("a non-MINTER cannot mint", async () => {
      await expect(
        assa.connect(alice).mint(alice.address, ONE)
      ).to.be.revertedWithCustomError(assa, "AccessControlUnauthorizedAccount");
    });

    it("minting past the 10B cap reverts with the cap message", async () => {
      const CAP = await assa.CAP();
      await assa.mint(admin.address, CAP); // fill to cap
      await expect(assa.mint(admin.address, 1n)).to.be.revertedWith("ASSAToken: cap exceeded");
    });
  });

  describe("burning", () => {
    it("an EOA can burn its own balance via ERC20Burnable.burn", async () => {
      await assa.mint(alice.address, ethers.parseUnits("100", 18));
      await assa.connect(alice).burn(ethers.parseUnits("40", 18));
      expect(await assa.balanceOf(alice.address)).to.equal(ethers.parseUnits("60", 18));
      expect(await assa.totalSupply()).to.equal(ethers.parseUnits("60", 18));
    });

    it("burnFrom is role-gated and bypasses allowance (BURNER can burn any holder)", async () => {
      await assa.mint(alice.address, ethers.parseUnits("100", 18));
      const BURNER = await assa.BURNER_ROLE();
      await assa.grantRole(BURNER, bob.address);

      // bob holds ZERO allowance from alice, yet (as BURNER) can burn her tokens.
      expect(await assa.allowance(alice.address, bob.address)).to.equal(0n);
      await assa.connect(bob).burnFrom(alice.address, ethers.parseUnits("100", 18));
      expect(await assa.balanceOf(alice.address)).to.equal(0n);
    });

    it("a non-BURNER cannot burnFrom even with a full allowance", async () => {
      await assa.mint(alice.address, ethers.parseUnits("100", 18));
      await assa.connect(alice).approve(bob.address, ethers.MaxUint256);
      await expect(
        assa.connect(bob).burnFrom(alice.address, ONE)
      ).to.be.revertedWithCustomError(assa, "AccessControlUnauthorizedAccount");
    });
  });

  describe("recoverERC20", () => {
    let usdc: MockUSDC;
    beforeEach(async () => {
      usdc = (await (await ethers.getContractFactory("MockUSDC")).deploy()) as unknown as MockUSDC;
      await usdc.mint(await assa.getAddress(), 1_000n * 10n ** 6n);
    });

    it("a non-admin cannot recover stray tokens", async () => {
      await expect(
        assa.connect(alice).recoverERC20(await usdc.getAddress(), alice.address, 1n)
      ).to.be.revertedWithCustomError(assa, "AccessControlUnauthorizedAccount");
    });

    it("admin recovers stray tokens to a recipient", async () => {
      await assa.recoverERC20(await usdc.getAddress(), bob.address, 1_000n * 10n ** 6n);
      expect(await usdc.balanceOf(bob.address)).to.equal(1_000n * 10n ** 6n);
    });
  });

  describe("EIP-2612 permit", () => {
    async function signPermit(
      owner: HardhatEthersSigner,
      spender: string,
      value: bigint,
      deadline: bigint
    ) {
      const net = await ethers.provider.getNetwork();
      const domain = {
        name: "ASSA WAVE",
        version: "1",
        chainId: net.chainId,
        verifyingContract: await assa.getAddress(),
      };
      const types = {
        Permit: [
          { name: "owner", type: "address" },
          { name: "spender", type: "address" },
          { name: "value", type: "uint256" },
          { name: "nonce", type: "uint256" },
          { name: "deadline", type: "uint256" },
        ],
      };
      const nonce = await assa.nonces(owner.address);
      const sig = await owner.signTypedData(domain, types, {
        owner: owner.address,
        spender,
        value,
        nonce,
        deadline,
      });
      return ethers.Signature.from(sig);
    }

    it("sets allowance from a signed permit and increments the nonce", async () => {
      const value = ethers.parseUnits("250", 18);
      const deadline = BigInt(await time.latest()) + 3600n;
      expect(await assa.nonces(alice.address)).to.equal(0n);

      const { v, r, s } = await signPermit(alice, bob.address, value, deadline);
      await assa.permit(alice.address, bob.address, value, deadline, v, r, s);

      expect(await assa.allowance(alice.address, bob.address)).to.equal(value);
      expect(await assa.nonces(alice.address)).to.equal(1n);
    });

    it("rejects an expired permit", async () => {
      const value = ethers.parseUnits("10", 18);
      const deadline = BigInt(await time.latest()) - 1n; // already expired
      const { v, r, s } = await signPermit(alice, bob.address, value, deadline);
      await expect(
        assa.permit(alice.address, bob.address, value, deadline, v, r, s)
      ).to.be.revertedWithCustomError(assa, "ERC2612ExpiredSignature");
    });

    it("rejects a permit whose signer is not the owner", async () => {
      const value = ethers.parseUnits("10", 18);
      const deadline = BigInt(await time.latest()) + 3600n;
      // bob signs but we claim alice is the owner → invalid signer
      const { v, r, s } = await signPermit(bob, bob.address, value, deadline);
      await expect(
        assa.permit(alice.address, bob.address, value, deadline, v, r, s)
      ).to.be.revertedWithCustomError(assa, "ERC2612InvalidSigner");
    });
  });

  describe("ERC20Votes history", () => {
    it("records past votes and past total supply after delegation", async () => {
      const amt = ethers.parseUnits("1000", 18);
      await assa.mint(alice.address, amt);
      await assa.connect(alice).delegate(alice.address);

      const bn = await ethers.provider.getBlockNumber();
      await ethers.provider.send("evm_mine", []); // make `bn` a past block

      expect(await assa.getVotes(alice.address)).to.equal(amt);
      expect(await assa.getPastVotes(alice.address, bn)).to.equal(amt);
      expect(await assa.getPastTotalSupply(bn)).to.equal(amt);
    });
  });
});
