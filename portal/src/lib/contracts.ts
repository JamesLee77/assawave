/**
 * Deployed ASSA WAVE contract addresses + minimal ABIs.
 *
 * Env-driven: VITE_ENV=mainnet → Base mainnet contracts;
 * VITE_ENV=testnet → Base Sepolia contracts.
 *
 * The investor-facing surface is split into two single-chain builds
 * (app.assawave.io + app-testnet.assawave.io) so an investor never has to
 * wonder which chain they're on.
 *
 * ⚠️ Addresses are filled AFTER deployment from onchain/deployments/<network>.json.
 *    Phase-1 contracts deploy to Base Sepolia first (audit gate), then mainnet.
 *    Until then they are the zero address and the UI shows a "not yet live" state.
 */
import type { Address } from "viem";
import { ADMIN_CHAIN_ID, ADMIN_EXPLORER, IS_MAINNET } from "./env";

const ZERO = "0x0000000000000000000000000000000000000000" as Address;

const CONTRACTS_MAINNET = {
  // Fill from onchain/deployments/base.json after Audit #1/#2 + mainnet deploy:
  assaToken: ZERO,
  tokenSale: ZERO,
  tokenVesting: ZERO,
  stakingLock: ZERO,
  bmeBurner: ZERO,
  kycRegistry: ZERO,
  treasury: ZERO,
  timelock: ZERO,
  usdc: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as Address, // canonical Base USDC
};

const CONTRACTS_TESTNET = {
  // Base Sepolia redeploy 2026-05-31 (60s timelock; onchain/deployments/baseSepolia.json):
  assaToken: "0x58233B116D933191D57bF719b4fF8e93d338aB3b" as Address,
  tokenSale: "0xf7206474d4e9395ce296443Fcdb55089338b3554" as Address,
  tokenVesting: "0xa7a5FB17F9dA8b09661e8c8940167AfB060363a5" as Address,
  stakingLock: "0xd3C68d0dcf095c662F4B844be24cFa5D965fCFC6" as Address,
  bmeBurner: ZERO, // not deployed on testnet (needs a DEX pool/router)
  kycRegistry: "0x96771b35fB6f2F3D045aE837ff9559365196b0d8" as Address,
  treasury: "0x590608e02e8992D7537e5dD50Ad1c5896C296424" as Address,
  timelock: "0xf6977062D646623766Ce6024266C215aB8A92111" as Address,
  usdc: "0x429F42Cea1977720bc97eC9d0CD45f7465F76F55" as Address, // MockUSDC (6dec)
};

/** Active contract set — pinned by build env. */
export const CONTRACTS = IS_MAINNET ? CONTRACTS_MAINNET : CONTRACTS_TESTNET;

/** Active chain id, pinned by build. */
export const CHAIN_ID = ADMIN_CHAIN_ID;

/** Active block explorer base URL. */
export const EXPLORER = ADMIN_EXPLORER;

/** True once real addresses are wired in (zero address = contract not live yet). */
export const CONTRACTS_LIVE = CONTRACTS.assaToken !== ZERO;

// ===================== ASSAToken =====================

