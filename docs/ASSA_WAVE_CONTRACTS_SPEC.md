# ASSA WAVE — Smart Contract Development Spec

> **Status:** Draft v0.1 · **Date:** 2026-05 · **Chain:** Base (Ethereum L2) → 자체 L3 (Phase 2+)
> **출처:** Whitepaper v2.0 / 재무 모델(ASSA_WAVE_Simulation.xlsx)
> 본 문서는 개발 착수용 스펙이며, 토큰/세일 파라미터는 규제·감사 검토 후 확정한다.

---

## 0. 요약 (TL;DR)

| 항목 | 결정 |
|---|---|
| 체인 | **Base** (mainnet `8453`, testnet Base Sepolia `84532`). Phase 2~ 자체 **L3(OP Stack)**, $ASSA 브리지 |
| 토큰 표준 | $ASSA = **ERC-20**(10B hard cap), NFT = **ERC-1155** |
| 언어/툴 | Solidity `^0.8.24`, **OpenZeppelin v5**, **Foundry**(forge/cast), Slither/Echidna |
| 업그레이드 | 진화 모듈은 **UUPS proxy** + Timelock·Multisig 거버넌스. 토큰 코어는 최소 업그레이드/불변 |
| 권한 | **AccessControl** 역할 + **Gnosis Safe(멀티시그)** + **TimelockController** |
| 핵심 원칙 | 스테이킹은 **무이자 락업**(emission 없음). 소비는 **소각 sink**(70% burn). 채굴 emission은 front-loaded |

설계 1원칙: **채굴(공급)을 스테이킹 락업·소비 소각(수요)이 흡수**한다. 컨트랙트는 이 균형을 온체인으로 강제한다.

---

## 1. 아키텍처 (모듈 맵)

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
   │  (Phase 2)   │          │+Vesting  │ │ (veASSA,무이자)│      │ (allocations)│
   └──────────────┘          └──────────┘ └───┬─────────┘       └──────────────┘
                                              │ weight
   ┌─────────────────────────────────────────▼───────────────────────────────┐
   │  ConsumptionEngine (Phase 2) ─ spend→70% burn/30% prize ─ StarRanking/Battle│
   └────────────────────────────────────────────────────────────────────────────┘
   Phase 3: veASSA Governor · AllKillPool · PredictionMarket · DebutFundingDAO · SettlementOracle
```

**컨트랙트 목록 / 단계**

| # | 컨트랙트 | 표준/베이스 | Phase | 업그레이드 |
|---|---|---|---|---|
| 1 | `ASSAToken` | ERC20, ERC20Permit, ERC20Votes, AccessControl | **1** | 불변(또는 최소) |
| 2 | `TokenSale` | custom + Merkle(KYC) | **1** | UUPS |
| 3 | `TokenVesting` | custom | **1** | UUPS |
| 4 | `BMEBurner` | custom + DEX router | **1** | UUPS |
| 5 | `StakingLock` (veASSA) | custom, 무이자, 비전송 | **1** | UUPS |
| 6 | `Treasury` | custom + Safe | **1** | UUPS |
| 7 | `ConsumptionEngine` | custom + 소각 | 2 | UUPS |
| 8 | `StarRanking` / `FandomBattle` | custom + epoch | 2 | UUPS |
| 9 | `EdgeNodeRegistry` + `MiningRewards` | custom + oracle | 2 | UUPS |
| 10 | `PerformanceNFT` / `ConcertPassNFT` | ERC1155 | 2 | UUPS |
| 11 | `VoiceDNANFT` | ERC1155 + Story Protocol IP | 2~3 | UUPS |
| 12 | `ASSAGovernor` + `TimelockController` | OZ Governor, ERC5805 | 3 | — |
| 13 | `AllKillPool` / `PredictionMarket` / `DebutFundingDAO` | custom + VRF | 3 | UUPS |
| 14 | `SettlementOracle` | Chainlink + custom adapter | 3 | UUPS |

---

## 2. 권한 & 거버넌스 (Access Control)

모든 권한은 `AccessControl` 역할로 부여하고, 최종 admin은 **Gnosis Safe 멀티시그(예: 4-of-7)** → **TimelockController(48h)** 가 보유한다.

| Role | 보유자 | 권한 |
|---|---|---|
| `DEFAULT_ADMIN_ROLE` | Timelock(Safe) | 역할 부여/회수, 업그레이드 승인 |
| `MINTER_ROLE` | `MiningRewards`만 | $ASSA mint (cap 내) |
| `BURNER_ROLE` | `BMEBurner`, `ConsumptionEngine` | $ASSA burn |
| `SALE_ADMIN_ROLE` | 운영 Safe | 라운드 설정·화이트리스트 루트 |
| `TREASURY_ROLE` | Treasury Safe | 분배 토큰 인출(베스팅 경유) |
| `ORACLE_ROLE` | Chainlink/노드 어테스터 | 가격·점수·업타임 피드 |
| `PAUSER_ROLE` | 운영 Safe | 긴급 일시정지 |
| `UPGRADER_ROLE` | Timelock | UUPS 업그레이드 |

원칙: **mint는 오직 `MiningRewards`**, **burn은 BME·소비 엔진**만. EOA 직접 mint/burn 금지.

---

## 3. Phase 1 (MVP) — 상세 스펙

> Phase 1 목표: **TGE·토큰·세일/베스팅·BME·무이자 스테이킹·지갑연결**까지. 감사 1차 대상.

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
    // burn / burnFrom inherited (BURNER_ROLE 컨트랙트가 호출)
    // ERC20Votes overrides (_update, nonces) per OZ v5
}
```

