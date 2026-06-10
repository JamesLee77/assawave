/**
 * Read-only preflight for the Sepolia TokenSale/TokenVesting redeploy.
 * Confirms the signer key, ETH balance, and whether the deployer can still
 * mint $ASSA on the existing token (handoff renounces MINTER from the deployer).
 *   npx hardhat run scripts/preflight-sepolia-redeploy.ts --network baseSepolia
 */
import { ethers, network } from "hardhat";
import { loadRegistry } from "./lib";

async function main() {
  const reg = loadRegistry();
  const c = reg.contracts;
  const [deployer] = await ethers.getSigners();
  const bal = await ethers.provider.getBalance(deployer.address);

  console.log(`\n=== Sepolia redeploy preflight (${network.name}) ===`);
  console.log(`  signer (deployer): ${deployer.address}`);
  console.log(`  registry deployer: ${reg.deployer}`);
  console.log(`  ETH balance:       ${ethers.formatEther(bal)}`);
  console.log(`  existing TokenSale:    ${c.TokenSale}`);
  console.log(`  existing TokenVesting: ${c.TokenVesting}`);

  const assa = await ethers.getContractAt("ASSAToken", c.ASSAToken);
  const MINTER = await assa.MINTER_ROLE();
  const canMint = await assa.hasRole(MINTER, deployer.address);
  const tlHasMinter = c.ASSATimelock ? await assa.hasRole(MINTER, c.ASSATimelock) : false;
  console.log(`\n  ASSAToken: ${c.ASSAToken}`);
  console.log(`  deployer holds MINTER: ${canMint ? "yes ✓ (configure:sepolia can fund directly)" : "NO ✗ (renounced via handoff — funding needs the Timelock gov path)"}`);
  console.log(`  Timelock holds MINTER: ${tlHasMinter} (${c.ASSATimelock})`);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
