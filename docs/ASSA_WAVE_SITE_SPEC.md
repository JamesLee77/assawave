# ASSA WAVE — 사이트 개발 기획 & 스펙

> **Status:** Draft v0.1 · **Date:** 2026-05 · **공식 도메인:** **assawave.io**
> **연계:** Whitepaper v2.0 · Contracts Spec(ASSA_WAVE_CONTRACTS_SPEC.md) · 재무 모델
> 본 문서는 웹/dApp 개발 착수용 스펙이다. MVP(Phase 1) 상세 + Phase 2·3 개요.

---

## 0. 요약 (TL;DR)

| 항목 | 결정 |
|---|---|
| 목적 | (a) 투자자 대상 토큰 세일 + (b) 팬 대상 Web3 dApp(스테이킹·소비·노드) |
| 공식 도메인 | **assawave.io** 단일 (`.ai`/`.net` 방어 리다이렉트). 사칭 방지 고지 상시 노출 |
| 프런트 | **Next.js 14(App Router) + TypeScript + Tailwind**, wagmi/viem, RainbowKit |
| 체인 | **Base** (Phase 2~ 자체 L3). SIWE 로그인 |
| 백엔드 | Node(NestJS) API + **인덱서(Ponder/The Graph)** + Postgres + Redis |
| 인프라 | Vercel(웹) + AWS/GCP(API·인덱서) + Cloudflare(CDN·WAF) |
| 컴플라이언스 | KYC/AML(세일), 지역 차단(US/CN), VAUPA/MAS/ADGM, i18n(KO/EN/JA) |

원칙: **세일 사이트(투자자)** 와 **dApp(팬)** 을 같은 디자인 시스템으로, 단 보안 등급은 세일·지갑 흐름을 최우선.

---

## 1. 시스템 아키텍처

