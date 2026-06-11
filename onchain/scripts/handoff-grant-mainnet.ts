/**
 * Mainnet handoff — GRANT step ONLY (additive, reversible; deployer keeps its roles).
 *
 *   npx hardhat run scripts/handoff-grant-mainnet.ts --network base
 *
 * Grants DEFAULT_ADMIN + MINTER on the live v2 ASSAToken to the Safe. It NEVER
 * renounces — the deployer stays in full control until a human verifies the Safe
 * can actually sign 2-of-3 and then renounces (ADMIN last) via Basescan.
 *
 * Guards: chainId 8453, signer == registry deployer (the funded admin EOA),
 * deployer currently holds ADMIN (pre-gate), Safe address has code. Idempotent:
 * a role already held by the Safe is skipped. Explicit nonce sequencing for the
 * public Base RPC.
 */
import { ethers, network } from "hardhat";
import { loadRegistry } from "./lib";

async function main() {
  console.log(`\n=== Mainnet handoff GRANT (${network.name}) ===`);
  const net = await ethers.provider.getNetwork();
  if (net.chainId !== 8453n) throw new Error(`expected Base mainnet 8453, got ${net.chainId}`);

  const reg = loadRegistry();
  const token = reg.contracts.ASSAToken;
  const safe = (process.env.SAFE_ADDRESS || reg.contracts.Safe || "").trim();
  if (!token) throw new Error("no ASSAToken in registry");
  if (!ethers.isAddress(safe)) throw new Error("no valid Safe address (set SAFE_ADDRESS or registry.Safe)");

  const [deployer] = await ethers.getSigners();
  if (deployer.address.toLowerCase() !== reg.deployer.toLowerCase()) {
    throw new Error(`signer ${deployer.address} != registry deployer ${reg.deployer} — wrong key`);
  }
  if ((await ethers.provider.getCode(safe)) === "0x") {
    throw new Error(`Safe ${safe} has no code — refusing to grant`);
  }

  const assa = await ethers.getContractAt("ASSAToken", token);
  const ADMIN = await assa.DEFAULT_ADMIN_ROLE();
  const MINTER = await assa.MINTER_ROLE();

  // Pre-gate: never start if the deployer isn't the current admin.
  if (!(await assa.hasRole(ADMIN, deployer.address))) {
    throw new Error("deployer no longer holds DEFAULT_ADMIN — aborting (investigate state first)");
  }

  console.log(`  token:    ${token}`);
  console.log(`  deployer: ${deployer.address} (ADMIN+MINTER)`);
  console.log(`  Safe:     ${safe}`);

  let nextNonce = await ethers.provider.getTransactionCount(deployer.address, "latest");
  const send = async (label: string, role: string) => {
    if (await assa.hasRole(role, safe)) {
      console.log(`  • ${label}: Safe already holds it — skip`);
      return;
    }
    console.log(`  → grant ${label} → Safe`);
    const tx = await assa.grantRole(role, safe, { nonce: nextNonce++ });
    await tx.wait(1);
    console.log(`    mined ${tx.hash}`);
  };

  await send("MINTER_ROLE", MINTER);
  await send("DEFAULT_ADMIN_ROLE", ADMIN);

  // Verify gate read-back. Public Base RPCs lag read-after-write, so retry the
  // freshly-granted roles a few times before declaring the gate incomplete.
  let sAdmin = false, sMint = false;
  for (let i = 0; i < 6; i++) {
    [sAdmin, sMint] = await Promise.all([assa.hasRole(ADMIN, safe), assa.hasRole(MINTER, safe)]);
    if (sAdmin && sMint) break;
    await new Promise((r) => setTimeout(r, 3000));
  }
  const dAdmin = await assa.hasRole(ADMIN, deployer.address);
  const dMint = await assa.hasRole(MINTER, deployer.address);
  console.log(`\n  RESULT:`);
  console.log(`    Safe:     ADMIN=${sAdmin}  MINTER=${sMint}`);
  console.log(`    deployer: ADMIN=${dAdmin}  MINTER=${dMint} (still held — NOT renounced)`);
  if (sAdmin && sMint) {
    console.log(`\n  ✓ VERIFY GATE PASSED — Safe co-holds ADMIN+MINTER.`);
    console.log(`    NEXT (human): prove the Safe can sign 2-of-3, THEN renounce deployer`);
    console.log(`    MINTER then ADMIN (last) via Basescan. Do NOT renounce before the Safe test.`);
  } else {
    console.log(`\n  ⚠️ grants incomplete — re-run before proceeding.`);
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
