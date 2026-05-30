# ASSA WAVE — Smart Contract Development Spec

> **Status:** Draft v0.1 · **Date:** 2026-05 · **Chain:** Base (Ethereum L2) → Custom L3 (Phase 2+)
> **Source:** Whitepaper v2.0 / Financial Model (ASSA_WAVE_Simulation.xlsx)
> This document is the specification for initiating development. Token and sale parameters will be finalized after regulatory and audit reviews.

---

## 0. Summary (TL;DR)

| Item | Decision |
|---|---|
| Chain | **Base** (mainnet `8453`, testnet Base Sepolia `84532`). Phase 2+ Custom **L3 (OP Stack)**, $ASSA bridge |
| Token Standard | $ASSA = **ERC-20** (10B hard cap), NFT = **ERC-1155** |
| Language/Tools | Solidity `^0.8.24`, **OpenZeppelin v5**, **Foundry** (forge/cast), Slither/Echidna |
| Upgradability | Evolution modules use **UUPS proxy** + Timelock·Multisig governance. Token core is minimal upgradability / immutable. |
| Permissions | **AccessControl** roles + **Gnosis Safe (Multisig)** + **TimelockController** |
| Core Principles | Staking is **interest-free lockup** (no emission). Spending is a **burn sink** (70% burn). Mining emission is front-loaded. |

First Principle of Design: **Mining (supply) is absorbed by staking lockup and consumption burn (demand).** The smart contracts enforce this balance on-chain.

---

## 1. Architecture (Module Map)

```
                         ┌──────────────────────────────┐
                         │        Governance Layer        │
                         │  Gnosis Safe ──▶ TimelockCtrl  │  (UPGRADER/ADMIN)
                         └───────────────┬───────────────┘
                                         │ owns/admin
   ┌──────────────┐   mint   ┌───────────▼───────────┐   burn   ┌──────────────┐
   │ MiningRewards│ ───────▶ │      ASSAToken (ERC20)│ ◀─────── │  BMEBurner   │
   │  (Phase 2)   │          │   cap 10B · Permit·Votes│         │ (revenue→burn)│
   └──────┬───────┘          └───────┬────────┬───────┘         └──────▲───────┘
          │ rewards                  │transfer│ lock                   │ USDC
   ┌──────▼───────┐          ┌───────▼──┐ ┌───▼─────────┐       ┌──────┴───────┐
   │EdgeNodeRegis │          │TokenSale │ │ StakingLock │       │   Treasury   │
   │  (Phase 2)   │          │+Vesting  │ │ (veASSA, no yield)│    │ (allocations)│
   └──────────────┘          └──────────┘ └───┬─────────┘       └──────────────┘
                                               │ weight
   ┌─────────────────────────────────────────▼───────────────────────────────┐
   │  ConsumptionEngine (Phase 2) ─ spend→70% burn/30% prize ─ StarRanking/Battle│
   └────────────────────────────────────────────────────────────────────────────┘
   Phase 3: veASSA Governor · AllKillPool · PredictionMarket · DebutFundingDAO · SettlementOracle
```

**Contract List / Phases**

| # | Contract | Standard/Base | Phase | Upgrade |
|---|---|---|---|---|
| 1 | `ASSAToken` | ERC20, ERC20Permit, ERC20Votes, AccessControl | **1** | Immutable (or minimal) |
| 2 | `TokenSale` | custom + Merkle (KYC) | **1** | UUPS |
| 3 | `TokenVesting` | custom | **1** | UUPS |
| 4 | `BMEBurner` | custom + DEX router | **1** | UUPS |
| 5 | `StakingLock` (veASSA) | custom, interest-free, non-transferable | **1** | UUPS |
| 6 | `Treasury` | custom + Safe | **1** | UUPS |
| 7 | `ConsumptionEngine` | custom + burn | 2 | UUPS |
| 8 | `StarRanking` / `FandomBattle` | custom + epoch | 2 | UUPS |
| 9 | `EdgeNodeRegistry` + `MiningRewards` | custom + oracle | 2 | UUPS |
| 10 | `PerformanceNFT` / `ConcertPassNFT` | ERC1155 | 2 | UUPS |
| 11 | `VoiceDNANFT` | ERC1155 + Story Protocol IP | 2~3 | UUPS |
| 12 | `ASSAGovernor` + `TimelockController` | OZ Governor, ERC5805 | 3 | — |
| 13 | `AllKillPool` / `PredictionMarket` / `DebutFundingDAO` | custom + VRF | 3 | UUPS |
| 14 | `SettlementOracle` | Chainlink + custom adapter | 3 | UUPS |

