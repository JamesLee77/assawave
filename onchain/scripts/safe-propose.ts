/**
 * Prove the real Safe multisig can drive the Timelock: collect 2-of-3 owner
 * signatures and execute a Safe transaction that calls timelock.schedule(...) for a
 * genuine governance action (KYCRegistry.setKYCed via the Timelock, which now holds
 * KYC_OPERATOR_ROLE). The op is then queued behind the 48h delay.
 *
 *   npm run safe:propose:sepolia
 *
 * Signatures are EIP-712 SafeTx signatures from two owners (deployer + test key),
 * packed sorted by address. The deployer submits execTransaction and pays gas.
 * 48h later the same op can be executed via timelock.execute(...) (or a Safe tx to it).
 */
import { ethers } from "hardhat";
import { loadRegistry, banner } from "./lib";

const SAFE_ABI = [
  "function nonce() view returns (uint256)",
  "function getThreshold() view returns (uint256)",
  "function isOwner(address) view returns (bool)",
  "function execTransaction(address to,uint256 value,bytes data,uint8 operation,uint256 safeTxGas,uint256 baseGas,uint256 gasPrice,address gasToken,address refundReceiver,bytes signatures) payable returns (bool)",
];

async function main() {
  banner("Prove Safe → Timelock governance proposal");
  const c = loadRegistry().contracts;
  if (!c.Safe) throw new Error("No Safe in registry. Run deploy:safe:sepolia first.");
  const [deployer] = await ethers.getSigners();
  const chainId = Number((await ethers.provider.getNetwork()).chainId);

  const safe = new ethers.Contract(c.Safe, SAFE_ABI, deployer);
  const tl = await ethers.getContractAt("ASSATimelock", c.ASSATimelock);
  const kyc = await ethers.getContractAt("KYCRegistry", c.KYCRegistry);

  // ── Governance action the Timelock will perform after the delay ──
  const govTarget = c.KYCRegistry;
  const subject = new ethers.Wallet(process.env.SAFE_PRIVATE_KEY!).address; // KYC this address
  const govData = kyc.interface.encodeFunctionData("setKYCed", [subject, true]);
  const delay = await tl.getMinDelay();
  const salt = ethers.id("safe-gov-1");
  const predecessor = ethers.ZeroHash;

  const scheduleData = tl.interface.encodeFunctionData("schedule", [govTarget, 0, govData, predecessor, salt, delay]);
  const opId = await tl.hashOperation(govTarget, 0, govData, predecessor, salt);
  console.log(`  Safe: ${c.Safe} (threshold ${await safe.getThreshold()})`);
  console.log(`  action: schedule KYCRegistry.setKYCed(${subject.slice(0, 10)}…) via Timelock`);
  console.log(`  opId: ${opId}`);

  if (await tl.isOperation(opId)) {
    console.log("  • operation already scheduled — nothing to do");
    return;
  }

  // ── Build + sign the Safe transaction (to=Timelock, data=schedule-calldata) ──
  const nonce = await safe.nonce();
  const domain = { chainId, verifyingContract: c.Safe };
  const types = {
    SafeTx: [
      { name: "to", type: "address" },
      { name: "value", type: "uint256" },
      { name: "data", type: "bytes" },
      { name: "operation", type: "uint8" },
      { name: "safeTxGas", type: "uint256" },
      { name: "baseGas", type: "uint256" },
      { name: "gasPrice", type: "uint256" },
      { name: "gasToken", type: "address" },
      { name: "refundReceiver", type: "address" },
      { name: "nonce", type: "uint256" },
    ],
  };
  const message = {
    to: c.ASSATimelock,
    value: 0,
    data: scheduleData,
    operation: 0,
    safeTxGas: 0,
    baseGas: 0,
    gasPrice: 0,
    gasToken: ethers.ZeroAddress,
    refundReceiver: ethers.ZeroAddress,
    nonce,
  };

  // Two owners sign (deployer + test). Packed signatures must be sorted by signer address.
  const owner1 = new ethers.Wallet(process.env.PRIVATE_KEY!);
  const owner2 = new ethers.Wallet(process.env.TEST_PRIVATE_KEY!);
  const signed = await Promise.all(
    [owner1, owner2].map(async (w) => ({ addr: w.address.toLowerCase(), sig: await w.signTypedData(domain, types, message) }))
  );
  signed.sort((a, b) => (a.addr < b.addr ? -1 : 1));
  const signatures = "0x" + signed.map((s) => s.sig.slice(2)).join("");
  console.log(`  signed by 2 owners: ${signed.map((s) => s.addr.slice(0, 10)).join(", ")}`);

  // ── Execute the Safe tx (deployer relays + pays gas) ──
  const tx = await safe.execTransaction(
    message.to, message.value, message.data, message.operation,
    message.safeTxGas, message.baseGas, message.gasPrice, message.gasToken, message.refundReceiver,
    signatures
  );
  const rcpt = await tx.wait();
  console.log(`  execTransaction mined (block ${rcpt!.blockNumber})`);

  // ── Verify the timelock op is now queued (retry: load-balanced RPCs lag after a write) ──
  let pending = false;
  let ts = 0n;
  for (let i = 0; i < 6; i++) {
    pending = await tl.isOperationPending(opId);
    ts = await tl.getTimestamp(opId);
    if (pending) break;
    await new Promise((r) => setTimeout(r, 3000));
  }
  const eta = new Date(Number(ts) * 1000).toISOString();
  console.log("\n" + "─".repeat(60));
  console.log(`  ${pending ? "✓" : "✗"} Timelock operation pending: ${pending}`);
  console.log(`  ⏱ executable after: ${eta} (48h delay)`);
  console.log(pending
    ? "✅ Real 2-of-3 Safe successfully proposed a governance action through the Timelock."
    : "❌ Operation not pending — proposal failed.");
  if (!pending) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
