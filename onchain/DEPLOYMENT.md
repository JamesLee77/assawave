# ASSA WAVE — Phase 1 Deployment Runbook

Hardhat + OpenZeppelin v5 + ethers v6. Solidity `0.8.24` (cancun, optimizer 200).
Target chains: **Base Sepolia** (`84532`) → audit → **Base mainnet** (`8453`).

## Contracts (Phase 1)

| Contract | Purpose |
|---|---|
| `ASSAToken` | ERC-20 (Permit + Votes + Burnable), 10B LIFETIME hard cap (`totalMinted`), role-gated mint; burn is the public allowance-gated ERC20Burnable path |
| `KYCRegistry` | On-chain `isKYCed` allowlist (off-chain OFAC/nationality pre-filter) |
| `Treasury` | USDC receiver + $ASSA bucket vault, withdrawals gated by `TREASURY_ROLE` |
| `ASSATimelock` | OZ TimelockController, 48h floor (relaxed on local chains) |
| `TokenVesting` | Categorized TGE + cliff + linear schedules (Founder/Team/Investor/…) |
| `TokenSale` | 3-round fixed-price USDC sale, self-vesting allocations (weighted-average top-up anchor), solvency-gated purchases, optional per-buyer cap, Pausable |
| `StakingLock` | veASSA — zero-yield lock, linear decay, checkpoint history |
| `BMEBurner` | USDC → $ASSA swap + permanent burn (needs a seeded DEX pool) |

## Vesting / sale accounting (single source of truth — Spec §3.3)

```
tge    = total * tgeBps / 1e4                       # unlocked at start
linear = (total - tge) over [start+cliff, start+cliff+duration]
vested(t):
  t < start                          -> 0
  start <= t < start+cliff           -> tge
  start+cliff <= t < +duration       -> tge + (total-tge)*(t-(start+cliff))/duration
  t >= start+cliff+duration          -> total
```
`duration` is the linear window measured **after** the cliff (R1 "Linear 18m" ⇒ full vest at cliff+18m).

## 0. Prerequisites

`.env` at the **repo root** (`assawave/.env`, gitignored) — see `hardhat.config.ts`:

```
PRIVATE_KEY=0x...              # testnet deployer (throwaway)
MAINNET_PRIVATE_KEY=0x...      # mainnet deployer (hardware key)
BASE_SEPOLIA_RPC=https://sepolia.base.org
BASE_MAINNET_RPC=https://mainnet.base.org
BASESCAN_API_KEY=...           # Etherscan v2 unified key

# optional overrides (else sensible defaults / mocks):
USDC_ADDRESS=0x...             # canonical Base USDC on mainnet by default
BASE_DEX_ROUTER=0x...          # Aerodrome/Uniswap router — REQUIRED for BME on live chains
SAFE_SIGNERS=0xSafeContract    # timelock proposer/executor = the Safe CONTRACT address (single entry — NEVER owner EOAs; deploy.ts hard-fails on mainnet otherwise)
TIMELOCK_MIN_DELAY=172800      # 48h
```

## 1. Build & test

```bash
npm run compile
npm test          # 77 passing
npm run coverage  # core modules 91–100% stmts
```

## 2. Deploy

Full suite (writes `deployments/<network>.json`):

```bash
npm run deploy:local           # in-process hardhat (mocks USDC + DEX)
npm run deploy:full:sepolia    # Base Sepolia
npm run deploy:full:mainnet    # Base mainnet
```

Or per contract (each reads deps from the registry / env):

```bash
npm run deploy:token:sepolia
npm run deploy:kyc:sepolia
npm run deploy:vesting:sepolia
npm run deploy:sale:sepolia
npm run deploy:staking:sepolia
npm run deploy:bme:sepolia      # requires BASE_DEX_ROUTER + a seeded ASSA/USDC pool
```

> **BME pre-requisite:** create the ASSA/USDC pool and seed initial LP **before** deploying
> `BMEBurner`. On live chains the full deploy skips BME unless `BASE_DEX_ROUTER` is set.

## 3. Funding Gate (BEFORE handoff)

While the deployer still holds `MINTER_ROLE`:

1. **Mint** TGE float + pool allocations:
   - `ASSAToken.mint(TokenSale, Σ round hard caps)`
   - `ASSAToken.mint(TokenVesting, Σ schedule totals)`
   - any veASSA/treasury seed amounts.
2. **Configure sale rounds** — launch discipline: `configureRound(..., active=false)` →
   verify price/caps/schedule on-chain (`getRound`) → optionally `setMaxPerBuyer(roundId, cap)` →
   `setWhitelist(roundId, [...], true)` → `setRoundActive(roundId, true)` LAST.
   A LIVE round is price-frozen once it sells; to correct a misconfigured sold round,
   `setRoundActive(roundId, false)` first (existing buyers keep their frozen terms;
   the cap can never drop below soldTokens). `purchase` requires the contract to be
   funded for ALL outstanding obligations — fund before activating.
3. **Create vesting schedules** — `TokenVesting.createSchedule(...)` per category
   (Founder 0%/12m/48m · Team 0%/12m/36m · Investor · Partner · ECO).
4. **Treasury buckets** — `Treasury.setBucketAllocation(bucket, cap)` for the distribution split.
5. **KYC** — `KYCRegistry.setKYCedBatch([...], true)` after off-chain OFAC + nationality screening.

> ⚠️ Order matters: funding/config must complete **before** the handoff, or roles needed to
> mint/configure move behind the 48h timelock (operational freeze).

## 4. Handoff to Timelock/Safe

Dry run prints the plan; `CONFIRM_HANDOFF=1` executes (grants every contract's roles to the
Timelock, then renounces the deployer EOA — `MINTER_ROLE` stays with the Timelock for the
replenishment runbook):

```bash
npx hardhat run scripts/handoff.ts --network baseSepolia                  # dry run
CONFIRM_HANDOFF=1 npx hardhat run scripts/handoff.ts --network baseSepolia # execute
```

Post-handoff: every privileged action goes through the Safe → 48h Timelock.

## 5. Verify on Basescan

```bash
npm run verify:sepolia <address> [constructor args...]
npm run verify:mainnet <address> [constructor args...]
```

## 6. Hard gates (do not skip)

- **External Audit #1** (Token · Sale · Vesting · KYC) — 0 critical/high before the sale.
- **External Audit #2** (veASSA · BMEBurner) — 0 critical/high before staking/BME mainnet.
- **Legal GO** (VAUPA / securities) before `configureRound` / `withdraw` on mainnet.
- Safe 2-of-3 + 48h Timelock handoff rehearsed on Sepolia; EOA renounced.
