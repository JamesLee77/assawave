/**
 * Mainnet deploy pre-flight (read-only — never prints or handles the private key).
 *
 * Run BEFORE `npm run deploy:token:mainnet`:
 *   npx hardhat run scripts/preflight-mainnet.ts --network base
 *
 * Confirms: right chain (Base 8453), MAINNET_PRIVATE_KEY actually set (not the
 * unfunded dummy fallback), deployer address (= ASSAToken admin), and a funded
 * balance. Exits non-zero on any failed gate so a bad deploy never starts.
 */
import { ethers, network } from "hardhat";

// Address of the DUMMY_KEY (0x..01) used by hardhat.config when MAINNET_PRIVATE_KEY is unset.
const DUMMY_ADDRESS = "0x7E5F4552091A69125d5DfCb7b8C2659029395Bdf";
const MIN_ETH = ethers.parseEther("0.002"); // comfortable floor for deploy + verify + 1 role tx

async function main() {
  console.log(`\n=== Mainnet pre-flight ===`);
  console.log(`  network: ${network.name}`);

  const net = await ethers.provider.getNetwork();
  console.log(`  chainId: ${net.chainId}`);
  let ok = true;

  if (net.chainId !== 8453n) {
    console.error(`  ✗ expected Base mainnet (8453); refusing. Use --network base.`);
    ok = false;
  }

  const [deployer] = await ethers.getSigners();
  console.log(`  deployer (= ASSAToken admin): ${deployer.address}`);

  if (deployer.address.toLowerCase() === DUMMY_ADDRESS.toLowerCase()) {
    console.error(`  ✗ MAINNET_PRIVATE_KEY is NOT set — this is the unfunded dummy key.`);
    console.error(`    Put your fresh deployer key in assawave/.env (MAINNET_PRIVATE_KEY=0x...).`);
    ok = false;
  }

  const bal = await ethers.provider.getBalance(deployer.address);
  console.log(`  balance: ${ethers.formatEther(bal)} ETH`);
  if (bal < MIN_ETH) {
    console.error(`  ✗ balance below ${ethers.formatEther(MIN_ETH)} ETH — fund this address on Base mainnet first.`);
    ok = false;
  }

  // Sanity: the production token has no premint and a 10B cap; nothing to read on-chain
  // yet (not deployed), so just echo what WILL be deployed.
  console.log(`  will deploy: ASSAToken("ASSA WAVE","ASSA"), 10B cap, admin=${deployer.address}`);

  if (!ok) {
    console.error(`\n  PRE-FLIGHT FAILED — do not deploy.\n`);
    process.exitCode = 1;
    return;
  }
  console.log(`\n  ✓ Pre-flight passed. Ready: npm run deploy:token:mainnet\n`);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
