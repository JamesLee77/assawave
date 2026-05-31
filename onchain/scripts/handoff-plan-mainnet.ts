/**
 * ASSAToken → Safe handoff PLANNER / VERIFIER (read-only — signs nothing, no key needed).
 *
 *   npx hardhat run scripts/handoff-plan-mainnet.ts --network base
 *   SAFE_ADDRESS=0x... npx hardhat run scripts/handoff-plan-mainnet.ts --network base
 *
 * Phase-A target (Safe only): DEFAULT_ADMIN + MINTER → Safe, BURNER renounced (no holder),
 * deployer EOA renounces everything. The actual grant/renounce txs are signed by the
 * deployer EOA via Basescan "Write Contract" (or any wallet) — this script only reads
 * state, prints the exact ordered calls, and gates each stage so the handoff can't brick
 * the token (ADMIN renounced last, only after the Safe is verified holding it).
 *
 * Run it at each stage; it reports what's done and what's next.
 */
import { ethers, network } from "hardhat";
import { loadRegistry } from "./lib";

const ZERO = "0x0000000000000000000000000000000000000000";

async function holds(c: any, role: string, who: string): Promise<boolean> {
  if (!who || who === ZERO) return false;
  return await c.hasRole(role, who);
}

async function main() {
  if (network.name !== "base") {
    console.error(`  ✗ run with --network base (got ${network.name})`);
    process.exitCode = 1;
    return;
  }
  const reg = loadRegistry();
  const token = reg.contracts.ASSAToken;
  const deployer = reg.deployer; // current admin EOA (0x7C5a…), from deploy record
  const safe = (process.env.SAFE_ADDRESS || reg.contracts.Safe || "").trim();

  console.log(`\n=== ASSAToken → Safe handoff plan (${network.name}) ===`);
  console.log(`  ASSAToken: ${token}`);
  console.log(`  deployer (current admin): ${deployer}`);
  console.log(`  Safe (target):            ${safe || "⟨not provided — set SAFE_ADDRESS=0x…⟩"}`);

  const assa = await ethers.getContractAt("ASSAToken", token);
  const ADMIN = await assa.DEFAULT_ADMIN_ROLE();
  const MINTER = await assa.MINTER_ROLE();
  const BURNER = await assa.BURNER_ROLE();

  // ---- current holders ----
  const dAdmin = await holds(assa, ADMIN, deployer);
  const dMint = await holds(assa, MINTER, deployer);
  const dBurn = await holds(assa, BURNER, deployer);
  console.log(`\n  deployer roles: ADMIN=${dAdmin}  MINTER=${dMint}  BURNER=${dBurn}`);

  let safeIsContract = false;
  let sAdmin = false, sMint = false, sBurn = false;
  if (safe) {
    if (!ethers.isAddress(safe)) {
      console.error(`  ✗ SAFE_ADDRESS is not a valid address.`);
      process.exitCode = 1;
      return;
    }
    safeIsContract = (await ethers.provider.getCode(safe)) !== "0x";
    sAdmin = await holds(assa, ADMIN, safe);
    sMint = await holds(assa, MINTER, safe);
    sBurn = await holds(assa, BURNER, safe);
    console.log(`  Safe roles:     ADMIN=${sAdmin}  MINTER=${sMint}  BURNER=${sBurn}`);
    console.log(`  Safe has code:  ${safeIsContract ? "yes ✓" : "NO ✗ (not a deployed contract!)"}`);
  }

  console.log(`\n  role ids:`);
  console.log(`    DEFAULT_ADMIN_ROLE = ${ADMIN}`);
  console.log(`    MINTER_ROLE        = ${MINTER}`);
  console.log(`    BURNER_ROLE        = ${BURNER}`);

  if (!safe) {
    console.log(`\n  → Create the 2-of-3 Safe on Base, then re-run with SAFE_ADDRESS=0x… for the call list.\n`);
    return;
  }

  // ---- ordered call list (executed by the deployer EOA on the ASSAToken contract) ----
  console.log(`\n  HANDOFF CALLS — sign as deployer ${deployer} on ASSAToken (${token}):`);
  console.log(`    [pre-gate] deployer ADMIN=${dAdmin} (must be true)  •  Safe has code=${safeIsContract} (must be true)`);
  console.log(`    1. grantRole(${MINTER}, ${safe})   // MINTER → Safe`);
  console.log(`    2. grantRole(${ADMIN}, ${safe})    // DEFAULT_ADMIN → Safe`);
  console.log(`    --- VERIFY GATE: re-run this script; require Safe ADMIN=true && MINTER=true ---`);
  console.log(`    3. renounceRole(${MINTER}, ${deployer})  // deployer drops MINTER`);
  console.log(`    4. renounceRole(${BURNER}, ${deployer})  // deployer drops BURNER (now unheld)`);
  console.log(`    5. renounceRole(${ADMIN}, ${deployer})   // deployer drops ADMIN — LAST, irreversible`);

  // ---- stage detection / gates ----
  console.log(`\n  STATUS:`);
  const grantsDone = sAdmin && sMint;
  const renouncesDone = !dAdmin && !dMint && !dBurn;
  if (!grantsDone) {
    if (!dAdmin) console.log(`    ⚠️ deployer no longer ADMIN but Safe doesn't hold ADMIN — investigate before anything else.`);
    console.log(`    → Stage: GRANT. Do calls 1–2. Do NOT renounce yet.`);
    if (!safeIsContract) console.log(`    ⛔ Safe has no code — DO NOT grant. Verify the Safe address/network first.`);
  } else if (grantsDone && !renouncesDone) {
    console.log(`    ✓ VERIFY GATE PASSED — Safe holds ADMIN + MINTER.`);
    console.log(`    → Stage: RENOUNCE. Do calls 3–4–5 (ADMIN last).`);
  } else if (renouncesDone) {
    const burnerUnheld = !dBurn && !sBurn;
    console.log(`    ✓ HANDOFF COMPLETE — deployer holds nothing; Safe = ADMIN${sMint ? "+MINTER" : ""}.`);
    console.log(`    BURNER unheld (deployer & Safe): ${burnerUnheld ? "yes ✓" : "⚠️ a holder remains"}`);
    console.log(`    (Note: plain AccessControl can't enumerate all holders — only deployer/Safe checked.)`);
  }
  console.log(``);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
