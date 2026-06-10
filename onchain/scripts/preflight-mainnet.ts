/**
 * Mainnet deploy pre-flight (read-only — never prints or handles the private key).
 *
 * Run BEFORE `npm run deploy:token:mainnet`:
 *   npx hardhat run scripts/preflight-mainnet.ts --network base
 *
 * Works in BOTH states so you can check funding before restoring the key:
 *   - key NOT set: reads the intended deployer from deployments/base.json and
 *     reports its live balance; flags that MAINNET_PRIVATE_KEY must be restored.
 *   - key set: also confirms the configured signer derives to that same deployer.
 *
 * Gates: right chain (Base 8453), deployer funded, key restored + matching, and
 * that the legacy ASSAToken address is preserved (deploy-token overwrites the
 * "ASSAToken" registry key with v2 — the legacy 10M token must stay recorded).
 */
import { ethers, network } from "hardhat";
import { loadRegistry } from "./lib";

// Address of the DUMMY_KEY (0x..01) used by hardhat.config when MAINNET_PRIVATE_KEY is unset.
const DUMMY_ADDRESS = "0x7E5F4552091A69125d5DfCb7b8C2659029395Bdf";
const MIN_ETH = ethers.parseEther("0.002"); // comfortable floor for deploy + verify

async function main() {
  console.log(`\n=== Mainnet v2 ASSAToken deploy pre-flight ===`);
  console.log(`  network: ${network.name}`);
  let ok = true;

  const net = await ethers.provider.getNetwork();
  console.log(`  chainId: ${net.chainId}`);
  if (net.chainId !== 8453n) {
    console.error(`  ✗ expected Base mainnet (8453); refusing. Use --network base.`);
    ok = false;
  }

  const reg = loadRegistry();
  const intended = reg.deployer; // 0x7C5a… — the funded EOA that will be ASSAToken admin
  console.log(`  intended deployer (registry): ${intended}`);

  // Live balance of the intended deployer — read by ADDRESS so it works even
  // before MAINNET_PRIVATE_KEY is restored.
  const bal = await ethers.provider.getBalance(intended);
  console.log(`  balance: ${ethers.formatEther(bal)} ETH`);
  if (bal < MIN_ETH) {
    console.error(`  ✗ below ${ethers.formatEther(MIN_ETH)} ETH — fund ${intended} on Base mainnet first.`);
    ok = false;
  }

  // Is the key restored and matching the intended deployer?
  const [signer] = await ethers.getSigners();
  if (signer.address.toLowerCase() === DUMMY_ADDRESS.toLowerCase()) {
    console.error(`  ✗ MAINNET_PRIVATE_KEY is NOT set (signer is the unfunded dummy).`);
    console.error(`    Restore it in assawave/.env (MAINNET_PRIVATE_KEY=0x…) before deploying.`);
    ok = false;
  } else if (signer.address.toLowerCase() !== intended.toLowerCase()) {
    console.error(`  ✗ MAINNET_PRIVATE_KEY derives to ${signer.address}`);
    console.error(`    but the registry deployer is ${intended}. Wrong key — fix before deploying.`);
    ok = false;
  } else {
    console.log(`  signer matches intended deployer ✓`);
  }

  // Legacy-overwrite guard: deploy-token records "ASSAToken" = v2, overwriting
  // the legacy entry. Make sure the legacy 10M token is preserved elsewhere.
  const legacy = reg.contracts.ASSAToken;
  const legacyPreserved = reg.contracts.ASSATokenLegacy;
  console.log(`  current "ASSAToken" in registry: ${legacy} (legacy 10M token)`);
  if (legacyPreserved) {
    console.log(`  legacy preserved as ASSATokenLegacy ✓ (${legacyPreserved})`);
  } else {
    console.error(`  ✗ no ASSATokenLegacy key — deploying v2 would overwrite the only legacy record.`);
    console.error(`    Add "ASSATokenLegacy": "${legacy}" to deployments/base.json first.`);
    ok = false;
  }

  console.log(`  will deploy: ASSAToken("ASSA WAVE","ASSA"), 10B cap, admin=${intended} (v2: no BURNER_ROLE, totalMinted cap)`);

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
