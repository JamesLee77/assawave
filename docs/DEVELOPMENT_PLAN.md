# ASSA WAVE — 개발 계획서 (ccm 기반)

> 작성: ASSA WAVE 기술 디렉터 · 기준일 2026-05-30 · Phase 1(MVP) 우선
> 근거: ASSA 사양서 2종 + ccm 실소스 검증 + 적대적 갭 분석(reuse-accuracy / dependency-sequencing / security-compliance) 반영
> **검증 사실(소스 대조 완료):**
> - **CCMStaking = 이자형** (`R0_BPS=1_000`·`POOL_INIT 200M`·`poolRemaining`·`_harvest`·`rewardDebt`·`priceOracle`·`pendingReward`·`RewardClaimed` 확인) → veASSA 무이자는 **신규 재작성**.
> - **CCMToken** = `ERC20,ERC20Burnable,ERC20Capped,ERC20Pausable,ERC20Permit,AccessControl`, **5B cap**, `_update` **3-way override**(`ERC20,ERC20Capped,ERC20Pausable`), `nonces` override 없음, **Votes 없음**, **BURNER_ROLE 없음**(ERC20Burnable=누구나 자기 잔액 소각), MINTER_ROLE은 admin→TGESale/Vesting/Staking에 부여(스펙의 "MiningRewards만" 과 불일치).
> - **CCMTGESale** = `claimable`이 `startTime` 기준 선형(`vested=total*elapsed/vestSeconds`), **cliff는 첫 청구만 게이트(cliff-jump)**, **TGE 즉시언락 개념 없음**, 게이팅은 `whitelist[roundId][addr]` 매핑(**KYCRegistry 미참조·Merkle 아님**), **Pausable 없음**.
> - **백엔드 = 이벤트 로그 인덱싱 코드 전무** — `chain.ts`/`holders.ts`는 `readContract` view 폴링 + D1 upsert + `sync_runs`/`snapshot`만. `getLogs`/`blockCursor`/`sale_orders` **없음**.
> - **mainnet KYCRegistry = `0x0`**(Sepolia 리허설 `0x9172D6eaF05587b595f4eE894B4C7917Be652E46`), wrangler crons 단일 `*/30`, 토큰/베스팅 mainnet 라이브 2026-05-12.
> - **Safe = 3-of-4 리허설 스크립트 / 3-of-5 mainnet 목표**(4-of-7 자산 없음). **CCMTimelock 48h floor**.
> - **`_dex-*` 스크립트 = Base Sepolia 전용**(`chainId!==84532n` throw, Uniswap V3, Mock USDC). **`_dry-run-phase1.ts` = cap 4.99B 하드코딩, Token+Vesting만**.
> - **ccm은 제3자 외부 감사 보고서가 코드베이스에 없음** — `SECURITY_REVIEW.md` 등은 자체 문서. **"감사 승계/델타"는 성립하지 않음**(아래 §6 정정).

---

## 0. 개요

### 목표
ASSA WAVE Phase 1(MVP)을 **ccm 라이브 기반(Base mainnet 8453)을 재사용**하여 최단 경로로 출시한다. Phase 1 산출물: ASSAToken(+ERC20Votes) · 3라운드 TokenSale · 카테고리 TokenVesting · 무이자 StakingLock(veASSA) · BMEBurner · 거버넌스 배선(Safe+Timelock+KYCRegistry) · 4개 dApp/사이트(site·portal·admin·testnet) · Cloudflare Worker 백엔드 · **신규 이벤트 인덱서**. Phase 2/3는 말미 개요만.

### 범위
- **In(Phase 1):** 토큰·세일·베스팅·veASSA·BME·SIWE 인증·세일/대시보드/락업 UI·운영 콘솔·랜딩(KO/EN/JA)·이벤트 인덱서·외부 감사 2건·mainnet 배포.
- **Out(Phase 2/3 개요만):** ConsumptionEngine, StarRanking/FandomBattle, EdgeNode/MiningRewards, ERC-1155 NFT, ASSAGovernor, PredictionMarket, L3.

### 핵심 원칙
1. **ccm 기반 재사용** — fork+적응을 1순위로, 실질 신규는 ① veASSA 무이자 ② BMEBurner ③ ERC20Votes ④ **이벤트 인덱서** ⑤ **mainnet KYC 운영 파이프라인** ⑥ **세일 TGE/베스팅 회계 재작성**으로 한정.
2. **공급-수요 균형** — 세일/베스팅/veASSA는 공급 잠금, BMEBurner는 외부 매출 기반 소각으로 수요 환류.
3. **무이자 락업(non-yield)** — veASSA는 보상·emission·oracle 경로가 **존재하지 않음**을 음성(negative) 불변식 + 정적 ABI 검사로 강제.
4. **감사 게이트(audit gate)** — **2개 SOW로 분리.** 감사#1(Token+Votes·Sale·Vesting·KYCRegistry)=세일 게이트(M2), 감사#2(veASSA·BMEBurner)=배포 게이트(M3). **각각 0 critical/high·medium 전부 mitigated** + Safe/Timelock 핸드오프 증명을 하드 게이트로. **"델타 감사" 표현 폐기**(ccm baseline 외부감사 부재).
5. **비수탁(non-custodial)** — 백엔드는 자금/키 미보유. SIWE·읽기 캐시·webhook만. 결제는 사용자 지갑이 USDC를 Treasury Safe로 직접 전송.
6. **법무 GO 게이트** — VAUPA/증권성 법무 의견서 수령을 mainnet 세일의 **명시적 하드 게이트**로(§5/§6).

---

## 1. 기술 스택 정합 (ccm 기준 재조정)

| 영역 | ASSA 사양서 권고 | ccm 실제 (채택) | 비고 |
|---|---|---|---|
| 온체인 프레임워크 | Foundry | **Hardhat 2.22 + OZ v5 + ethers v6 + typechain + TS**, Solidity 0.8.24(cancun, optimizer 200) | `hardhat.config.ts` 그대로. **Foundry는 invariant/fuzz 전용으로 신규 추가**(ccm엔 fuzz 툴링 0개) |
| 프런트 | Next.js 14 App Router | **Vite 8 + React 18 + Tailwind 4 + wagmi + viem + RainbowKit + TS** | 4앱(site/admin/portal/testnet) 분리. App Router 미사용 |
| 백엔드 | NestJS + Postgres + Redis | **Cloudflare Workers(Hono) + D1 + viem + Resend + vitest** | SIWE·세션·me·sync·cron fork. **단 이벤트 인덱서는 ccm에 없음 → 신규** |
| 인덱서 | Ponder / The Graph | **Worker 직접읽기 + D1 캐시 + cron** (view 폴링) **+ 신규 eventIndexer(getLogs+커서)** | ⚠️ ccm은 view 폴링만 보유. Purchased/Locked/Burned 추적은 **신규 인덱싱 서브시스템**(§2.3) |
| 모노레포 | Turborepo | **별도 repo 2개 유지 + 공유 패키지 git 의존성**(아래 §3 재설계) | ⚠️ 단일 pnpm-workspace는 단일 git repo 전제 → 옵션 C 원안 폐기 |
| 세일 게이팅 | Merkle allowlist | ⚠️ **컨트랙트 변경 결정 필요**: per-round whitelist 유지(무변경) vs KYCRegistry 조회(신규 변경) | CCMTGESale은 `whitelist[round][addr]`만. KYCRegistry 미참조 |
| 결제 통화 | USDC | **canonical Base USDC(6dec)** | Sale.tsx 정확금액 approve 구현. 온램프는 Phase 2 |
| 결제·키 수탁 | — | **비수탁**(세일 USDC 수령처=Treasury Safe) | |