---

## 2. Permissions & Governance (Access Control)

All permissions are granted via `AccessControl` roles, and the ultimate admin is a **Gnosis Safe Multisig (e.g., 4-of-7)** → **TimelockController (48h)**.

| Role | Holder | Permissions |
|---|---|---|
| `DEFAULT_ADMIN_ROLE` | Timelock (Safe) | Grant/revoke roles, approve upgrades |
| `MINTER_ROLE` | `MiningRewards` only | $ASSA mint (within cap) |
| `BURNER_ROLE` | `BMEBurner`, `ConsumptionEngine` | $ASSA burn |
| `SALE_ADMIN_ROLE` | Operator Safe | Configure rounds, whitelist root |
| `TREASURY_ROLE` | Treasury Safe | Withdraw allocated tokens (via Vesting) |
| `ORACLE_ROLE` | Chainlink/Node Attesters | Price, score, and uptime feeds |
| `PAUSER_ROLE` | Operator Safe | Emergency pause |
| `UPGRADER_ROLE` | Timelock | UUPS upgrades |

Principle: **Only `MiningRewards` can mint**, and **only BME/Consumption engines can burn**. Direct EOA mint/burn is prohibited.

---

## 3. Phase 1 (MVP) — Detailed Spec

> Phase 1 Goal: **TGE, Token, Sale/Vesting, BME, Interest-free Staking, and Wallet Connection**. Primary target for the 1st audit.

### 3.1 `ASSAToken` (ERC-20)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import {ERC20Votes} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

/// @notice $ASSA — ASSA WAVE utility token. ERC-20 on Base.
contract ASSAToken is ERC20, ERC20Permit, ERC20Votes, ERC20Burnable, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    uint256 public constant CAP = 10_000_000_000e18;   // 10B hard cap

    constructor(address admin) ERC20("ASSA WAVE", "ASSA") ERC20Permit("ASSA WAVE") {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);          // Timelock/Safe
    }

    /// @dev Mining emission only. Reverts if it would exceed CAP.
    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        require(totalSupply() + amount <= CAP, "CAP");
        _mint(to, amount);
    }
    // burn / burnFrom inherited (called by BURNER_ROLE contracts)
    // ERC20Votes overrides (_update, nonces) per OZ v5
}
```

- **Invariants:** `totalSupply() <= CAP` always holds.
- **decimals:** 18. **Permit (EIP-2612):** Gasless approval. **Votes:** Checkpoints for future governance.
- **Emission:** At TGE, only the initial circulating supply is minted. The rest is minted by `MiningRewards` over a 10-year front-loaded schedule.
- **Events:** `Transfer`, `DelegateChanged`, standard.

### 3.2 `TokenSale` (3 Rounds, Fixed Price)

The sale price is fixed in KRW (30/50/70 KRW), but on-chain payments are made in **USDC (6 decimals)**. When configuring a round, the **USDC/ASSA price** is frozen based on the KRW exchange rate. Purchased amounts are not immediately circulating; they are loaded as schedules into **`TokenVesting`**.

```solidity
struct Round {
    uint64  start; uint64 end;
    uint128 cap;            // Round token cap (e.g., 30_000_000e18)
    uint128 sold;
    uint256 priceUsdcPerAssa; // USDC (1e6) per 1 ASSA, fixed when round is configured
    bytes32 merkleRoot;    // KYC/Whitelist (allowlist)
    uint8   tgeBps;        // TGE immediate unlock % (R1 0 / R2 500 / R3 1000)
    uint32  cliff;         // Seconds (R1 6m / R2 3m / R3 0)
    uint32  duration;      // Linear vesting duration in seconds (R1 18m / R2 12m / R3 6m)
}