- **불변식:** `totalSupply() ≤ CAP` 항상 성립.
- **decimals:** 18. **Permit(EIP-2612):** 가스리스 승인. **Votes:** 향후 거버넌스용 체크포인트.
- **소수:** TGE 시 초기 유통분만 발행, 나머지는 `MiningRewards`가 10년 front-loaded로 mint.
- **이벤트:** `Transfer`, `DelegateChanged`, 표준.

### 3.2 `TokenSale` (3 라운드, 고정가)

세일 단가는 KRW 고정(30/50/70원)이나 온체인 결제는 **USDC(6 decimals)**. 라운드 설정 시 **USDC/ASSA 단가**를 KRW 기준 환율로 고정(frozen)한다. 구매분은 즉시 유통되지 않고 **`TokenVesting`에 스케줄로 적재**된다.

```solidity
struct Round {
    uint64  start; uint64 end;
    uint128 cap;            // 라운드 토큰 한도 (예: 30_000_000e18)
    uint128 sold;
    uint256 priceUsdcPerAssa; // USDC(1e6) per 1 ASSA, 라운드 설정 시 고정
    bytes32 merkleRoot;    // KYC/화이트리스트 (allowlist)
    uint8   tgeBps;        // TGE 즉시 언락 % (R1 0 / R2 500 / R3 1000)
    uint32  cliff;         // 초 (R1 6m / R2 3m / R3 0)
    uint32  duration;      // 선형 베스팅 초 (R1 18m / R2 12m / R3 6m)
}

interface ITokenSale {
    function configureRound(uint8 id, Round calldata r) external; // SALE_ADMIN
    function buy(uint8 roundId, uint256 assaAmount, bytes32[] calldata proof) external; // USDC 사전 approve
    function roundOf(uint8 id) external view returns (Round memory);
}
```

- **흐름:** `buy()` → USDC `safeTransferFrom`(구매자→Treasury) → `sold += amount` (cap 체크) → `TokenVesting.createSchedule(buyer, amount, tge, cliff, duration, SALE)`.
- **검증:** 라운드 활성(start≤now≤end), cap 미초과, `MerkleProof.verify(proof, root, leaf=keccak(addr))`, 1인 한도(옵션).
- **자금:** 전액 `Treasury`(Safe). 환불 불가(또는 미달 시 admin refund 로직).
- **이벤트:** `RoundConfigured`, `Purchased(buyer, roundId, assa, usdc)`.
- **보안:** `ReentrancyGuard`, `SafeERC20`, `whenNotPaused`. **가격 동결**(라운드 중 변경 불가).

### 3.3 `TokenVesting`

카테고리별 cliff+linear 스케줄. 세일·Founder·Team·Investor·Partner·ECO·Marketing 분배에 공통 사용.

```solidity
struct Schedule {
    uint128 total; uint128 claimed;
    uint64  start; uint32 cliff; uint32 duration;
    uint16  tgeBps;       // TGE 즉시 분
    bool    revocable;    // Team/Founder 등
    uint8   category;
}

interface ITokenVesting {
    function createSchedule(address who, uint256 total, uint16 tgeBps,
                            uint32 cliff, uint32 duration, bool revocable, uint8 cat) external; // VESTING_ADMIN
    function claim() external;                       // beneficiary
    function releasable(address who) external view returns (uint256);
    function revoke(address who) external;           // revocable만, ADMIN
}
```

표준 분배 베스팅(권고):

| 카테고리 | TGE | Cliff | Linear | revocable |
|---|---|---|---|---|
| Private R1 (30원) | 0% | 6m | 18m | no |
| Private R2 (50원) | 5% | 3m | 12m | no |
| Private R3 (70원) | 10% | 0 | 6m | no |
| Investor | 0% | 6–12m | 18–24m | no |
| Founder | 0% | 12m | 48m | yes |
| Team & Advisor | 0% | 12m | 36m | yes |
| Partner | 0% | 6m | 24m | yes(마일스톤) |
| ECO/Marketing | 일부 | 0 | 24–36m | yes |

