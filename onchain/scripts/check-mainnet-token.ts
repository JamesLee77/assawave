/**
 * Post-deploy on-chain sanity read for the live ASSAToken (read-only).
 *   npx hardhat run scripts/check-mainnet-token.ts --network base
 * Reads address from deployments/base.json, prints metadata/cap/supply and
 * confirms the deployer's roles and that no premint exists.
 *
 * Handles both token generations:
 *   - v2 (current source): MINTER only, lifetime `totalMinted` cap, no BURNER_ROLE.
 *   - legacy (pre-2026-06 deploy): also exposes BURNER_ROLE (allowance-bypassing
 *     burnFrom) — flagged below so it is not mistaken for the patched token.
 */
import { ethers, network } from "hardhat";
import { loadRegistry } from "./lib";

function isContractMiss(e: any): boolean {
  if (e?.code === "CALL_EXCEPTION" || e?.code === "BAD_DATA") return true;
  const m = String(e?.message || "");
  return /execution reverted|could not decode result data|function selector was not recognized/i.test(m);
}

async function main() {
  const reg = loadRegistry();
  const addr = reg.contracts.ASSAToken;
  console.log(`\n=== ASSAToken live state (${network.name}) ===`);
  console.log(`  address:  ${addr}`);
  console.log(`  deployer: ${reg.deployer}`);

  const assa = await ethers.getContractAt("ASSAToken", addr);
  const [name, symbol, decimals, cap, supply] = await Promise.all([
    assa.name(),
    assa.symbol(),
    assa.decimals(),
    assa.CAP(),
    assa.totalSupply(),
  ]);
  console.log(`  name/symbol/decimals: ${name} / ${symbol} / ${decimals}`);
  console.log(`  CAP:        ${ethers.formatUnits(cap, 18)}`);
  console.log(`  totalSupply:${ethers.formatUnits(supply, 18)}  ${supply === 0n ? "(no premint ✓)" : "⚠️ NON-ZERO"}`);

  // v2 tokens expose totalMinted (lifetime issuance); legacy tokens revert here.
  let isLegacy = false;
  try {
    const minted = await assa.totalMinted();
    console.log(`  totalMinted:${ethers.formatUnits(minted, 18)} (lifetime cap ✓ v2 token)`);
  } catch (e: any) {
    // Only a contract-level miss means "legacy". Surface transport/RPC errors.
    if (!isContractMiss(e)) throw e;
    isLegacy = true;
    console.log(`  totalMinted: n/a — ⚠️ LEGACY token (circulating-supply cap, role-gated burnFrom)`);
  }

  const [ADMIN, MINTER] = await Promise.all([assa.DEFAULT_ADMIN_ROLE(), assa.MINTER_ROLE()]);
  const d = reg.deployer;
  const [hasAdmin, hasMinter] = await Promise.all([assa.hasRole(ADMIN, d), assa.hasRole(MINTER, d)]);
  let burnerNote = "BURNER=n/a (removed in v2)";
  if (isLegacy) {
    const legacy = new ethers.Contract(
      addr,
      ["function BURNER_ROLE() view returns (bytes32)", "function hasRole(bytes32,address) view returns (bool)"],
      ethers.provider
    );
    const BURNER = await legacy.BURNER_ROLE();
    burnerNote = `BURNER=${await legacy.hasRole(BURNER, d)} ⚠️ legacy confiscation role`;
  }
  console.log(`  deployer roles: ADMIN=${hasAdmin}  MINTER=${hasMinter}  ${burnerNote}`);
  if (isLegacy) {
    console.log(`\n  ⛔ This is the PRE-PATCH token. Plan: deploy the patched v2 token, update the registry, handoff, then re-mint existing balances on v2 (supply above shows what must migrate; verify holders before abandoning this one).\n`);
  } else {
    console.log(`\n  ⚠️ While the deployer holds ADMIN/MINTER, back up its key; hand off to the Safe before minting.\n`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