interface ITokenSale {
    function configureRound(uint8 id, Round calldata r) external; // SALE_ADMIN
    function buy(uint8 roundId, uint256 assaAmount, bytes32[] calldata proof) external; // USDC pre-approved
    function roundOf(uint8 id) external view returns (Round memory);
}
```

- **Flow:** `buy()` → USDC `safeTransferFrom` (buyer → Treasury) → `sold += amount` (cap check) → `TokenVesting.createSchedule(buyer, amount, tge, cliff, duration, SALE)`.
- **Validation:** Round is active (start <= now <= end), cap not exceeded, `MerkleProof.verify(proof, root, leaf=keccak(addr))`, individual limit (optional).
- **Funds:** Entire amount goes to `Treasury` (Safe). Non-refundable (or admin refund logic if target not met).
- **Events:** `RoundConfigured`, `Purchased(buyer, roundId, assa, usdc)`.
- **Security:** `ReentrancyGuard`, `SafeERC20`, `whenNotPaused`. **Price Freeze** (cannot be modified during the round).

### 3.3 `TokenVesting`

Cliff + linear schedules per category. Used commonly for Sale, Founder, Team, Investor, Partner, ECO, and Marketing allocations.

```solidity
struct Schedule {
    uint128 total; uint128 claimed;
    uint64  start; uint32 cliff; uint32 duration;
    uint16  tgeBps;       // TGE immediate unlock bps
    bool    revocable;    // For Team/Founder, etc.
    uint8   category;
}

interface ITokenVesting {
    function createSchedule(address who, uint256 total, uint16 tgeBps,
                            uint32 cliff, uint32 duration, bool revocable, uint8 cat) external; // VESTING_ADMIN
    function claim() external;                       // beneficiary
    function releasable(address who) external view returns (uint256);
    function revoke(address who) external;           // revocable only, ADMIN
}
```

Standard Distribution Vesting (Recommended):

| Category | TGE | Cliff | Linear | Revocable |
|---|---|---|---|---|
| Private R1 (30 KRW) | 0% | 6m | 18m | no |
| Private R2 (50 KRW) | 5% | 3m | 12m | no |
| Private R3 (70 KRW) | 10% | 0 | 6m | no |
| Investor | 0% | 6–12m | 18–24m | no |
| Founder | 0% | 12m | 48m | yes |
| Team & Advisor | 0% | 12m | 36m | yes |
| Partner | 0% | 6m | 24m | yes (milestone-based) |
| ECO/Marketing | Partial | 0 | 24–36m | yes |

- **claim:** `releasable = total*tgeBps/1e4 + (now>start+cliff ? linear : 0) - claimed`.
- **Events:** `ScheduleCreated`, `Claimed`, `Revoked`.

### 3.4 `BMEBurner` (Burn-Mint Equilibrium)

Purchases $ASSA from a DEX using a portion of external revenue (USDC) and **permanently burns** it. B2C 20% / B2B 30–40%.

```solidity
interface IBMEBurner {
    function processRevenue(uint256 usdcAmount, uint16 burnBps, uint256 minAssaOut) external; // TREASURY/BACKEND
    // burnBps: B2C 2000 / B2B 3000~4000
}
```

- **Flow:** `usdc.safeTransferFrom` → `burnAmount = usdc*burnBps/1e4` → Aerodrome/Uniswap `swapExactTokensForTokens` (USDC → ASSA, `minAssaOut` slippage guard, deadline) → `ASSA.burn(received)`.
- **Oracle/MEV:** Determine `minAssaOut` via TWAP or Chainlink price; using a private mempool or split execution is highly recommended.
- **Events:** `Burned(usdcIn, assaBurned, burnBps)`.
- **Invariants:** Burned tokens are only sent to `address(0)` and never transferred elsewhere.

### 3.5 `StakingLock` (veASSA · **Interest-free Lockup**)

Lock up $ASSA for a period of time to receive **veASSA weight** (non-transferable). **No yield/emission** — rewards are ranking weights, governance power, and tier eligibility. Borrowed from the Curve veToken model (with reward distribution removed).

```solidity
struct Lock { uint128 amount; uint64 end; uint64 start; }