- **claim:** `releasable = total*tgeBps/1e4 + (now>start+cliff ? linear : 0) − claimed`.
- **이벤트:** `ScheduleCreated`, `Claimed`, `Revoked`.

### 3.4 `BMEBurner` (Burn-Mint Equilibrium)

외부 매출(USDC)의 일부로 DEX에서 $ASSA 매입 후 **영구 소각**. B2C 20% / B2B 30~40%.

```solidity
interface IBMEBurner {
    function processRevenue(uint256 usdcAmount, uint16 burnBps, uint256 minAssaOut) external; // TREASURY/BACKEND
    // burnBps: B2C 2000 / B2B 3000~4000
}
```

- **흐름:** `usdc.safeTransferFrom` → `burnAmount = usdc*burnBps/1e4` → Aerodrome/Uniswap `swapExactTokensForTokens`(USDC→ASSA, `minAssaOut` 슬리피지 가드, deadline) → `ASSA.burn(received)`.
- **오라클/MEV:** TWAP 또는 Chainlink 가격으로 `minAssaOut` 산정, 프라이빗 멤풀/스플릿 실행 권장.
- **이벤트:** `Burned(usdcIn, assaBurned, burnBps)`.
- **불변식:** 소각분은 `Treasury` 외부로 나가지 않고 `address(0)`로만.

### 3.5 `StakingLock` (veASSA · **무이자 락업**)

$ASSA를 시간 락업해 **veASSA 가중치**(비전송)를 얻는다. **이자/emission 없음** — 보상은 랭킹 가중치·거버넌스·티어 자격. Curve veToken 모델 차용(보상 분배만 제거).

```solidity
struct Lock { uint128 amount; uint64 end; uint64 start; }

interface IStakingLock {
    function lock(uint256 amount, uint256 duration) external;   // max 4y
    function increaseAmount(uint256 amount) external;
    function increaseUnlockTime(uint256 newEnd) external;
    function withdraw() external;                                // end 이후 원금만
    function votingPower(address u) external view returns (uint256); // 시간 감쇠 가중
    function tierWeight(address u) external view returns (uint256);  // Tier multiplier 입력
}
```

- **가중:** `weight = amount * (lockRemaining / MAXTIME)` (선형 감쇠). 거버넌스·랭킹 입력.
- **No-yield 강제:** 컨트랙트에 reward 분배 함수 없음 → 가치 유출 0. 공급 락업으로 매도압력만 감소.
- **비전송:** veASSA 잔액 transfer 불가(ERC20Votes-like 체크포인트만).
- **이벤트:** `Locked`, `Withdrawn`.

### 3.6 `Treasury`

분배 버킷(40/12/5/10/10/5/8/5/5%) 보유. 베스팅·유동성·운영 자금 집행은 Safe + Timelock. 세일 USDC 수령처.

---

## 4. Phase 2 — 개요 스펙

### 4.1 `ConsumptionEngine` (Spend-to-Compete · 소비 소각)

```solidity
interface IConsumptionEngine {
    /// @notice 팬이 스타/팬덤에 토큰을 소비. 70% burn + 30% prizePool.
    function spend(uint256 targetId, uint256 amount, bytes calldata skillAttest) external;
    function settleSeason(uint256 seasonId) external; // 리더보드 정산 → prize 분배
}
```

- **분배:** `burn = amount*70%` (`ASSA.burn`), `prize = amount*30%` → `prizePool[targetId]`(아티스트·상금).
- **랭킹:** `StarRanking.addPoints(targetId, weight)` — `weight = f(amount) * skillFactor`(diminishing returns + 실력 VPU 가중, `skillAttest`=오라클 서명).
- **시즌:** epoch 단위 리셋, `settleSeason`에서 상위 팬덤/팬 보상(NFT·allocation).
- **안티-고래/시빌:** 체감 곡선, Voice DNA 검증(off-chain), per-epoch 캡.

### 4.2 `StarRanking` / `FandomBattle`
시즌별 포인트 집계·정산. ARMY vs BLINK식 대결. 정산 시 보상 분배 + 이벤트.

### 4.3 `EdgeNodeRegistry` + `MiningRewards`
- 노드 등록(본드 스테이킹 + 하드웨어 어테스트), Tier, **front-loaded emission**을 노드 가중×업타임/추론증명(oracle)으로 분배. `claim()`. 채굴분 **auto-stake(veASSA)** 옵션 → 유통 억제.
- emission 곡선은 재무 모델 §Mining 참조(Y1~Y10 비중).

### 4.4 NFTs (ERC-1155)
`PerformanceNFT`(S/A/B/C tier), `ConcertPassNFT`, `VoiceDNANFT`(Story Protocol IP·on-chain consent). 마켓 fee의 일부 BME 소각.

---

