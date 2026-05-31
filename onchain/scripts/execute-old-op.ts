/**
 * Execute the op queued on the OLD 48h timelock by safe-propose.ts (b352370).
 * Only works AFTER the 48h delay elapses (ETA 2026-06-02T03:50:28Z).
 *
 *   npm run execute:old:sepolia
 *
 * The old timelock's executor is the real Safe, so this goes through a 2-of-3 Safe tx.
 * Guards on operation state: refuses (cleanly) until Ready.
 */
import { ethers } from "hardhat";
import { banner } from "./lib";

const OLD_TL = "0xbe357Dc9165b6A9c6cc1236F337607b110Bd1b11";
const OLD_KYC = "0xcabD38a3543EfdE6830CB3F4486792DfC8A7E088";
const SAFE = "0xb3F22b9afE0c4f16400b2CAb7A85C5d6a02DeD73";
const SUBJECT = "0x9eA78182701B6f16cC8EB1A0817B0a42e1261D7F";
const SALT = ethers.id("safe-gov-1");

const SAFE_ABI = [
  "function nonce() view returns (uint256)",
  "function execTransaction(address to,uint256 value,bytes data,uint8 operation,uint256 safeTxGas,uint256 baseGas,uint256 gasPrice,address gasToken,address refundReceiver,bytes signatures) payable returns (bool)",
];

async function execSafeTx(chainId: number, to: string, data: string, relayer: any) {
  const safe = new ethers.Contract(SAFE, SAFE_ABI, relayer);
  const nonce = await safe.nonce();
  const domain = { chainId, verifyingContract: SAFE };
  const types = { SafeTx: [
    { name: "to", type: "address" }, { name: "value", type: "uint256" }, { name: "data", type: "bytes" },
    { name: "operation", type: "uint8" }, { name: "safeTxGas", type: "uint256" }, { name: "baseGas", type: "uint256" },
    { name: "gasPrice", type: "uint256" }, { name: "gasToken", type: "address" }, { name: "refundReceiver", type: "address" },
    { name: "nonce", type: "uint256" } ] };
  const msg = { to, value: 0, data, operation: 0, safeTxGas: 0, baseGas: 0, gasPrice: 0, gasToken: ethers.ZeroAddress, refundReceiver: ethers.ZeroAddress, nonce };
  const owners = [new ethers.Wallet(process.env.PRIVATE_KEY!), new ethers.Wallet(process.env.TEST_PRIVATE_KEY!)];
  const signed = await Promise.all(owners.map(async (w) => ({ addr: w.address.toLowerCase(), sig: await w.signTypedData(domain, types, msg) })));
  signed.sort((a, b) => (a.addr < b.addr ? -1 : 1));
  const signatures = "0x" + signed.map((s) => s.sig.slice(2)).join("");
  return (await safe.execTransaction(to, 0, data, 0, 0, 0, 0, ethers.ZeroAddress, ethers.ZeroAddress, signatures, { gasLimit: 600_000 })).wait();
}

async function main() {
  banner("Execute the old 48h timelock op (via Safe)");
  const [deployer] = await ethers.getSigners();
  const chainId = Number((await ethers.provider.getNetwork()).chainId);
  const tl = await ethers.getContractAt("ASSATimelock", OLD_TL);
  const kyc = await ethers.getContractAt("KYCRegistry", OLD_KYC);
  const govData = kyc.interface.encodeFunctionData("setKYCed", [SUBJECT, true]);
  const opId = await tl.hashOperation(OLD_KYC, 0, govData, ethers.ZeroHash, SALT);

  const state = Number(await tl.getOperationState(opId)); // 0 Unset,1 Waiting,2 Ready,3 Done
  const ts = Number(await tl.getTimestamp(opId));
  const now = (await ethers.provider.getBlock("latest"))!.timestamp;
  console.log(`  opId: ${opId}\n  state: ${["Unset","Waiting","Ready","Done"][state]}  eta: ${ts ? new Date(ts*1000).toISOString() : "n/a"}`);

  if (state === 3) { console.log("  • already executed (Done). isKYCed:", await kyc.isKYCed(SUBJECT)); return; }
  if (state !== 2) {
    console.log(`  ⏳ not ready — ${Math.max(0, Math.round((ts-now)/3600))}h remaining until ${new Date(ts*1000).toISOString()}. Re-run after that.`);
    process.exitCode = 1;
    return;
  }

  console.log("  before isKYCed:", await kyc.isKYCed(SUBJECT));
  const executeData = tl.interface.encodeFunctionData("execute", [OLD_KYC, 0, govData, ethers.ZeroHash, SALT]);
  await execSafeTx(chainId, OLD_TL, executeData, deployer);

  let done = false, after = false;
  for (let i = 0; i < 8; i++) {
    after = await kyc.isKYCed(SUBJECT);
    done = Number(await tl.getOperationState(opId)) === 3;
    if (after && done) break;
    await new Promise((r) => setTimeout(r, 3000));
  }
  console.log(after && done ? `\n✅ Executed. isKYCed(${SUBJECT.slice(0,8)}…)=${after}, op Done.` : "\n❌ execute did not finalize.");
  if (!(after && done)) process.exitCode = 1;
}

main().catch((e) => { console.error(e); process.exitCode = 1; });
