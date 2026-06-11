# ASSA WAVE — Deployment & Work Status

> Living status doc. Last updated: **2026-06-11**.
> Handoff-specific runbook: [`MAINNET-HANDOFF-STATUS.md`](./MAINNET-HANDOFF-STATUS.md).
> On-chain address source of truth: `onchain/deployments/{base,baseSepolia}.json`.

## TL;DR — current state

- **Security**: a deep review found a HIGH + several MED issues in the original contracts; all fixed in a **v2** patch (P0 token/timelock, P1 sale/vesting). 89 tests passing.
- **Testnet (Base Sepolia 84532)**: full fresh **v2 stack** deployed + Basescan-verified + demo-configured; portal rewired and live at **app.assawave.io** (serves the testnet build).
- **Mainnet (Base 8453)**: **v2 ASSAToken deployed & verified** (`0x7B58cC6b…`, supply 0). Handoff to the Safe is **mid-way**: GRANT done (Safe co-holds ADMIN+MINTER), **RENOUNCE blocked** by a safety gate (the Safe has never executed a tx — see §4).
- **No mint yet on v2.** The legacy pre-patch token still holds the only 10M (to be migrated/retired).

---

## 1. Security patches (v2)

Patched sources in `onchain/contracts/`. All pushed to `origin/main`.

### P0 — ASSAToken + ASSATimelock (`ba9829c`, `c8dd690`, `e95f1f3`)
- **ASSAToken**: removed the allowance-bypassing `burnFrom` override **and `BURNER_ROLE` entirely** (HIGH — any BURNER could burn any wallet without consent; BMEBurner only self-burns via public `burn()`). Cap is now **lifetime issuance** via monotonic `totalMinted` (burns never restore mint headroom). `recoverERC20` uses SafeERC20.
- **ASSATimelock**: the 48h mainnet floor is enforced on **every `updateDelay`**, not just at construction (one proposal could otherwise remove the exit window).

### P1 — TokenSale + TokenVesting (`dda97c2`, `0910af9`)
- **TokenVesting**: `revoke()` re-vest freeze bug fixed — `_vestedAmount` returns the frozen total for revoked schedules (was underflow-reverting every release for months).
- **TokenSale**: top-ups **re-anchor the vesting clock to the amount-weighted average** (kills the dust-early/buy-late cliff bypass); `claim`/`claimable` floor at zero; **solvency-gated** purchases (`balance >= totalOutstanding + amount`); a sold round is correctable only while **deactivated** (cap never below sold); optional per-round `maxPerBuyer` cap.

Tests: **89 passing**, tsc clean; ASSAToken & ASSATimelock at 100% coverage. Adversarial review: no critical/high/medium.

---

## 2. Contract addresses

### Base Sepolia (testnet, chainId 84532) — fresh v2 stack, 2026-06-10
Deployer/admin EOA `0xa547684361bB20Ca497859dD090A44C9F0A9D8Da` (throwaway testnet key). All Basescan-verified. Demo data configured for wallet `0xdD2e7E977b8c73bf7f5C86D50b610498FBf497E3`.

| Contract | Address |
|---|---|
| ASSAToken (v2) | `0x6139EB8724608f442B3A851eD3907D9B428129C0` |
| TokenSale (v2) | `0xD532eee8d41A6f4F5e8Fd5c84B4AE5D5602B6674` |
| TokenVesting (v2) | `0x4f4C873D5Eba3aD31E6633abd3D5F3A75fdcDEAA` |
| StakingLock (veASSA) | `0xa4181Af9358FFD5a24F1100Bc930721336Fe4b3b` |
| KYCRegistry | `0x1e5A8f22E4A01DEDb31e8075930cfc2d23755F3b` |
| Treasury | `0x08c6E2353899FABeDbCfF87e036e173DFeF6DFDf` |
| ASSATimelock (60s) | `0x4cF8496E352682c760311C705fb724e65652796F` |
| MockUSDC (6dec) | `0x55e27D3F68fCcf6e3810D7038002831E1CeC6439` |
| Safe (2-of-3, reused) | `0xb3F22b9afE0c4f16400b2CAb7A85C5d6a02DeD73` |
| BMEBurner | not deployed (needs a DEX pool/router) |

