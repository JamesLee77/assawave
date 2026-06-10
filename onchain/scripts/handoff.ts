/**
 * Admin handoff: grant every contract's admin/operational roles to the ASSATimelock
 * (driven by the Safe), then renounce the deployer EOA's roles.
 *
 * ⚠️ IRREVERSIBLE on mainnet. Run ONLY after the Funding Gate is complete:
 *    1. ASSAToken minted: sale round allocations → TokenSale, vesting totals → TokenVesting,
 *       any veASSA/treasury seed amounts distributed.
 *    2. Sale rounds configured + whitelists set; vesting schedules created.
 * Then run with CONFIRM_HANDOFF=1. Without it, this script only PRINTS the plan (dry run).
 *
 * MINTER_ROLE is intentionally handed to the Timelock (not renounced) so post-handoff
 * replenishment is possible via the 48h timelock runbook (DEVELOPMENT_PLAN §5).
 *
 * v2 tokens only (no BURNER_ROLE). For the legacy mainnet token use the
 * legacy-aware handoff-plan-mainnet.ts instead.
 */
import { ethers } from "hardhat";
import { loadRegistry, banner } from "./lib";

async function main() {
  banner("ASSA WAVE — admin handoff to Timelock");
  const confirm = process.env.CONFIRM_HANDOFF === "1";
  const [deployer] = await ethers.getSigners();
  const reg = loadRegistry();
  const c = reg.contracts;

  const timelock = c["ASSATimelock"];
  if (!timelock) throw new Error("ASSATimelock not in registry — deploy first.");
  console.log(`  deployer: ${deployer.address}`);
  console.log(`  timelock: ${timelock}`);
  console.log(`  mode:     ${confirm ? "EXECUTE" : "DRY RUN (set CONFIRM_HANDOFF=1 to execute)"}\n`);

  // role-id, grant-to-timelock, renounce-from-deployer per contract
  const plan: Array<{ name: string; roles: string[]; keepMinter?: boolean }> = [
    { name: "ASSAToken", roles: ["DEFAULT_ADMIN_ROLE", "MINTER_ROLE"], keepMinter: true },
    { name: "KYCRegistry", roles: ["DEFAULT_ADMIN_ROLE", "KYC_OPERATOR_ROLE"] },
    { name: "Treasury", roles: ["DEFAULT_ADMIN_ROLE", "TREASURY_ROLE"] },
    { name: "TokenVesting", roles: ["DEFAULT_ADMIN_ROLE", "VESTING_ADMIN_ROLE"] },
    { name: "TokenSale", roles: ["DEFAULT_ADMIN_ROLE", "SALE_ADMIN_ROLE", "PAUSER_ROLE"] },
    { name: "StakingLock", roles: ["DEFAULT_ADMIN_ROLE", "ADMIN_ROLE"] },
    { name: "BMEBurner", roles: ["DEFAULT_ADMIN_ROLE", "ADMIN_ROLE", "REVENUE_PROCESSOR_ROLE"] },
  ];

  for (const item of plan) {
    const addr = c[item.name];
    if (!addr) {
      console.log(`  - ${item.name}: not deployed, skipping`);
      continue;
    }
    const contract = await ethers.getContractAt(item.name, addr);
    console.log(`  ${item.name} @ ${addr}`);
    for (const roleName of item.roles) {
      const roleId: string = await (contract as any)[roleName]();
      console.log(`    grant ${roleName} → timelock`);
      if (confirm) await (await (contract as any).grantRole(roleId, timelock)).wait();
    }
    // Renounce deployer roles AFTER granting to timelock (never lock ourselves out mid-way).
    for (const roleName of item.roles) {
      // keep MINTER on the deployer? No — renounce all deployer roles; timelock holds them.
      const roleId: string = await (contract as any)[roleName]();
      console.log(`    renounce ${roleName} (deployer)`);
      if (confirm) await (await (contract as any).renounceRole(roleId, deployer.address)).wait();
    }
  }

  console.log(confirm ? "\n✅ Handoff executed." : "\nDry run complete. Re-run with CONFIRM_HANDOFF=1 to execute.");
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
