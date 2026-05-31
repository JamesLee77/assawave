# ASSA WAVE — Mainnet token handoff & initial mint (status)

> Resume point. Last updated: 2026-05-31. Network: **Base mainnet (chainId 8453)**.

## 1. Live deployment
| | |
|---|---|
| **ASSAToken** | `0xA35BE42FF121F1D6333dd15bb2f5524A7BD684a6` — Basescan-verified, **totalSupply 0** (no premint) |
| Deployer / current admin (EOA) | `0x7C5aCAD2c305f2B29818b614bFdD4DA9F6c15A4F` — ⚠️ session-exposed key, being **retired** by the handoff |
| Roles now | deployer holds **DEFAULT_ADMIN + MINTER + BURNER**; Safe holds none yet |

## 2. Governance Safe (VERIFIED on Base mainnet)
| | |
|---|---|
| **Safe** | `0x7eDcCba223e78ea6dC2C9b09F56F4030Abb0d5FA` |
| Type / threshold | SafeL2 **v1.4.1**, **2-of-3** |
| Owners (fresh hardware keys; exposed `0x7C5a` is **NOT** an owner) | `0x43f57cFF76E5Bf005f1bBB217C870bfdA929a554`<br>`0x15e6e63e84c1f90fC61802FB67c3F04a957924BF`<br>`0xC8c719b49DFDADEbD52d31967d8a230B537Bf641` |

## 3. Role hashes (for Basescan Write)
```
DEFAULT_ADMIN_ROLE = 0x0000000000000000000000000000000000000000000000000000000000000000
MINTER_ROLE        = 0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6
BURNER_ROLE        = 0x3c11d16cbaffd01df69ce1c404f6340ee057498f5f00246190ea54220576a848
```

## 4. Handoff plan (Phase A — Safe only) — STATUS: ⏳ NOT STARTED (grants pending)
Target after handoff: **ADMIN + MINTER → Safe**, **BURNER renounced** (no holder), deployer renounces all.

Execute on **ASSAToken** via **Basescan Write**, connected as deployer `0x7C5a`:
<https://basescan.org/address/0xA35BE42FF121F1D6333dd15bb2f5524A7BD684a6#writeContract>

```
1. grantRole(MINTER_ROLE, Safe)
2. grantRole(DEFAULT_ADMIN_ROLE, Safe)
--- VERIFY GATE: require Safe ADMIN=true && MINTER=true (re-run verifier) ---
(Recommended: execute ONE 2-of-3 Safe tx first to confirm the Safe can actually sign.)
3. renounceRole(MINTER_ROLE, 0x7C5a…)
4. renounceRole(BURNER_ROLE, 0x7C5a…)
5. renounceRole(DEFAULT_ADMIN_ROLE, 0x7C5a…)   ← LAST, irreversible
--- POST-VERIFY: deployer holds nothing; Safe = ADMIN+MINTER; BURNER unheld ---
```
> `renounceRole` 2nd arg must be the caller's own address (`0x7C5a…`) — OZ v5 callerConfirmation.

**Read-only verifier** (no key; `SAFE_ADDRESS` already in `.env`):
```
cd onchain && npx hardhat run scripts/handoff-plan-mainnet.ts --network base
```

## 5. Tomorrow: mint 10,000,000 ASSA
- **Amount:** 10,000,000 ASSA = `10000000000000000000000000` wei  (10,000,000 × 10^18)
- ⚠️ **Recommended order: finish the handoff FIRST, then mint via the Safe (2-of-3)** — not the single deployer EOA (that's the single-hot-key risk the handoff removes).
  - Safe UI → New transaction → Contract interaction → ASSAToken `0xA35B…` → `mint(to, amount)`
  - `to` = recipient (decide: sale distributor / treasury), `amount` = `10000000000000000000000000`
- If minting **before** handoff (not recommended): deployer `0x7C5a` (MINTER) can mint, but no multisig protection yet.
- ⚖️ Selling minted tokens to users also re-triggers **Audit #1** (Token/Sale) + **Legal GO (VAUPA)** gates.

## 6. Safety reminders
- ADMIN renounced **LAST**, only after the Safe is verified holding ADMIN (don't brick the token).
- Keep the `0x7C5a` key safe until handoff step 5; afterward it controls nothing.
- BURNER left **unheld** (its `burnFrom` bypasses allowance) until BMEBurner is deployed + audited.
