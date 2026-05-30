# ASSA WAVE — Site Development Plan & Specifications

> **Status:** Draft v0.1 · **Date:** 2026-05 · **Official Domain:** **assawave.io**
> **Related Docs:** Whitepaper v2.0 · Contracts Spec (ASSA_WAVE_CONTRACTS_SPEC.md) · Financial Model
> This document provides the development specifications for initiating Web/dApp development. It includes details for MVP (Phase 1) and outlines for Phase 2 and Phase 3.

---

## 0. Summary (TL;DR)

| Item | Decision |
|---|---|
| Purpose | (a) Token sale for investors + (b) Web3 dApp for fans (staking, consumption, nodes) |
| Official Domain | Single domain at **assawave.io** (with defensive redirects for `.ai`/`.net`). Anti-phishing notices will be permanently displayed |
| Frontend | **Next.js 14 (App Router) + TypeScript + Tailwind**, wagmi/viem, RainbowKit |
| Chain | **Base** (transitioning to a proprietary L3 in Phase 2+). SIWE (Sign-In with Ethereum) login |
| Backend | Node (NestJS) API + **Indexer (Ponder/The Graph)** + Postgres + Redis |
| Infrastructure | Vercel (Web) + AWS/GCP (API & Indexer) + Cloudflare (CDN & WAF) |
| Compliance | KYC/AML (Sale), Geo-blocking (US/CN), VAUPA/MAS/ADGM compliance, i18n (KO/EN/JA) |

Principle: Align the **Sale Site (Investors)** and **dApp (Fans)** using the same design system, prioritizing maximum security for the token sale and wallet connection flows.

---

## 1. System Architecture

```
            ┌─────────────── Cloudflare (CDN / WAF / DNS) ───────────────┐
            │                                                            │
   ┌────────▼─────────┐     ┌──────────────────┐      ┌─────────────────▼┐
   │  Web (Next.js)    │     │   API (NestJS)    │      │  Indexer (Ponder) │
   │  - Landing        │◀───▶│  - Auth (SIWE)    │◀────▶│  - Base Event Sync│
   │  - Token Sale     │     │  - KYC/orders     │      │  - balances/vesting│
   │  - dApp Dashboard │     │  - profiles/rank  │      │  - rank/consumption│
   │  wagmi/viem+Rainbow│    │  - webhooks       │      └─────────┬─────────┘
   └────────┬──────────┘     └───────┬───────────┘                │
            │ JSON-RPC                │ Postgres / Redis            │ subgraph
   ┌────────▼─────────────────────────▼───────────┐     ┌─────────▼─────────┐
   │            Base (L2) Smart Contracts          │     │  External SaaS     │
   │  ASSAToken·Sale·Vesting·BME·StakingLock ...   │     │  KYC, On-ramp,     │
   └───────────────────────────────────────────────┘     │  Chart API, Email  │
                                                          └────────────────────┘
```

- **Reads:** On-chain data is synchronized via an **Indexer** (Ponder/The Graph) for high-speed retrieval by the API and Frontend (balances, vesting, lockups, rankings). Direct RPC queries are reserved only for transaction submissions and real-time validations.
- **Writes:** Users sign and submit transactions directly via their connected wallet (non-custodial). The backend does not handle or hold user funds.
- **Off-chain State:** User profiles, KYC records, order metadata, ranking caches, and auxiliary consumption scores are stored in Postgres.

---

## 2. Technical Stack (Recommended)

| Layer | Choice | Remarks |
|---|---|---|
| Frontend | Next.js 14, TS, Tailwind, shadcn/ui, Framer Motion | App Router, SSR/ISR |
| Web3 | **wagmi + viem**, **RainbowKit** (Wallet), SIWE | Base chain configuration |
| Charts | Recharts / visx | Tokenomics & demand charts |
| Backend | NestJS (Node 20), Prisma, Postgres, Redis, BullMQ | REST + partial GraphQL |
| Indexer | **Ponder** (Recommended) or The Graph subgraph | Base events |
| Infrastructure | Vercel (web), AWS ECS/Fargate (api/indexer), RDS, ElastiCache | IaC: Terraform |
| Security/Ops | Cloudflare WAF, Sentry, Datadog, OZ Defender (Contracts) | |
| External | KYC (Sumsub/Persona), On-ramp (Transak/Stripe), Email (Resend/SES) | |

