/**
 * Full governance loop with a SHORT delay, so propose -> wait -> execute is testable
 * in one session (the production 48h timelock makes execute untestable interactively).
 *
 *   npm run fast:gov:sepolia
 *
 * Self-contained (does not touch the production 48h deployment):
 *   1. deploy a fast ASSATimelock (60s delay; proposer = the real Safe; executor = open)
 *   2. deploy a fresh KYCRegistry governed by that timelock
 *   3. the 2-of-3 Safe schedules KYCRegistry.setKYCed(subject,true) through the timelock
 *   4. wait out the 60s delay
 *   5. execute the queued op (open executor)
 *   6. verify KYCRegistry.isKYCed(subject) flipped to true  ← the action actually happened
 *
 * Relies on the mainnet-only floor (ASSATimelock enforces 48h on chainid 8453 only).
 */
import { ethers } from "hardhat";
import { loadRegistry, banner } from "./lib";

const SAFE_ABI = [
  "function nonce() view returns (uint256)",
  "function execTransaction(address to,uint256 value,bytes data,uint8 operation,uint256 safeTxGas,uint256 baseGas,uint256 gasPrice,address gasToken,address refundReceiver,bytes signatures) payable returns (bool)",
];

async function waitForCode(addr: string) {
  // Load-balanced RPCs lag after a deploy; poll until the new code is visible.
  for (let i = 0; i < 20; i++) {
    if ((await ethers.provider.getCode(addr)) !== "0x") return;
    await new Promise((r) => setTimeout(r, 2500));
  }
  throw new Error(`code never appeared at ${addr}`);
}

async function execSafeTx(safeAddr: string, chainId: number, to: string, data: string, relayer: any) {
  const safe = new ethers.Contract(safeAddr, SAFE_ABI, relayer);
  const nonce = await safe.nonce();
  const domain = { chainId, verifyingContract: safeAddr };
  const types = {
    SafeTx: [
      { name: "to", type: "address" }, { name: "value", type: "uint256" }, { name: "data", type: "bytes" },
      { name: "operation", type: "uint8" }, { name: "safeTxGas", type: "uint256" }, { name: "baseGas", type: "uint256" },
      { name: "gasPrice", type: "uint256" }, { name: "gasToken", type: "address" }, { name: "refundReceiver", type: "address" },
      { name: "nonce", type: "uint256" },
    ],
  };
  const msg = { to, value: 0, data, operation: 0, safeTxGas: 0, baseGas: 0, gasPrice: 0, gasToken: ethers.ZeroAddress, refundReceiver: ethers.ZeroAddress, nonce };
  const owners = [new ethers.Wallet(process.env.PRIVATE_KEY!), new ethers.Wallet(process.env.TEST_PRIVATE_KEY!)];
  const signed = await Promise.all(owners.map(async (w) => ({ addr: w.address.toLowerCase(), sig: await w.signTypedData(domain, types, msg) })));
  signed.sort((a, b) => (a.addr < b.addr ? -1 : 1));
  const signatures = "0x" + signed.map((s) => s.sig.slice(2)).join("");
  return (await safe.execTransaction(to, 0, data, 0, 0, 0, 0, ethers.ZeroAddress, ethers.ZeroAddress, signatures)).wait();
}

async function main() {
  banner("Fast governance loop (60s) — Safe → Timelock → execute");
  const c = loadRegistry().contracts;
  if (!c.Safe) throw new Error("No Safe in registry. Run deploy:safe:sepolia first.");
  const [deployer] = await ethers.getSigners();
  const chainId = Number((await ethers.provider.getNetwork()).chainId);
  const DELAY = 60;

  // 1. fast timelock: proposer = Safe, executor = open (anyone after delay), admin = deployer
  console.log("\n[1] deploy fast ASSATimelock (60s)");
  const tl = await (await ethers.getContractFactory("ASSATimelock")).deploy(DELAY, [c.Safe], [ethers.ZeroAddress], deployer.address);
  await tl.waitForDeployment();
  const tlAddr = await tl.getAddress();
  await waitForCode(tlAddr);
  console.log(`  fast timelock: ${tlAddr}  (minDelay ${DELAY}s)`);

  // 2. fresh KYCRegistry governed by the fast timelock
  console.log("\n[2] deploy fresh KYCRegistry (admin = fast timelock)");
  const kyc = await (await ethers.getContractFactory("KYCRegistry")).deploy(tlAddr);
  await kyc.waitForDeployment();
  const kycAddr = await kyc.getAddress();
  await waitForCode(kycAddr);
  const subject = new ethers.Wallet(process.env.SAFE_PRIVATE_KEY!).address;
  console.log(`  fresh KYC: ${kycAddr}\n  subject: ${subject}  isKYCed(before)=${await kyc.isKYCed(subject)}`);

  // 3. Safe schedules the governance action
  console.log("\n[3] Safe (2-of-3) schedules setKYCed via the timelock");
  const govData = kyc.interface.encodeFunctionData("setKYCed", [subject, true]);
  const salt = ethers.id("fast-gov-1");
  const scheduleData = tl.interface.encodeFunctionData("schedule", [kycAddr, 0, govData, ethers.ZeroHash, salt, DELAY]);
  await execSafeTx(c.Safe, chainId, tlAddr, scheduleData, deployer);
  const opId = await tl.hashOperation(kycAddr, 0, govData, ethers.ZeroHash, salt);
  console.log(`  scheduled. opId=${opId}`);

  // 4. wait out the delay
  console.log(`\n[4] waiting ${DELAY + 15}s for the timelock delay…`);
  await new Promise((r) => setTimeout(r, (DELAY + 15) * 1000));

  // poll until Ready (handles RPC lag + block timestamp granularity)
  let ready = false;
  for (let i = 0; i < 10; i++) {
    if (Number(await tl.getOperationState(opId)) === 2 /* Ready */) { ready = true; break; }
    await new Promise((r) => setTimeout(r, 4000));
  }
  console.log(`  operation Ready: ${ready}`);

  // 5. execute (open executor → deployer relays)
  console.log("\n[5] execute the queued op");
  await (await tl.connect(deployer).execute(kycAddr, 0, govData, ethers.ZeroHash, salt)).wait();

  // 6. verify the action took effect (retry: RPC lags after the execute write)
  let after = false;
  let done = false;
  for (let i = 0; i < 8; i++) {
    after = await kyc.isKYCed(subject);
    done = Number(await tl.getOperationState(opId)) === 3; // Done
    if (after && done) break;
    await new Promise((r) => setTimeout(r, 3000));
  }
  console.log("\n" + "─".repeat(60));
  console.log(`  ${after ? "✓" : "✗"} KYCRegistry.isKYCed(subject) = ${after}`);
  console.log(`  ${done ? "✓" : "✗"} timelock op state = Done`);
  console.log(after && done
    ? "✅ Full governance loop verified: Safe → 60s Timelock → execute → state changed."
    : "❌ Loop did not complete.");
  if (!(after && done)) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
