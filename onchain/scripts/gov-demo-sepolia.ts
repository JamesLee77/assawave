/**
 * Full governance action on the LIVE production stack (post-handoff, 60s timelock):
 *   Safe(2-of-3) schedules -> wait 60s -> Safe(2-of-3) executes -> verify effect.
 *
 *   npm run gov:demo:sepolia
 *
 * Action: KYCRegistry.setKYCed(subject, true) via the Timelock (which holds
 * KYC_OPERATOR after the handoff). Proves the deployed contracts are governable
 * end-to-end through the Safe -> 60s Timelock chain.
 */
import { ethers } from "hardhat";
import { loadRegistry, banner } from "./lib";

const SAFE_ABI = [
  "function nonce() view returns (uint256)",
  "function execTransaction(address to,uint256 value,bytes data,uint8 operation,uint256 safeTxGas,uint256 baseGas,uint256 gasPrice,address gasToken,address refundReceiver,bytes signatures) payable returns (bool)",
];

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
  // Pin gas: public RPCs under-estimate the nested Safe→Timelock call.
  return (await safe.execTransaction(to, 0, data, 0, 0, 0, 0, ethers.ZeroAddress, ethers.ZeroAddress, signatures, { gasLimit: 600_000 })).wait();
}

async function main() {
  banner("Governance demo on the live production stack (Safe → 60s Timelock → execute)");
  const c = loadRegistry().contracts;
  const [deployer] = await ethers.getSigners();
  const chainId = Number((await ethers.provider.getNetwork()).chainId);
  const tl = await ethers.getContractAt("ASSATimelock", c.ASSATimelock);
  const kyc = await ethers.getContractAt("KYCRegistry", c.KYCRegistry);

  const subject = deployer.address; // KYC the deployer (currently false on the prod KYC)
  const govData = kyc.interface.encodeFunctionData("setKYCed", [subject, true]);
  const delay = Number(await tl.getMinDelay());
  const salt = ethers.id("gov-demo-" + Math.floor(Date.now() / 1000));
  const opId = await tl.hashOperation(c.KYCRegistry, 0, govData, ethers.ZeroHash, salt);
  console.log(`  timelock delay: ${delay}s | subject isKYCed(before): ${await kyc.isKYCed(subject)}`);

  // 1. Safe schedules
  console.log("\n[1] Safe schedules setKYCed via the Timelock");
  const scheduleData = tl.interface.encodeFunctionData("schedule", [c.KYCRegistry, 0, govData, ethers.ZeroHash, salt, delay]);
  await execSafeTx(c.Safe, chainId, c.ASSATimelock, scheduleData, deployer);
  console.log(`  scheduled. opId=${opId}`);

  // 2. wait the delay
  console.log(`\n[2] waiting ${delay + 15}s …`);
  await new Promise((r) => setTimeout(r, (delay + 15) * 1000));
  let ready = false;
  for (let i = 0; i < 10; i++) {
    if (Number(await tl.getOperationState(opId)) === 2) { ready = true; break; }
    await new Promise((r) => setTimeout(r, 4000));
  }
  console.log(`  operation Ready: ${ready}`);

  // 3. Safe executes
  console.log("\n[3] Safe executes the queued op");
  const executeData = tl.interface.encodeFunctionData("execute", [c.KYCRegistry, 0, govData, ethers.ZeroHash, salt]);
  await execSafeTx(c.Safe, chainId, c.ASSATimelock, executeData, deployer);

  // 4. verify (retry for RPC lag)
  let after = false, done = false;
  for (let i = 0; i < 8; i++) {
    after = await kyc.isKYCed(subject);
    done = Number(await tl.getOperationState(opId)) === 3;
    if (after && done) break;
    await new Promise((r) => setTimeout(r, 3000));
  }
  console.log("\n" + "─".repeat(60));
  console.log(`  ${after ? "✓" : "✗"} KYCRegistry.isKYCed(subject) = ${after}`);
  console.log(`  ${done ? "✓" : "✗"} timelock op state = Done`);
  console.log(after && done
    ? "✅ Production stack governed end-to-end: Safe(2of3) → 60s Timelock → execute → state changed."
    : "❌ Loop did not complete.");
  if (!(after && done)) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