---

## 2. 재사용 맵 (컴포넌트 → ccm 소스 → action → 변경점)

> **라벨 정정 원칙:** 갭 분석에 따라 '재사용/fork'로 과대 라벨링된 항목 중 실제 신규 구현이 큰 6개 영역(이벤트 인덱서·mainnet KYC 운영·세일 TGE/베스팅 회계·Safe 4-of-7 키세리머니·ERC20Votes·StakingLock)을 **[재사용+신규]** 또는 **[신규]**로 재분류했다. action 라벨이 곧 감사 범위·일정 산정의 입력이다.

### 2.1 온체인 컨트랙트

| ASSA 컴포넌트 | ccm 소스 | action | 핵심 변경점 |
|---|---|---|---|
| **ASSAToken** (ERC20+Permit+Burnable+Capped+Pausable+Votes, 10B cap) | `CCMToken.sol` | **[재사용+신규] / 감사 풀스코프** | (1) cap 5B→`10_000_000_000e18`, **ERC20Capped 상속 유지**(수동 require 금지 — `_mint` 우회 차단). (2) **ERC20Votes 추가** — `_update` override를 `(ERC20,ERC20Capped,ERC20Pausable,ERC20Votes)`로 확장 + `nonces()`를 `(ERC20Permit,Nonces)` override **신규**(현재 없음). (3) name/symbol/Permit 'ASSA WAVE'/'ASSA'. (4) **burn 모델 결정**(아래 결정#6b): ERC20Burnable 유지(BMEBurner가 자기 잔액 burn) vs BURNER_ROLE 신규 게이트. (5) **MINTER_ROLE 정책**: ccm은 admin→Sale/Vesting/Staking에 부여 → ASSA는 TGE float 시점에 한정, Phase2 MiningRewards로 이관. transfer 핫패스가 바뀌므로 **fork가 아닌 신규 감사 대상**. |
| **TokenSale** (3라운드 고정가, USDC, 게이팅, TGE+베스팅) | `CCMTGESale.sol` | **[재사용+신규] / 회계 재작성** | (1) 3라운드 KRW 30/50/70원→USDC 단가 동결. (2) ⚠️ **claimable 재작성** — 현재는 `startTime` 기준 선형이라 cliff-jump 발생·TGE 즉시분 없음. 스펙 §3.3 공식(`total*tgeBps/1e4 + (now>start+cliff?linearPostCliff:0) − claimed`)을 **단일 진실원천**으로 채택, ccm의 startTime-선형 폐기. 선형은 **cliff 종료 시점부터** 시작(`[start+cliff, start+duration]`). 즉시분/선형분 이중계상·언더플로 방지. (3) **게이팅 결정**(결정#3): per-round whitelist 유지(컨트랙트 무변경=진짜 재사용) vs `purchase()`에 `require(kyc.isKYCed(msg.sender))` + 생성자 registry immutable 주입(**신규 변경·새 감사표면**). (4) ⚠️ **Pausable 신규**(스펙 §3.2 요구, ccm 없음): `purchase` whenNotPaused, claim/withdrawUSDC는 정지 예외. (5) `withdrawUSDC` 수령처=Treasury Safe. |
| **TokenVesting** (카테고리 cliff+linear, revocable) | `CCMVesting.sol` | **[재사용+신규] / 회계 재작성** | (1) Schedule에 `tgeBps(uint16)`·`category(uint8)` 추가. (2) ⚠️ `releasable` **동일 재작성**(CCMVesting도 startTime-선형 결함) — 선형은 cliff 후 시작, TGE 즉시분 가산, `claimed<=total`·`releasable>=0` 불변식. (3) Founder 12m/48m·Team 12m/36m·Investor·Partner·ECO 파라미터 배포 스크립트화. |
| **StakingLock (veASSA)** (무이자·비전송·시간감쇠) | `CCMStaking.sol` | **[신규] / 사실상 재작성** | ⚠️ CCMStaking 이자형 확인. **제거:** `priceOracle`·`R0_BPS`·`POOL_INIT`·`poolRemaining`·`rewardDebt`·`_harvest`·`pendingReward`·`currentYieldRateBps`·`recoverPoolRemainder`·`RewardClaimed` 전 경로. **신규:** Curve veToken식 `Lock{amount,start,end}`, `lock(amt,dur≤4y)`/`increaseAmount`/`increaseUnlockTime`/`withdraw`(end 후 원금만)/lock 병합 회계, `votingPower=amount*(end-now)/MAXTIME` 선형감쇠 + **과거시점 조회용 체크포인트/history**, **transfer/approve revert(진짜 비전송)**. **ERC5805(votes) 호환 여부 결정**(결정#16). **재사용 골격:** import·CEI·AccessControl/ReentrancyGuard/SafeERC20만. **veToken 체크포인트는 고난도 감사 항목** → §4 XL 재산정. |
| **BMEBurner** (USDC→ASSA swap+영구소각) | 없음(신규) | **[신규]** | `processRevenue(usdc,burnBps,minAssaOut)` → safeTransferFrom → DEX swap(deadline·minAssaOut) → `ASSA.burn`. **호출자=Safe/Timelock 경유**(비수탁 §0-5 정합, 백엔드 직접 호출 금지). minAssaOut은 **on-chain TWAP AND/OR Chainlink 중 보수적 값**으로 강제(keeper는 maxSlippageBps만 설정, push 단일소스 금지). 소각=address(0)만. **선행 의존: ASSA/USDC mainnet 풀 생성+LP 시딩**(아래 LP 태스크). |
| **BME LP 부트스트랩** (mainnet 풀+LP) | `_dex-*.ts`(⚠️**Base Sepolia/Uniswap V3/Mock USDC 전용**) | **[신규]** | ⚠️ `_dex-*`는 `chainId!==84532n` throw. mainnet Aerodrome(결정#12) 라우터/풀 통합·ASSA/USDC 풀 생성·초기 LP 시딩(자금 출처·규모 명시)은 **전량 신규**이며 **BMEBurner 배포의 크리티컬 선행**. `_dex-*`는 testnet 스모크 참고용으로만. 최소 유동성 임계 불변식(swap≤풀의 X%). |
| **Treasury** (세일 USDC 수령, 분배 버킷) | `deploy-safe-3of4.ts`+`transfer-admin-to-timelock.ts` | **[재사용+신규]** | 전용 Treasury.sol 대신 **Gnosis Safe + Timelock**(ccm 패턴). ⚠️ ccm은 **3-of-4 리허설/3-of-5 목표** — ASSA 4-of-7(결정#9)은 **스크립트 파라미터화[재사용] + 7-서명자 키 세리머니/하드웨어 분배 런북[신규]**. 온체인 버킷 회계 필요 시에만 Treasury.sol 신규. |
| **Timelock** (48h) | `CCMTimelock.sol` | **[그대로 재사용]** | 48h MIN_DELAY floor, 31337/1337만 단축. 이름만 ASSATimelock. UUPS 진화모듈 채택 시 UPGRADER_ROLE 부여. |
| **KYCRegistry** (컨트랙트) | `CCMKYCRegistry.sol` | **[재사용] / 운영은 신규 분리** | `isKYCed` 단일 bool. ⚠️ **mainnet 미배포(`0x0`)** — 세일 전 배포 필수. **단일 bool에 jurisdiction/expiry 없음** → US/CN·제재 차단은 **온체인 강제 불가**, OPERATOR가 `setKYCed=true` 기록 **이전에** OFAC+국적 필터링하는 **운영 정책으로 강제**(불변 정책·감사 항목화). v2 jurisdiction 필드는 신규 컨트랙트로 등재. |
| **KYC 운영 파이프라인** (webhook→온체인 반영) | 없음(Sepolia 리허설만) | **[신규]** | ⚠️ ccm은 mainnet KYC 운영 무경험. webhook(HMAC 검증)→OFAC 스크리닝→`setKYCed` 큐. **온체인 반영 SLA 결정**(결정#11b): 전용 KYC_OPERATOR hot key 자동 batch(키 노출 trade-off) vs Safe 주기 batch(당일 참여 불가 고지). Sepolia→mainnet 승격 리허설을 게이트에 포함. |
| **Hardhat/mocks/배포·verify** | `hardhat.config.ts`+`mocks/`+`deploy-*.ts` | **[재사용]** | MockUSDC(6dec)·ReentrantToken·MockPriceOracle 재사용. deploy/verify fork. ⚠️ `_dry-run-phase1.ts`는 **cap 4.99B 하드코딩·Token+Vesting만** → ASSA용(10B·KYCRegistry·Sale·핸드오프 풀시퀀스) **재작성**. |

### 2.2 프런트 (Vite/React/wagmi)

| ASSA 화면/모듈 | ccm 소스 | action | 핵심 변경점 |
|---|---|---|---|
| **Landing (site)** | `frontend/`(App·sections/earth·Layout) | **[재사용]** | 라우트 셸·SEO/OG·i18n·법무·AllocationRing/VestingTimeline/EmissionCurve 재사용. 콘텐츠를 ASSA 내러티브로 교체. |
| **dApp 셸 (portal)** | `portal/App.tsx`·Layout·lib | **[재사용]** | /sale·/app·/app/stake 재배치. Migrate 제거. |
| **Token Sale (/sale)** | `Sale.tsx`(27KB, 거의 완성) | **[재사용+적응]** | N라운드 루프·진행바·**정확금액 approve(무한승인 회피)**·purchase·영수증·explorer 재사용. ABI를 ASSA로 교체, TGE bps 표시, KRW고정+USDC 병기, KYC 상태 가드. |
| **Dashboard+Claim (/app)** | `Dashboard.tsx`+`Vesting.tsx` | **[재사용+적응]** | ⚠️ **베스팅 인덱싱 모델 확정 후**(결정#4): ccm·CCMVesting은 **id-indexed**(`scheduleIdsOf→id[]→releasable(id)`)이며 ASSA 스펙의 `releasable(address)`와 불일치. self-contained 유지 시 `claimable(roundId,addr)` 루프. 'address-indexed releasable' 문구는 모델 확정 후 일치시킴. |
| **무이자 Staking (/app/stake)** | 없음(패턴만: Sale approve→write→receipt, EmissionCurve SVG) | **[신규]** | 금액+기간(≤4y)→approve→lock→veASSA 가중치/티어, increase*/withdraw. **'이자 없음' 오해방지 카피 상시**, 감쇠곡선. **정확금액 approve 강제**(NFR). |
| **지갑·네트워크 가드** | `wagmi.ts`·env.ts(빌드타임 단일체인 핀)·WalletStatusBar | **[재사용]** | appName만 'ASSA WAVE'. 빌드타임 체인 핀(8453/84532)이 네트워크 혼동 방지 핵심. |
| **SIWE 로그인+세션** | `siwe.ts`·useSession.ts + portal-api auth/session/me | **[재사용]** | ⚠️ **반피싱:** `ALLOWED_DOMAINS`를 `ccmnetwork.net`→assawave.io **정확 도메인 집합**으로 교체(와일드카드/유사도메인 배제 테스트), APP_STATEMENTS 다국어 문구 법무+보안 리뷰. KYC세션 엔드포인트 추가. |
| **주소·ABI 동기** | `contracts.ts` + `wrangler.toml [vars]` | **[재사용]** | 하드코딩+IS_MAINNET 빌드핀(반피싱) 유지. 공유 abi 패키지를 단일 진실원천으로. |
| **i18n KO/EN/JA** | `i18n.ts`+`locales/en.json` | **[재사용+적응]** | `['en']`→`['ko','en','ja']`, **ko 기본**. 3 네임스페이스 번역. |
| **디자인 토큰·프리미티브** | `index.css`(CSS변수+@theme)·`primitives.tsx` | **[재사용+적응]** | CSS변수만 ASSA 브랜드(네이비+레드+골드, 골드는 액센트/보더 한정·WCAG AA 대비)로 스왑. primitives 코드 무변경. |
| **반피싱·공식도메인 배너** | Sale.tsx env 배너 + SiteFooter + CopyableAddress | **[재사용]** | '공식: assawave.io' 상시 고지 + 주소 검증 표시. |
| **BME 소각 대시보드** | `ValueAccrualLive.tsx`·`TVLLive` (라이브 지표 패턴) | **[재사용+적응]** | viem 읽기+주기 refetch 패턴 차용. **Worker eventIndexer(Burned 집계) + D1**. |

### 2.3 백엔드 (Cloudflare Workers + D1)

| ASSA 엔드포인트/모듈 | ccm 소스 | action | 핵심 변경점 |
|---|---|---|---|
| Hono 라우터+CORS | `index.ts` | **[재사용+적응]** | origin=assawave.io. /sale·/kyc·/portfolio·/webhooks 마운트. scheduled에서 carbon/sandbox/oracle 키퍼 제거. |
| SIWE auth | `auth.ts` | **[재사용+적응]** | buildSiweMessage·verify 무변경. ⚠️ ALLOWED_DOMAINS를 assawave.io 정확집합으로. ALLOWED_CHAIN_IDS{8453,84532} 동일. |
| 세션 HMAC | `session.ts` | **[그대로 재사용]** | 무변경. SIWE_SECRET만 신규. |
| requireSession 미들웨어 | `middleware.ts` | **[그대로 재사용]** | 무변경. |
| GET/PUT /me | `me.ts` | **[재사용+적응]** | VALID_LANGS에 ko(기본)/ja, 응답에 kyc_status 조인. |
| 체인 직접읽기(view) | `chain.ts` | **[재사용+적응]** | ⚠️ ABI 재배선은 **베스팅 모델 확정 후**(결정#4). ERC20/KYC view 재사용. TokenSale getRound·StakingLock votingPower 리더 신규. **로그 인덱싱 아님(view만)**. |
| view sync 잡 | `holders.ts` | **[재사용+적응]** | vesting/KYC/snapshot **view 폴링** sync + D1 upsert + sync_runs 재사용. ⚠️ **이벤트 로그 폴링 코드 없음** — 아래 eventIndexer 신규. |
| **이벤트 인덱서** (getLogs+커서) | 없음 | **[신규] / L** | ⚠️ **ccm에 getLogs/blockCursor/sale_orders 전무.** 신규 `eventIndexer.ts`: viem `getLogs` + `fromBlock` 커서를 `sync_state` 테이블 영속 + 청크 윈도우 + **Worker subrequest/CPU 한도 회피용 다중 cron tick 백필** + 중복방지(`INSERT OR IGNORE`). **Purchased/Locked/Withdrawn/Burned 4개 이벤트** ABI·디코더. 데이터 정합성 최민감 컴포넌트. |
| 이메일(Resend) | `email.ts` | **[그대로 재사용]** | sendEmail 무변경. 템플릿 ASSA·다국어. |
| cron keeper | `scheduled.ts` | **[재사용+적응]** | ⚠️ **단일 `*/30` cron 분할**(아래 §2.4 cron 토폴로지). cliff/claim 알림 골격 유지, 오라클/샌드박스 제거. |
| admin 게이트 | `admin.ts` | **[신규] / 격상** | ⚠️ **단일 공유 Bearer는 단일 실패점.** /sale/round-config·/allowlist·KYC 큐 같은 자금/규제 민감 작업 추가 전 **Safe 멤버 SIWE + audit 로그**로 격상(결정#14, Phase1 필수). 운영자별 토큰+회전. |
| audit 로그 | `audit.ts`+`0003_admin_audit.sql` | **[그대로 재사용]** | VALID_ACTIONS에 create_round/whitelist_set/kyc_set 이미 포함. 민감 액션 강제 기록. |
| KYC webhook | 없음 | **[신규]** | provider HMAC 검증 → OFAC 스크리닝 → kyc_status upsert → setKYCed 큐. webhook 본문 untrusted, 서명 필수. |
| 온램프 세션 | 없음 | **[신규/선택]** | Phase 1 선택. Transak 위젯 세션 토큰만(자금 비경유). Phase 2 우선. |
| wrangler/D1/CI | `wrangler.toml`+`migrations/`+`package.json` | **[재사용+적응]** | name=assawave-portal-api, 새 D1. vars=ASSA 주소·체인. environments(dev=84532/staging/prod=8453). |

### 2.4 cron 토폴로지 (단일 `*/30` 분할 — 신규)
ccm은 단일 `*/30` cron에 모든 키퍼를 직렬 await. ASSA는 sync+이벤트 인덱서+BME 가격푸시+알림 부하가 Worker CPU/subrequest 한도를 초과할 위험 → **작업별 분할**:
- **view sync**(vesting/KYC/snapshot) `*/14`
- **eventIndexer 백필**(Purchased/Locked/Withdrawn/Burned, blockCursor 증분 + per-tick 청크 상한) `*/7`
- **BME 가격푸시 keeper**(가격 신선도 요구) `*/4`
- **cliff/claim 알림** `hourly`

세일 활성 기간 로그량 급증 시 eventIndexer를 독립 Worker로 분리 가능하도록 설계.

---

## 3. 소스 공유 전략 (재설계 — git 경계 반영)

> ⚠️ **갭 정정:** 원안 옵션 C("web3/ 루트 단일 pnpm-workspace로 두 독립 repo 링크")는 **단일 `pnpm-workspace.yaml`이 단일 git repo를 전제**하므로 두 별도 원격(ccm·assawave)과 양립 불가(lockfile 소유권·node_modules 호이스팅 충돌). 서브모듈은 사용자 거부. 따라서 재설계한다.

### 옵션 비교

| 옵션 | 방식 | 장점 | 단점 | 평가 |
|---|---|---|---|---|
| **A(채택)** | 공통·안정 코드를 **별도 repo `assa-ccm-shared`(또는 ccm 내 publishable 패키지)** 로 추출, 두 repo가 **git 의존성/사설 레지스트리(npm)** 로 버전 핀 소비 | 명확한 버전 경계·git 경계 충돌 없음·두 repo 완전 독립 | 패키지 퍼블리시·버전 핀·CI 인증 오버헤드 | ✅ **채택** |
| B | 단순 fork | 가장 빠름 | 주소·ABI·auth 드리프트(최대 리스크) | 단기만 |
| C(폐기) | web3/ 루트 단일 workspace | — | **git 경계상 비현실적** | ✗ |
| D(대안) | ccm·assawave를 **한 모노레포로 통합** | workspace 정상 동작 | 서브모듈 거부와 별개로 사용자 재확인 필요·repo 독립성 상실 | 사용자 결정시만 |

### 채택(옵션 A) — 공유 패키지 대상 & 이관 순서
- **chains/config** — Base 8453/84532 정의·RPC·주소 맵·IS_MAINNET 빌드핀
- **ABI·주소 타입** — typechain 산출 ABI 타입(컨트랙트 빌드 산출물 = 단일 진실원천, **토큰 freeze 버전에 핀**)
- **viem 헬퍼** — publicClient·readContract 래퍼(4앱+Worker 중복 제거)
- **auth/session** — SIWE 빌더·세션 HMAC(`session.ts` 그대로)
- **UI 프리미티브** — Card/CTA/Stat/Step + CSS 변수 토큰
- **도메인 훅** — sale/vesting/staking 읽기 훅

**이관 순서(빅뱅 금지, 각 단계 ccm 회귀 게이트):** ① `session.ts`+chains/config → ② viem 헬퍼·ABI 타입 → ③ UI 프리미티브 → ④ 도메인 훅.
⚠️ **타이밍:** **M1부터 최소 추출**(chains/config·ABI·session)을 먼저 하고 M1 fork(WS2.3/WS3.1/WS3.2)가 **처음부터 공유 패키지를 import**하게 하여 retrofit/드리프트 회피. 도메인 훅·UI 프리미티브는 M2 단계화. ccm workspace 회귀 테스트는 크리티컬 패스와 **분리된 인력**에 배정.

---

## 4. 워크스트림별 작업 분해

규모: S(≤3일)·M(~1주)·L(~2주)·XL(>2주). 태그: [재사용]=fork/그대로, [재사용+신규]=구조 변경, [신규]=신규.

### ① 컨트랙트
| 태스크 | 태그 | 의존 | M | 규모 |
|---|---|---|---|---|
| WS1.1 Hardhat 부트스트랩(config·mocks·deploy·.env) | [재사용] | — | M1 | S |
| WS1.2 ASSAToken: cap10B + ERC20Votes + `_update`(4-way)/`nonces` 신규 override + burn모델 확정 | [재사용+신규] | WS1.1 | M1 | M |
| WS1.3 TokenVesting: tgeBps/category + **releasable 회계 재작성**(cliff후 선형·TGE분) + 스케줄 | [재사용+신규] | WS1.2 | M1 | L |
| WS1.4 TokenSale: 3라운드 동결가 + **claimable 재작성** + 게이팅 결정 + **Pausable 신규** + Treasury 수령 | [재사용+신규] | WS1.3 | M2 | L |
| **WS1.4b** KYCRegistry mainnet 배포(토큰 무의존, 1.2와 병렬) — 세일 전 선행 | [재사용] | WS1.1 | M2 | S |
| WS1.5 StakingLock veASSA: 보상 전 경로 제거 + Lock/votingPower 선형감쇠 + **체크포인트/history** + 비전송 + ERC5805 결정 | [신규] | WS1.2 | M3 | **XL** |
| WS1.6 BMEBurner: processRevenue+swap+burn+TWAP/Chainlink minAssaOut+Safe경유 호출 | [신규] | WS1.2, WS1.6b | M4 | L |
| **WS1.6b** BME mainnet LP: Aerodrome 풀 생성+LP 시딩(자금 명시)+최소유동성 불변식 | [신규] | WS1.2 | M4 | M |
| WS1.7 Treasury(Safe 4-of-7 파라미터화+키세리머니 런북)+Timelock(48h)+핸드오프(grant→renounce) | [재사용+신규] | WS1.2/3/4/4b | M2 | M |

### ② 프런트
| 태스크 | 태그 | 의존 | M | 규모 |
|---|---|---|---|---|
| WS2.1 브랜딩 토큰 스왑(navy/red/gold, WCAG AA)+Wordmark | [재사용] | — | M1 | S |
| WS2.2 Landing(site) fork + ASSA 콘텐츠 + 차트 + SEO/i18n | [재사용] | WS2.1 | M1 | M |
| WS2.3 지갑·SIWE·네트워크가드·**반피싱 도메인 집합**·contracts/ABI 동기 | [재사용+적응] | WS2.1, WS5.1 | M1 | M |
| WS2.4 Token Sale(/sale): ASSA ABI + 게이팅 + TGE bps | [재사용] | WS2.3, WS1.4 | M2 | M |
| WS2.5 Dashboard(/app)+Claim+veASSA 요약 (**베스팅 모델 확정 후**) | [재사용] | WS2.4, 결정#4 | M2 | M |
| WS2.6 무이자 Staking(/app/stake) 신규 UI+감쇠곡선+오해방지 카피+정확승인 | [신규] | WS2.5, WS1.5 | M3 | L |
| WS2.7 BME 대시보드+반피싱+NFR(LCP<2.5s·WCAG AA·e2e Playwright) | [재사용] | WS2.4/5/6, WS4.5 | M3 | M |

### ③ 백엔드
| 태스크 | 태그 | 의존 | M | 규모 |
|---|---|---|---|---|
| WS3.1 portal-api fork(SIWE/세션/me/middleware/db)+도메인 교체+0001 migration | [재사용] | WS5.1 | M1 | S |
| WS3.2 chain.ts ABI 재배선(**베스팅 모델 확정 후**·Sale·StakingLock 리더) | [재사용+적응] | WS3.1, WS1.4, 결정#4 | M2 | M |
| WS3.3 /sale/rounds·/sale/allowlist·/portfolio + 0002 migration | [재사용] | WS3.2 | M2 | M |
| WS3.4 KYC webhook(HMAC)+OFAC 스크리닝+/kyc/session+지역차단(CF-IPCountry) | [신규] | WS3.1 | M1 | M |
| WS3.5 BME keeper Worker(TWAP/Chainlink 가격, 독립 cron) | [신규] | WS1.6 | M4 | M |
| **WS3.6** admin 콘솔 **Safe 멤버 SIWE 격상** + 민감액션 audit 강제 | [신규] | WS3.1 | M2 | M |

### ④ 데이터/동기 (Worker+D1)
| 태스크 | 태그 | 의존 | M | 규모 |
|---|---|---|---|---|
| WS4.1 holders.ts **view 폴링** sync fork(vesting/KYC/snapshot) ASSA 재배선 | [재사용] | WS3.2 | M2 | M |
| **WS4.2 eventIndexer 신규**(getLogs+`sync_state` 커서+청크+중복방지) — Purchased/Locked/Withdrawn/Burned | [신규] | WS4.1 | M2 | **L** |
| WS4.3 sale_orders/locks_cache/bme_burns D1 스키마 + 디코더 4종 | [신규] | WS4.2 | M2/M3 | M |
| WS4.4 scheduled.ts cliff/claim 알림 fork(다국어) | [재사용] | WS4.1 | M2 | S |
| WS4.5 cron 토폴로지 분할(§2.4) | [신규] | WS4.2 | M2 | S |

### ⑤ 인프라·DevOps
| 태스크 | 태그 | 의존 | M | 규모 |
|---|---|---|---|---|
| WS5.1 **공유 패키지 골격(옵션 A)** 최소 추출(chains/config·ABI·session) + git 의존성 배선 | [신규] | — | M1 | M |
| WS5.2 wrangler environments(dev/staging/prod) vars·secrets + cron 토폴로지 | [재사용] | WS3.1 | M1 | S |
| WS5.3 GitHub Actions: PR=typecheck+hardhat test+vitest, main=staging, tag=prod + d1 migrate | [재사용] | WS5.2 | M2 | S |
| WS5.4 반피싱 인프라: 방어 도메인(.ai/.net) 등록·301 리다이렉트·DNSSEC + Basescan verify·주소 레지스트리·Defender/Tenderly·/health | [재사용+신규] | WS1.7 | M2/M4 | M |

### ⑥ 보안·감사
| 태스크 | 태그 | 의존 | M | 규모 |
|---|---|---|---|---|
| WS6.1 Slither+Solhint+coverage(≥95% 핵심) CI + mocks 이식 + 위협모델 문서 | [재사용] | WS1.1 | M1 | M |
| WS6.2 **invariant/fuzz 신규**(Foundry forge 또는 hardhat+fast-check — **ccm에 없음**): totalSupply≤10B·mint호출자·sold≤cap·**claimed≤total+TGE/선형 경계**·veASSA 보상경로 부재(음성 불변식+ABI 정적검사)·**ERC20Capped+Votes+Pausable _update MRO**(cap초과 mint시 체크포인트 미기록·pause시 votingPower 불변) | [신규] | WS6.1 | M2 | L |
| WS6.3 신규 3종(veASSA·BME·Votes) 자체검증 + Sale/Vesting 회계 검증 (델타 아님) | [재사용+신규] | WS1.4/5/6 | M2/M3 | L |
| **WS6.4a 외부 감사#1**(Token+Votes·Sale·Vesting·KYCRegistry 배선) — 0 crit/high 게이트 | [신규] | WS6.2/6.3 | M2 | L |
| **WS6.4b 외부 감사#2**(veASSA·BMEBurner) — 0 crit/high 게이트 | [신규] | WS1.5/1.6 | M3 | L |
| WS6.5 Safe 4-of-7+48h Timelock 핸드오프 Sepolia 리허설(런북)+EOA renounce | [재사용] | WS6.4a | M2 | M |
| WS6.6 Immunefi 바운티 vault 펀딩·런칭(mainnet 직후) | [재사용] | WS6.5 | M2 | S |

> ⚠️ **WS6.2(fuzz)는 WS6.4a/b(외부 감사)의 명시적 선행 의존.** fuzz 없이 감사 진입 불가. ccm은 fuzz 툴링 0개이므로 Foundry/fast-check 도입은 순수 신규.

### ⑦ 컴플라이언스
| 태스크 | 태그 | 의존 | M | 규모 |
|---|---|---|---|---|
| WS7.1 KYC/AML 통합(KYCRegistry+Sumsub/Persona)·**OFAC+국적 setKYCed 사전필터 정책 코드화**·지역차단 US/CN(IP+지갑) | [재사용+신규] | WS3.4, WS1.4b | M2 | M |
| **WS7.2 VAUPA/MAS/ADGM 법무 의견서·증권성 판단 — mainnet 세일 하드게이트** | [신규] | — | M2 | M |
| WS7.3 약관/개인정보/쿠키 동의·무이자 카피 법무 리뷰 | [신규] | WS2.6 | M3 | S |

---

## 5. 의존성 그래프 & 크리티컬 패스

```
WS5.1 공유패키지(chains/ABI/session 최소) ──> WS2.3 / WS3.1 / WS3.2 가 즉시 소비(retrofit 회피)

WS1.1 Hardhat ──┬─> WS1.2 ASSAToken(Votes+10B+nonces) ──[코드 freeze=감사#1 입력]──┐
                │        ├─> WS1.3 Vesting(회계 재작성) ──> WS1.4 Sale(회계+Pausable+게이팅) ─┤
                │        ├─> WS1.5 veASSA(무이자 재작성+체크포인트) ─[XL, 감사#2 입력]──────────┤
                │        └─> WS1.6b LP시딩 ─> WS1.6 BMEBurner ─[감사#2 입력]───────────────────┤
                │   WS1.4b KYCRegistry(토큰무의존, 병렬) ──> WS1.4 게이팅 / WS1.7 핸드오프         │
                └─> WS6.1 보안CI ─> WS6.2 fuzz(신규)══선행══> 감사                                │
                                                                                                v
   [펀딩 게이트] ASSAToken 배포 → deployer(EOA admin)가 세일/베스팅/veASSA 풀 전량 mint·전송
                → createRound/createSchedule 구성 → 그 후에 transfer-admin-to-timelock 핸드오프
                (핸드오프 후 재충전은 48h timelock mint 런북 — WS1.7 종료조건)
                                                                                                v
   WS6.2 ─> WS6.4a 감사#1(Token/Sale/Vesting/KYC) ══HARD GATE══╗
   WS7.2 법무 GO 의견서 ════════════════════════════════════════╬══> mainnet 세일(M2)
   WS6.5 핸드오프 리허설+EOA renounce + WS1.4b KYCRegistry mainnet ╝

   WS1.5 + WS1.6 ─> WS6.4b 감사#2 ══HARD GATE══> veASSA/BME mainnet 배포(M3)

   백엔드(WS3 SIWE 재사용)·Landing(WS2.2)은 ABI/주소+testnet 배포만으로 병렬(비크리티컬)
   WS4.2 eventIndexer(신규)는 데이터 정합 크리티컬 — sale_orders/BME 대시보드의 선행
```

### 순서 (크리티컬 패스)
1. **WS5.1 공유패키지 최소 추출**(M1 fork가 처음부터 소비)
2. **WS1.1 인프라 + WS1.2 ASSAToken**(Votes+10B, `_update`/`nonces` 컴파일 게이트) → **M1 토큰 코드 freeze**
3. **WS1.3 Vesting ∥ WS1.4 Sale**(둘 다 회계 재작성) + **WS1.4b KYCRegistry**(병렬·세일 게이팅 선행)
4. **WS1.5 veASSA(XL, 최장)** ∥ **WS1.6b LP → WS1.6 BME**
5. **펀딩 게이트** → **WS1.7 핸드오프**(grant→renounce)
6. **WS6.2 fuzz → WS6.4a 감사#1 ∥ WS7.2 법무 GO** — ⚠️ **mainnet 세일 하드 게이트(M2)**
7. **WS6.5 핸드오프 리허설 + KYCRegistry mainnet** → **mainnet 배포 → 세일 개시(M2)**
8. **WS6.4b 감사#2** → **veASSA/BME mainnet(M3)**

> **병렬 비크리티컬:** WS3(백엔드 SIWE 재사용)·WS2.2(Landing)·WS2.4(Sale UI)는 ABI/주소+testnet 배포만으로 동시 진행. WS4.2(eventIndexer)는 신규지만 데이터 정합 크리티컬. WS2.6/BME 대시보드는 WS1.5/1.6 종속(M3).

---

## 6. 마일스톤 계획 (M1~M5)

> **감사 정정:** ccm 코드베이스에 제3자 외부 감사 보고서 부재 → "델타 SOW/감사 승계" 폐기. **2개 풀스코프 감사**로 분리. ccm mainnet 라이브 ≠ 감사 통과.

### M1 — 부트스트랩 & 재사용 코어
- **산출물:** assawave repo 스캐폴드, **공유패키지 최소 추출(chains/ABI/session)**, ASSAToken(Votes+10B)·Vesting testnet 배포, Landing(브랜딩+KO/EN/JA), SIWE 인증(반피싱 도메인 집합), 보안 CI(Slither+coverage), KYC webhook 골격, wrangler env+cron 토폴로지.
- **Exit Criteria:** ASSAToken/Vesting Base Sepolia 배포+verify, `_update`(4-way)/`nonces` override 정합 + **`totalSupply≤10B` 단위테스트** green, SIWE nonce→verify→세션 e2e green, **ASSAToken 코드 freeze(감사#1 입력)**·ABI를 공유패키지에 핀, Slither 0 high.
- **DoD:** 4앱 빌드·배포 동작, M1 이후 토큰 변경 금지(변경=v2 절차).
- **ccm 단축:** Token/Vesting/auth/session/wagmi/i18n/디자인토큰 fork. 신규=Votes override·브랜딩·반피싱 도메인.

### M2 — 세일 풀스택 + 감사#1 + 법무 게이트 (mainnet 세일 런칭)
- **산출물:** TokenSale(3라운드, **claimable 재작성·Pausable**)·Sale UI·/sale/rounds·/portfolio·**eventIndexer(Purchased)**·KYC webhook(OFAC)·admin SIWE 격상·Safe/Timelock/**KYCRegistry mainnet** 배포, **외부 감사#1 완료**, **법무 GO 의견서**, 공유패키지 도메인 훅 단계화.
- **Exit Criteria:** ⚠️ **(A) 감사#1 0 crit/high + medium 전부 mitigated**, **(B) VAUPA/증권성 법무 GO 의견서 수령**(없이는 createRound/withdrawUSDC 금지), (C) Safe 4-of-7+48h 핸드오프 Sepolia 리허설+EOA renounce, (D) KYCRegistry mainnet 배포+OFAC 사전필터 정책 적용, (E) **세일 전체 라운드 물량 핸드오프 이전 사전 펀딩 완료**, (F) **KYC 승인→온체인 반영 SLA** 명시, (G) Immunefi vault 펀딩.
- **DoD:** Base Sepolia **세일→게이트→TGE 즉시언락→cliff→선형 claim→USDC를 Treasury Safe 수령** 풀시퀀스 E2E(재작성한 dry-run) 통과, mainnet 첫 라운드 오픈.
- **ccm 단축:** Sale.tsx(27KB)·view sync·핸드오프 런북 재사용. 신규=claimable 회계·Pausable·eventIndexer·감사 리드타임.

### M3 — 무이자 Staking + BME 출시 + 감사#2
- **산출물:** StakingLock veASSA(mainnet)·/app/stake UI(감쇠곡선·오해방지 카피)·BMEBurner+LP(mainnet)·BME 대시보드·다국어 마감·컴플라이언스 카피.
- **Exit Criteria:** ⚠️ **감사#2 0 crit/high**(veASSA·BME), veASSA "보상 분배 함수 부재" 음성 불변식+ABI 정적검사 통과, 토큰잔액==lock원금합(잉여유출 0), BME swap+burn fork test(Base) 통과·최소유동성 불변식, BME 대시보드 체인↔캐시 정합, 무이자 카피 법무 승인.
- **DoD:** lock→votingPower 감쇠→withdraw E2E, BME processRevenue→소각 mainnet 검증.
- **ccm 단축:** Sale approve→write→receipt 패턴·EmissionCurve SVG·라이브 지표·keeper 패턴 차용. veASSA(XL)/BME 로직 신규.

### M4 (개요) — Phase 2 팬 이코노미
ConsumptionEngine, StarRanking/FandomBattle, EdgeNode+MiningRewards, ERC-1155 NFT. 전부 신규, 감사 대규모. eventIndexer 부하 급증 시 Ponder/Graph 재평가.

### M5 (개요) — Phase 3 거버넌스·L3
ASSAGovernor+Timelock(votes 소스 단일화 결정 §8-16 반영), PredictionMarket(VRF), DebutFundingDAO, L3(OP Stack).

---

## 7. 리스크 레지스터

| 리스크 | 영향 | 가능성 | 완화 |
|---|---|---|---|
| **이벤트 인덱서 신규 부재 과소평가**(ccm getLogs 코드 0) | 높음(데이터 정합) | 높음 | WS4.2를 [신규]/L로 등재, `sync_state` 커서·다중 cron 백필·중복방지, subrequest/CPU 한도 설계 |
| **세일/베스팅 회계 재작성 버그**(startTime-선형 결함·TGE 이중계상·언더플로) | 높음(자금 과다/과소지급) | 중 | 스펙 §3.3 공식 단일소스, cliff후 선형, 경계 fuzz(t=start/start+cliff/start+duration), claimed≤total 불변식 |
| **감사 baseline 부재**(델타 SOW 불성립) | 높음(범위·일정) | 높음 | 2개 풀스코프 감사, 4-8주 전 예약, fuzz 선행 게이트 |
| **법무 미승인 세일 강행**(VAUPA·증권성) | 높음(불법) | 중 | WS7.2 법무 GO를 M2 하드게이트로, 온체인 isKYCed 최종 게이트 |
| **veASSA 무이자 재작성 + 체크포인트**(이자형 잔재·감쇠 정밀도·veToken 감사난이도) | 높음(가치유출) | 중 | XL 재산정, 음성 불변식+ABI 정적검사, Curve/Velodrome 레퍼런스 대조, 감사#2, ReentrantToken 재진입 |
| **BME DEX/MEV/유동성**(샌드위치·풀 부족·keeper키 탈취) | 높음(직접손실) | 중 | TWAP+Chainlink 보수값, keeper는 maxSlippageBps만, LP 시딩 선행+최소유동성 불변식, Flashbots Protect, Safe 경유 호출 |
| **mainnet KYC 운영 미검증**(Sepolia 리허설만·webhook 위조·Safe 서명 지연) | 높음 | 높음 | webhook HMAC, OFAC 사전필터, 승격 리허설, 온체인 반영 SLA(hot key vs Safe batch) |
| **펀딩↔핸드오프 순서 모순**(MINTER 회수 후 세일 펀딩 48h 갇힘) | 높음(운영 마비) | 중 | 펀딩 게이트 명시(전량 mint→구성→핸드오프), 재충전 48h timelock 런북 |
| **공유패키지 git 경계**(단일 workspace 충돌) | 중 | 중 | 옵션 A(별도 패키지+git 의존성), C 폐기 |
| **admin 단일 Bearer 단일점**(round 조작·무단 화이트리스트) | 중 | 중 | Safe 멤버 SIWE 격상, 가격 동결 온체인 강제, audit 강제 |
| **ERC20Capped+Votes+Pausable _update MRO** | 중 | 중 | 컴파일 게이트 아닌 런타임 불변식(cap초과 mint시 체크포인트 미기록·pause시 votingPower 불변) |
| **ASSAToken Votes vs veASSA votes 이중계표** | 중 | 중 | Phase1 votes 소스 단일화(§8-16): 토큰 votes dormant 또는 veASSA만, 비전송 강제 |
| **세일 Pausable 부재**(긴급정지 불가) | 중 | 중 | purchase whenNotPaused 신규, claim/withdraw 정지 예외 |

---

## 8. 결정 필요 사항 (⚠️ 사용자 승인) — **[권고]** 포함

1. **스택 override** — [승인] Foundry/Next14/NestJS/Ponder 폐기, ccm 실제 스택 확정.
2. **인덱서** — [Worker view 폴링 + **신규 eventIndexer**] 별도 Ponder/Graph 불필요(Phase1). ⚠️ 이벤트 로그 인덱싱은 ccm에 없어 신규 구축.
3. **세일 게이팅** — [**per-round whitelist 유지 권고**(컨트랙트 무변경=진짜 재사용·감사표면 0), KYCRegistry는 프런트/백엔드 게이팅+온체인 진실원천으로 병용] vs purchase에 isKYCed 주입(신규 변경·감사표면↑). ⚠️ KYCRegistry 주입 채택 시 mainnet 배포가 Sale 배포 선행.
4. **세일 베스팅 모델** — [**CCMTGESale self-contained 유지 권고**(id-indexed, `claimable(round,addr)` 루프)] vs ASSA 스펙 `releasable(address)` 단일집계 재설계. **chain.ts/UI 인덱싱 일관성의 선행 결정** — 확정 전 WS3.2/WS2.5 착수 금지.
5. **소스 공유** — [**옵션 A**(별도 패키지+git 의존성) 권고] C(단일 workspace) 폐기·서브모듈 거부. D(모노레포 통합)는 사용자 결정 시.
6. **ASSAToken ERC20Votes** — [Phase1부터 포함 권고] Phase3 거버넌스 전제. _update/nonces 복잡도·감사범위 증가.
6b. **burn 모델** — [**ERC20Burnable 유지 권고**(BMEBurner가 자기 잔액 burn, EOA burn 무해)] vs BURNER_ROLE 게이트(스펙 'EOA burn 금지' 준수·감사표면↑). WS1.6 인터페이스의 선행.
7. **StakingLock 무이자 확정** — [확정] 보상/emission/oracle 전 경로 제거, 음성 불변식 강제.
8. **토큰 업그레이드성** — [코어 불변 권고] Token/Sale/Vesting non-upgradeable. UUPS는 Phase2 진화모듈만.
9. **Safe 구성** — [**4-of-7 권고**] ccm 3-of-4 스크립트 파라미터화[재사용] + 7-서명자 키 세리머니[신규]. 서명자 7명 확보 가능성 확인.
10. **결제 통화** — [USDC 단독] KRW 고정→USDC 동결 표시. 온램프는 Phase 2.
11. **KYC 공급자·지역차단** — [provider 추상화 후 1곳] Sumsub vs Persona, US/CN IP+지갑.
11b. **KYC 온체인 반영 SLA** — [**세일 전 사전심사+Safe batch 권고**(당일 참여 불가 고지)] vs 전용 hot key 자동 batch(키 노출 trade-off).
12. **BME DEX·가격소스** — [Aerodrome + TWAP/Chainlink 보수값] ASSA/USDC LP 시딩 규모·자금 출처 확정.
13. **감사 SOW·바운티** — [**2개 풀스코프**(감사#1=Token/Sale/Vesting/KYC@M2, 감사#2=veASSA/BME@M3), 델타 폐기, 슬롯 조기 예약, Immunefi mainnet 직후].
14. **admin 콘솔 인증** — [**Safe 멤버 SIWE 격상 권고**, Phase1 필수] 공유 Bearer 단일점 회피.
15. **브랜드 계승** — [네이비+레드+골드, 골드 액센트 한정·WCAG AA] WS2 재작업 방지 위해 사전 확정.
16. **votes 소스 단일화** — [**Phase1 토큰 votes dormant, 거버넌스는 veASSA만**(Phase3) 권고] 이중계표 방지. veASSA transfer revert(비전송)·ERC5805 호환 시점 결정.
17. **세일 Pausable** — [purchase whenNotPaused 추가, claim/withdraw 정지 예외 권고] 스펙 §3.2 요구.

---

## 9. 즉시 착수 (첫 스프린트, 1~2주)

**공유 패키지 골격 (옵션 A — 최소 추출 먼저)**
- [ ] 공유 패키지 repo(`assa-ccm-shared` 또는 ccm 내 publishable) 스캐폴드 + 두 repo git 의존성 배선
- [ ] `session.ts` + chains/config(Base 8453/84532·RPC·주소 맵 stub) 1차 이관, **ccm 회귀 테스트 green** 확인

**온체인 (크리티컬 패스 시작)**
- [ ] `ccm/onchain` → `assawave/onchain` 복제: `hardhat.config.ts`(0.8.24 cancun·optimizer 200·Base/Sepolia·Basescan v2 verify)·`mocks/`·`.env` 템플릿
- [ ] **ASSAToken**: CCMToken fork → ERC20Votes 상속 → `_update` override `(ERC20,Capped,Pausable,Votes)` + `nonces()`(`ERC20Permit,Nonces`) 신규 → cap 5B→10B(**ERC20Capped 유지**) → name/symbol 'ASSA' → **burn 모델 확정**(결정#6b) → 컴파일·`totalSupply≤10B`·`_update` MRO 단위테스트
- [ ] **fuzz 툴링 신규 도입**(Foundry forge 또는 hardhat+fast-check — ccm에 없음) 부트스트랩
- [ ] Base Sepolia 배포 + verify + 주소 레지스트리 JSON 초기화

**디자인시스템 (병렬)**
- [ ] `frontend` 토큰 fork → `index.css` CSS변수 navy/red/gold 스왑(WCAG AA, 골드 액센트 한정) + ASSA Wordmark
- [ ] primitives.tsx 무변경 동작 확인

**백엔드 (병렬)**
- [ ] `portal-api` fork(index/auth/session/middleware/db/me/email) → 도메인 assawave.io, **ALLOWED_DOMAINS 정확집합** → 신규 시크릿
- [ ] 신규 D1 + `0001_init` + **`sync_state`(이벤트 커서) 스키마** → nonce→verify→세션쿠키 vitest e2e green

**인프라/CI**
- [ ] `wrangler.toml` fork: name·D1·vars(ASSA stub·dev=84532) + environments + **cron 토폴로지 분할 골격**
- [ ] GitHub Actions: PR=typecheck+hardhat test+vitest + Slither+Solhint+coverage 게이트
- [ ] **감사사 2-3곳 슬롯 사전 문의**(감사#1/#2 분리 SOW) + **법무(VAUPA/증권성) 킥오프**(M2 하드게이트)
- [ ] 방어 도메인(.ai/.net) 등록·DNSSEC 착수

---

*본 계획은 ccm 라이브 기반(Base mainnet) 재사용을 전제로 한다. 크리티컬 패스의 실질 신규 작업은 ① veASSA 무이자 재작성(XL) ② BMEBurner+LP ③ ERC20Votes ④ 이벤트 인덱서 ⑤ mainnet KYC 운영 ⑥ 세일/베스팅 TGE 회계 재작성이며, mainnet 세일은 **외부 감사#1 통과 + 법무 GO 의견서**를, veASSA/BME mainnet 배포는 **감사#2 통과**를 하드 게이트로 둔다. ccm에 제3자 외부 감사·이벤트 인덱서·fuzz 툴링·mainnet KYC 운영이 부재하므로 이들은 재사용이 아닌 신규로 산정한다. §8의 17개 결정(특히 #3 게이팅·#4 베스팅 모델·#16 votes 단일화는 다른 작업의 선행) 승인 후 M1 착수.*