> Superseded/orphaned: the older Sepolia stack (`0x5823…` token) and the standalone sale/vesting redeploy (`0xC008…`/`0xEF1d…`).

### Base mainnet (production, chainId 8453)
| Item | Address |
|---|---|
| **ASSAToken (v2, LIVE)** | `0x7B58cC6b1a746cC73986b439ffD968e9b1028d78` — Basescan-verified, supply 0, totalMinted 0 |
| ASSATokenLegacy (pre-patch) | `0xA35BE42FF121F1D6333dd15bb2f5524A7BD684a6` — holds the abandoned 10M; do NOT distribute |
| Safe (governance, 2-of-3) | `0x7eDcCba223e78ea6dC2C9b09F56F4030Abb0d5FA` (SafeL2 v1.4.1) |
| Deployer / admin EOA | `0x7C5aCAD2c305f2B29818b614bFdD4DA9F6c15A4F` |
| Distributor (mint target) | `0xdBDe9699C3a12867789176b3468d3DB939400516` |
| Canonical Base USDC | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` |

v2 token: ASSA WAVE / ASSA / 18, CAP 10,000,000,000, no `BURNER_ROLE`, `totalMinted` lifetime cap.
Basescan: <https://basescan.org/address/0x7B58cC6b1a746cC73986b439ffD968e9b1028d78#code>

---

## 3. Mainnet token deploy (done — 2026-06-11)

`bc9e02f`. Sequence run: `preflight:mainnet` (all gates green) → `deploy:token:mainnet` → `verify:mainnet` → `check:token:mainnet`. Live state confirmed: deployer `0x7C5a` holds ADMIN+MINTER (before handoff), no premint. Legacy address preserved as `ASSATokenLegacy` in `base.json` (`37a5d4c`).

---

## 4. Mainnet handoff — IN PROGRESS

Goal: move ADMIN+MINTER off the session-exposed deployer EOA `0x7C5a` to the Safe `0x7eDc` (2-of-3). v2 token → 4 calls (no BURNER step).

| Step | Status |
|---|---|
| 1. `grantRole(MINTER, Safe)` | ✅ done — tx `0x82b1223b460d1be0808e75e8db4fbe90d6f3136e0b5a7acc888e04a9248915a0` |
| 2. `grantRole(ADMIN, Safe)` | ✅ done — tx `0xdb9385fc533624f062278779305ef249b9ea80dec1a17a3cd442c27543db298b` |
| — verify gate | ✅ Safe holds ADMIN=true MINTER=true |
| 3. prove Safe signs 2-of-3 | ❌ **NOT done** — Safe nonce is 0 (never executed a tx on Base) |
| 4. `renounceRole(MINTER, 0x7C5a)` | ⏸ blocked |
| 5. `renounceRole(ADMIN, 0x7C5a)` LAST | ⏸ blocked |

**Current on-chain state**: BOTH the deployer `0x7C5a` AND the Safe `0x7eDc` hold ADMIN+MINTER (safe, reversible intermediate state). The renounce script (`f5d0952` grant / `7cd2a6d` renounce) **hard-aborted** because Safe `nonce == 0` — no executed transaction proves the multisig can sign. Nothing was renounced.

**To unblock**: execute ONE real Safe transaction on Base via <https://app.safe.global/home?safe=base:0x7eDcCba223e78ea6dC2C9b09F56F4030Abb0d5FA> (2 owners sign **and click Execute** → nonce 0→1). Then re-run the renounce script.

> ⚠️ Renounce is irreversible. `renounceRole`'s 2nd arg is the caller's OWN address (`0x7C5a`), not the Safe (OZ v5 callerConfirmation). ADMIN is renounced LAST, only after the Safe is verified holding it.

---

## 5. Portal

- `portal/src/lib/contracts.ts`: **testnet** addresses point at the v2 Sepolia stack (`84008d5`); **mainnet** `assaToken` set to the live v2 token `0x7B58…` (`04a5062`), rest of the mainnet suite still ZERO until deployed.
- Live build at **app.assawave.io** is the **testnet** build (default `VITE_ENV`), verified working (chain 84532, new addresses in bundle, no contract-read errors). A mainnet build/deploy is a separate step once the full mainnet stack exists — do NOT deploy a mainnet build onto the same project (it would clobber the testnet demo).

---

## 6. Scripts & commands (from `onchain/`)

| Command | Purpose |
|---|---|
| `npm test` / `npm run coverage` | run suite (89 passing) / coverage |
| `npm run deploy:full:sepolia` | full testnet stack (explicit nonce sequencing) |
| `DEMO_WALLET=0x… npm run configure:sepolia` | seed testnet demo data |
| `npm run verify:all:sepolia` | batch Basescan verify (testnet) |
| `npm run preflight:mainnet` | read-only mainnet deploy gate |
| `npm run deploy:token:mainnet` | deploy v2 ASSAToken (mainnet) |
| `npm run verify:mainnet -- <addr> <ctorArg>` | Basescan verify (mainnet) |
| `npm run check:token:mainnet` | read live mainnet token state (legacy/v2-aware) |
| `SAFE_ADDRESS=0x7eDc… npx hardhat run scripts/handoff-plan-mainnet.ts --network base` | read-only handoff verifier |
| `SAFE_ADDRESS=0x7eDc… npx hardhat run scripts/handoff-grant-mainnet.ts --network base` | GRANT roles → Safe (done) |
| `SAFE_ADDRESS=0x7eDc… npx hardhat run scripts/handoff-renounce-mainnet.ts --network base` | RENOUNCE (hard-gated; pending Safe nonce>0) |

> RPC note: the public Base RPCs lag `getTransactionCount("pending")` and read-after-write. The deploy/config/handoff scripts thread the nonce explicitly and retry reads.

---

## 7. Outstanding / next steps

1. **Mainnet handoff finish**: Safe executes 1 tx (nonce 0→1) → run renounce script → deployer holds nothing, Safe sole ADMIN+MINTER.
2. **Mint 10M v2-ASSA** via the Safe (2-of-3) → distributor `0xdBDe…` (`10000000000000000000000000` wei). Needs the handoff done first (Safe = MINTER).
3. **Retire legacy**: distributor self-burns the 10M on `0xA35BE…` (or abandons); mark deprecated.
4. **Security hygiene**: remove `MAINNET_PRIVATE_KEY` from `.env` once handoff/mint complete (currently set).
5. **Mainnet full suite** (later): deploy KYC/Treasury/Timelock/Vesting/Sale/Staking, fill `CONTRACTS_MAINNET`, then build/deploy a mainnet portal on its own domain.
6. **External audit + Legal GO (VAUPA)** before selling/distributing to users.

---

## 8. Commit log (this cycle)

```
7cd2a6d chore(mainnet): hard-gated handoff RENOUNCE script (aborted on Safe nonce=0)
f5d0952 chore(mainnet): handoff GRANT — Safe co-holds ADMIN+MINTER
04a5062 chore(portal): set mainnet ASSAToken to the live v2 address
bc9e02f deploy(mainnet): v2 ASSAToken live on Base — 0x7B58cC6b…
37a5d4c chore(mainnet): prepare v2 deploy — preflight hardening + legacy preservation
84008d5 chore(portal): rewire testnet addresses to the v2 fresh Sepolia stack
45aac16 chore(sepolia): full fresh stack redeploy with v2 + explicit nonce sequencing
2b0ae6b chore(sepolia): redeploy patched TokenSale + TokenVesting (superseded)
0910af9 docs(deploy): round launch discipline
dda97c2 fix(sale,vesting): vesting-clock bypass, revoke re-vest freeze, unbacked-sale (P1)
e95f1f3 docs: sync runbook & spec to v2; record legacy 10M mint
c8dd690 chore(scripts): v2-aware mainnet tooling + Safe-contract guards
ba9829c fix(security)!: v2 ASSAToken — remove confiscation burnFrom, lifetime cap; Timelock floor (P0)
```
