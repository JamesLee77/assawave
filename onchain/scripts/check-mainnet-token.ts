/**
 * Post-deploy on-chain sanity read for the live ASSAToken (read-only).
 *   npx hardhat run scripts/check-mainnet-token.ts --network base
 * Reads address from deployments/base.json, prints metadata/cap/supply and
 * confirms the deployer holds ADMIN+MINTER+BURNER and no premint exists.
 */
import { ethers, network } from "hardhat";
import { loadRegistry } from "./lib";

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

  const [ADMIN, MINTER, BURNER] = await Promise.all([
    assa.DEFAULT_ADMIN_ROLE(),
    assa.MINTER_ROLE(),
    assa.BURNER_ROLE(),
  ]);
  const d = reg.deployer;
  const [hasAdmin, hasMinter, hasBurner] = await Promise.all([
    assa.hasRole(ADMIN, d),
    assa.hasRole(MINTER, d),
    assa.hasRole(BURNER, d),
  ]);
  console.log(`  deployer roles: ADMIN=${hasAdmin}  MINTER=${hasMinter}  BURNER=${hasBurner}`);
  console.log(`\n  ⚠️ deployer is sole admin/minter/burner — back up its key; do NOT mint pre-governance.\n`);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