interface IStakingLock {
    function lock(uint256 amount, uint256 duration) external;   // max 4y
    function increaseAmount(uint256 amount) external;
    function increaseUnlockTime(uint256 newEnd) external;
    function withdraw() external;                                // Principal only after end
    function votingPower(address u) external view returns (uint256); // Time-decayed weight
    function tierWeight(address u) external view returns (uint256);  // Tier multiplier input
}
```

- **Weighting:** `weight = amount * (lockRemaining / MAXTIME)` (linear decay). Input for governance and ranking.
- **Enforced No-Yield:** No reward distribution function exists in the contract → zero value outflow. Locking supply simply reduces selling pressure.
- **Non-transferable:** veASSA balances cannot be transferred (only ERC20Votes-like checkpoints).
- **Events:** `Locked`, `Withdrawn`.

### 3.6 `Treasury`

Holds the distribution buckets (40/12/5/10/10/5/8/5/5%). Vesting, liquidity, and operational fund executions are managed via Safe + Timelock. Recipient of Sale USDC.

---

## 4. Phase 2 — Outline Specification

### 4.1 `ConsumptionEngine` (Spend-to-Compete · Consumption Burn)

```solidity
interface IConsumptionEngine {
    /// @notice Fans spend tokens on stars/fandoms. 70% burn + 30% prizePool.
    function spend(uint256 targetId, uint256 amount, bytes calldata skillAttest) external;
    function settleSeason(uint256 seasonId) external; // Season settlement -> distribute prizes
}
```

- **Distribution:** `burn = amount * 70%` (`ASSA.burn`), `prize = amount * 30%` → `prizePool[targetId]` (Artist/Prize).
- **Ranking:** `StarRanking.addPoints(targetId, weight)` — where `weight = f(amount) * skillFactor` (diminishing returns + skill-based VPU weighting, `skillAttest` = oracle signature).
- **Season:** Resets per epoch; `settleSeason` rewards top fandoms/fans (NFTs, allocations).
- **Anti-Whale/Sybil:** Diminishing returns curve, Voice DNA verification (off-chain), per-epoch caps.

### 4.2 `StarRanking` / `FandomBattle`
Aggregate and settle points per season. ARMY vs BLINK-style battles. Distribute rewards and trigger events upon settlement.

### 4.3 `EdgeNodeRegistry` + `MiningRewards`
- Node registration (bond staking + hardware attestation), Tiers, and **front-loaded emission** distributed based on Node Weight x Uptime / Proof of Inference (oracle). `claim()`. Option for **auto-stake (veASSA)** of mined tokens → suppresses circulating supply.
- Emission curve follows the financial model §Mining (Y1~Y10 allocations).

### 4.4 NFTs (ERC-1155)
`PerformanceNFT` (S/A/B/C tiers), `ConcertPassNFT`, and `VoiceDNANFT` (Story Protocol IP, on-chain consent). A portion of marketplace fees is burned via BME.

---

## 5. Phase 3 — Outline

| Contract | Description |
|---|---|
| `ASSAGovernor` + `TimelockController` | OZ Governor (ERC-5805 votes=veASSA). Tier multiplier·Veto (Legends). Proposal → Timelock → Execution |
| `AllKillPool` | Comeback cheering pool, PAK/CAK settlement, Participation NFT |
| `PredictionMarket` | Music outcome prediction, settled via Chainlink **VRF**/oracle |
| `DebutFundingDAO` | DAO funding for rookie debuts |
| `SettlementOracle` | Integration of 7 major music charts (Chainlink + custom adapter) |
| **L3 Migration** | Custom L3 using OP Stack, $ASSA as gas token, official bridge (Base ↔ L3), sequencer |

---

## 6. Cross-cutting Concerns

- **Oracles:** Price = Chainlink/TWAP; Randomness = Chainlink VRF; Scores/Uptime/Charts = Signature-based custom oracle (`ORACLE_ROLE`).
- **DEX Integration:** Aerodrome (default on Base) / Uniswap v3 router. Slippage, deadline, and MEV guards.
- **Pausing:** Core modules implement `Pausable` (`PAUSER`). However, it is recommended that user fund withdrawals (`withdraw`/`claim`) be excluded from pausing.
- **Upgrade Governance:** UUPS + `_authorizeUpgrade(onlyRole(UPGRADER))` via Timelock. Storage gap (`uint256[50]`).
- **Compliance:** Sale KYC (Merkle allowlist), geo-blocking (US/CN) enforced on frontend and off-chain; token transfer itself is unrestricted (utility token). Under VAUPA/MAS/ADGM review.
- **L2/Gas:** Minimize calldata, batch transactions, EIP-1559. Leverage Base's low fees.

---

## 7. Security & Audits

- **Threat Model:** Reentrancy, privilege escalation, oracle manipulation, flash loans, MEV, supply invariant violation, vesting bypass, infinite minting.
- **Defenses:** CEI pattern, `ReentrancyGuard`, `SafeERC20`, pull-payment, least privilege roles, minting restricted to `MiningRewards` (within cap), Safe + Timelock.
- **Static/Dynamic Analysis:** Slither, Mythril, Echidna/Foundry invariant fuzzing.
- **Audits:** **2–3 audit firms** (CertiK, Quantstamp, Halborn) prior to mainnet + **Bug Bounty** (Immunefi).
- **Operations:** OZ Defender / Tenderly monitoring & alerts, multisig, timelock, incident response runbook.

**Core Invariants (Enforced by Tests):**
1. `totalSupply <= 10B` always.
2. Mint callers ∈ {MiningRewards}, burn callers ∈ {BMEBurner, ConsumptionEngine}.
3. Vesting `claimed <= total`, releasable matches schedule functions.
4. Sale `sold <= cap`, round prices frozen.
5. `StakingLock` has no reward distribution path (interest-free).

---

## 8. Testing & Deployment

- **Framework:** Foundry. Unit + **fuzz** + **invariant** + **fork test** (Base).
- **Coverage:** Line/branch coverage >= 95% for core modules.
- **Scenarios:** 3-round sale, vesting cliff/linear, BME burn, lockup/decay, consumption 70/30, cap boundaries, permission boundaries.
- **Deployment:** `script/Deploy.s.sol` → Base Sepolia → Audit → Mainnet. Basescan verification. Managed address registry (JSON).
- **Environment:** `.env` (RPC, PRIVATE_KEY via hardware/Safe), `foundry.toml` profiles.

**Recommended Repo Structure**
```
contracts/  (src/token, src/sale, src/staking, src/bme, src/consumption, src/node, src/gov)
test/       (unit, invariant, fork)
script/     (Deploy, Configure)
audit/      (reports)
foundry.toml
```

---

## 9. Open Questions (Decisions Required)

1. **Sale Payment Currency:** USDC (recommended) vs. KRW-stable. Finalize round price freezing mechanism.
2. **Token Upgradability:** Immutable (recommended) vs. minimal upgradability.
3. **Team/Founder Vesting Revocability:** Whether it is revocable and under what conditions.
4. **L3 Transition Timeline:** Timing and design of bridge/gas token.
5. **Consumption Engine Skill Weighting:** Trust model for the oracle (signer and VPU calculation).
6. **KYC Enforced On-chain (allowlist) vs. Off-chain Gating proportion.**

---

*This specification is for informational and design purposes only and does not constitute investment or legal advice. Token sale and issuance are subject to regulatory reviews, such as South Korea's VAUPA and securities laws, and smart contract audits.*
