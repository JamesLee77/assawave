/**
 * Rehearsal: replace the Timelock's proposer/executor/canceller (currently the
 * deployer EOA) with a Safe — the production governance signer.
 *
 *   npm run swap:timelock:sepolia                 # uses a generated mock-Safe (EOA stand-in)
 *   SAFE_ADDRESS=0xRealSafe npm run swap:timelock:sepolia   # uses a real Safe address
 *   RENOUNCE_TL_ADMIN=1 ...                        # also hand the Timelock's DEFAULT_ADMIN to the Safe + renounce deployer
 *
 * Steps (sent by the deployer, which still holds the Timelock's DEFAULT_ADMIN_ROLE):
 *   1. grant PROPOSER / EXECUTOR / CANCELLER to the Safe
 *   2. revoke PROPOSER / EXECUTOR / CANCELLER from the deployer
 *   3. (optional) grant DEFAULT_ADMIN to the Safe + renounce deployer's DEFAULT_ADMIN
 *   4. verify the role matrix + functional proof (deployer can no longer schedule; Safe can)
 *
 * For a faithful procedure rehearsal a single EOA stands in for the multisig — the
 * Timelock only checks the role, not whether the holder is an EOA or a Safe contract.
 * The mock-Safe key is saved to .env as SAFE_PRIVATE_KEY (gitignored) so the script can
 * prove "the new signer can schedule" via a no-state staticCall.
 */
import { ethers } from "hardhat";
import type { Provider } from "ethers";
import { loadRegistry, banner } from "./lib";
import * as fs from "fs";
import * as path from "path";

function getMockSafe(provider: Provider) {
  let pk = process.env.SAFE_PRIVATE_KEY;
  if (!pk) {
    const w = ethers.Wallet.createRandom();
    pk = w.privateKey;
    const ENV = path.resolve(__dirname, "..", "..", ".env");
    let env = fs.readFileSync(ENV, "utf8");
    env += `\nSAFE_PRIVATE_KEY=${pk}\n`;
    fs.writeFileSync(ENV, env);
    fs.chmodSync(ENV, 0o600);
    console.log("  · generated mock-Safe (EOA stand-in) → saved SAFE_PRIVATE_KEY to .env");
  }
  return new ethers.Wallet(pk, provider);
}

async function main() {
  banner("Rehearsal — swap Timelock proposer/executor EOA → Safe");
  const c = loadRegistry().contracts;
  const [deployer] = await ethers.getSigners();
  const tl = await ethers.getContractAt("ASSATimelock", c.ASSATimelock);

  // Real Safe via SAFE_ADDRESS, else a generated EOA stand-in (also usable for the proof).
  const mock = process.env.SAFE_ADDRESS ? undefined : getMockSafe(ethers.provider);
  const safeAddr = process.env.SAFE_ADDRESS ?? mock!.address;
  console.log(`  deployer: ${deployer.address}\n  timelock: ${c.ASSATimelock}\n  Safe:     ${safeAddr}${mock ? " (mock stand-in)" : ""}`);

  const PROPOSER = await tl.PROPOSER_ROLE();
  const EXECUTOR = await tl.EXECUTOR_ROLE();
  const CANCELLER = await tl.CANCELLER_ROLE();
  const ADMIN = await tl.DEFAULT_ADMIN_ROLE();
  const roles: [string, string][] = [["PROPOSER", PROPOSER], ["EXECUTOR", EXECUTOR], ["CANCELLER", CANCELLER]];

  // 1. grant to Safe
  console.log("\n[1] grant proposer/executor/canceller → Safe");
  for (const [n, role] of roles) {
    if (!(await tl.hasRole(role, safeAddr))) {
      await (await tl.grantRole(role, safeAddr)).wait();
      console.log(`  grant ${n} → Safe`);
    } else console.log(`  • ${n} already held by Safe`);
  }

  // 2. revoke from deployer
  console.log("\n[2] revoke proposer/executor/canceller from deployer");
  for (const [n, role] of roles) {
    if (await tl.hasRole(role, deployer.address)) {
      await (await tl.revokeRole(role, deployer.address)).wait();
      console.log(`  revoke ${n} from deployer`);
    } else console.log(`  • ${n} already revoked from deployer`);
  }

  // 3. optional: hand the Timelock's own DEFAULT_ADMIN to the Safe
  if (process.env.RENOUNCE_TL_ADMIN === "1") {
    console.log("\n[3] hand DEFAULT_ADMIN → Safe + renounce deployer (irreversible)");
    if (!(await tl.hasRole(ADMIN, safeAddr))) await (await tl.grantRole(ADMIN, safeAddr)).wait();
    if (await tl.hasRole(ADMIN, deployer.address)) await (await tl.renounceRole(ADMIN, deployer.address)).wait();
    console.log("  DEFAULT_ADMIN → Safe; deployer renounced");
  } else {
    console.log("\n[3] DEFAULT_ADMIN kept with deployer (reversible). Set RENOUNCE_TL_ADMIN=1 for full handover.");
  }

  // 4. verify role matrix
  console.log("\n[4] role matrix");
  let ok = true;
  for (const [n, role] of roles) {
    const dep = await tl.hasRole(role, deployer.address);
    const sf = await tl.hasRole(role, safeAddr);
    const good = !dep && sf;
    ok = ok && good;
    console.log(`  ${good ? "✓" : "✗"} ${n}: deployer=${dep} safe=${sf}`);
  }

  // functional proof (no state change): deployer can no longer schedule; Safe can.
  const delay = await tl.getMinDelay();
  const target = c.ASSAToken;
  const salt = ethers.id("assa-rehearsal");
  let depBlocked = false;
  try {
    await tl.connect(deployer).schedule.staticCall(target, 0, "0x", ethers.ZeroHash, salt, delay);
  } catch {
    depBlocked = true;
  }
  console.log(`  ${depBlocked ? "✓" : "✗"} deployer can no longer schedule (PROPOSER revoked)`);
  ok = ok && depBlocked;

  if (mock) {
    let safeCan = false;
    try {
      await tl.connect(mock).schedule.staticCall(target, 0, "0x", ethers.ZeroHash, salt, delay);
      safeCan = true;
    } catch (e) {
      console.log("    safe schedule revert:", (e as Error).message.split("\n")[0]);
    }
    console.log(`  ${safeCan ? "✓" : "✗"} Safe can schedule (PROPOSER granted)`);
    ok = ok && safeCan;
  }

  console.log("\n" + "─".repeat(60));
  console.log(ok ? "✅ Timelock signer swapped to the Safe (verified)." : "❌ Swap incomplete.");
  if (!ok) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