```
            ┌─────────────── Cloudflare (CDN / WAF / DNS) ───────────────┐
            │                                                            │
   ┌────────▼─────────┐     ┌──────────────────┐      ┌─────────────────▼┐
   │  Web (Next.js)    │     │   API (NestJS)    │      │  Indexer (Ponder) │
   │  - Landing        │◀───▶│  - Auth (SIWE)    │◀────▶│  - Base 이벤트 동기 │
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

- **읽기:** 체인 데이터는 **인덱서**(Ponder/The Graph)로 동기화해 API/프런트가 빠르게 조회(잔액·베스팅·락업·랭킹). 직접 RPC는 트랜잭션 전송·실시간 확인만.
- **쓰기:** 사용자가 지갑으로 직접 서명·전송(비수탁). 백엔드는 자금을 만지지 않음(논커스터디).
- **오프체인 상태:** 프로필·KYC·주문 메타·랭킹 캐시·소비 점수 보조는 Postgres.

---

## 2. 기술 스택 (권고)

| 레이어 | 선택 | 비고 |
|---|---|---|
| 프런트 | Next.js 14, TS, Tailwind, shadcn/ui, Framer Motion | App Router, SSR/ISR |
| Web3 | **wagmi + viem**, **RainbowKit**(지갑), SIWE | Base 체인 설정 |
| 차트 | Recharts / visx | 토크노믹스·수요 그래프 |
| 백엔드 | NestJS(Node 20), Prisma, Postgres, Redis, BullMQ | REST + 일부 GraphQL |
| 인덱서 | **Ponder**(권장) 또는 The Graph subgraph | Base 이벤트 |
| 인프라 | Vercel(web), AWS ECS/Fargate(api·indexer), RDS, ElastiCache | IaC: Terraform |
| 보안/운영 | Cloudflare WAF, Sentry, Datadog, OZ Defender(컨트랙트) | |
| 외부 | KYC(Sumsub/Persona), 온램프(Transak/Stripe), Email(Resend/SES) | |

---

## 3. Phase 1 (MVP) — 페이지 & 기능 상세

> Phase 1: **Landing · Token Sale · Dashboard · Staking(무이자) · Wallet 연결**. Q3~Q4 2026.

### 3.1 Landing (`/`)
- **목적:** 프로젝트 소개·투자자 신뢰·세일 유입. 백서/덱 다운로드, 로드맵, 팀, FAQ.
- **요소:** 히어로(아싸·한류), 핵심 지표(MAU·5M install·$1.2B TAM), 토크노믹스 요약(배분·BME·소비/스테이킹), 수요·시나리오 차트, 파트너, **공식 도메인 고지 배너**("공식: assawave.io — 그 외 사이트 주의").
- **SEO/공유:** OG 태그, 다국어(KO/EN/JA), `robots`, sitemap.

### 3.2 Token Sale (`/sale`)
- **흐름:** 지갑 연결 → 네트워크=Base 확인 → **KYC 상태 확인**(미인증 시 KYC 위젯) → 라운드 선택(1/2/3차) → USDC 금액 입력 → approve → `buy()` → 영수증·베스팅 일정 표시.
- **표시:** 라운드별 단가(30/50/70원 ≈ USDC)·잔여 캡·진행바·종료 타이머, 내 배정·베스팅(TGE/cliff/linear) 곡선.
- **가드:** 화이트리스트(Merkle proof) 검증, 지역 차단, 1인 한도, 트랜잭션 상태(pending/success/fail), 슬리피지/가스 안내.
- **보안:** 컨트랙트 주소 **하드코딩+검증 표시**, 피싱 경고, approve 금액 정확화(무한승인 지양).

### 3.3 Dashboard (`/app`)
- **포트폴리오:** $ASSA 잔액, 베스팅(claimable/locked) + **Claim** 버튼, 락업(veASSA) 현황, 거래 내역.
- **데이터:** 인덱서 조회(빠름) + 온체인 검증.

### 3.4 Staking (`/app/stake`) — **무이자 락업**
- **UX 명확화:** "이 스테이킹은 **이자를 주지 않습니다**. 락업으로 **랭킹 가중치·거버넌스·티어 자격**을 얻고 공급을 잠급니다." (오해 방지 카피 필수)
- **기능:** 금액·기간(최대 4y) 선택 → `lock()` → veASSA 가중치/티어 표시. 기간 연장·금액 증가·만기 후 출금.
- **시각화:** 가중치 감쇠 곡선, 내 티어, 거버넌스 파워(향후).

### 3.5 공통: Wallet & Auth
- **연결:** RainbowKit(MetaMask·Coinbase Wallet·WalletConnect). Base 네트워크 자동 추가/전환.
- **로그인:** **SIWE**(Sign-In With Ethereum) → 세션(JWT/쿠키). 서명만, 자금 비수탁.
- **상태:** 잘못된 네트워크·미연결·KYC 미완 등 가드 UI.

---

## 4. Phase 2 — 개요

| 화면 | 설명 |
|---|---|
| **소비 경쟁(`/app/compete`)** | 스타 랭킹·팬덤 대결. 토큰 **소비(소각)** 로 순위 부스트, 시즌 리더보드, 누적 소비→티켓 우선권·배지 |
| **노드 운영자(`/app/node`)** | K-Node 등록·업타임·채굴 보상·auto-stake, 하드웨어 구매 연계 |
| **NFT 마켓(`/app/market`)** | Performance/Concert Pass/Voice DNA NFT 거래(ERC-1155) |
| **MagicSing 앱 연동** | 음악앱(노래·점수·VPU) ↔ Wallet 앱(파이낸스) 분리, 점수 어테스트 연동 |

## 5. Phase 3 — 개요
거버넌스 포털(veASSA 투표·제안), All-Kill Pool/예측 마켓, 팬 토큰, 풀 dApp, L3 전환(브리지 UI).

---

## 6. 데이터 모델 (오프체인, 발췌)

| 테이블 | 핵심 컬럼 |
|---|---|
| `users` | id, wallet(addr, unique), handle, locale, created_at |
| `kyc` | user_id, provider, status(none/pending/approved/rejected), country, updated_at |
| `sale_orders` | id, user_id, round, assa_amount, usdc_amount, tx_hash, status |
| `vesting_cache` | wallet, category, total, claimed, claimable, next_unlock (인덱서 동기) |
| `locks_cache` | wallet, amount, end, voting_power (인덱서) |
| `rank_cache` | target_id(star/fandom), season, points, updated (Phase 2) |
| `consumption_log` | wallet, target_id, amount, burned, tx_hash (Phase 2) |

> 온체인이 진실원천(source of truth). 위 테이블은 **읽기 캐시/메타**이며 인덱서가 이벤트로 갱신.

---

## 7. API (발췌)

```
POST /auth/siwe/nonce         # SIWE nonce
POST /auth/siwe/verify        # 서명 검증 → 세션
GET  /me                      # 프로필·KYC 상태
POST /kyc/session             # KYC 위젯 토큰
GET  /sale/rounds             # 라운드 상태(가격·캡·잔여·타이머)
GET  /sale/allowlist/:addr    # Merkle proof 반환
GET  /portfolio/:addr         # 잔액·베스팅·락업(인덱서)
POST /webhooks/kyc            # KYC provider 콜백
POST /webhooks/chain          # 인덱서 이벤트 → 알림
```
- 인증: SIWE 세션 + rate limit. 민감 엔드포인트 CSRF/CORS 제한.

---

## 8. 비기능 요구 (NFR)

- **보안:** CSP·HSTS, WAF, rate limiting, secrets(KMS), 컨트랙트 주소 화이트리스트, approve 최소화, **반(反)피싱**(공식 도메인 고지·인증 채널 안내·DNSSEC). 정기 펜테스트.
- **컴플라이언스:** 세일 KYC/AML, 지역 차단(US/CN 등 IP+지갑), 약관/개인정보, VAUPA(콜드월렛·신고)·MAS·ADGM 연계, 쿠키 동의.
- **i18n:** KO(기본)/EN/JA. 통화·일자 로케일.
- **성능:** LCP < 2.5s, 인덱서 지연 < 수초, 캐시(Redis/ISR).
- **접근성:** WCAG AA, 키보드/대비.
- **관측:** Sentry(에러), Datadog(APM), 온체인 모니터(Defender), 분석(Plausible/GA4).

---

## 9. 환경 · CI/CD · 레포

- **환경:** `dev`(Base Sepolia) → `staging` → `prod`(Base mainnet). 컨트랙트 주소·체인ID는 환경설정.
- **CI/CD:** GitHub Actions(lint·typecheck·test·e2e Playwright) → Vercel/ECS 배포. 프리뷰 배포.
- **레포(모노레포 권고, Turborepo):**
```
apps/web        (Next.js)
apps/api        (NestJS)
apps/indexer    (Ponder)
packages/ui     (디자인시스템)
packages/abi    (컨트랙트 ABI·주소·타입)
packages/config (chains, env)
```

---

## 10. 마일스톤 (로드맵 정합)

| 시기 | 산출물 |
|---|---|
| **M1 (Q3 2026)** | 디자인 시스템, Landing, 지갑연결/SIWE, KYC 연동, 컨트랙트 testnet 배포 |
| **M2 (Q3~Q4 2026)** | **Token Sale**(3라운드)·Vesting·Dashboard·Claim, 인덱서, 감사 1차 → **mainnet 세일** |
| **M3 (Q4 2026)** | **무이자 Staking** UI, BME 대시보드, 다국어 |
| **M4 (Q1~Q2 2027)** | 소비 경쟁(소각)·노드 운영자 포털·NFT 마켓 (Phase 2) |
| **M5 (2027~)** | 거버넌스 포털·예측/응원풀·L3 전환 (Phase 3) |

---

## 11. 결정 필요 (Open Questions)

1. **세일 통화** USDC vs KRW-stable, 온램프(법정화폐) 포함 여부.
2. **KYC 공급자**(Sumsub/Persona)·지역 차단 정책 확정.
3. **인덱서** Ponder vs The Graph(분산) 선택.
4. **MagicSing 본앱 ↔ Wallet dApp** 연동 범위(SSO·점수 어테스트).
5. 디자인: 기존 덱 브랜드(네이비+레드+골드, ASSA 로고) 계승 범위.

---

*본 기획/스펙은 정보·설계 목적이며 투자·법률 자문이 아니다. 세일·KYC·지역 제한은 규제 검토를 전제로 한다.*