---

## 3. Phase 1 (MVP) — Page & Feature Details

> Phase 1: **Landing · Token Sale · Dashboard · Staking (Interest-Free) · Wallet Connection**. Q3~Q4 2026.

### 3.1 Landing (`/`)
- **Purpose:** Introduce the project, build investor trust, and drive traffic to the token sale. Includes whitepaper/pitch deck downloads, roadmap, team showcase, and FAQ.
- **Elements:** Hero section (ASSA/K-Wave theme), key metrics (MAU, 5M installs, $1.2B TAM), tokenomics summary (allocation, BME, consumption/staking), demand/scenario charts, partners, and **official domain notice banner** ("Official: assawave.io — beware of duplicate/imposter sites").
- **SEO/Social Sharing:** OG tags, multilingual support (KO/EN/JA), `robots.txt`, sitemap.

### 3.2 Token Sale (`/sale`)
- **Flow:** Connect Wallet → Verify Network = Base → **Check KYC Status** (embed KYC widget if unverified) → Select Round (1st/2nd/3rd) → Input USDC amount → approve → `buy()` → Display receipt and vesting schedule.
- **Display:** Unit price per round (approx. 30/50/70 KRW equivalent in USDC), remaining cap, progress bar, countdown timer, individual allocation, and vesting (TGE/cliff/linear) curves.
- **Guards & Restrictions:** Whitelist (Merkle proof) validation, geo-blocking, individual caps, transaction states (pending/success/fail), slippage and gas fee guidance.
- **Security:** **Hardcoded & verified contract address display**, phishing warnings, and exact-amount ERC-20 approvals (discourage infinite approval).

### 3.3 Dashboard (`/app`)
- **Portfolio:** $ASSA balance, vesting status (claimable/locked) + **Claim** button, current lockup (veASSA) status, and transaction history.
- **Data Sources:** High-speed querying via the Indexer + direct on-chain verification.

### 3.4 Staking (`/app/stake`) — **Interest-Free Lockup**
- **UX Clarity:** Explicit copy to prevent misunderstandings is mandatory: "This staking program **does not yield interest/yield**. Locking up your tokens grants you **ranking weight, governance power, and tier eligibility** while locking market supply."
- **Features:** Select amount & duration (up to 4 years) → `lock()` → Display veASSA voting power/tier. Extend duration, increase amount, and withdraw after maturity.
- **Visualization:** Weight decay curve, user tier, and governance power (for future phases).

### 3.5 Common: Wallet & Auth
- **Connection:** RainbowKit (MetaMask, Coinbase Wallet, WalletConnect). Automatic addition/switching to the Base network.
- **Login:** **SIWE** (Sign-In with Ethereum) → Session generation (JWT/cookie). Requires signature only; strictly non-custodial.
- **States:** Guard UI for invalid network, disconnected wallet, incomplete KYC, etc.

---

## 4. Phase 2 — Outline

| Screen | Description |
|---|---|
| **Consumption Competition (`/app/compete`)** | Star rankings and fandom battles. Boost ranking via token **consumption (burning)**, season leaderboards, and accumulate points for ticket pre-sales and badges. |
| **Node Operator Portal (`/app/node`)** | K-Node registration, uptime tracking, mining rewards, auto-stake, and direct links to hardware purchases. |
| **NFT Marketplace (`/app/market`)** | Trading of Performance/Concert Passes and Voice DNA NFTs (ERC-1155). |
| **MagicSing App Integration** | Separation of the music app (singing, scores, VPU) ↔ Wallet app (finance), with integrated score attestations. |

---

## 5. Phase 3 — Outline

Governance portal (veASSA voting & proposals), All-Kill Pool/prediction markets, Fan Tokens, full-fledged dApp ecosystem, and transition to L3 (including bridge UI).

---

## 6. Data Model (Off-chain, Excerpt)

| Table | Core Columns |
|---|---|
| `users` | id, wallet(addr, unique), handle, locale, created_at |
| `kyc` | user_id, provider, status(none/pending/approved/rejected), country, updated_at |
| `sale_orders` | id, user_id, round, assa_amount, usdc_amount, tx_hash, status |
| `vesting_cache` | wallet, category, total, claimed, claimable, next_unlock (Indexer sync) |
| `locks_cache` | wallet, amount, end, voting_power (Indexer sync) |
| `rank_cache` | target_id(star/fandom), season, points, updated (Phase 2) |
| `consumption_log` | wallet, target_id, amount, burned, tx_hash (Phase 2) |

