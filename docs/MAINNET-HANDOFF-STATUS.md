# ASSA WAVE — Mainnet token handoff & initial mint (status)

> Resume point. Last updated: **2026-06-10**. Network: **Base mainnet (chainId 8453)**.

## ⚠️ 2026-06-10 — P0 security patch changes the plan

A deep security review found a **HIGH** finding in the deployed token: its `burnFrom`
override drops the allowance check, so any BURNER_ROLE holder can burn ANY wallet's
balance without consent. The stated rationale ("for BMEBurner") is false — BMEBurner
only self-burns via the public `burn()`. Two MEDIUMs were also patched: the cap was a
*circulating-supply* cap (burns restored mint headroom, contradicting the "permanent
burn" narrative), and the Timelock's 48h floor was constructor-only (one governance
proposal could remove it via `updateDelay(0)`).

**The patched v2 sources are in the repo** (`onchain/contracts/ASSAToken.sol`,
`ASSATimelock.sol`): no BURNER_ROLE, standard allowance-gated `burnFrom`, lifetime
`totalMinted` cap, SafeERC20 `recoverERC20`, `updateDelay` floor override.
77 tests passing; ASSAToken & ASSATimelock at 100% coverage.

**⚠️ 2026-06-10 live read: the 10M mint ALREADY HAPPENED on the legacy token** —
`totalSupply = 10,000,000`, all held by the distributor `0xdBDe9699C3a12867789176b3468d3DB939400516`;
handoff still NOT executed (deployer holds ADMIN+MINTER+BURNER, Safe holds none).
Migration is still simple while the distributor is the **only** holder — do it BEFORE
the server distributes anything to users.

## 0. v2 TOKEN DEPLOY — READY TO FIRE (prepared 2026-06-10)

Pre-flight verified read-only (`npm run preflight:mainnet`) — every gate green EXCEPT the key:
- chainId 8453 ✓ · intended deployer `0x7C5a…` balance **0.0504 ETH** ✓ (floor 0.002) · legacy preserved as `ASSATokenLegacy` in base.json ✓
- compiled artifact = **v2** (has `totalMinted`, NO `BURNER_ROLE`, standard allowance `burnFrom`) ✓
- **ONE blocker: `MAINNET_PRIVATE_KEY` is empty in `assawave/.env`.** Restore the `0x7C5a…` key (the value is backed up off-machine), then the deploy is a clean 4-command run.

**Exact fire sequence (run from `assawave/onchain`):**
```bash
# 0. (one-time) restore the deployer key in assawave/.env:  MAINNET_PRIVATE_KEY=0x…
npm run preflight:mainnet          # must print "✓ Pre-flight passed"
npm run deploy:token:mainnet       # deploys v2 ASSAToken, writes base.json "ASSAToken" = new addr
npm run verify:mainnet -- <newAddr> 0x7C5aCAD2c305f2B29818b614bFdD4DA9F6c15A4F   # Basescan verify (ctor arg = deployer)
npm run check:token:mainnet        # should now read "v2 token" (totalMinted present), supply 0, deployer ADMIN+MINTER
```
After this, the v2 token is live (supply 0). Then: handoff v2 → Safe (§4), Safe mints 10M → distributor (§5), retire legacy (§7). Remove `MAINNET_PRIVATE_KEY` from `.env` again once done.

**FULL RECOMMENDED ORDER (single-holder migration):**
```
0. FREEZE legacy distribution: do not send legacy ASSA to anyone from 0xdBDe…
1. Deploy v2 token: the 4-command sequence above (preflight → deploy → verify → check)
2. Update portal/site testnet→mainnet addresses to the new v2 token
3-6. Handoff v2 → Safe  (section 4 below — 4 calls, no BURNER step)
7. Safe mints 10,000,000 v2-ASSA → distributor 0xdBDe… (section 5)
8. Retire legacy: distributor self-burns its 10M legacy ASSA via burn()
   (public ERC20Burnable — its own key suffices), or simply never moves it.
   Mark the legacy address (ASSATokenLegacy) as deprecated in docs/portal/site.
```
Do NOT mint or distribute further on the legacy token.