export const ASSATokenAbi = [
  { type: "function", name: "name", inputs: [], outputs: [{ type: "string" }], stateMutability: "view" },
  { type: "function", name: "symbol", inputs: [], outputs: [{ type: "string" }], stateMutability: "view" },
  { type: "function", name: "decimals", inputs: [], outputs: [{ type: "uint8" }], stateMutability: "view" },
  { type: "function", name: "totalSupply", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "balanceOf", inputs: [{ type: "address" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "allowance", inputs: [{ type: "address" }, { type: "address" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "approve", inputs: [{ type: "address" }, { type: "uint256" }], outputs: [{ type: "bool" }], stateMutability: "nonpayable" },
  { type: "function", name: "transfer", inputs: [{ type: "address" }, { type: "uint256" }], outputs: [{ type: "bool" }], stateMutability: "nonpayable" },
  { type: "function", name: "CAP", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "getVotes", inputs: [{ type: "address" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "delegate", inputs: [{ type: "address" }], outputs: [], stateMutability: "nonpayable" },
] as const;

// ===================== TokenSale =====================

export const TokenSaleAbi = [
  // reads
  { type: "function", name: "assaToken", inputs: [], outputs: [{ type: "address" }], stateMutability: "view" },
  { type: "function", name: "usdcToken", inputs: [], outputs: [{ type: "address" }], stateMutability: "view" },
  { type: "function", name: "getRoundCount", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  {
    type: "function",
    name: "getRound",
    inputs: [{ type: "uint256" }],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "name", type: "string" },
          { name: "priceUsdc", type: "uint256" },
          { name: "hardCapTokens", type: "uint128" },
          { name: "soldTokens", type: "uint128" },
          { name: "startTime", type: "uint64" },
          { name: "endTime", type: "uint64" },
          { name: "cliffSeconds", type: "uint32" },
          { name: "vestSeconds", type: "uint32" },
          { name: "tgeBps", type: "uint16" },
          { name: "active", type: "bool" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "allocations",
    inputs: [{ type: "uint256" }, { type: "address" }],
    outputs: [
      { name: "totalAllocated", type: "uint128" },
      { name: "claimed", type: "uint128" },
      { name: "startTime", type: "uint64" },
      { name: "cliffSeconds", type: "uint32" },
      { name: "vestSeconds", type: "uint32" },
      { name: "tgeBps", type: "uint16" },
    ],
    stateMutability: "view",
  },
  { type: "function", name: "whitelist", inputs: [{ type: "uint256" }, { type: "address" }], outputs: [{ type: "bool" }], stateMutability: "view" },
  { type: "function", name: "claimable", inputs: [{ name: "roundId", type: "uint256" }, { name: "user", type: "address" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "quoteUsdc", inputs: [{ type: "uint256" }, { type: "uint256" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
  // investor writes
  { type: "function", name: "purchase", inputs: [{ name: "roundId", type: "uint256" }, { name: "assaAmount", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "claim", inputs: [{ name: "roundId", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  // events
  { type: "event", name: "Purchased", inputs: [
    { type: "uint256", indexed: true },
    { type: "address", indexed: true },
    { type: "uint256" },
    { type: "uint256" },
  ] },
  { type: "event", name: "Claimed", inputs: [
    { type: "uint256", indexed: true },
    { type: "address", indexed: true },
    { type: "uint256" },
  ] },
] as const;

// ===================== TokenVesting =====================

export const TokenVestingAbi = [
  {
    type: "function",
    name: "schedules",
    inputs: [{ type: "uint256" }],
    outputs: [
      { name: "beneficiary", type: "address" },
      { name: "total", type: "uint256" },
      { name: "claimed", type: "uint256" },
      { name: "start", type: "uint256" },
      { name: "cliff", type: "uint256" },
      { name: "duration", type: "uint256" },
      { name: "tgeBps", type: "uint16" },
      { name: "category", type: "uint8" },
      { name: "revocable", type: "bool" },
      { name: "revoked", type: "bool" },
    ],
    stateMutability: "view",
  },
  { type: "function", name: "scheduleIdsOf", inputs: [{ type: "address" }], outputs: [{ type: "uint256[]" }], stateMutability: "view" },
  { type: "function", name: "scheduleCountOf", inputs: [{ type: "address" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "releasable", inputs: [{ type: "uint256" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "vestedOf", inputs: [{ type: "uint256" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "release", inputs: [{ type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "releaseAll", inputs: [], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "getScheduleCount", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
] as const;

// ===================== StakingLock (veASSA) =====================

export const StakingLockAbi = [
  {
    type: "function",
    name: "locks",
    inputs: [{ type: "address" }],
    outputs: [
      { name: "amount", type: "uint128" },
      { name: "start", type: "uint64" },
      { name: "end", type: "uint64" },
    ],
    stateMutability: "view",
  },
  { type: "function", name: "votingPower", inputs: [{ type: "address" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "votingPowerAt", inputs: [{ type: "address" }, { type: "uint256" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "tierOf", inputs: [{ type: "address" }], outputs: [{ type: "uint8" }], stateMutability: "view" },
  { type: "function", name: "tierWeight", inputs: [{ type: "address" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "totalLocked", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "MAX_LOCK_DURATION", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "MIN_LOCK_DURATION", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  // writes
  { type: "function", name: "lock", inputs: [{ name: "amount", type: "uint256" }, { name: "duration", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "increaseAmount", inputs: [{ name: "amount", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "increaseUnlockTime", inputs: [{ name: "duration", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "withdraw", inputs: [], outputs: [], stateMutability: "nonpayable" },
] as const;

// ===================== KYCRegistry =====================

export const KYCRegistryAbi = [
  { type: "function", name: "isKYCed", inputs: [{ type: "address" }], outputs: [{ type: "bool" }], stateMutability: "view" },
  { type: "function", name: "kycedCount", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
] as const;

// ===================== USDC =====================

export const USDCAbi = [
  { type: "function", name: "name", inputs: [], outputs: [{ type: "string" }], stateMutability: "view" },
  { type: "function", name: "symbol", inputs: [], outputs: [{ type: "string" }], stateMutability: "view" },
  { type: "function", name: "decimals", inputs: [], outputs: [{ type: "uint8" }], stateMutability: "view" },
  { type: "function", name: "balanceOf", inputs: [{ type: "address" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "allowance", inputs: [{ type: "address" }, { type: "address" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "approve", inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }], outputs: [{ type: "bool" }], stateMutability: "nonpayable" },
] as const;