## 5. Phase 3 — 개요

| 컨트랙트 | 설명 |
|---|---|
| `ASSAGovernor` + `TimelockController` | OZ Governor(ERC-5805 votes=veASSA). Tier multiplier·Veto(레전드). 제안→타임락→실행 |
| `AllKillPool` | 컴백 응원 풀, PAK/CAK 정산, Participation NFT |
| `PredictionMarket` | 음악 outcome 예측, Chainlink **VRF**/oracle 정산 |
| `DebutFundingDAO` | 신인 데뷔 펀딩 |
| `SettlementOracle` | 7대 차트 API 통합(Chainlink + custom adapter) |
| **L3 마이그레이션** | OP Stack 자체 L3, $ASSA 가스토큰, 정식 브리지(Base↔L3), 시퀀서 |

---

## 6. 횡단 관심사 (Cross-cutting)

- **오라클:** 가격=Chainlink/TWAP, 무작위=Chainlink VRF, 점수·업타임·차트=서명 기반 custom oracle(`ORACLE_ROLE`).
- **DEX 연동:** Aerodrome(Base 기본)/Uniswap v3 라우터. 슬리피지·deadline·MEV 가드.
- **일시정지:** 핵심 모듈 `Pausable`(PAUSER). 단, 사용자 자금 인출(withdraw/claim)은 정지 예외 권장.
- **업그레이드 거버넌스:** UUPS + `_authorizeUpgrade(onlyRole(UPGRADER))`, Timelock 경유. Storage gap(`uint256[50]`).
- **컴플라이언스:** 세일 KYC(Merkle allowlist), 지역 차단(US/CN)은 프런트+오프체인, 토큰 자체는 무제한 전송(유틸리티). VAUPA/MAS/ADGM 검토.
- **L2/가스:** calldata 최소화, batch, EIP-1559. Base 저가 활용.

---

## 7. 보안 & 감사

- **위협 모델:** 재진입, 권한 상승, 오라클 조작, 플래시론, MEV, 공급 불변식 위반, 베스팅 우회, 무한 mint.
- **방어:** CEI 패턴, `ReentrancyGuard`, `SafeERC20`, pull-payment, 역할 최소권한, mint=오직 MiningRewards(cap), Safe+Timelock.
- **정적/동적 분석:** Slither, Mythril, Echidna/Foundry invariant fuzz.
- **감사:** mainnet 전 **2~3개사**(CertiK·Quantstamp·Halborn) + **버그바운티**(Immunefi).
- **운영:** OZ Defender/Tenderly 모니터링·알림, 멀티시그, 타임락, incident runbook.

**핵심 불변식(테스트로 강제):**
1. `totalSupply ≤ 10B` 항상.
2. mint 호출자 ∈ {MiningRewards}, burn 호출자 ∈ {BMEBurner, ConsumptionEngine}.
3. 베스팅 `claimed ≤ total`, releasable는 스케줄 함수와 일치.
4. 세일 `sold ≤ cap`, 라운드 가격 동결.
5. StakingLock은 reward 분배 경로가 존재하지 않음(무이자).

---

## 8. 테스트 & 배포

- **프레임워크:** Foundry. 유닛 + **fuzz** + **invariant** + **fork test**(Base).
- **커버리지:** 라인/브랜치 ≥ 95% 핵심 모듈.
- **시나리오:** 세일 3라운드·베스팅 cliff/linear, BME 소각, 락업/감쇠, 소비 70/30, cap 경계, 권한 경계.
- **배포:** `script/Deploy.s.sol` → Base Sepolia → 감사 → mainnet. Basescan verify. 주소 레지스트리(JSON) 관리.
- **환경:** `.env`(RPC, PRIVATE_KEY via hardware/Safe), `foundry.toml` profiles.

**레포 구조(권고)**
```
contracts/  (src/token, src/sale, src/staking, src/bme, src/consumption, src/node, src/gov)
test/       (unit, invariant, fork)
script/     (Deploy, Configure)
audit/      (reports)
foundry.toml
```

---

## 9. 결정 필요 (Open Questions)

1. **세일 결제 통화:** USDC(권장) vs KRW-stable. 라운드 단가 동결 방식 확정.
2. **토큰 업그레이드성:** 불변(권장) vs 최소 업그레이드.
3. **Team/Founder 베스팅 revocable** 여부·조건.
4. **L3 전환 시점**과 브리지/가스토큰 설계.
5. **소비 엔진 skill 가중** 오라클(서명자·VPU 산출) 신뢰 모델.
6. KYC 온체인(allowlist) vs 오프체인 게이팅 비중.

---

*본 스펙은 정보·설계 목적이며 투자·법률 자문이 아니다. 토큰 세일·발행은 한국 VAUPA·증권법 등 규제 검토와 스마트컨트랙트 감사를 전제로 한다.*