## 1. Live deployment (LEGACY — pre-patch)
| | |
|---|---|
| **ASSAToken (legacy)** | `0xA35BE42FF121F1D6333dd15bb2f5524A7BD684a6` — Basescan-verified, **totalSupply 10,000,000** (minted to distributor `0xdBDe…0516`, confirmed live 2026-06-10) |
| Deployer / current admin (EOA) | `0x7C5aCAD2c305f2B29818b614bFdD4DA9F6c15A4F` — ⚠️ session-exposed key, being **retired**; still holds ADMIN+MINTER+BURNER |
| Roles now | deployer holds **DEFAULT_ADMIN + MINTER + BURNER**; Safe holds none yet |
| Status | ⛔ superseded by v2 patch — migrate (single holder) instead of handing this one off |

## 2. Governance Safe (VERIFIED on Base mainnet — unchanged, reused for v2)
| | |
|---|---|
| **Safe** | `0x7eDcCba223e78ea6dC2C9b09F56F4030Abb0d5FA` |
| Type / threshold | SafeL2 **v1.4.1**, **2-of-3** |
| Owners (fresh hardware keys; exposed `0x7C5a` is **NOT** an owner) | `0x43f57cFF76E5Bf005f1bBB217C870bfdA929a554`<br>`0x15e6e63e84c1f90fC61802FB67c3F04a957924BF`<br>`0xC8c719b49DFDADEbD52d31967d8a230B537Bf641` |

## 3. Role hashes (for Basescan Write)
```
DEFAULT_ADMIN_ROLE = 0x0000000000000000000000000000000000000000000000000000000000000000
MINTER_ROLE        = 0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6
BURNER_ROLE        = (legacy token only — does not exist on v2)
```

## 4. Handoff plan (Phase A — Safe only) — for the **v2 token** after step 0
Target after handoff: **ADMIN + MINTER → Safe**, deployer renounces all.

Execute on the **v2 ASSAToken** via **Basescan Write**, connected as the deployer:

```
1. grantRole(MINTER_ROLE, Safe)
2. grantRole(DEFAULT_ADMIN_ROLE, Safe)
--- VERIFY GATE: require Safe ADMIN=true && MINTER=true (re-run verifier) ---
(Recommended: execute ONE 2-of-3 Safe tx first to confirm the Safe can actually sign.)
3. renounceRole(MINTER_ROLE, deployer)
4. renounceRole(DEFAULT_ADMIN_ROLE, deployer)   ← LAST, irreversible
--- POST-VERIFY: deployer holds nothing; Safe = ADMIN+MINTER ---
```
> `renounceRole` 2nd arg must be the caller's own address — OZ v5 callerConfirmation.

**Read-only verifier** (no key; `SAFE_ADDRESS` already in `.env`) — auto-detects
legacy vs v2 and prints the matching call list:
```
cd onchain && npx hardhat run scripts/handoff-plan-mainnet.ts --network base
```

## 5. Mint 10,000,000 ASSA (after handoff)
- **Amount:** 10,000,000 ASSA = `10000000000000000000000000` wei  (10,000,000 × 10^18)
- ⚠️ **Finish the v2 handoff FIRST, then mint via the Safe (2-of-3)** — not the single deployer EOA.
  - Safe UI → New transaction → Contract interaction → v2 ASSAToken → `mint(to, amount)`
  - `to` = distributor `0xdBDe9699C3a12867789176b3468d3DB939400516` (owner decision 2026-06-07), `amount` = `10000000000000000000000000`
  - Safe Transaction Builder auto-ABI fetch fails on Base → paste the ABI manually (from `artifacts/contracts/ASSAToken.sol/ASSAToken.json` after compile, or Basescan #code once verified).
- Note: v2 cap is **lifetime issuance** — burned tokens can never be re-minted (matches the public "permanent burn" narrative).
- ⚖️ Selling minted tokens to users also re-triggers **Audit #1** (Token/Sale) + **Legal GO (VAUPA)** gates.

## 6. Safety reminders
- ADMIN renounced **LAST**, only after the Safe is verified holding ADMIN (don't brick the token).
- Keep the deployer key safe until the final renounce; afterward it controls nothing.
- When the full suite later deploys with a mainnet Timelock: pass the **Safe contract address** as the timelock's proposer/executor (never the owner EOAs — `deploy.ts` now hard-fails on this), and the v2 Timelock enforces the 48h floor on every `updateDelay`, not just at construction.