> On-chain data remains the absolute source of truth. The tables above serve as **read caches/metadata** and are updated dynamically by the Indexer via events.

---

## 7. API (Excerpt)

```
POST /auth/siwe/nonce         # SIWE nonce
POST /auth/siwe/verify        # Signature verification → Session
GET  /me                      # Profile & KYC status
POST /kyc/session             # KYC widget token
GET  /sale/rounds             # Round status (price, cap, remaining, timer)
GET  /sale/allowlist/:addr    # Returns Merkle proof
GET  /portfolio/:addr         # Balance, vesting, and lockups (Indexer)
POST /webhooks/kyc            # KYC provider callback
POST /webhooks/chain          # Indexer events → Notifications
```
- Auth: SIWE session + rate limiting. CSRF/CORS restrictions on sensitive endpoints.

---

## 8. Non-Functional Requirements (NFR)

- **Security:** CSP, HSTS, WAF, rate limiting, secret management (KMS), contract address whitelists, exact/minimal approvals, and **anti-phishing measures** (official domain banners, verified channels, DNSSEC). Regular penetration testing.
- **Compliance:** KYC/AML for sales, geo-blocking (US/CN, etc. based on IP and wallet addresses), Terms of Service/Privacy Policy, VAUPA alignment (cold wallets, regulatory reporting), MAS/ADGM compliance, and cookie consent.
- **i18n:** KO (default)/EN/JA. Locale-specific currency and date formatting.
- **Performance:** LCP < 2.5s, Indexer latency < several seconds, caching (Redis/ISR).
- **Accessibility:** WCAG AA compliance, keyboard navigation, and high color contrast.
- **Observability:** Sentry (error tracking), Datadog (APM), on-chain monitoring (OpenZeppelin Defender), and analytics (Plausible/GA4).

---

## 9. Environments · CI/CD · Repository

- **Environments:** `dev` (Base Sepolia) → `staging` → `prod` (Base mainnet). Contract addresses and Chain IDs configured per environment.
- **CI/CD:** GitHub Actions (lint, typecheck, test, e2e Playwright) → Vercel/ECS deployment. Preview deployments enabled.
- **Repository (Turborepo monorepo recommended):**
```
apps/web        (Next.js)
apps/api        (NestJS)
apps/indexer    (Ponder)
packages/ui     (Design System)
packages/abi    (Contract ABIs, addresses, types)
packages/config (chains, env)
```

---

## 10. Milestones (Roadmap Alignment)

| Timeline | Deliverable |
|---|---|
| **M1 (Q3 2026)** | Design system, Landing page, Wallet connection/SIWE integration, KYC widget integration, contract deployment on testnet |
| **M2 (Q3~Q4 2026)** | **Token Sale** (3 rounds), Vesting setup, Dashboard & Claim functionality, Indexer deployment, 1st audit → **Mainnet Sale** |
| **M3 (Q4 2026)** | **Interest-Free Staking** UI, BME dashboard, multilingual support |
| **M4 (Q1~Q2 2027)** | Consumption Competition (Burning), Node Operator Portal, NFT Marketplace (Phase 2) |
| **M5 (2027~)** | Governance Portal, Prediction/Cheering Pools, L3 transition (Phase 3) |

---

## 11. Open Questions (Decisions Required)

1. **Token Sale Currency:** USDC vs KRW-pegged stablecoin, and whether to integrate fiat on-ramps.
2. **KYC Provider:** Confirmation of choice (Sumsub/Persona) and geo-blocking policy details.
3. **Indexer Choice:** Ponder vs The Graph (decentralized hosted service).
4. **MagicSing App ↔ Wallet dApp Integration:** Scope of connection (SSO, score attestation).
5. **Design System:** Extent of branding inheritance from the existing pitch deck (navy + red + gold theme, ASSA logo).

---

*This plan/specification is for informational and design purposes only and does not constitute investment or legal advice. Token sale, KYC, and regional restrictions are subject to comprehensive regulatory review.*
