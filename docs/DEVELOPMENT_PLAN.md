# ASSA WAVE — Development Plan (ccm-based)

> Written by: ASSA WAVE Technical Director · Reference Date: 2026-05-30 · Phase 1 (MVP) First Priority
> Basis: 2 ASSA Specification Documents + ccm Actual Source Verification + Adversarial Gap Analysis (reuse-accuracy / dependency-sequencing / security-compliance) Reflected
> **Verified Facts (Source Code Cross-Reference Completed):**
> - **CCMStaking = Yield-bearing** (Confirmed `R0_BPS=1_000` · `POOL_INIT 200M` · `poolRemaining` · `_harvest` · `rewardDebt` · `priceOracle` · `pendingReward` · `RewardClaimed`) → Non-yield veASSA is a **new rewrite**.
> - **CCMToken** = `ERC20,ERC20Burnable,ERC20Capped,ERC20Pausable,ERC20Permit,AccessControl`, **5B cap**, `_update` **3-way override** (`ERC20,ERC20Capped,ERC20Pausable`), no `nonces` override, **no Votes**, **no BURNER_ROLE** (ERC20Burnable = anyone can burn their own balance), MINTER_ROLE granted from admin → TGESale/Vesting/Staking (inconsistent with the spec's "MiningRewards only").
> - **CCMTGESale** = `claimable` is linear based on `startTime` (`vested=total*elapsed/vestSeconds`), **cliff gates only the first claim (cliff-jump)**, **no concept of TGE immediate unlock**, gating via `whitelist[roundId][addr]` mapping (**does not reference KYCRegistry · not Merkle**), **no Pausable**.
> - **Backend = Zero event log indexing code** — `chain.ts`/`holders.ts` only perform `readContract` view polling + D1 upsert + `sync_runs`/`snapshot`. No `getLogs`/`blockCursor`/`sale_orders`.
> - **mainnet KYCRegistry = `0x0`** (Sepolia rehearsal `0x9172D6eaF05587b595f4eE894B4C7917Be652E46`), single wrangler cron `*/30`, Token/Vesting mainnet live 2026-05-12.
> - **Safe = 3-of-4 rehearsal script / 3-of-5 mainnet target** (no 4-of-7 assets). **CCMTimelock 48h floor**.
> - **`_dex-*` scripts = Base Sepolia only** (throws if `chainId!==84532n`, Uniswap V3, Mock USDC). **`_dry-run-phase1.ts` = 4.99B cap hardcoded, Token+Vesting only**.
> - **ccm has no third-party external audit report in the codebase** — `SECURITY_REVIEW.md` etc. are internal documents. **"Audit inheritance / delta audit" is not valid** (corrected in §6 below).

---

## 0. Overview

### Goals
Launch ASSA WAVE Phase 1 (MVP) on the shortest path by **reusing the live ccm codebase (Base mainnet 8453)**. Phase 1 deliverables: ASSAToken (+ERC20Votes) · 3-round TokenSale · categorized TokenVesting · non-yield StakingLock (veASSA) · BMEBurner · governance integration (Safe + Timelock + KYCRegistry) · 4 dApps/websites (site · portal · admin · testnet) · Cloudflare Worker backend · **new event indexer**. Phase 2/3 will only be outlined at the end.

### Scope
- **In (Phase 1):** Token · Sale · Vesting · veASSA · BME · SIWE authentication · Sale/Dashboard/Lockup UI · Operations console · Landing page (KO/EN/JA) · Event indexer · 2 external audits · mainnet deployment.
- **Out (Phase 2/3 outline only):** ConsumptionEngine, StarRanking/FandomBattle, EdgeNode/MiningRewards, ERC-1155 NFT, ASSAGovernor, PredictionMarket, L3.

### Core Principles
1. **ccm-Based Reuse** — Fork + adaptation as top priority; actual new features are strictly limited to ① non-yield veASSA, ② BMEBurner, ③ ERC20Votes, ④ **event indexer**, ⑤ **mainnet KYC operations pipeline**, and ⑥ **rewrite of Sale TGE / Vesting accounting**.
2. **Supply-Demand Balance** — Sale/Vesting/veASSA lock the supply, while BMEBurner feeds demand back by burning based on external revenue.
3. **Non-yield Lockup** — Enforce the **absence** of reward, emission, or oracle paths in veASSA through negative invariants + static ABI checks.
4. **Audit Gate** — **Split into 2 SOWs.** Audit #1 (Token+Votes · Sale · Vesting · KYCRegistry) = Sale Gate (M2); Audit #2 (veASSA · BMEBurner) = Deployment Gate (M3). **Must have 0 critical/high findings, with all medium findings mitigated** + Safe/Timelock handoff proof as a hard gate. **Discard the term "delta audit"** due to the absence of a baseline external audit for ccm.
5. **Non-custodial** — Backend does not hold any funds or private keys. Uses only SIWE, read cache, and webhooks. Payments are directly sent as USDC from the user's wallet to the Treasury Safe.
6. **Legal GO Gate** — Acquisition of VAUPA/securities legal opinion is an **explicit hard gate** for the mainnet sale (§5/§6).

---

## 1. Technical Stack Alignment (Realigned based on ccm)

| Area | ASSA Spec Recommendation | Actual ccm (Adopted) | Remarks |
|---|---|---|---|
| On-chain Framework | Foundry | **Hardhat 2.22 + OZ v5 + ethers v6 + typechain + TS**, Solidity 0.8.24 (cancun, optimizer 200) | Retain `hardhat.config.ts` as-is. **Add Foundry specifically for invariant/fuzz testing** (0 fuzz tooling existed in ccm). |
| Frontend | Next.js 14 App Router | **Vite 8 + React 18 + Tailwind 4 + wagmi + viem + RainbowKit + TS** | Separated into 4 apps (site/admin/portal/testnet). App Router is not used. |
| Backend | NestJS + Postgres + Redis | **Cloudflare Workers (Hono) + D1 + viem + Resend + vitest** | Fork SIWE · session · me · sync · cron. **However, event indexer is absent in ccm → New**. |
| Indexer | Ponder / The Graph | **Direct Worker Read + D1 Cache + Cron** (view polling) **+ New eventIndexer (getLogs + cursor)** | ⚠️ ccm only has view polling. Tracking Purchased/Locked/Burned requires a **new indexing subsystem** (§2.3). |
| Monorepo | Turborepo | **Maintain 2 separate repos + shared package git dependencies** (redesigned in §3 below) | ⚠️ A single pnpm-workspace assumes a single git repo → Discard original Option C. |
| Sale Gating | Merkle allowlist | ⚠️ **Contract Change Decision Required**: Keep per-round whitelist (no change) vs. Query KYCRegistry (new change) | CCMTGESale only uses `whitelist[round][addr]`. KYCRegistry is not referenced. |
| Payment Currency | USDC | **canonical Base USDC (6dec)** | Sale.tsx implements exact amount approval. On-ramp planned for Phase 2. |
| Payment/Key Custody | — | **Non-custodial** (Sale USDC recipient = Treasury Safe) | |

---

## 2. Reuse Map (Component → ccm Source → Action → Changes)

> **Label Correction Principle:** Based on the gap analysis, items that were overly labeled as 'reuse/fork' but require significant new implementation—specifically 6 areas (event indexer, mainnet KYC operations, sale TGE/vesting accounting, Safe 4-of-7 key ceremony, ERC20Votes, and StakingLock)—have been reclassified as **[Reuse+New]** or **[New]**. The action labels serve as direct inputs for estimating audit scopes and schedules.

### 2.1 On-chain Contracts

| ASSA Component | ccm Source | Action | Key Changes |
|---|---|---|---|
| **ASSAToken** (ERC20+Permit+Burnable+Capped+Pausable+Votes, 10B cap) | `CCMToken.sol` | **[Reuse+New] / Full Audit Scope** | (1) Cap 5B → `10_000_000_000e18`, **maintain ERC20Capped inheritance** (avoid manual require statements to prevent bypassing `_mint`). (2) **Add ERC20Votes** — extend the `_update` override to `(ERC20,ERC20Capped,ERC20Pausable,ERC20Votes)` + **new override** of `nonces()` in `(ERC20Permit,Nonces)` (currently missing). (3) name/symbol/Permit = 'ASSA WAVE'/'ASSA'. (4) **Determine burn model** (Decision #6b below): Maintain ERC20Burnable (BMEBurner burns its own balance) vs. New BURNER_ROLE gating. (5) **MINTER_ROLE Policy**: ccm grants it from admin → Sale/Vesting/Staking. ASSA will limit this to the TGE float stage and then transfer it to Phase 2 MiningRewards. Because the transfer hot-path changes, this requires a **new audit rather than a simple fork**. |
| **TokenSale** (3-Round Fixed Price, USDC, Gating, TGE+Vesting) | `CCMTGESale.sol` | **[Reuse+New] / Rewrite Accounting** | (1) Fix 3-round prices to USDC equivalent of KRW 30/50/70. (2) ⚠️ **Rewrite `claimable`** — Current ccm is linear from `startTime`, which causes a cliff-jump and lacks a TGE immediate release portion. Adopt the spec §3.3 formula (`total*tgeBps/1e4 + (now>start+cliff?linearPostCliff:0) - claimed`) as the **single source of truth**, discarding ccm's `startTime`-based linearity. Linear vesting must start **from the end of the cliff** (`[start+cliff, start+duration]`). Prevent double-counting and underflow between the immediate and linear portions. (3) **Determine Gating** (Decision #3): Maintain per-round whitelist (no contract change = true reuse) vs. add `require(kyc.isKYCed(msg.sender))` to `purchase()` + inject immutable registry in the constructor (**new change · new audit surface**). (4) ⚠️ **New Pausable** (required by spec §3.2, absent in ccm): `purchase` is `whenNotPaused`, while claim/withdrawUSDC are exempted from pausing. (5) `withdrawUSDC` recipient = Treasury Safe. |
| **TokenVesting** (Categorized Cliff+Linear, Revocable) | `CCMVesting.sol` | **[Reuse+New] / Rewrite Accounting** | (1) Add `tgeBps(uint16)` and `category(uint8)` to Schedule. (2) ⚠️ **Rewrite `releasable` similarly** (CCMVesting also has the `startTime`-based linearity flaw) — linear vesting starts after the cliff, add the TGE immediate portion, and enforce the invariants `claimed<=total` and `releasable>=0`. (3) Script deployment parameters: Founder 12m/48m · Team 12m/36m · Investor · Partner · ECO. |
| **StakingLock (veASSA)** (Non-yield · Non-transferable · Time-decay) | `CCMStaking.sol` | **[New] / Virtual Rewrite** | ⚠️ Confirmed CCMStaking is yield-bearing. **Remove:** All paths for `priceOracle` · `R0_BPS` · `POOL_INIT` · `poolRemaining` · `rewardDebt` · `_harvest` · `pendingReward` · `currentYieldRateBps` · `recoverPoolRemainder` · `RewardClaimed`. **New:** Curve-style veToken `Lock{amount,start,end}`, `lock(amt,dur≤4y)` / `increaseAmount` / `increaseUnlockTime` / `withdraw` (principal only, after end) / lock consolidation accounting, linear decay `votingPower=amount*(end-now)/MAXTIME` + **checkpoints/history for historical querying**, **revert transfer/approve (strictly non-transferable)**. **Determine ERC5805 (votes) compatibility** (Decision #16). **Reuse skeleton:** imports · CEI · AccessControl/ReentrancyGuard/SafeERC20 only. **veToken checkpointing is a highly complex audit item** → Re-estimated as XL in §4. |
| **BMEBurner** (USDC → ASSA Swap + Permanent Burn) | None (New) | **[New]** | `processRevenue(usdc,burnBps,minAssaOut)` → `safeTransferFrom` → DEX swap (`deadline`, `minAssaOut`) → `ASSA.burn`. **Caller must go through Safe/Timelock** (non-custodial alignment per §0-5, backend direct call prohibited). `minAssaOut` must be enforced as the **conservative value between on-chain TWAP AND/OR Chainlink** (keeper only configures `maxSlippageBps`, prohibiting push-only single source of truth). Burning = `address(0)` only. **Pre-dependency: ASSA/USDC mainnet pool creation + LP seeding** (see LP task below). |
| **BME LP Bootstrap** (Mainnet Pool + LP) | `_dex-*.ts` (⚠️ **Base Sepolia / Uniswap V3 / Mock USDC only**) | **[New]** | ⚠️ `_dex-*` throws if `chainId!==84532n`. Mainnet Aerodrome (Decision #12) router/pool integration, ASSA/USDC pool creation, and initial LP seeding (specifying funding source and size) are **100% new** and constitute a **critical pre-requisite for BMEBurner deployment**. `_dex-*` is strictly for testnet smoke reference. Minimum liquidity threshold invariant (swap ≤ X% of the pool). |
| **Treasury** (Sale USDC Recipient, Distribution Bucket) | `deploy-safe-3of4.ts` + `transfer-admin-to-timelock.ts` | **[Reuse+New]** | Uses **Gnosis Safe + Timelock** instead of a dedicated `Treasury.sol` (matching ccm pattern). ⚠️ ccm uses a **3-of-4 rehearsal / 3-of-5 mainnet target**. ASSA's 4-of-7 (Decision #9) requires **script parameterization [Reuse] + a 7-signer key ceremony/hardware distribution runbook [New]**. A new `Treasury.sol` will be created only if on-chain bucket accounting is required. |
| **Timelock** (48h) | `CCMTimelock.sol` | **[Reuse As-Is]** | 48h `MIN_DELAY` floor, shortened only for 31337/1337. Renamed to ASSATimelock. Grant `UPGRADER_ROLE` if adopting UUPS evolution modules. |
| **KYCRegistry** (Contract) | `CCMKYCRegistry.sol` | **[Reuse] / Operations Separated as New** | Single `isKYCed` bool. ⚠️ **Not deployed on mainnet (`0x0`)** — deployment is required prior to the sale. **No jurisdiction/expiry in the single bool** → US/CN and sanction blocking **cannot be enforced on-chain**. This must be **enforced through an operational policy** where the `OPERATOR` performs OFAC + nationality filtering **before** writing `setKYCed=true` (enforced as an invariant policy and audit item). The v2 jurisdiction field will be registered via a new contract. |
| **KYC Operations Pipeline** (Webhook → On-chain reflection) | None (Sepolia Rehearsal Only) | **[New]** | ⚠️ ccm lacks experience in mainnet KYC operations. Webhook (HMAC verification) → OFAC screening → `setKYCed` queue. **Determine on-chain reflection SLA** (Decision #11b): automated batching via a dedicated `KYC_OPERATOR` hot key (key exposure trade-off) vs. periodic Safe batching (with notice that same-day participation is unavailable). Include the Sepolia → mainnet promotion rehearsal in the gate. |
| **Hardhat/mocks/deploy · verify** | `hardhat.config.ts` + `mocks/` + `deploy-*.ts` | **[Reuse]** | Reuse `MockUSDC` (6dec) · `ReentrantToken` · `MockPriceOracle`. Fork deploy/verify. ⚠️ `_dry-run-phase1.ts` has a **4.99B cap hardcoded and covers Token+Vesting only** → **Rewrite** for ASSA (10B · KYCRegistry · Sale · full handoff sequence). |

### 2.2 Frontend (Vite/React/wagmi)

| ASSA Screen/Module | ccm Source | Action | Key Changes |
|---|---|---|---|
| **Landing (site)** | `frontend/` (App · sections/earth · Layout) | **[Reuse]** | Reuse route shell · SEO/OG · i18n · legal copy · AllocationRing/VestingTimeline/EmissionCurve. Replace content with the ASSA narrative. |
| **dApp Shell (portal)** | `portal/App.tsx` · Layout · lib | **[Reuse]** | Rearrange `/sale` · `/app` · `/app/stake`. Remove Migrate. |
| **Token Sale (/sale)** | `Sale.tsx` (27KB, near complete) | **[Reuse+Adaptation]** | Reuse N-round loop · progress bars · **exact amount approval (avoiding infinite approval)** · purchase · receipts · explorer. Swap ABI for ASSA, display TGE bps, list KRW fixed price + USDC together, and guard with KYC status. |
| **Dashboard+Claim (/app)** | `Dashboard.tsx` + `Vesting.tsx` | **[Reuse+Adaptation]** | ⚠️ **Post vesting indexing model confirmation** (Decision #4): ccm and `CCMVesting` are **id-indexed** (`scheduleIdsOf → id[] → releasable(id)`), which is inconsistent with the ASSA spec's `releasable(address)`. If maintaining a self-contained structure, loop over `claimable(roundId, addr)`. The 'address-indexed releasable' terminology will be aligned once the model is confirmed. |
| **Non-yield Staking (/app/stake)** | None (Pattern only: Sale approve → write → receipt, EmissionCurve SVG) | **[New]** | Amount + duration (≤4y) → approve → lock → veASSA weight/tier, `increase*`/`withdraw`. **Enforce continuous 'no-yield' anti-misunderstanding copy** and display decay curve. **Force exact amount approval** (NFR). |
| **Wallet/Network Guard** | `wagmi.ts` · `env.ts` (build-time single-chain pin) · `WalletStatusBar` | **[Reuse]** | Rename `appName` to 'ASSA WAVE'. The build-time chain pin (8453/84532) is critical to preventing network confusion. |
| **SIWE Login + Session** | `siwe.ts` · `useSession.ts` + portal-api auth/session/me | **[Reuse]** | ⚠️ **Anti-phishing**: Replace `ALLOWED_DOMAINS` from `ccmnetwork.net` to the **exact set of domains** for `assawave.io` (test to exclude wildcards/homoglyphs), conduct legal + security review for multilingual `APP_STATEMENTS`. Add KYC session endpoint. |
| **Address/ABI Sync** | `contracts.ts` + `wrangler.toml [vars]` | **[Reuse]** | Maintain hardcoding + `IS_MAINNET` build-pin (anti-phishing). Use the shared ABI package as the single source of truth. |
| **i18n KO/EN/JA** | `i18n.ts` + `locales/en.json` | **[Reuse+Adaptation]** | `['en']` → `['ko','en','ja']`, with **ko as default**. Translate 3 namespaces. |
| **Design Tokens & Primitives** | `index.css` (CSS variables + @theme) · `primitives.tsx` | **[Reuse+Adaptation]** | Swap CSS variables to match ASSA branding (Navy + Red + Gold; gold is limited to accents/borders, WCAG AA contrast). Primitives code remains unchanged. |
| **Anti-Phishing/Official Domain Banner** | `Sale.tsx` env banner + `SiteFooter` + `CopyableAddress` | **[Reuse]** | Continuously display 'Official: assawave.io' banner + address verification indicators. |
| **BME Burn Dashboard** | `ValueAccrualLive.tsx` · `TVLLive` (live metrics pattern) | **[Reuse+Adaptation]** | Adopt viem read + periodic refetch patterns. **Worker eventIndexer (Burned aggregation) + D1**. |

### 2.3 Backend (Cloudflare Workers + D1)

| ASSA Endpoint/Module | ccm Source | Action | Key Changes |
|---|---|---|---|
| Hono Router + CORS | `index.ts` | **[Reuse+Adaptation]** | origin = `assawave.io`. Mount `/sale`, `/kyc`, `/portfolio`, `/webhooks`. Remove carbon/sandbox/oracle keepers from `scheduled`. |
| SIWE Auth | `auth.ts` | **[Reuse+Adaptation]** | `buildSiweMessage` · `verify` remain unchanged. ⚠️ Change `ALLOWED_DOMAINS` to the exact set of `assawave.io`. `ALLOWED_CHAIN_IDS` {8453, 84532} remains the same. |
| Session HMAC | `session.ts` | **[Reuse As-Is]** | Unchanged. New `SIWE_SECRET` only. |
| requireSession Middleware | `middleware.ts` | **[Reuse As-Is]** | Unchanged. |
| GET/PUT /me | `me.ts` | **[Reuse+Adaptation]** | Add `ko` (default) / `ja` to `VALID_LANGS`, join `kyc_status` in response. |
| Direct Chain Read (view) | `chain.ts` | **[Reuse+Adaptation]** | ⚠️ Rewire ABI **after vesting model confirmation** (Decision #4). Reuse ERC20/KYC view. New readers for `TokenSale.getRound` and `StakingLock.votingPower`. **Not log indexing (view only)**. |
| view sync Job | `holders.ts` | **[Reuse+Adaptation]** | Reuse vesting/KYC/snapshot **view polling** sync + D1 upsert + `sync_runs`. ⚠️ **No event log polling code exists** — see new `eventIndexer` below. |
| **Event Indexer** (getLogs + cursor) | None | **[New] / L** | ⚠️ **ccm completely lacks `getLogs`/`blockCursor`/`sale_orders`.** New `eventIndexer.ts`: viem `getLogs` + persist `fromBlock` cursor in `sync_state` table + chunk windows + **multiple cron tick backfills to avoid Worker subrequest/CPU limits** + deduplication (`INSERT OR IGNORE`). ABI & decoders for **4 events: Purchased/Locked/Withdrawn/Burned**. Highly sensitive component for data integrity. |
| Email (Resend) | `email.ts` | **[Reuse As-Is]** | `sendEmail` remains unchanged. ASSA templates, multilingual. |
| cron keeper | `scheduled.ts` | **[Reuse+Adaptation]** | ⚠️ **Split single `*/30` cron** (see §2.4 cron topology below). Retain cliff/claim notification skeleton; remove oracle/sandbox. |
| admin Gate | `admin.ts` | **[New] / Upgrade** | ⚠️ **A single shared Bearer is a single point of failure.** Prior to adding capital/regulation sensitive tasks like `/sale/round-config`, `/allowlist`, or the KYC queue, upgrade to **Safe member SIWE + audit logs** (Decision #14, mandatory for Phase 1). Per-operator token + rotation. |
| audit Log | `audit.ts` + `0003_admin_audit.sql` | **[Reuse As-Is]** | `VALID_ACTIONS` already includes `create_round`/`whitelist_set`/`kyc_set`. Force-record sensitive actions. |
| KYC Webhook | None | **[New]** | Provider HMAC verification → OFAC screening → `kyc_status` upsert → `setKYCed` queue. Treat webhook payload as untrusted; signature verification is mandatory. |
| On-ramp Session | None | **[New/Optional]** | Optional for Phase 1. Transak widget session token only (no funds passing through). Phase 2 takes priority. |
| wrangler/D1/CI | `wrangler.toml` + `migrations/` + `package.json` | **[Reuse+Adaptation]** | `name=assawave-portal-api`, new D1. `vars` = ASSA addresses & chain. `environments` (dev = 84532 / staging / prod = 8453). |

### 2.4 Cron Topology (Splitting Single `*/30` — New)

ccm performs serial `await` on all keepers under a single `*/30` cron. For ASSA, the sync + event indexer + BME price push + notification load risks exceeding Worker CPU/subrequest limits → **Split by task**:
- **view sync** (vesting/KYC/snapshot) `*/14`
- **eventIndexer backfill** (Purchased/Locked/Withdrawn/Burned, blockCursor increment + per-tick chunk cap) `*/7`
- **BME price push keeper** (price freshness requirement) `*/4`
- **cliff/claim notifications** `hourly`

Designed to allow separating `eventIndexer` into an independent Worker in the event of log spikes during active sale periods.

---

## 3. Source Sharing Strategy (Redesign — Reflecting git Boundaries)

> ⚠️ **Gap Correction:** The original Option C ("linking two independent repos via a single `pnpm-workspace.yaml` at the `web3/` root") is incompatible with two separate remote origins (ccm and assawave) because **a single `pnpm-workspace.yaml` assumes a single git repository** (colliding lockfile ownerships and node_modules hoisting conflicts). Submodules have been rejected by the user. Therefore, we redesign.

### Option Comparison

| Option | Method | Advantages | Disadvantages | Evaluation |
|---|---|---|---|---|
| **A (Adopted)** | Extract common/stable code into a **separate repository `assa-ccm-shared` (or a publishable package within ccm)**, consumed by both repos using a **git dependency or private npm registry** with version pinning. | Clear version boundaries · no git boundary conflicts · complete repo independence. | Package publishing · version pinning · CI authentication overhead. | ✅ **Adopted** |
| B | Simple Fork | Fastest | Address, ABI, and auth drift (highest risk). | Short-term only |
| C (Discarded) | Single workspace at `web3/` root | — | **Unrealistic due to git boundaries** | ✗ |
| D (Alternative) | Consolidate ccm & assawave into **one monorepo** | Workspace operates correctly. | Requires user confirmation regardless of submodule rejection · loss of repo independence. | Only if decided by the user |

### Adopted (Option A) — Shared Package Scope & Migration Order
- **chains/config** — Base 8453/84532 definitions · RPC · address maps · `IS_MAINNET` build-pin
- **ABI & Address Types** — ABI types generated by typechain (contract build output = single source of truth, **pinned to token freeze version**)
- **viem Helpers** — `publicClient` / `readContract` wrappers (deduplicates code across the 4 apps + Worker)
- **auth/session** — SIWE builder · session HMAC (using `session.ts` as-is)
- **UI Primitives** — Card / CTA / Stat / Step + CSS variable tokens
- **Domain Hooks** — sale / vesting / staking read hooks

**Migration Order (No big bang, regression gate for ccm at each stage):** ① `session.ts` + `chains/config` → ② viem helpers & ABI types → ③ UI primitives → ④ Domain hooks.
⚠️ **Timing:** Extract the **minimal footprint from M1** (`chains/config`, ABI, session) first, ensuring that M1 forks (WS2.3 / WS3.1 / WS3.2) **import from the shared package from the beginning** to avoid retrofitting/drift. Transition domain hooks and UI primitives in M2. Allocate ccm workspace regression testing to **separate personnel** detached from the critical path.

---

## 4. Workstream Breakdown

Sizes: S (≤ 3 days) · M (~1 week) · L (~2 weeks) · XL (> 2 weeks). Tags: [Reuse] = fork/as-is, [Reuse+New] = structural changes, [New] = new implementation.

### ① Contracts

| Task | Tag | Dependency | M | Size |
|---|---|---|---|---|
| WS1.1 Hardhat Bootstrap (config, mocks, deploy, .env) | [Reuse] | — | M1 | S |
| WS1.2 ASSAToken: cap 10B + ERC20Votes + new `_update` (4-way)/`nonces` overrides + finalize burn model | [Reuse+New] | WS1.1 | M1 | M |
| WS1.3 TokenVesting: `tgeBps`/`category` + **rewrite `releasable` accounting** (post-cliff linear + TGE portion) + schedule | [Reuse+New] | WS1.2 | M1 | L |
| WS1.4 TokenSale: 3-round fixed price + **rewrite `claimable` accounting** + finalize gating + **new Pausable** + Treasury receipt | [Reuse+New] | WS1.3 | M2 | L |
| **WS1.4b** KYCRegistry mainnet deployment (no token dependency, in parallel with 1.2) — pre-requisite for Sale | [Reuse] | WS1.1 | M2 | S |
| WS1.5 StakingLock veASSA: remove all reward paths + Lock/`votingPower` linear decay + **checkpoints/history** + non-transferable + determine ERC5805 | [New] | WS1.2 | M3 | **XL** |
| WS1.6 BMEBurner: `processRevenue` + swap + burn + TWAP/Chainlink `minAssaOut` + calling via Safe | [New] | WS1.2, WS1.6b | M4 | L |
| **WS1.6b** BME mainnet LP: Aerodrome pool creation + LP seeding (specify funding) + minimum liquidity invariant | [New] | WS1.2 | M4 | M |
| WS1.7 Treasury (Safe 4-of-7 parameterization + key ceremony runbook) + Timelock (48h) + Handoff (grant → renounce) | [Reuse+New] | WS1.2/3/4/4b | M2 | M |

### ② Frontend

| Task | Tag | Dependency | M | Size |
|---|---|---|---|---|
| WS2.1 Branding token swap (navy/red/gold, WCAG AA) + Wordmark | [Reuse] | — | M1 | S |
| WS2.2 Landing (site) fork + ASSA content + charts + SEO/i18n | [Reuse] | WS2.1 | M1 | M |
| WS2.3 Wallet · SIWE · network guard · **anti-phishing domains** · contracts/ABI synchronization | [Reuse+Adaptation] | WS2.1, WS5.1 | M1 | M |
| WS2.4 Token Sale (/sale): ASSA ABI + gating + TGE bps | [Reuse] | WS2.3, WS1.4 | M2 | M |
| WS2.5 Dashboard (/app) + Claim + veASSA summary (**post vesting model confirmation**) | [Reuse] | WS2.4, Decision #4 | M2 | M |
| WS2.6 Non-yield Staking (/app/stake) new UI + decay curve + anti-misunderstanding copy + exact approval | [New] | WS2.5, WS1.5 | M3 | L |
| WS2.7 BME dashboard + anti-phishing + NFR (LCP < 2.5s · WCAG AA · e2e Playwright) | [Reuse] | WS2.4/5/6, WS4.5 | M3 | M |

### ③ Backend

| Task | Tag | Dependency | M | Size |
|---|---|---|---|---|
| WS3.1 portal-api fork (SIWE / session / me / middleware / db) + domain replacement + `0001` migration | [Reuse] | WS5.1 | M1 | S |
| WS3.2 `chain.ts` ABI rewiring (**post vesting model confirmation** · Sale · StakingLock readers) | [Reuse+Adaptation] | WS3.1, WS1.4, Decision #4 | M2 | M |
| WS3.3 `/sale/rounds` · `/sale/allowlist` · `/portfolio` + `0002` migration | [Reuse] | WS3.2 | M2 | M |
| WS3.4 KYC webhook (HMAC) + OFAC screening + `/kyc/session` + geo-blocking (CF-IPCountry) | [New] | WS3.1 | M1 | M |
| WS3.5 BME keeper Worker (TWAP/Chainlink price, independent cron) | [New] | WS1.6 | M4 | M |
| **WS3.6** admin console **upgrade to Safe member SIWE** + force audit logging for sensitive actions | [New] | WS3.1 | M2 | M |

### ④ Data/Sync (Worker+D1)

| Task | Tag | Dependency | M | Size |
|---|---|---|---|---|
| WS4.1 `holders.ts` **view polling** sync fork (vesting/KYC/snapshot) ASSA rewiring | [Reuse] | WS3.2 | M2 | M |
| **WS4.2 new eventIndexer** (getLogs + `sync_state` cursor + chunking + deduplication) — Purchased/Locked/Withdrawn/Burned | [New] | WS4.1 | M2 | **L** |
| WS4.3 `sale_orders` / `locks_cache` / `bme_burns` D1 schema + 4 decoders | [New] | WS4.2 | M2/M3 | M |
| WS4.4 `scheduled.ts` cliff/claim notification fork (multilingual) | [Reuse] | WS4.1 | M2 | S |
| WS4.5 Cron topology splitting (§2.4) | [New] | WS4.2 | M2 | S |

### ⑤ Infrastructure & DevOps

| Task | Tag | Dependency | M | Size |
|---|---|---|---|---|
| WS5.1 **Shared Package Skeleton (Option A)** minimal extraction (`chains/config` · ABI · session) + git dependency wiring | [New] | — | M1 | M |
| WS5.2 wrangler environments (dev/staging/prod) vars & secrets + cron topology | [Reuse] | WS3.1 | M1 | S |
| WS5.3 GitHub Actions: PR = typecheck + hardhat test + vitest, `main` = staging, `tag` = prod + D1 migrate | [Reuse] | WS5.2 | M2 | S |
| WS5.4 Anti-phishing infra: defensive domains (.ai/.net) registration, 301 redirects, DNSSEC + Basescan verify, address registry, Defender/Tenderly, `/health` | [Reuse+New] | WS1.7 | M2/M4 | M |

### ⑥ Security & Auditing

| Task | Tag | Dependency | M | Size |
|---|---|---|---|---|
| WS6.1 Slither + Solhint + coverage (≥95% core) CI + mock porting + threat model document | [Reuse] | WS1.1 | M1 | M |
| WS6.2 **New invariant/fuzz testing** (Foundry forge or hardhat+fast-check — **missing in ccm**): `totalSupply` ≤ 10B · `mint` caller authorization · `sold` ≤ cap · **`claimed` ≤ `total` + TGE/linear boundaries** · absence of veASSA reward paths (negative invariant + static ABI check) · **`ERC20Capped` + `Votes` + `Pausable` `_update` MRO** (no checkpoints recorded on mint exceeding cap · `votingPower` remains constant during pause) | [New] | WS6.1 | M2 | L |
| WS6.3 In-house verification of the 3 new components (veASSA · BME · Votes) + Sale/Vesting accounting verification (not a delta) | [Reuse+New] | WS1.4/5/6 | M2/M3 | L |
| **WS6.4a External Audit #1** (Token+Votes · Sale · Vesting · KYCRegistry integration) — 0 crit/high gate | [New] | WS6.2/6.3 | M2 | L |
| **WS6.4b External Audit #2** (veASSA · BMEBurner) — 0 crit/high gate | [New] | WS1.5/1.6 | M3 | L |
| WS6.5 Safe 4-of-7 + 48h Timelock handoff Sepolia rehearsal (runbook) + EOA renounce | [Reuse] | WS6.4a | M2 | M |
| WS6.6 Immunefi bug bounty vault funding & launch (immediately post-mainnet) | [Reuse] | WS6.5 | M2 | S |

> ⚠️ **WS6.2 (fuzz) is an explicit pre-requisite dependency for WS6.4a/b (external audit). Entering audits without fuzz testing is prohibited. Since ccm had 0 fuzz tooling, the introduction of Foundry/fast-check is 100% new.**

### ⑦ Compliance

| Task | Tag | Dependency | M | Size |
|---|---|---|---|---|
| WS7.1 KYC/AML integration (KYCRegistry + Sumsub/Persona) · **codify OFAC + nationality `setKYCed` pre-filter operational policies** · geo-blocking US/CN (IP + wallet) | [Reuse+New] | WS3.4, WS1.4b | M2 | M |
| **WS7.2 VAUPA / MAS / ADGM Legal Opinion & Securities Determination — Mainnet Sale Hard Gate** | [New] | — | M2 | M |
| WS7.3 Terms of service / privacy policy / cookie consent · legal review of no-yield copy | [New] | WS2.6 | M3 | S |

---

## 5. Dependency Graph & Critical Path

```
WS5.1 Shared Package (Minimal chains/ABI/session) ──> Consumed immediately by WS2.3 / WS3.1 / WS3.2 (avoids retrofitting)

WS1.1 Hardhat ──┬─> WS1.2 ASSAToken (Votes+10B+nonces) ──[Code Freeze = Audit #1 Input]──┐
                │        ├─> WS1.3 Vesting (Accounting Rewrite) ──> WS1.4 Sale (Accounting+Pausable+Gating) ─┤
                │        ├─> WS1.5 veASSA (Non-yield Rewrite + Checkpoints) ──[XL, Audit #2 Input]──────────┤
                │        └─> WS1.6b LP Seeding ──> WS1.6 BMEBurner ──[Audit #2 Input]───────────────────────┤
                │   WS1.4b KYCRegistry (No token dependency, parallel) ──> WS1.4 Gating / WS1.7 Handoff     │
                └─> WS6.1 Security CI ──> WS6.2 Fuzz (New) ══Pre-requisite══> Audit                          │
                                                                                                            v
   [Funding Gate] ASSAToken deployed → deployer (EOA admin) mints & transfers entire sale/vesting/veASSA pools
                 → configure createRound/createSchedule → transfer-admin-to-timelock handoff afterward
                 (post-handoff replenishment uses 48h timelock mint runbook — WS1.7 completion criteria)
                                                                                                            v
   WS6.2 ──> WS6.4a Audit #1 (Token/Sale/Vesting/KYC) ══HARD GATE══╗
   WS7.2 Legal GO Opinion ═════════════════════════════════════════╬══> Mainnet Sale (M2)
   WS6.5 Handoff Rehearsal + EOA Renounce + WS1.4b KYCRegistry Mainnet ╝

   WS1.5 + WS1.6 ──> WS6.4b Audit #2 ══HARD GATE══> veASSA/BME Mainnet Deployment (M3)

   Backend (WS3 SIWE reuse) & Landing (WS2.2) are parallel (non-critical) using only ABI/address + testnet deployment
   WS4.2 eventIndexer (New) is critical for data integrity — pre-requisite for sale_orders / BME dashboard
```

### Order (Critical Path)
1. **WS5.1 Shared Package Minimal Extraction** (consumed by M1 forks from the beginning)
2. **WS1.1 Infrastructure + WS1.2 ASSAToken** (Votes+10B, `_update`/`nonces` compilation gates) → **M1 Token Code Freeze**
3. **WS1.3 Vesting ∥ WS1.4 Sale** (both accounting rewrites) + **WS1.4b KYCRegistry** (parallel · sale gating pre-requisite)
4. **WS1.5 veASSA** (XL, longest path) ∥ **WS1.6b LP → WS1.6 BME**
5. **Funding Gate** → **WS1.7 Handoff** (grant → renounce)
6. **WS6.2 Fuzz → WS6.4a Audit #1 ∥ WS7.2 Legal GO** — ⚠️ **Mainnet Sale Hard Gate (M2)**
7. **WS6.5 Handoff Rehearsal + KYCRegistry Mainnet** → **Mainnet Deployment → Sale Launch (M2)**
8. **WS6.4b Audit #2** → **veASSA/BME Mainnet (M3)**

> **Parallel Non-critical Path:** WS3 (backend SIWE reuse) · WS2.2 (Landing) · WS2.4 (Sale UI) progress simultaneously using only ABI/address + testnet deployment. WS4.2 (eventIndexer) is new but critical for data integrity. WS2.6/BME dashboard depends on WS1.5/1.6 (M3).

---

## 6. Milestone Plan (M1 ~ M5)

> **Audit Correction:** Absence of a third-party external audit report in the ccm codebase → Discard "delta SOW / audit inheritance". Split into **2 full-scope audits**. ccm mainnet live does not equal audit approved.

### M1 — Bootstrap & Reused Core
- **Deliverables:** assawave repo scaffolding, **shared package minimal extraction (chains/ABI/session)**, ASSAToken (Votes+10B) · Vesting testnet deployment, Landing (branding + KO/EN/JA), SIWE authentication (anti-phishing domain set), security CI (Slither+coverage), KYC webhook skeleton, wrangler env + cron topology.
- **Exit Criteria:** ASSAToken/Vesting Base Sepolia deployment + verify, `_update` (4-way)/`nonces` override alignment + **`totalSupply ≤ 10B` unit test** green, SIWE `nonce` → `verify` → session e2e green, **ASSAToken Code Freeze (Audit #1 Input)** · pin ABI to shared package, Slither 0 high.
- **DoD:** 4 apps build & deploy operational, no changes to token after M1 (change = v2 process).
- **ccm Savings:** Fork Token/Vesting/auth/session/wagmi/i18n/design tokens. New = Votes override · branding · anti-phishing domains.

### M2 — Sale Full Stack + Audit #1 + Legal Gate (Mainnet Sale Launch)
- **Deliverables:** TokenSale (3 rounds, **rewritten `claimable` · Pausable**) · Sale UI · `/sale/rounds` · `/portfolio` · **eventIndexer (Purchased)** · KYC webhook (OFAC) · admin SIWE upgrade · Safe/Timelock/**KYCRegistry mainnet** deployment, **completion of External Audit #1**, **Legal GO Opinion**, phased integration of shared package domain hooks.
- **Exit Criteria:** ⚠️ **(A) Audit #1 0 crit/high + all mediums mitigated**, **(B) Acquisition of VAUPA/securities Legal GO Opinion** (without which `createRound`/`withdrawUSDC` are prohibited), (C) Safe 4-of-7 + 48h handoff Sepolia rehearsal + EOA renounce, (D) KYCRegistry mainnet deployed + OFAC pre-filter policies enforced, (E) **pre-funding of all sale round allocations completed prior to handoff**, (F) **KYC approval → on-chain reflection SLA** specified, (G) Immunefi vault funded.
- **DoD:** Base Sepolia **Sale → Gate → TGE Immediate Unlock → Cliff → Linear Claim → USDC received in Treasury Safe** full sequence E2E (rewritten dry-run) passes; mainnet first round opens.
- **ccm Savings:** Reuse `Sale.tsx` (27KB) · view sync · handoff runbooks. New = `claimable` accounting · Pausable · `eventIndexer` · audit lead time.

### M3 — Non-yield Staking + BME Launch + Audit #2
- **Deliverables:** StakingLock veASSA (mainnet) · `/app/stake` UI (decay curve · anti-misunderstanding copy) · BMEBurner + LP (mainnet) · BME dashboard · final multilingual assets · compliance copy.
- **Exit Criteria:** ⚠️ **Audit #2 0 crit/high** (veASSA · BME), veASSA "absence of reward distribution function" negative invariant + static ABI check passes, token balance == sum of lock principals (0 excess outflow), BME swap+burn fork test (Base) passes · minimum liquidity invariant, BME dashboard chain ↔ cache consistency, legal approval of non-yield copy.
- **DoD:** lock → `votingPower` decay → withdraw E2E, `BME` `processRevenue` → burn mainnet verification.
- **ccm Savings:** Borrow Sale approve → write → receipt patterns · EmissionCurve SVG · live metrics · keeper patterns. New = veASSA (XL) / BME logics.

### M4 (Outline) — Phase 2 Fan Economy
ConsumptionEngine, StarRanking/FandomBattle, EdgeNode+MiningRewards, ERC-1155 NFT. Entirely new, massive audit scope. If eventIndexer load spikes, re-evaluate Ponder/The Graph.

### M5 (Outline) — Phase 3 Governance & L3
ASSAGovernor + Timelock (reflecting votes single source of truth Decision §8-16), PredictionMarket (VRF), DebutFundingDAO, L3 (OP Stack).

---

## 7. Risk Register

| Risk | Impact | Probability | Mitigation |
|---|---|---|---|
| **Underestimating new event indexer scope** (0 `getLogs` code in ccm) | High (Data Integrity) | High | Classify WS4.2 as [New]/L; implement `sync_state` cursors, multiple cron backfills, deduplication, and design for Worker subrequest/CPU limits. |
| **Bugs in Sale/Vesting accounting rewrite** (ccm `startTime`-based linearity flaw, TGE double-counting, underflow) | High (Over/Under-disbursement) | Medium | Spec §3.3 formula as single source of truth; linear vesting starts post-cliff; boundary fuzzing (`t = start / start+cliff / start+duration`); enforce `claimed ≤ total` invariant. |
| **Absence of audit baseline** (delta SOW invalid) | High (Scope/Schedule) | High | Contract 2 full-scope audits; reserve slots 4–8 weeks in advance; establish fuzzing as a mandatory pre-requisite gate. |
| **Launching sale without legal approval** (VAUPA, securities) | High (Illegal) | Medium | Establish WS7.2 Legal GO as M2 hard gate; enforce on-chain `isKYCed` as final gate. |
| **veASSA non-yield rewrite + checkpoints** (residual yield mechanics, decay precision, high veToken audit difficulty) | High (Value Outflow) | Medium | Re-estimate scope as XL; enforce negative invariants + static ABI checks; cross-reference Curve/Velodrome implementations; execute Audit #2; test with `ReentrantToken` re-entry. |
| **BME DEX/MEV/Liquidity risks** (sandwiching, insufficient pool depth, keeper key theft) | High (Direct Losses) | Medium | Enforce conservative pricing using TWAP + Chainlink; keeper only configures `maxSlippageBps`; mandate LP seeding first + minimum liquidity invariant; leverage Flashbots Protect; call exclusively via Safe. |
| **Unverified mainnet KYC operations** (Sepolia rehearsal only, webhook forgery, Safe signing delays) | High | High | Validate webhooks via HMAC; apply OFAC pre-filters; conduct promotion rehearsals; define on-chain reflection SLA (hot key vs. Safe batching). |
| **Funding ↔ Handoff sequencing conflict** (Sale funding locked for 48h if `MINTER` is revoked first) | High (Operational Freeze) | Medium | Explicitly define the Funding Gate (mint entire supply → configure rounds/schedules → execute handoff); compile a 48h timelock mint runbook for replenishments. |
| **Shared package git boundaries** (single workspace conflict) | Medium | Medium | Implement Option A (separate package + git dependency); discard Option C. |
| **Single Bearer token on admin panel as single point of failure** (round tampering, unauthorized whitelisting) | Medium | Medium | Upgrade to Safe member SIWE; enforce price freeze on-chain; mandate audit logging. |
| **`ERC20Capped` + `Votes` + `Pausable` `_update` MRO** | Medium | Medium | Establish runtime invariants rather than compile gates (no checkpoints written on mint exceeding cap · `votingPower` remains constant during pause). |
| **Double-voting between `ASSAToken` votes and `veASSA` votes** | Medium | Medium | Single source of truth for votes in Phase 1 (§8-16): keep token votes dormant or use veASSA only; enforce non-transferability. |
| **Lack of `Pausable` in Sale** (incapable of emergency stop) | Medium | Medium | Add `whenNotPaused` to `purchase`; exempt claim/withdraw from pause. |

---

## 8. Decisions Required (⚠️ User Approval) — Including **[Recommendations]**

1. **Stack Override** — [Approval] Discard Foundry/Next14/NestJS/Ponder, finalize ccm actual stack.
2. **Indexer** — [Worker view polling + **New eventIndexer**] Separate Ponder/Graph unnecessary for Phase 1. ⚠️ Event log indexing is missing in ccm and must be built anew.
3. **Sale Gating** — ✅ **Confirmed (2026-05-30): Maintain per-round whitelist** (ccm `whitelist[round][addr]` boolean unchanged = true reuse · 0 new audit surface). KYCRegistry will be **used in tandem** for frontend/backend gating + on-chain source of truth. Discard alternative: injecting `isKYCed` into `purchase` (contract change · new audit surface · KYCRegistry mainnet dependency).
4. **Sale Vesting Model** — ✅ **Confirmed (2026-05-30): Maintain CCMTGESale/CCMVesting self-contained id-indexing** (loop over `claimable(roundId, addr)`, chain.ts/UI also id-indexed). TGE/cliff accounting will be rewritten using the spec §3.3 formula (WS1.3/1.4, separate). Discard alternative: redesigning for a single aggregated `releasable(address)`. → **WS3.2/WS2.5 blocking is cleared.**
5. **Source Sharing** — [**Option A (separate package + git dependency) Recommended**] Option C (single workspace) discarded; submodules rejected. Option D (monorepo integration) is open if decided by user.
6. **ASSAToken ERC20Votes** — [Phase 1 Inclusion Recommended] Pre-requisite for Phase 3 governance. Increases `_update`/`nonces` complexity and audit scope.
6b. **Burn Model** — [**Maintaining ERC20Burnable Recommended** (BMEBurner burns its own balance; EOA burning is harmless)] vs. `BURNER_ROLE` gate (respects spec's 'prohibit EOA burning', increases audit surface). Pre-requisite for WS1.6 interface.
7. **StakingLock Non-yield Finalized** — [Confirmed] Remove all reward/emission/oracle paths; enforce negative invariants.
8. **Token Upgradeability** — [Core Immutability Recommended] Token/Sale/Vesting non-upgradeable. UUPS limited to Phase 2 evolution modules only.
9. **Safe Configuration** — [**4-of-7 Recommended**] ccm 3-of-4 script parameterization [Reuse] + 7-signer key ceremony [New]. Confirm viability of acquiring 7 signers.
10. **Payment Currency** — [USDC Only] Fix price equivalent to KRW and list in USDC. On-ramp planned for Phase 2.
11. **KYC Provider & Geo-blocking** — [Single provider after abstraction] Sumsub vs. Persona; US/CN IP + wallet blocking.
11b. **KYC On-chain Reflection SLA** — [**Pre-screening before sale + Safe batch Recommended** (with notice that same-day participation is unavailable)] vs. automated batching via a dedicated hot key (key exposure trade-off).
12. **BME DEX & Price Source** — [Aerodrome + TWAP/Chainlink conservative value] Finalize ASSA/USDC LP seeding size and funding source.
13. **Audit SOW & Bounty** — [**2 full-scope audits** (Audit #1 = Token/Sale/Vesting/KYC at M2; Audit #2 = veASSA/BME at M3), discard delta audits, reserve slots early, launch Immunefi immediately post-mainnet].
14. **Admin Console Authentication** — [**Upgrade to Safe Member SIWE Recommended**, mandatory for Phase 1] Avoid single point of failure with shared Bearer.
15. **Brand Inheritance (Corrected by Measured BI)** — [**Red #EF2525 primary + White + Dark Ink canvas + Gold accent** finalized] ⚠️ The previous "Navy + Red + Gold" was assumed from pitch decks. The **measured BI (`docs/assa-bi/`) only contains Red and White** (no Navy or Gold). Realignment: Red = Brand/CTA; **navy = dApp dark canvas**; **gold = limited to badges/borders/tiers (no text usage)**; data visualization = neutral `--data-*` (no red). **WCAG measurement:** White text on `#EF2525` = **4.23:1 FAIL** → Finalize **Primary Background = #C81E14 (brand-pressed)**. Establish **ΔE separation** across the 3 red tones (`#EF2525` / `#D93A26` / `#DC2626`) for brand vs. progress vs. danger. **BI Master = bold wordmark (logo01.png)**; ▶ + wave symbol = logo mark (OG/favicon). Fonts: Righteous + Poppins + Chakra Petch + Pretendard (KO)/Noto JP. ⚠️ ccm reuse is not a simple 'color variable swap' but requires a **`--moss` (single accent, used 237 times) semantic split audit** (brand vs. data vs. positive). Details in `ASSA_WAVE_SITE_DESIGN.md` §1 · §1.0a · §6. Elevate WS2.1 to 'audit-based semantic split'.
16. **Votes Source Consolidation** — [**Keep Phase 1 Token Votes Dormant; Governance using veASSA Only (Phase 3) Recommended**] Prevents double-voting. Determine veASSA `transfer` revert (non-transferable) & ERC5805 compatibility.
17. **Sale Pausable** — [Add `whenNotPaused` to `purchase`; exempt claim/withdraw from pause Recommended] Required by spec §3.2.
18. **Testnet Key Isolation Policy** — [**Per-project Key Isolation Recommended**] ccm testnet keys (`.phase2-rehearsal-keys.json` · `.carbon-oracle-keeper.json`) are `.gitignore`'d throwaway wallets exclusive to Sepolia and have no value for reuse. Creating **new dedicated deployer/keeper/admin keys** for assawave is highly recommended. Rationale: In the same chain (Base Sepolia `84532`), contract addresses are derived from `(deployer, nonce)`. Sharing keys mixes nonces → **precludes reproducibility of assawave testnet addresses · creates registry confusion**, and helps shrink the blast radius, isolate audit trails, and establish mainnet key discipline early. **The targets of reuse are settings/tooling, not the keys themselves** — Sepolia RPC (`sepolia.base.org`), `chainId` `84532`, faucet, deploy/keeper scripts (`_*-keeper-*.ts`), wrangler structure, and KYCRegistry rehearsal *patterns* (note that assawave must deploy its own instance and must not point to ccm's `0x9172...`). **Hard Rules:** ① Testnet keys ≠ Mainnet keys (strictly); ② **Do not copy** ccm `.env` or key JSONs to assawave (prevents secret sprawl) — reference patterns only, generate fresh keys; ③ Mainnet Safe signers & deployer must use dedicated hardware keys and must never be shared with anything. Exception: Individual dev/QA wallets (used for clicking MetaMask in Sepolia UI testing) are harmless to share between projects. *(Related: #9 Safe Configuration · #11b KYC On-chain Reflection SLA. Key generation/input must be executed directly by the user for security).*

---

## 9. Immediate Actions (First Sprint, 1–2 Weeks)

**Shared Package Skeleton (Option A — Minimal Extraction First)**
- [ ] Scaffold shared package repo (`assa-ccm-shared` or publishable package inside ccm) + wire git dependencies for both repos
- [ ] First migration of `session.ts` + `chains/config` (Base 8453/84532 · RPC · address map stub), verify **ccm regression test green**

**On-chain (Critical Path Launch)**
- [ ] Clone `ccm/onchain` → `assawave/onchain`: `hardhat.config.ts` (0.8.24 cancun · optimizer 200 · Base/Sepolia · Basescan v2 verify) · `mocks/` · `.env` template
- [ ] **ASSAToken**: Fork `CCMToken` → inherit `ERC20Votes` → new `_update` override `(ERC20,Capped,Pausable,Votes)` + `nonces()` (`ERC20Permit,Nonces`) → change cap 5B → 10B (**maintain ERC20Capped**) → name/symbol = 'ASSA' → **finalize burn model** (Decision #6b) → execute compilation · `totalSupply ≤ 10B` · `_update` MRO unit tests
- [ ] Bootstrap **new fuzz tooling** (Foundry forge or hardhat+fast-check — absent in ccm)
- [ ] Deploy to Base Sepolia + verify + initialize address registry JSON

**Design System (Parallel)**
- [ ] Fork `frontend` tokens → swap `index.css` CSS variables to navy/red/gold (WCAG AA, gold limited to accents) + add ASSA Wordmark
- [ ] Verify `primitives.tsx` runs unchanged

**Backend (Parallel)**
- [ ] Fork `portal-api` (index/auth/session/middleware/db/me/email) → update domain to `assawave.io`, enforce **exact set of `ALLOWED_DOMAINS`** → generate new secrets
- [ ] New D1 + `0001_init` + **`sync_state` (event cursor) schema** → run `nonce` → `verify` → session cookie vitest e2e green

**Infrastructure/CI**
- [ ] Fork `wrangler.toml`: update `name` · D1 · `vars` (ASSA stub · dev = 84532) + environments + **cron topology split skeleton**
- [ ] GitHub Actions: PR = typecheck + hardhat test + vitest + Slither + Solhint + coverage gates
- [ ] **Inquire early with 2–3 audit firms** (separate SOWs for Audit #1 / #2) + **kickoff legal (VAUPA / securities) consultations** (M2 hard gate)
- [ ] Register defensive domains (.ai/.net) · initiate DNSSEC setup

---

*This plan is premised on reusing the live ccm codebase (Base mainnet). The actual new tasks on the critical path are ① veASSA non-yield rewrite (XL), ② BMEBurner+LP, ③ ERC20Votes, ④ event indexer, ⑤ mainnet KYC operations, and ⑥ rewrite of Sale/Vesting TGE accounting. The mainnet sale is hard-gated on **passing External Audit #1 + acquisition of the Legal GO Opinion**, while the veASSA/BME mainnet deployment is hard-gated on **passing Audit #2**. Because ccm lacks third-party external audits, event indexing, fuzz tooling, and mainnet KYC operations, these are scoped as new implementations rather than reuse. M1 kickoff will commence following approval of the 18 decisions in §8 (specifically, #3 gating, #4 vesting model, and #16 votes source consolidation which are pre-requisites for other tasks).*
