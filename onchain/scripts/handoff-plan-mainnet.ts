/**
 * ASSAToken → Safe handoff PLANNER / VERIFIER (read-only — signs nothing, no key needed).
 *
 *   npx hardhat run scripts/handoff-plan-mainnet.ts --network base
 *   SAFE_ADDRESS=0x... npx hardhat run scripts/handoff-plan-mainnet.ts --network base
 *
 * Phase-A target (Safe only): DEFAULT_ADMIN + MINTER → Safe, deployer EOA renounces
 * everything. The actual grant/renounce txs are signed by the deployer EOA via
 * Basescan "Write Contract" (or any wallet) — this script only reads state, prints
 * the exact ordered calls, and gates each stage so the handoff can't brick the
 * token (ADMIN renounced last, only after the Safe is verified holding it).
 *
 * Token generations: the patched v2 token has no BURNER_ROLE. If the registry still
 * points at the LEGACY token (allowance-bypassing burnFrom), this script flags it
 * and includes the extra BURNER renounce step.
 *
 * Run it at each stage; it reports what's done and what's next.
 */
import { ethers, network } from "hardhat";
import { loadRegistry } from "./lib";

const ZERO = "0x0000000000000000000000000000000000000000";

function isContractMiss(e: any): boolean {
  if (e?.code === "CALL_EXCEPTION" || e?.code === "BAD_DATA") return true;
  const m = String(e?.message || "");
  return /execution reverted|could not decode result data|function selector was not recognized/i.test(m);
}

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
  const deployer = reg.deployer; // current admin EOA, from deploy record
  const safe = (process.env.SAFE_ADDRESS || reg.contracts.Safe || "").trim();

  console.log(`\n=== ASSAToken → Safe handoff plan (${network.name}) ===`);
  console.log(`  ASSAToken: ${token}`);
  console.log(`  deployer (current admin): ${deployer}`);
  console.log(`  Safe (target):            ${safe || "⟨not provided — set SAFE_ADDRESS=0x…⟩"}`);

  const assa = await ethers.getContractAt("ASSAToken", token);
  const ADMIN = await assa.DEFAULT_ADMIN_ROLE();
  const MINTER = await assa.MINTER_ROLE();

  // Legacy detection: the pre-patch token exposes BURNER_ROLE; v2 does not.
  let BURNER: string | null = null;
  const legacyProbe = new ethers.Contract(
    token,
    ["function BURNER_ROLE() view returns (bytes32)"],
    ethers.provider
  );
  try {
    BURNER = await legacyProbe.BURNER_ROLE();
  } catch (e: any) {
    // Only a contract-level miss means "v2 token". A transport/RPC error must
    // NOT silently misclassify the legacy token as v2 — that would drop the
    // BURNER renounce step from the printed plan.
    if (isContractMiss(e)) {
      BURNER = null; // v2 token
    } else {
      throw e;
    }
  }
  if (BURNER) {
    console.log(`\n  ⚠️ LEGACY token detected (BURNER_ROLE present — allowance-bypassing burnFrom).`);
    console.log(`     Prefer deploying the patched v2 token while supply is 0 instead of handing this one off.`);
  } else {
    console.log(`\n  ✓ v2 token (no BURNER_ROLE).`);
  }

  // ---- current holders ----
  const dAdmin = await holds(assa, ADMIN, deployer);
  const dMint = await holds(assa, MINTER, deployer);
  const dBurn = BURNER ? await holds(assa, BURNER, deployer) : false;
  console.log(`\n  deployer roles: ADMIN=${dAdmin}  MINTER=${dMint}${BURNER ? `  BURNER=${dBurn}` : ""}`);

  let safeIsContract = false;
  let sAdmin = false,
    sMint = false,
    sBurn = false;
  if (safe) {
    if (!ethers.isAddress(safe)) {
      console.error(`  ✗ SAFE_ADDRESS is not a valid address.`);
      process.exitCode = 1;
      return;
    }
    safeIsContract = (await ethers.provider.getCode(safe)) !== "0x";
    sAdmin = await holds(assa, ADMIN, safe);
    sMint = await holds(assa, MINTER, safe);
    sBurn = BURNER ? await holds(assa, BURNER, safe) : false;
    console.log(`  Safe roles:     ADMIN=${sAdmin}  MINTER=${sMint}${BURNER ? `  BURNER=${sBurn}` : ""}`);
    console.log(`  Safe has code:  ${safeIsContract ? "yes ✓" : "NO ✗ (not a deployed contract!)"}`);
  }

  console.log(`\n  role ids:`);
  console.log(`    DEFAULT_ADMIN_ROLE = ${ADMIN}`);
  console.log(`    MINTER_ROLE        = ${MINTER}`);
  if (BURNER) console.log(`    BURNER_ROLE        = ${BURNER} (legacy)`);

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
  if (BURNER) {
    console.log(`    4. renounceRole(${BURNER}, ${deployer})  // deployer drops legacy BURNER (now unheld)`);
    console.log(`    5. renounceRole(${ADMIN}, ${deployer})   // deployer drops ADMIN — LAST, irreversible`);
  } else {
    console.log(`    4. renounceRole(${ADMIN}, ${deployer})   // deployer drops ADMIN — LAST, irreversible`);
  }

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
    console.log(`    → Stage: RENOUNCE. Do the renounce calls (ADMIN last).`);
  } else if (renouncesDone) {
    console.log(`    ✓ HANDOFF COMPLETE — deployer holds nothing; Safe = ADMIN${sMint ? "+MINTER" : ""}.`);
    if (BURNER) {
      const burnerUnheld = !dBurn && !sBurn;
      console.log(`    legacy BURNER unheld (deployer & Safe): ${burnerUnheld ? "yes ✓" : "⚠️ a holder remains"}`);
    }
    console.log(`    (Note: plain AccessControl can't enumerate all holders — only deployer/Safe checked.)`);
  }
  console.log(``);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
