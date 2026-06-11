/**
 * Mainnet handoff — RENOUNCE step (IRREVERSIBLE). Deployer drops MINTER then
 * ADMIN (last), leaving the Safe as sole admin/minter.
 *
 *   SAFE_ADDRESS=0x7eDc… npx hardhat run scripts/handoff-renounce-mainnet.ts --network base
 *
 * HARD GATES (refuses unless ALL pass — never bricks the token):
 *   - chainId 8453, signer == registry deployer.
 *   - Safe holds BOTH DEFAULT_ADMIN and MINTER right now (read with retry).
 *   - Safe nonce > 0 — concrete on-chain proof the 2-of-3 has executed ≥1 tx
 *     (corroborates the "Safe can sign" rehearsal before we burn the EOA's keys).
 * Order: renounce MINTER, then ADMIN LAST. renounceRole's 2nd arg is the
 * caller's OWN address (OZ v5 callerConfirmation).
 */
import { ethers, network } from "hardhat";
import { loadRegistry } from "./lib";

async function holdsWithRetry(assa: any, role: string, who: string): Promise<boolean> {
  for (let i = 0; i < 6; i++) {
    if (await assa.hasRole(role, who)) return true;
    await new Promise((r) => setTimeout(r, 3000));
  }
  return false;
}

async function main() {
  console.log(`\n=== Mainnet handoff RENOUNCE (IRREVERSIBLE) — ${network.name} ===`);
  const net = await ethers.provider.getNetwork();
  if (net.chainId !== 8453n) throw new Error(`expected Base mainnet 8453, got ${net.chainId}`);

  const reg = loadRegistry();
  const token = reg.contracts.ASSAToken;
  const safe = (process.env.SAFE_ADDRESS || reg.contracts.Safe || "").trim();
  if (!ethers.isAddress(safe)) throw new Error("no valid Safe address");

  const [deployer] = await ethers.getSigners();
  if (deployer.address.toLowerCase() !== reg.deployer.toLowerCase()) {
    throw new Error(`signer ${deployer.address} != registry deployer ${reg.deployer} — wrong key`);
  }

  const assa = await ethers.getContractAt("ASSAToken", token);
  const ADMIN = await assa.DEFAULT_ADMIN_ROLE();
  const MINTER = await assa.MINTER_ROLE();

  // ---- HARD GATE 1: Safe must hold BOTH roles (else renouncing bricks the token) ----
  const safeAdmin = await holdsWithRetry(assa, ADMIN, safe);
  const safeMint = await holdsWithRetry(assa, MINTER, safe);
  console.log(`  Safe ${safe}: ADMIN=${safeAdmin} MINTER=${safeMint}`);
  if (!safeAdmin || !safeMint) {
    throw new Error("ABORT: Safe does not hold ADMIN+MINTER — renouncing would brick the token. Run the GRANT step first.");
  }

  // ---- HARD GATE 2: Safe must have executed >= 1 tx (proof the 2-of-3 works) ----
  const safeC = new ethers.Contract(safe, ["function nonce() view returns (uint256)"], ethers.provider);
  const safeNonce: bigint = await safeC.nonce();
  console.log(`  Safe nonce: ${safeNonce} ${safeNonce > 0n ? "(has executed ≥1 tx ✓)" : "(NEVER executed ✗)"}`);
  if (safeNonce === 0n) {
    throw new Error("ABORT: Safe nonce is 0 — no executed transaction proves the 2-of-3 can sign. Do one Safe tx first.");
  }

  const dAdmin = await assa.hasRole(ADMIN, deployer.address);
  const dMint = await assa.hasRole(MINTER, deployer.address);
  console.log(`  deployer ${deployer.address}: ADMIN=${dAdmin} MINTER=${dMint}`);

  let nextNonce = await ethers.provider.getTransactionCount(deployer.address, "latest");
  const renounce = async (label: string, role: string) => {
    if (!(await assa.hasRole(role, deployer.address))) {
      console.log(`  • ${label}: deployer doesn't hold it — skip`);
      return;
    }
    console.log(`  → renounce ${label} (deployer)`);
    const tx = await assa.renounceRole(role, deployer.address, { nonce: nextNonce++ });
    await tx.wait(1);
    console.log(`    mined ${tx.hash}`);
  };

  // MINTER first, ADMIN LAST.
  await renounce("MINTER_ROLE", MINTER);
  await renounce("DEFAULT_ADMIN_ROLE", ADMIN);

  // ---- final read-back (retry for RPC lag) ----
  let dA = true, dM = true;
  for (let i = 0; i < 8; i++) {
    [dA, dM] = await Promise.all([assa.hasRole(ADMIN, deployer.address), assa.hasRole(MINTER, deployer.address)]);
    if (!dA && !dM) break;
    await new Promise((r) => setTimeout(r, 3000));
  }
  const sA = await assa.hasRole(ADMIN, safe);
  const sM = await assa.hasRole(MINTER, safe);
  console.log(`\n  FINAL STATE:`);
  console.log(`    deployer: ADMIN=${dA} MINTER=${dM}`);
  console.log(`    Safe:     ADMIN=${sA} MINTER=${sM}`);
  if (!dA && !dM && sA && sM) {
    console.log(`\n  ✅ HANDOFF COMPLETE — deployer holds nothing; Safe is sole ADMIN+MINTER.`);
    console.log(`     Next: remove MAINNET_PRIVATE_KEY from .env; mint 10M via the Safe (2-of-3).`);
  } else {
    console.log(`\n  ⚠️ unexpected final state — re-read with the verifier before trusting.`);
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
