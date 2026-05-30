# ASSA WAVE — 사이트 기획 & 디자인 시스템

> **버전:** v1.1 (적대적 비평 반영 최종) · **기준일:** 2026-05-30 · **공식 도메인:** assawave.io (단일)
> **단일 진실원천:** ASSA WAVE 디자인 파운데이션 + ccm 실소스 IA(Base mainnet 라이브) + 실측 BI 2종 + 3개 스펙(SITE/CONTRACTS/DEVELOPMENT_PLAN)
> **상태:** Phase 1(MVP) 상세 / Phase 2·3 개요
>
> **v1.1 변경 요약 (critical/high 갭 반영):**
> 1. ⚠️ **"색 변수만 스왑하면 무변경 재사용" 전제 철회.** ccm은 단일 accent색 `--moss`(녹색)를 브랜드·데이터·positive·`::selection`에 **237회** 혼용 → 레드로 일괄 치환 불가. **§1.0a moss 3분류 audit 표**로 의미 분기.
> 2. **워드마크 글리프 명세 정정** — 'A 좌측 스트로크 대체'(오기) → '온전한 A + 좌측 독립 wave 스트라이프'. **BI 2종(심볼/워드마크) 역할 분리**.
> 3. **WCAG 실측 반영** — 흰 글자 on #EF2525 = 4.23:1 **FAIL**. Primary 배경을 `--brand-pressed`(#C81E14)로 확정.
> 4. **'재사용' 라벨 전면 정정** — 실측상 Step/Input/Badge/Toast/ProgressBar/WalletButton/Recharts는 **신규**. focus-visible·44px·에러디코딩은 ccm에 **부재** → 신규 구축.
> 5. **세일 컨트랙트 2모델 명시** — ccm 실측(`purchase`/`whitelist` boolean/self-contained) vs ASSA 스펙(`buy`+proof). Sale은 '재사용'이 아니라 **회계 재작성 fork**.

---

## 0. 개요

### 0.1 목적 — 2-오디언스 단일 제품

ASSA WAVE 사이트는 **하나의 디자인 시스템**으로 두 청중을 동시에 설득한다.

- **(a) 투자자** — 토큰 세일 참여. 핵심 가치는 **신뢰·투명·절제**. 3라운드 세일·토크노믹스·베스팅·감사·법무 게이트. 톤: 데이터 중심, Hairline 테이블, `tabular-nums`.
- **(b) K-pop 팬** — Web3 음악 이코노미 참여. 핵심 가치는 **열광·소속·속도**. 스테이킹(veASSA)·소비(BME 소각)·노드(Phase 2). 톤: Vibrant·볼드·듀오톤·wave/▶ 모티프.

설계 긴장은 **"위는 팬덤(Vibrant), 아래로 갈수록 투자자(절제)"** 의 톤 그라데이션과, **공급(채굴 emission)을 수요(스테이킹 락업·소비 소각)가 흡수**하는 BME 서사의 일관 시각화로 해소한다.

### 0.2 브랜드 요약 (실측 BI 2종 — 역할 분리)

⚠️ **공식 BI 자산은 weight가 다른 2종이 존재**한다(비평 high 갭 반영). 둘을 모순으로 두지 않고 락업 역할로 분리한다.

| 자산 | 파일 | 구성(실측) | 역할 |
|---|---|---|---|
| **워드마크(Primary)** | `logo01.png` | **굵고 각진 white 'ASSA'** 글리프(레드 면 위). 첫 'A'는 **온전한 굵은 A 글리프**이고, 그 **좌측에 우상향 3줄 wave 스트라이프가 별개 요소로 부착**(= ▶ play/음파 하이브리드). ⚠️ 'A의 좌측 스트로크를 대체'하는 것이 **아니다** | 메인 로고. nav 좌상단·히어로·문서 헤더. **굵은 weight가 마스터** |
| **심볼 마크(Mark)** | `3197611bd3cf6.png` | **▶ 재생삼각형(코랄)에 3줄 wave가 진입**하는 심볼 + 그 아래 **가늘고 라이트한 'ASSA'** 락업 | 단독 심볼(앱 아이콘·OG·favicon·로딩). 얇은 ASSA 락업은 **세컨더리/부제** 한정 |

- **컬러(실측):** Red #EF2525 · Coral #D93A26 · White. (덱 유래 navy/gold는 **실제 로고에 없음** → 액센트로 역할 재조정: navy=dApp 다크 캔버스, gold=투자자/티어 액센트 전용·텍스트 금지.)
- **모티프:** 3줄 wave + ▶ play를 구분선·배경·로딩·CTA·스크롤 인디케이터에 **시스템화**.
- **글리프 헬퍼 구현:** ccm `Wordmark`는 폰트 텍스트가 아니라 커스텀 SVG path 헬퍼(`wordmark-paths.ts`)다. ASSA `WaveMark`도 동일 구조 — **path 그룹 2개(① 온전한 ASSA 글리프 ② 좌측 독립 3줄 wave 스트라이프)** 로 logo01.png 실측 기하를 명세. 폰트 의존 금지.

### 0.3 디자인 원칙 5

1. **하나의 토큰, 두 청중.** 세일(투자자)·dApp(팬)을 단일 토큰·프리미티브로. 톤은 컴포넌트가 아니라 **컨텍스트·카피·강조 빈도**로 분기.
2. **ccm 코드 재사용 = 변수 스왑 + 클래스 audit.** ⚠️ **단순 변수값 스왑만으로 끝나지 않는다.** ccm `--moss`(단일 accent)가 브랜드·데이터·positive에 혼용(237회)되어, **사용처별 의미 분류(§1.0a) 후** CSS 변수를 분기 매핑해야 컴포넌트 코드 무변경이 성립한다.
3. **레드=브랜드/CTA, 골드=액센트만, 진행=중립, 위험=destructive 톤 분리.** 레드는 음악 브랜드이자 위험색 → 에러 남용 금지. 레드 3계열(#EF2525/#D93A26/#DC2626)이 근접하므로 **ΔE 분리**(§1.1)로 '브랜드 vs 진행 vs 위험'을 시각 구분. 골드는 면·보더만(텍스트 금지). 데이터 시각화에 브랜드 레드 미사용.
4. **신뢰는 디테일에서.** 모든 트랜잭션 서명 전 "무엇을·누구에게·정확히 얼마"를 표기. 무한승인 금지(정확 금액 approve). 컨트랙트 주소 하드코딩 + verified 표시. 반피싱 배너 상시.
5. **모션은 의미, 장식 아님.** wave/▶를 로딩·진행·전환에 시스템화. AI 슬롭(보라 그라데이션·무의미 글래스·레이아웃 시프트 hover) 회피. 150–300ms. ⚠️ reduced-motion은 **CSS 리셋 + `useReducedMotion()` 훅 가드 병행**(JS 애니메이션은 CSS로 안 멈춤, §1.4).

### 0.4 ccm IA 재사용 전제 (검증된 4앱 구조)

ASSA는 ccm 실소스의 **4앱 분리 구조**를 참조 기준으로 채택한다. 마케팅(공개)·dApp(지갑)·운영(SSO)·샌드박스는 보안등급·배포주기·번들이 근본적으로 달라 분리가 정당하다.

| 앱 | 도메인 | ccm 소스 | 핵심 |
|---|---|---|---|
| **site** (마케팅) | `assawave.io` | `frontend/` | 앵커드 단일 스크롤 랜딩 + 법무. 라이트/다크 토글 |
| **portal** (dApp) | `app.assawave.io` | `portal/` | 1단 평탄 URL + Layout 중첩(셸 공유) + 지갑. 다크 기본 |
| **admin** (운영) | `admin.assawave.io` | `admin/` | CF Access SSO + persona RBAC. 다크 |
| **testnet** (샌드박스) | `testnet.assawave.io` | testnet | Playground. Base Sepolia |

> **토큰 아키텍처(검증):** ccm `index.css`는 모든 색을 `:root`/`[data-theme]`의 순수 CSS 변수로 정의하고 `@theme`에서 `--color-*`로 **참조만** 한다. `ThemeProvider`의 `DEFAULT_THEME="dark"` + `document.documentElement.dataset.theme` 스왑으로 리렌더 없이 테마 전환. 이 2단 구조 자체는 그대로 계승하나, **변수 값 스왑은 §1.0a audit를 선행**해야 한다(비평 critical 갭).

### 0.5 참조 문서

- 사이트 스펙: `/Users/hyunsuklee/Developer/web3/assawave/docs/ASSA_WAVE_SITE_SPEC.md`
- 컨트랙트 스펙: `/Users/hyunsuklee/Developer/web3/assawave/docs/ASSA_WAVE_CONTRACTS_SPEC.md`
- 개발 계획서: `/Users/hyunsuklee/Developer/web3/assawave/docs/DEVELOPMENT_PLAN.md`
- BI 실측: `/Users/hyunsuklee/Developer/web3/assawave/docs/assa-bi/{logo01.png(워드마크), 3197611bd3cf6.png(심볼 마크)}`
- ccm IA 실측 기준 파일: `frontend/src/pages/Earth.tsx`·`portal/src/pages/Sale.tsx`·`portal/src/components/site/primitives.tsx`·`portal/src/components/CopyableAddress.tsx`·`admin/src/lib/personas.ts`·`frontend/src/hooks/useReducedMotion.ts`

---

## 1. 디자인 시스템

### 1.0 토큰 아키텍처 — ccm 패턴 계승 + 의미 분기

```
[data-theme] CSS 변수 (값의 단일 소스, 테마별 분기)
        │  참조
        ▼
@theme  --color-* (Tailwind 유틸 생성: bg-brand, text-ink, border-rule …)
        │  사용
        ▼
컴포넌트 (의미론적 유틸만 — 하드코딩 hex 금지)
```

ccm의 검증된 구조 명명(`paper`/`ink`/`rule`/`paper-deep`)은 유지한다. 단, **단일 accent 슬롯 `moss`/`clay`를 ASSA에서 의미별로 분기**한다(아래 §1.0a). `lib/tokens.ts`의 TS 미러도 동일 분기 유지(런타임 차트·SVG에서 `getTokens(theme)` 참조).

### 1.0a ⚠️ moss/clay audit — 단순 리네임 금지 (critical 갭 해소)

**실측:** ccm `--moss`(녹색 #2dbf63)는 **단일 accent 색**으로 `text-moss` 237회 + `italic-moss`(Heading em) + `SectionLabel` + `SignalPlot` 데이터 라인(`var(--moss)`) + `::selection`까지 혼용된다. `--clay`(테라코타 #c8602e)는 보조 16곳. 이를 ASSA `--brand`(레드)로 **일괄 치환하면** 차트 데이터·성공 상태·선택 영역이 전부 레드로 오염되어, 본 문서 원칙 #3('레드=데이터/에러색 금지')과 정면 충돌한다.

**해소: 사용처를 3분류해 분기 매핑(컴포넌트별 클래스 audit 선행 필수).**

| ccm 원 사용처(`--moss`/`text-moss`/`--clay`) | 의미 분류 | ASSA 매핑 변수 | 예 |
|---|---|---|---|
| CTA 채움·`italic`/`em` 브랜드 강조·active 하이라이트·`::selection` | **브랜드/강조** | `--brand`(면)·`--brand-on-dark`(텍스트) | Hero em, AnchorNav active, 선택 영역 |
| `SignalPlot`/차트 데이터 라인·측정 시각화·스파크라인 | **데이터/측정** | `--data-1`(중립 청록)·`--ink-soft`·`--coral`(보조 계열) | WaveLines 데이터, 도넛 세그먼트 |
| "성공/완료/positive/claimable>0/vested" 상태 | **positive** | `--positive`(녹색 유지) | Claim 가능, 베스팅 완료, tx success |
| `--clay`(보조 강조·warning 근접) | 보조/경고 | `--coral`(보조 강조) 또는 `--warning`(경고) | revocable 태그, 진행 강조 |

> **운영 규칙:** fork 시 `grep -r "moss\|clay"` 전수 → 위 표로 분기 치환 → `git diff`로 데이터/positive가 레드로 새지 않았는지 확인. 이 audit를 **§7 첫 스프린트 게이트**로 못박는다. (DEVELOPMENT_PLAN WS2.1의 '색 스왑'을 'audit 기반 의미 분기'로 격상.)

### 1.1 컬러 토큰

#### 의미론 슬롯 (역할 분리 — 레드 3계열 ΔE 분리)

| 슬롯 | 역할 | 비고 |
|---|---|---|
| `--brand` / `--brand-hover` / `--brand-pressed` | BI 레드. 워드마크·▶ 모티프 | #EF2525 / #FF3B3B(다크)·#D93A26(라이트) / **#C81E14** |
| `--brand-on-dark` | 다크 위 레드 텍스트/링크/포커스링(AA 확보) | #FF5A4D |
| `--coral` | BI 코랄. 보조 강조·진행 상태·wave 그라데이션 끝점. ⚠️ brand-hover와 **값 충돌 회피** | **#E0563F**(주황 쪽으로 분리) |
| `--gold` | 투자자·veASSA 티어 액센트/보더 **전용**. 본문 텍스트 금지 | 덱 골드 계승 |
| `--data-1` / `--data-2` | 차트·데이터비주얼 중립색(브랜드 레드 미사용) | 청록 #2DD4BF / slate #64748B |
| `--paper` / `--paper-deep` | Canvas / 패널·카드 깊은 면 | ccm 명명 계승 |
| `--surface` / `--surface-2` | 입력·모달 등 상승 표면 | dApp 컴포넌트 면 |
| `--ink` / `--ink-soft` | 본문 / 약화 텍스트 | |
| `--rule` | 헤어라인·보더·구분선 | ccm 핵심 구조 토큰 |
| `--positive` / `--warning` / `--destructive` | 성공(그린) / 경고(앰버) / 위험 | destructive=#DC2626, brand와 **ΔE 분리** |
| `--nav-bg` | 반투명 네비 배경(backdrop-blur) | ccm 패턴 |

#### 레드 3계열 시각 분리 규칙 (high 갭)

`--brand`#EF2525(브랜드) / `--coral`#E0563F(진행, 주황 편향) / `--destructive`#DC2626(위험)을 **채도·색상각**으로 분리하고, **색 단독 의존 금지**:
- 진행중 = `--coral` + 스피너/`--dur-wave` 펄스(애니메이션 차이)
- 위험 = `--destructive` + `alert-triangle` 아이콘 + 텍스트 라벨(3중)
- 브랜드 = `--brand` 면 + CTA 위치(우상단/하단 고정)

#### `index.css` — `@theme` + 라이트/다크 (사이트 기본 다크)

```css
@import "tailwindcss";
@import "@rainbow-me/rainbowkit/styles.css";

/* 폰트(§1.2) */
@import "@fontsource/righteous/400.css";
@import "@fontsource/poppins/300.css";  @import "@fontsource/poppins/400.css";
@import "@fontsource/poppins/500.css";  @import "@fontsource/poppins/600.css";
@import "@fontsource/poppins/700.css";
@import "@fontsource/chakra-petch/400.css"; @import "@fontsource/chakra-petch/500.css";
@import "@fontsource/chakra-petch/600.css";
@import "@fontsource-variable/pretendard";          /* CJK 기본(KO) */
@import "@fontsource/black-han-sans/400.css";        /* CJK 디스플레이 후보(§1.2 결정#7) */
@import "@fontsource/noto-sans-jp/400.css"; @import "@fontsource/noto-sans-jp/700.css"; @import "@fontsource/noto-sans-jp/900.css";

/* 값의 단일 소스 — [data-theme]로 스왑. 라이트가 기본 정의이되 사이트 기본 테마는 다크. */
:root,
[data-theme="light"] {
  --brand: #EF2525;  --brand-hover: #D93A26;  --brand-pressed: #C81E14;
  --brand-on-dark: #C81E14;            /* 라이트 본문 레드는 pressed 톤(on white 5.75:1) */
  --coral: #E0563F;  --gold: #B7791F;  /* 라이트 골드는 채도 낮춰 면 대비 확보 */
  --data-1: #0D9488; --data-2: #475569;

  /* ⚠️ ccm 라이트는 웜크림(#f5f3ec)이나 ASSA는 순백 채택 = 브랜드 결정(ccm 정합 아님). */
  --paper: #FFFFFF;  --paper-deep: #F5F5F7;
  --surface: #FFFFFF; --surface-2: #F0F0F3;
  --ink: #0F172A;    --ink-soft: #475569;
  --rule: #E2E2E8;   --nav-bg: rgba(255,255,255,0.86);

  --positive: #16A34A;  --warning: #B45309;  --destructive: #DC2626;
  color-scheme: light;
}

[data-theme="dark"] {
  --brand: #EF2525;  --brand-hover: #FF3B3B;  --brand-pressed: #C81E14;
  --brand-on-dark: #FF5A4D;            /* 다크 위 텍스트/링크/포커스링용 레드(AA 4.5:1+) */
  --coral: #E0563F;  --gold: #FBBF24;
  --data-1: #2DD4BF; --data-2: #94A3B8;

  --paper: #0B0B14;  --paper-deep: #14141F;     /* 잉크 네이비블랙 */
  --surface: #1A1A26; --surface-2: #22222F;
  --ink: #F8FAFC;    --ink-soft: #94A3B8;
  --rule: #262633;   --nav-bg: rgba(11,11,20,0.88);

  --positive: #22C55E;  --warning: #F59E0B;  --destructive: #F0584B;
  color-scheme: dark;
}

@theme {
  --color-brand: var(--brand); --color-brand-hover: var(--brand-hover);
  --color-brand-pressed: var(--brand-pressed); --color-brand-on-dark: var(--brand-on-dark);
  --color-coral: var(--coral); --color-gold: var(--gold);
  --color-data-1: var(--data-1); --color-data-2: var(--data-2);
  --color-paper: var(--paper); --color-paper-deep: var(--paper-deep);
  --color-surface: var(--surface); --color-surface-2: var(--surface-2);
  --color-ink: var(--ink); --color-ink-soft: var(--ink-soft); --color-rule: var(--rule);
  --color-positive: var(--positive); --color-warning: var(--warning);
  --color-destructive: var(--destructive);

  --font-display: "Righteous", system-ui, sans-serif;
  --font-body:    "Poppins", system-ui, sans-serif;
  --font-data:    "Chakra Petch", ui-monospace, monospace;
  --font-cjk:     "Pretendard Variable", Pretendard, "Noto Sans KR", system-ui, sans-serif;
  --font-cjk-display: "Black Han Sans", "Pretendard Variable", "Noto Sans JP", sans-serif;

  --radius-sm: 6px; --radius-md: 10px; --radius-lg: 16px; --radius-pill: 999px;
  --radius-none: 0;
}

/* ⚠️ 포커스 링 — ccm 프리미티브에 부재(신규 구축, critical 갭) */
:focus-visible { outline: 2px solid var(--brand-on-dark); outline-offset: 2px; }
[data-theme="light"] :focus-visible { outline-color: var(--brand-pressed); }

/* ::selection 등 ccm moss 사용처는 §1.0a 분기 후 brand로 */
::selection { background: var(--brand); color: #fff; }
```

#### WCAG AA 검증 규칙 (실측 반영 — critical 갭)

- ⚠️ **흰 글자 on #EF2525 = 4.23:1 → 일반 텍스트 AA(4.5:1) FAIL** (실측). 따라서 **Primary 버튼 배경 = `--brand-pressed`#C81E14**(흰 글자 5.0:1+) 확정. brand #EF2525는 **면·아이콘·1px 보더·대형(18px+ bold, 3:1)** 에만.
- **레드 텍스트:** 다크=`--brand-on-dark`#FF5A4D, 라이트 본문 크기=`--brand-pressed`#C81E14(on white 5.75:1). 순색 #EF2525 본문 텍스트 금지.
- **골드는 텍스트 금지·액센트만:** 보더·언더라인·티어 배지 면·아이콘. 골드 위 글자는 `--ink`. 라이트 골드는 채도 낮춤(#B7791F).
- **데이터 시각화는 `--data-*`/`--positive`/`--coral`만** — 브랜드 레드 미사용(CTA 혼동·도넛 오염 차단).
- `--destructive`는 색+아이콘(`alert-triangle`)+텍스트 **3중 표기**(색맹 안전).
- **CI 게이트:** `pa11y`/`axe` — 토큰 변경 시 대비 회귀 차단. **버튼 라벨 실측 케이스 명시 추가**(흰 글자 on 면색).

### 1.2 타이포그래피

| 역할 | 폰트 | 용도 | weight |
|---|---|---|---|
| Display(라틴) | **Righteous** | Hero·섹션 타이틀·CTA 라벨. 각진 BI 워드마크 정합. 라틴 전용 | 400 |
| Body / UI | **Poppins** | 본문·버튼·입력·네비·카드 | 300–700 |
| Data | **Chakra Petch** | 수치·금액·주소·카운트다운·차트축. `tabular-nums` 필수 | 400/500/600 |
| CJK 본문 | **Pretendard**(KO) / **Noto Sans JP**(JA) | 한·일 본문. Noto Sans KR 폴백 | 400–800 |
| CJK 디스플레이 | **Black Han Sans**(KO) / **Noto Sans JP 900**(JA) | KO/JA 타이틀(BI 각짐 정합용). ⚠️ 결정#7 실측 게이트 | 400/900 |

⚠️ **CJK 타이틀 BI 정합(medium 갭):** Pretendard ExtraBold는 라운드 휴머니스트라 BI '각진 기하' 톤과 이질적이다. KO/JA **타이틀**은 각진 CJK 디스플레이(Black Han Sans / Noto Sans JP 900 + 음수 자간)를 1순위 후보로 하고, **실측 비교 게이트**(결정#7) 통과 후 확정. 본문은 Pretendard/Noto 유지. Righteous는 **라틴 전용**(CJK에 강제 금지).

```css
html { font-family: var(--font-body); }
:lang(ko), :lang(ja) { font-family: var(--font-cjk); }
.font-display { font-family: var(--font-display); letter-spacing: -0.01em; }
:lang(ko) .font-display, :lang(ja) .font-display {
  font-family: var(--font-cjk-display); letter-spacing: -0.02em;
}
.tnum { font-family: var(--font-data); font-variant-numeric: tabular-nums; }
```

**혼용 규칙:** `lang` 속성으로 폰트 스택 자동 분기. 숫자는 언어 무관 Chakra Petch + `tabular-nums`(자릿수 점프 방지=CLS 안정). 카운트다운·차트축·금액 등 **data 폰트 영역도 `:lang()` 전파 검증**(§5.4).

**타입 스케일**

| 토큰 | size(clamp) | line-height | weight | 폰트 |
|---|---|---|---|---|
| `display-hero` | `clamp(56px, 9vw, 120px)` | 0.92 | 400 | Righteous |
| `display-1` (h1) | `clamp(40px, 6vw, 72px)` | 1.0 | 400 | Righteous |
| `display-2` (h2) | `clamp(32px, 4.5vw, 52px)` | 1.05 | 400 | Righteous |
| `heading-3` (h3) | `clamp(22px, 2.5vw, 30px)` | 1.15 | 600 | Poppins |
| `body-lg` / `body` / `body-sm` | 18 / 16 / 14px | 1.6 | 400 | Poppins |
| `label` (SectionLabel) | 12px / `0.16em` / UPPERCASE | 1.4 | 600 | Chakra Petch |
| `data-xl` (금액 대형) | `clamp(28px, 4vw, 44px)` | 1.0 | 600 tnum | Chakra Petch |

> ccm `Heading`/`SectionLabel` 구조는 재사용하되, `font-display` 매핑(Space Grotesk→Righteous), accent(`italic-moss`→`--brand`, **italic 미사용·각진 글리프**), SectionLabel 색(`text-moss`→§1.0a 분기)으로 교체. ⚠️ 실측: SectionLabel은 `var(--ink-soft)`이고 active 강조만 moss → 강조처만 brand로.

### 1.3 스페이싱 · 반경 · 엘레베이션

**스페이싱:** 8px 베이스 `4·8·12·16·24·32·48·64·96·128`. 섹션갭 48px+ 강제. 랜딩 섹션 수직 패딩 desktop `120px` / tablet `80px` / phone `56px`. portal 컨테이너 `max-w-5xl mx-auto px-6 md:px-14 py-10 md:py-14`(ccm `Layout`). 랜딩 앵커에 `scroll-snap-align: start` + nav 높이만큼 `scroll-margin-top`.

**반경:** ccm은 sharp(radius 0). ASSA는 엔터 톤을 위해 소폭 라운드 도입하되 wave/▶의 각진 기하와 대비.

| 토큰 | 값 | 용도 |
|---|---|---|
| `--radius-sm` / `md` / `lg` | 6 / 10 / 16px | 입력·배지 / 버튼·카드 / 모달·히어로 카드 |
| `--radius-pill` | 999px | 티어 칩·필터·프로그레스 트랙 |
| `--radius-none` | 0 | wave 라인·▶ 클립패스·데이터 테이블(`HairlineTable` 계승) |

**엘레베이션 (다크 우선 — 표면 단계 + 1px rule, glow 절제)**

| 토큰 | 다크 | 라이트 |
|---|---|---|
| `--elev-1` (카드) | `surface` + `1px rule` | `0 1px 2px rgba(15,23,42,.06)` |
| `--elev-2` (드롭다운) | `surface-2` + `1px rule` | `0 4px 16px rgba(15,23,42,.10)` |
| `--elev-3` (모달) | `surface-2` + `0 0 0 1px rule` + 백드롭 | `0 12px 40px rgba(15,23,42,.16)` |
| `--glow-brand` | `0 0 24px rgba(239,37,37,.28)` (CTA hover·재생 한정) | 미사용 |

> 글래스(반투명+blur)는 **nav 배경·모달 백드롭**에만 한정(AI 슬롭 회피).

### 1.4 모션 토큰 + reduced-motion (CSS + JS 훅 병행 — high 갭)

```css
@theme {
  --ease-out:   cubic-bezier(0.16, 1, 0.3, 1);
  --ease-inout: cubic-bezier(0.65, 0, 0.35, 1);
  --dur-fast: 150ms; --dur-base: 220ms; --dur-slow: 320ms;
  --dur-wave: 1600ms;  /* wave 흐름·▶ 펄스 장식 루프 */
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important; animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important; scroll-behavior: auto !important;
  }
}
```

- ⚠️ **CSS 리셋만으로는 JS 애니메이션이 안 멈춘다.** ccm은 `useReducedMotion()` 훅(`matchMedia` 구독)을 보유하고 `AllocationRing` 등 라이브 컴포넌트가 이를 구독한다(실측). ASSA의 **모든 JS/rAF/`setInterval` 구동 모션**(`WaveLines`·`PlayGlyph`·`FanNetwork`·`CountdownTimer`·BME 라이브 집계·세일 진행바 펄스)은 **`useReducedMotion()`을 구독해 루프를 가드**한다. CSS 리셋은 보조 안전망.
- hover는 색/보더/`translateY(-2px)`만 — **레이아웃 시프트 금지**. 그림자/글로우는 transition 대상 분리(리플로우 차단).
- 섹션 reveal: `IntersectionObserver` `opacity 0→1 + translateY 16→0`, 1회성.
- 카운트다운 정보 갱신(숫자 변화)은 유지(애니메이션 아님), 점멸만 reduced-motion에서 off.

### 1.5 아이콘 + wave/▶ 모티프 시스템

**아이콘:** `lucide-react` 단일(stroke 1.6–2.0, 24px, `currentColor`). 이모지 전면 금지. 표준 매핑: 지갑=`wallet`, 세일=`coins`, 베스팅=`calendar-clock`, 락=`lock`, veASSA 파워=`zap`, 복사=`copy`/`check`, 탐색기=`external-link`, 경고=`alert-triangle`, 성공=`check-circle`, 반피싱=`shield-alert`, 소각=`flame`, 재생=`play`.

**wave/▶ 브랜드 데이터비주얼** (ccm `SignalPlot`/`NodeNetwork` 대체. CSS 변수 라우팅·`aria-hidden`·viewBox 패턴 계승, **단 데이터색은 `--data-*`**):

| 컴포넌트 | ccm 출처 | ASSA 적응 |
|---|---|---|
| `WaveMark` | `Wordmark`(SVG path) | logo01.png 실측 글리프 = **path 그룹 ① 온전한 ASSA ② 좌측 독립 3줄 wave 스트라이프**. `brand`/`ink` 2색, `currentColor` 추적 |
| `MarkSymbol` | (신규, 3197611bd3cf6.png) | **▶+wave 심볼**(앱 아이콘·OG·favicon·로딩). 코랄 ▶ + wave 진입 |
| `WaveLines` | `SignalPlot` | 3줄 사인 wave. `stroke-dashoffset` 흐름(`--dur-wave`, **훅 가드**). 구분선·배경. 데이터 라인은 `--data-1` |
| `PlayGlyph` | (신규, BI ▶) | clip-path/SVG ▶ 삼각형. CTA 프리픽스·로딩 스피너. `--radius-none` |
| `FanNetwork` | `NodeNetwork` | 팬·노드 연결망(중앙 허브='ASSA'). 스테이킹/노드 섹션. 노드색 `--data-*` |

모든 모티프 SVG는 `aria-hidden="true"` + 브랜드/잉크/rule/**data** 변수만 사용(테마 자동 추적). 활용: 섹션 구분선(WaveLines 1px), 히어로 배경(저대비 wave opacity≤0.12), 로딩(PlayGlyph 펄스), CTA 좌측 ▶, scroll-snap 진입 reveal.

### 1.6 컴포넌트 프리미티브 (요약 — 실재/신규 구분은 §4)

⚠️ **'재사용'은 실측 기준으로 제한**(비평 high 갭). ccm 실재 프리미티브(`portal/src/components/site/primitives.tsx`)는 **`Card`/`CTA`(primary·ghost만)/`Stat`/`SectionLabel`/`H1~H3`/`Lede`/`DefRow`** 뿐이다. **Button 변형(secondary/gold)·Input·Badge·Step·Toast·ProgressBar·WalletButton·focus 링·44px는 ccm에 부재 → 신규**. 공통 신규 DoD: 44px 최소 타깃, `:focus-visible` 링, `disabled` opacity 0.5, **상태 6종(default/hover/focus/disabled/loading/error)**.

---

## 2. 정보구조(IA) & 사이트맵 & 내비게이션

### 2.0 IA 거버넌스 — 결정 요약

| 결정 | ccm 실제(실측) | ASSA 채택 | 근거 |
|---|---|---|---|
| **앱 분리** | site/portal/admin/testnet 4앱 | **동일 4앱** | 보안등급·배포주기·번들 분리 |
| **Sale 위치** | `portal/pages/Sale.tsx`(dApp) | **portal 유지** | 세일=지갑·KYC·트랜잭션 → dApp 보안 컨텍스트 |
| **라우트 형태** | **Layout 중첩 라우트 + 1단 평탄 URL** | **동일 패턴** (스펙 `/app/stake` 2단 → portal `/stake` 1단) | ⚠️ ccm은 `<Route element={<Layout/>}>` **중첩**으로 셸 공유. 차이는 URL 깊이(1단)일 뿐 — '중첩 Layout 불필요'가 아니라 '셸은 중첩, URL은 1단' |
| **서브도메인** | `*.ccmnetwork.net` | `assawave.io`/`app.*`/`admin.*`/`testnet.*` | 쿠키·세션·CSP 경계, 반피싱 정확도메인 |
| **테마 기본** | site 토글·portal/admin force dark | **다크 기본 + 라이트 토글**(site), portal/admin 다크 | 파운데이션 |

> ⚠️ **반피싱 IA 불변식:** 공식 도메인 `assawave.io` **단일**, 방어 도메인(`.ai`/`.net`/유사)은 301. SIWE `ALLOWED_DOMAINS`는 와일드카드 금지·정확집합. 전 앱 푸터·세일 화면에 "공식: assawave.io" 상시 배너.

### 2.1 전체 사이트맵 (4앱)

```
assawave.io ── 마케팅 (site / frontend)  ── 공개·SEO·라이트 토글
├─ /                  랜딩 — 앵커드 단일 스크롤 (AnchorNav)
│   └ #hero #manifesto #solution #tokenomics #sale #market
│     #mining #roadmap #team #faq
├─ /whitepaper        백서 (LegalLayout)
├─ /terms /privacy /disclaimer   법무 (LegalLayout)
├─ /tokenomics → /#tokenomics    레거시 앵커 리다이렉트
├─ /roadmap   → /#roadmap        레거시 앵커 리다이렉트
└─ /sale → app.assawave.io/sale  (외부 CTA, 포털로)

app.assawave.io ── dApp (portal)  ── 지갑·SIWE·다크 기본
│   Layout(앱셸 + RainbowKit Connect + 네트워크가드) 중첩 라우트 · 1단 평탄 URL
├─ /          Home (포트폴리오 개요)
├─ /sale      Token Sale   ★ 세일은 여기 (마케팅 아님)
├─ /dashboard Dashboard (잔액·claimable·락업 요약·BME 소각 추이)
├─ /vesting   Vesting (카테고리 스케줄·곡선·Claim)
├─ /stake     Lock / veASSA (무이자 락업)  ★ 신규 (ccm migrate 자리 대체)
└─ /settings  Settings (locale·지갑·세션)
   ✗ /migrate  ccm 전용 — 제거

admin.assawave.io ── 운영 (admin)  ── CF Access + persona RBAC
├─ / TokenAdmin(index) · /tge SaleAdmin(TGE) · /vesting VestingAdmin
├─ /kyc KycAdmin · /timelock TimelockAdmin
├─ /staking StakingAdmin ★신규 · /bme BMEAdmin ★신규
└─ /e2e E2eSetup (!IS_MAINNET 게이트)

testnet.assawave.io ── 샌드박스 (testnet)  ── Base Sepolia
└─ / Playground (포털 미러 + 무료 민트·시간조작)
```

### 2.2 site (마케팅) 라우트 맵

**랜딩 = 앵커드 단일 스크롤.** ⚠️ ASSA 11섹션은 ccm 섹션의 **재배치(reorder)** 다 — ccm 실제 Earth.tsx 순서는 `Hero→Market→Trinity→Problem→WrapSim→Grades→Architecture→Mining→Tokenomics→Scenarios→Defi→Vs→Roadmap→Risks→Manifesto`(Manifesto가 **맨 끝**). ASSA는 아래로 재배열·일부 드롭:

| # | 앵커 | ASSA 섹션 | AnchorNav | ccm 원본(재배치/흡수) | 규모 |
|---|---|---|---|---|---|
| 1 | `hero` | Hero(아싸·wave·세일CTA·카운트다운) | — | `Hero` | M |
| 2 | `manifesto` | Manifesto/Problem | ● | `Manifesto`(원래 끝)+`Problem` ↑이동 | S |
| 3 | `solution` | Solution/Trinity(스트리밍·소비·노드) | ● | `Trinity` | S |
| 4 | `tokenomics` | Tokenomics(배분 도넛·BME·베스팅) | ● | `Tokenomics`(SVG 차트) | M |
| 5 | `sale` | Token Sale(3라운드·진행바·카운트다운) | ● | 신규(SVG 라이브 패턴 차용) | M |
| 6 | `market` | Market/Scenarios(TAM·MAU·시나리오) | ● | `Market`+`Scenarios` | M |
| 7 | `mining` | Mining(Phase 2 개요) | — | `Mining` | S |
| 8 | `roadmap` | Roadmap(M1~M5) | ● | `Roadmap` | S |
| 9 | `team` | Team & Partners(MagicSing) | — | 신규(`Grades`/`Vs` 그리드 패턴) | S |
| 10 | `faq` | FAQ | — | `Risks`(아코디언) | S |
| 11 | — | 공식 도메인 배너 + Footer | — | `SiteFooter` | S |

**드롭/흡수(의도):** `WrapSim`·`Grades`·`Architecture`·`Defi`·`Vs`는 ASSA에서 드롭하거나 Tokenomics/Team 섹션에 흡수. ccm `/defi`·`/markets`·`/ccmine` 라우트는 제거. `AnchorNav items`=`[매니페스토, 솔루션, 토크노믹스, 세일, 마켓, 로드맵]`(과밀 방지 6개). ccm IntersectionObserver active 추적은 계승하되 활성 하이라이트는 §1.0a 분기로 brand. 레거시 앵커는 `<Navigate replace>`.

### 2.3 portal (dApp) 라우트 맵

**Layout 중첩 라우트 + 1단 평탄 URL.** `<Route element={<Layout/>}>`(PortalNav+Connect+Footer 셸) 하위에 1단 라우트.

| 라우트 | 페이지 | ccm 소스 | action(실측 기준) |
|---|---|---|---|
| `/` | Home | `portal/pages/Home` | 재사용+토큰 audit |
| `/sale` | Token Sale | `Sale.tsx`(815줄) | ⚠️ **회계 재작성 fork**(§3.2, claim 분리·게이팅 결정 선행) |
| `/dashboard` | Dashboard | `Dashboard.tsx` | 재사용+적응(StatCard는 로컬 정의→프리미티브화) |
| `/vesting` | Vesting | `Vesting.tsx`(215줄) | 재사용+적응(에러 처리 신규) |
| `/stake` | Lock/veASSA | **신규**(패턴만 차용) | 신규 |
| `/settings` | Settings | `Settings.tsx` | 재사용 |

**PortalNav 변경:** ccm 대비 `migrate` 제거, `stake` 추가. **네트워크 가드**: ccm `wagmi.ts`+`env.ts` 빌드타임 단일체인 핀(`IS_MAINNET`→8453/84532)으로 잘못된 체인 트랜잭션 구조적 차단.

### 2.4 admin (운영) 라우트 맵 + persona RBAC

ccm admin은 **persona 기반 RBAC**(`lib/personas.ts`)를 채택 — 그대로 승계. 4계층 방어: ① CF Access ② persona UI(무관 탭 숨김·write 비활성) ③ portal-api SIWE audit log ④ 온체인 RBAC.

| 라우트(실측 경로) | 페이지 | ccm | persona |
|---|---|---|---|
| `/`(index) | TokenAdmin | 재사용 | super_admin·read_only |
| **`/tge`** | SaleAdmin(TGE) | `TgeAdmin` | super_admin·treasury·read_only |
| `/vesting` | VestingAdmin | 재사용 | super_admin·compliance·read_only |
| `/kyc` | KycAdmin | 재사용 | super_admin·compliance·read_only |
| `/timelock` | TimelockAdmin | 재사용 | super_admin·treasury·read_only |
| `/staking` | StakingAdmin | **신규** | super_admin·treasury |
| `/bme` | BMEAdmin | **신규** | super_admin·treasury |
| `/e2e` | E2eSetup | 재사용 | `!IS_MAINNET` 게이트 |

⚠️ **실측 정정:** ccm 세일 라우트는 **`/tge`**(`/sale` 아님). ASSA가 `/sale`로 rename하려면 명시적 결정으로 기록. **신규 `/staking`·`/bme`는 `PERSONA_ROUTES.treasury`·`PERSONA_WRITES.treasury` 두 맵에 키 추가가 선행 작업**(현재 키 부재 — 추가 없으면 treasury 접근 불가). persona 정의(실측): `super_admin`(전권) / `treasury`(Token·TGE·Timelock·**+Staking·BME**) / `compliance`(KYC·Vesting, 자금이동 불가) / `read_only`(view). `Layout`이 `canViewRoute`로 nav 필터. ⚠️ DEVELOPMENT_PLAN 결정#14: ccm 공유 Bearer 단일점 → **Safe 멤버 SIWE 격상**(Phase1 필수).

### 2.5 내비게이션 시스템 종합

| 내비 | 위치 | 앱 | 동작 |
|---|---|---|---|
| **SiteNav** | 상단 sticky | site | 앵커+실라우트 혼합, 포털 CTA(external), 언어셀렉터, ThemeToggle, 모바일 드로어(Esc·scroll lock·44px 햄버거) |
| **AnchorNav** | SiteNav 하단 `top-[64px]` | site | 인페이지 앵커, IntersectionObserver 활성추적, 모바일 가로스크롤. ⚠️ active는 색+**굵기/언더라인 2px+`aria-current`**(색 단독 금지, high 갭) |
| **PortalNav** | 상단 sticky | portal | 1단 NavLink + Connect, TESTNET 배지(`!IS_MAINNET`) |
| **admin Layout nav** | 상단 sticky | admin | persona 필터 NavLink + Connect + Safe/Persona/E2e 배지 |

**브랜드:** `WaveMark`(logo01.png 실측 글리프) 전 앱 nav 좌상단 공유. **`MarkSymbol`**(심볼)은 favicon·OG·로딩.

---

## 3. 페이지별 디자인 기획

### 3.1 Landing (site, `/`)

**패턴:** ccm 앵커드 단일 스크롤 재배치. 라우트 셸·SEO/OG·i18n·법무·SVG 차트 프리미티브는 패턴 fork, 섹션 콘텐츠/카피/색만 ASSA로(§1.0a audit 거침).

**SiteNav 구조:**
```
[ ▶ASSA WAVE | K-POP · WEB3 ]  세일 토크노믹스 로드맵 백서  [앱 열기 ↗] [KO▾] [◐]
```
좌측 `WaveMark` + 캡션(ccm "Carbon Credit" 자리). NAV_ITEMS=앵커(`/#sale` 등)+실라우트(`/whitepaper`). APP CTA=`app.assawave.io`(external, hover 시 `--brand-pressed` 채움·흰 글자 AA). 추가: 언어셀렉터(KO/EN/JA) + ThemeToggle. ccm `CarbonPriceBadge` 슬롯 → 세일 카운트다운 마이크로 배지(라운드 진행 중에만).

**섹션별 톤·비주얼 (위=Vibrant, 아래=절제):**

- **1. Hero** (2-컬럼 `1.4fr/1fr`): 좌=`Heading h1` pre `"K-pop을 소유하는"` / em `"새로운 물결, ASSA WAVE"` + 리드 + CTA 2개(`세일 참여 ↗` `--brand-pressed` 채움 / `백서 보기` 아웃라인). 우=세일 카운트다운 카드(Righteous 84px `D-12:04:33:17` tnum + 2-칼럼 stat). 배경=▶ 좌→우 진행 + wave 3줄 흐름 SVG(`WaveLines`, 데이터색 `--data-1`, `useReducedMotion` 가드, opacity≤0.12). 마이크로 카피 '아싸 = 무대의 주인공'.
- **2. Manifesto/Problem**: 풀폭 선언문 → 3-칼럼 문제 블록(스트리밍 수익 미환류 / 팬 노동 무보상 / 중앙화 종속). wave 구분선. 톤=단호.
- **3. Solution/Trinity**: `FanNetwork`(NodeNetwork 적응). 스트리밍(WAVE)·소비(소각)·노드(채굴) 3축이 $ASSA 중심 순환, 공급↔수요 균형 화살표. 노드색 `--data-*`. 톤=구조적.
- **4. Tokenomics** (ccm SVG 차트 패턴 fork): `AllocationRing`(배분 도넛, hover 테이블 동기, **세그먼트색=`--data-*`/`--coral`/`--gold`, 브랜드 레드 미사용**) · 누적 소각량 라이브(`ValueAccrualLive` SVG 패턴) · 무이자 락업/소비 소각 2카드(**이자 없음 명시**) · `VestingTimeline`(카테고리별 TGE/cliff/linear). 톤=데이터·Hairline.
- **5. Token Sale**: 3-라운드 카드, 단가·캡·진행바·종료타이머·베스팅 요약. 활성 라운드 brand 보더+글로우. CTA→`app.assawave.io/sale`. 가드 카피(KYC·US/CN 제한·USDC·공식 컨트랙트). 인라인 반피싱 마이크로 배너. 톤=신뢰·투명.
- **6. Market/Scenarios**: 지표 스탯 밴드(TAM·install·MAU) → 수요/공급 시나리오 라인·영역. ⚠️ site 마케팅 차트도 **ccm SVG 패턴 fork 우선**(Recharts는 신규 의존성, §결정#8). 톤=투자자 데이터.
- **7. Mining**(Phase 2): 노드 채굴·front-loaded emission·auto-stake 개요. **"Phase 2" 배지**. 1-스크린.
- **8. Roadmap**: M1~M5. 현재 단계 brand 마커.
- **9. Team & Partners**: 팀·자문 그리드 + MagicSing 연계 + 파트너 로고 row(그레이스케일, hover 컬러). **얼굴 이미지 스크래핑 금지**(제공 자산만).
- **10. FAQ**: 아코디언(세일 방법 / KYC·지역 / **무이자 스테이킹이란** / 유틸리티 / 컨트랙트 안전성).
- **11. 공식 도메인 배너(반피싱) + Footer**: §3.1.5.

**공식 도메인 배너(상시):** Footer 직전 풀폭(Layout 레벨, 전 페이지). `⚠ 공식 도메인은 assawave.io 단 하나. .ai/.net·DM·에어드랍 링크 세일은 전부 사칭. 컨트랙트 0xASSA… [복사]`. 빌드핀 `IS_MAINNET`·`ALLOWED_DOMAINS`(정확집합) 정합. `role="note"`. 아이콘 `shield-alert`. 레드는 이 배너에 한정.

**SEO/i18n:** `['ko','en','ja']`, ko 기본. `react-helmet` title/description/canonical(`assawave.io`)/`hreflang`/sitemap. OG=`MarkSymbol`(▶wave) 다크 캔버스. LCP<2.5s(Hero 폰트 preload, 아래폴드 `React.lazy`).

### 3.2 Token Sale (portal, `/sale`)

⚠️ **컨트랙트 2모델 명시 (critical 갭).** ccm Sale은 '재사용'이 아니라 **회계 재작성 fork**다(DEVELOPMENT_PLAN WS1.4: claimable 재작성·Pausable 신규·게이팅 결정).

| | **ccm 실측 ABI**(`Sale.tsx`) | **ASSA 스펙 목표 ABI** |
|---|---|---|
| 구매 | `purchase(roundId, amount)` | `buy(roundId, assaAmount, proof[])` |
| 클레임 | `claim(roundId)`(self-contained 베스팅) | 외부 `TokenVesting` 적재 |
| 게이팅 | 온체인 `whitelist[round][addr]` **boolean read** | Merkle `proof[]` + `merkleRoot` |
| Round 구조체 | `{priceUsdc, hardCapTokens, soldTokens, cliffSeconds, vestSeconds, startTime, endTime, active}` | `{…, priceUsdcPerAssa, merkleRoot, tgeBps, cliff, duration}` |
| TGE | 없음(cliff/vest만) | `tgeBps`(0/500/1000) |

⚠️ **모델 미확정(결정 #4·#10)을 본문에서 기정사실로 그리지 않는다.** 아래 UI는 **ASSA 스펙 모델 채택 시** 기준이며, ccm 모델 유지 시 proof-fetch UI를 그리지 않는다(결정#10 권고=per-round whitelist 유지).

**5계명:** ① 신뢰 최우선(서명 직전 무엇/누구/얼마). ② 무한승인 금지(✅ ccm `approve(sale, usdcRequired)` 정확금액, `MaxUint256` 미사용 — **이미 충족, 유지**). ③ 주소 하드코딩+verified+반피싱 상시. ④ 온체인이 진실원천(인덱서로 그리되 서명 직전 RPC 재확인). ⑤ 레드=CTA(배경은 `--brand-pressed`), 골드=티어, 진행=coral, 위험=#DC2626.

**페이지 구조 (스크롤):**
```
AntiPhishingBanner (sticky) → SaleHeader(글로벌 카운트다운·환경배지)
→ GateChecklist(지갑→Base→지역→KYC 4단계) → RoundCards(R1/R2/R3)
→ PurchasePanel(USDC 입력→approve→buy 2단계) → MyAllocations
→ ContractVerifyFooter → TxToast/Drawer
```

**진입 게이트 (순차 잠금):** 앞 단계 미충족 시 라운드/구매 카드는 흐리게(blur 2px+잠금 아이콘), 현재 단계만 하이라이트.

| # | 스텝 | 상태색 | 미충족 액션 |
|---|---|---|---|
| 1 | 지갑 연결 | 완료 Green / 현재 Coral | RainbowKit 모달 |
| 2 | Base 네트워크 | — | `switchChain(8453)` 원클릭 |
| 3 | 지역 확인(US/CN) | — | 차단 화면 |
| 4 | KYC 인증 | — | Sumsub/Persona 위젯 |

> **완료=Green / 진행중=Coral / CTA=brand-pressed**(레드 통일 금지, WCAG·의미 혼동 방지). 각 스텝 색+아이콘+텍스트.

**KYC 게이팅:** ⚠️ **ccm 실측 = 온체인 `whitelist[round][addr]` boolean read**(proof 백엔드 발급 경로 없음, DEVELOPMENT_PLAN도 명시). 따라서:
- **ccm 모델 유지(결정#10 권고):** `whitelist(round, addr)` boolean으로 라운드별 게이팅. proof-fetch UI 없음.
- **ASSA 스펙 모델 채택 시(신규):** `GET /sale/allowlist/:addr` proof 발급 → `buy()` 주입. 상태별: `미인증`/`심사중`(coral 스피너)/`승인`(green)/`반려`(destructive)/`라운드 외`(coral, 해당 라운드만 잠금).

**RoundCards:** ccm `RoundRow`(가로행) → 3병렬 카드(desktop 3컬럼/tablet 2+1/mobile scroll-snap 캐러셀).

| | R1 Private | R2 Strategic | R3 Community |
|---|---|---|---|
| 단가(KRW 동결) | 30원 | 50원 | 70원 |
| tgeBps(스펙) | 0 | 500(5%) | 1000(10%) |
| cliff | 6m | 3m | 0 |
| duration | 18m | 12m | 6m |

> 단가는 KRW→USDC 동결 `priceUsdc`(실측 6dec)가 진실원천. 화면엔 "30원(고정)" 1차 + USDC 환산 보조 + "환율 변동에도 라운드 USDC 단가 불변" 툴팁.

카드 구성: 라운드번호+상태칩(예정 gold/LIVE coral 점멸/마감 muted) → wave divider → 단가(Righteous 대형) → 진행바(`pct = soldTokens*10000/hardCapTokens` 실측 계산, brand fill, 95%+ "마감 임박" gold, 100% SOLD OUT 회색) → 베스팅 칩(TGE/Cliff/Linear) → 카운트다운(Chakra Petch tnum 1s) → [화이트리스트✓][이 라운드 선택]. 선택 카드=brand 보더+미세 글로우.

**PurchasePanel (신규 — 상태머신·PreSign·Step은 ccm에 부재):**
- 입력 2축 토글: ASSA→USDC / USDC→ASSA. `usdcRequired = amount*priceUsdc/1e18`(실측 식). MAX 버튼(잔액·잔여캡·한도 최솟값). 실시간 grid 3칸(`Stat` 재사용): 내 USDC 잔액·세일 allowance·충족 여부.
- **2단계(Step, 신규):** ① `approve(sale, 정확 usdcRequired)` — **"이번 구매분만, 무제한 승인 아님"**(ccm 카피 "One-time per amount" 계승) ② `purchase`/`buy`. allowance≥required면 ① 자동 done.
- **서명 전 확인 카드(`PreSignReview`, 신규, 인라인):** 라운드·받을 ASSA·지불 USDC·받는 곳(`CopyableAddress withExplorer` verified)·베스팅·예상 가스. **"슬리피지 0(고정가)" 명시**(슬리피지는 BME/DEX 한정, 세일 무관 한 줄). [취소][서명하고 구매].
- **TxState(신규 상태머신):** idle→pending(서명대기)→confirming(컨펌·Basescan)→success(green 영수증)/fail(destructive). ⚠️ **상태 전이 `aria-live="polite"`로 스크린리더 안내**(서명 대기/컨펌/성공·실패, high 갭). **에러 디코딩 맵(신규, i18n):** ⚠️ ccm 실측은 `writeError.message.slice(0,280)` 영문 원문을 하드코딩 `#ef4444`(브랜드 레드 근접)에 노출 → **전면 교체**: merkle/whitelist→"화이트리스트·KYC 자격 확인", cap→"잔여 한도 초과", paused→"일시정지", user rejected→**조용히 neutral**(에러 아님). 색=`--destructive` 토큰 + `alert-triangle` + 텍스트 라벨 3중 + `role="alert"`. 인라인 `#ef4444`/rgba 하드코딩 전수 제거.

**MyAllocations:** 라운드별 배정 카드 + 영수증(tx hash·Basescan) + 베스팅 진행률 + §6 곡선 `now` 마커. ⚠️ **claim은 /vesting으로 라우팅.** 실측: ccm `claimable`/`claim` 로직이 Sale.tsx 핵심부에 깊게 박혀 있어(L143~262), 이를 떼어 Vesting으로 옮기는 것은 '적응'이 아니라 **claim 분리 재구조화(중간 규모 신규)** 이며, **베스팅 인덱싱 모델(결정#4) 확정의 후행**이다. 세일 화면엔 "베스팅 일정 보기" 링크만.

**가드 화면:** 미연결·잘못된 네트워크·지역 차단·세일 미배포(카운트다운+알림)·testnet 배지.

### 3.3 Dashboard (portal, `/dashboard`)

ccm `Dashboard.tsx` StatCard 골격(⚠️ StatCard는 로컬 정의 → 공유 프리미티브화) + **veASSA 요약 + BME 소각 추이** 추가.

```
PortalNav → main(max-w-5xl)
├ ① KPI 4 StatCard: ASSA 총잔액 · Claimable(green 강조) · veASSA 파워(gold) · 다음 언락(D-day)
├ ② 좌(2/3) 포지션 도넛 | 우(1/3) 분해 리스트
├ ③ BME 소각 추이 (full-width 라인/에어리어)
├ ④ 거래내역 테이블 (인덱서 페이지네이션)
└ ⑤ 빠른 액션 (Claim으로 · Lock으로 · 토큰 지갑추가)
```

- **KPI:** 라벨=Chakra Petch mono, 값=`data-xl` tnum. Claimable>0이면 **Green** 글로우 보더. veASSA=Gold 액센트. 다음 언락 7일 이내 Gold 펄스(훅 가드). **레드 강조 금지**(Green=액션 가능, Gold=프리미엄).
- **포지션 도넛:** SVG(ccm AllocationRing 패턴) 또는 Recharts(신규, 결정#8). 4 세그먼트(Liquid `--data-2` / Vesting-locked `--coral` / veASSA-locked `--gold` / Claimable `--positive`). **브랜드 레드 미사용.** 슬라이스≤5·라벨 직접·범례+값+패턴 병기. ⚠️ **데이터 테이블 동봉(`HairlineTable`, sr-only/토글)·`figure role="img" aria-label` 요약**(차트 색 단독 금지, medium 갭). 중앙 홀 총합 tnum.
- **BME 소각 추이:** AreaChart, `BMEBurner.Burned` 인덱서 집계. 소각=감소라 `--destructive`/`--coral` fill 허용(단 toast/error 레드와 시각 거리 확보·키보드 포커스 툴팁). 상단 토큰: 총소각·소각률·최근 30일.
- **거래내역:** `HairlineTable`. Time·Type(Purchase/Claim/Lock/Withdraw/Burn)·Amount(tnum)·Tx(Basescan). empty state.
- **데이터 원칙:** 인덱서 우선, 핵심 수치(Claimable·veASSA power) 온체인 교차검증. 지연 시 "온체인 기준 N초 전" 라벨.

### 3.4 Vesting (portal, `/vesting`)

ccm `Vesting.tsx`(215줄) 골격 + **타임라인 라인차트** + **에러 처리 신규**.

- **데이터:** ⚠️ **베스팅 인덱싱 모델 확정 선행(결정#4).** ccm/CCMVesting은 id-indexed(`scheduleIdsOf`→`schedules(id)`+`releasable(id)`), 스펙은 `releasable(address)`. self-contained 유지 시 `claimable(roundId,addr)` 루프. **확정 전 Dashboard/Vesting 착수 금지.**
- **스케줄 카드:** H3 "Schedule #id" + 카테고리 태그(gold)·revocable(coral)·revoked(**destructive #DC2626**) + 진행바(Green fill on rule track) + Field grid(Total·Released%·Claimable green·TGE 언락·Cliff 종료일·완전베스팅일) + CTA "Claim X ASSA"(claimable>0 & !revoked). **`tgeBps>0`이면 "TGE 5% 즉시 언락"** 보조 라벨.
- **타임라인 라인차트(신규):** X=now→fullyVested, Y=누적 unlocked. TGE 점프→cliff 평탄→linear→100%. **현재 시점 수직 마커.** vested=solid Green, 미래=dashed. 다중 스케줄 토글. **데이터 테이블 동봉·aria-label.**
- **상태(신규):** writeError→**디코딩 후** `--destructive` 박스(⚠️ 실측 L160 `writeError.message.slice` 영문덤프·`#ef4444` 교체)+`role="alert"`, 성공→green, empty→"베스팅 일정 없음"+/sale 링크.

### 3.5 Lock / veASSA (portal, `/stake`) — 무이자 락업

> ⚠️ **1순위 제약: "이자 없음" 오해 방지.** 스펙 불변식 5("StakingLock은 reward 분배 경로 부재"). ccm migrate 자리 대체 **신규 페이지**. **라우트 `/stake` 유지하되 페이지 H1·nav 라벨은 "Lock / veASSA"** 로 통일("Stake=수익" 연상 차단, medium 갭).

**No-Yield 고지(필수, 닫기 불가, 폼 위 DOM 우선 배치, `role="note"`):**
> **이 락업은 이자(APY/보상)를 지급하지 않습니다.** ASSA를 잠그면 **veASSA 가중치**(랭킹·거버넌스·티어)를 얻습니다. 토큰을 추가 발행하지 않으며 만기 후 **원금만** 출금. (전송 불가·시간 경과 가중치 감쇠)

- 시각: info 톤(Gold/중립 보더 + `info` 아이콘) + **색과 독립적인 텍스트 라벨 '보상 없음'**(스크린리더·색맹 전달, medium 갭). **레드 경고색 금지**(위협 아니라 사실). CTA 라벨 "Stake & Earn" 금지 → **"Lock for veASSA"**. "예상 APY: **0%(의도된 설계)**" 항상 병기.

**락 생성 폼:** 스펙 `lock(amount, duration)` max 4y. approve→실행 2-Step.
```
금액 입력(MAX) + 기간 프리셋(1w·1m·3m·6m·1y·2y·4y 하드캡)
→ 미리보기(종료일·초기 veASSA = amount×(lock/MAXTIME)·예상 티어·감쇠 미니그래프)
→ Step1 Approve(정확 금액만, 무한승인 금지) → Step2 Lock for veASSA
```

**veASSA 시간감쇠 곡선:** X=오늘→만기, Y=veASSA. `weight = amount×(lockRemaining/MAXTIME)` 우하향. 현재 마커 + "오늘 X→만기 0". **연장 시뮬:** `increaseUnlockTime`/`increaseAmount` 슬라이더로 곡선 이동(before dashed, after solid). **티어 임계선(Gold 수평선)** + "티어 유지 마지노선 날짜". 데이터색 `--data-*`/`--gold`. **데이터 테이블 동봉·aria-label.**

**내 락 목록:** 락 카드마다 원금·종료일·현재 veASSA(감쇠)·티어(Gold 배지)·감쇠 미니그래프 + 액션(기간 연장·금액 증액[정확 approve]·출금[만기 후만, 만기 전 비활성+"X일 후"]). **조기출금/패널티 없음(원금만)** 카피 명시. "veASSA 전송 불가" 칩.

### 3.6 Wallet & Auth (공통 셸 · 가드)

**비수탁** — 백엔드는 자금 미보유, 사용자 지갑 직접 서명.

- **연결:** RainbowKit(MetaMask·Coinbase·WalletConnect), 다크 캔버스 커스텀 테마(accent=`--brand`). **단일체인 핀**(빌드타임 `app`=8453/`testnet`=84532). 다른 체인 시 경고+"Base로 전환".
- **SIWE:** ccm `useSession`/`siwe.ts` 1:1. **온체인 읽기는 SIWE 불필요**(지갑 연결만으로 표시), SIWE는 오프체인 개인화(알림·KYC 상태)에만 → 마찰 최소화.
- **가드 상태:** 미연결 / 잘못된 네트워크 / 미인증 SIWE(개인화 한정) / KYC 미완(**Sale buy() 게이팅 전용**, 조회는 불요) / 지역 차단(US/CN). 반피싱 배너 전 가드 상시.
- **트랜잭션 UX:** 모든 write "무엇·어느 컨트랙트·정확히 얼마" 요약 후 서명, 무한승인 지양. 상태머신 + `aria-live`. 컬러: 성공 Green·실패 #DC2626·진행 coral·brand 레드는 CTA/소각 데이터 전용.

### 3.7 Admin · Phase 2·3 (개요)

- **Admin:** persona RBAC(§2.4, **신규 라우트는 personas.ts 두 맵 확장 선행**). 신규 `StakingAdmin`(veASSA 파라미터·MAXTIME) · `BMEAdmin`(소각·LP·가격소스 TWAP/Chainlink). 모든 write Safe 멤버 SIWE + audit. ccm admin 프리미티브 재사용(다크).
- **Phase 2(M4):** 소비 경쟁(`/compete` 소각 랭킹) · 노드 운영자(`/node` auto-stake) · NFT 마켓(ERC-1155) · MagicSing 연동. eventIndexer 부하 시 Ponder/Graph 재평가.
- **Phase 3(M5):** 거버넌스 포털(veASSA 투표) · All-Kill Pool/예측 마켓(VRF) · L3 전환(브리지 UI).

---

## 4. 컴포넌트 라이브러리

⚠️ **'재사용/신규' 라벨을 실측 코드 기준으로 정정**(critical/high 갭). **ccm 실재 프리미티브(`portal/src/components/site/primitives.tsx`)는 `Card`/`CTA`(primary·ghost만)/`Stat`/`SectionLabel`/`H1~H3`/`Lede`/`DefRow`** 뿐. Step·Field2·Toast·Badge·Tag·StatCard(로컬)·ProgressBar·WalletStatusBar·focus 링·44px·에러 디코딩은 **어느 앱에도 없음 → 신규**. 신규 컴포넌트 DoD: **focus-visible 링·44px hit-area·aria-live(상태)·색외지표·키보드·상태 6종(default/hover/focus/disabled/loading/error)**.

| 컴포넌트 | 변형 | 주요 상태 | 실재/신규(실측) |
|---|---|---|---|
| **Button** | `primary`(**bg=brand-pressed**, 흰 글자 AA, hover brand-hover+translateY-2px+glow) / `secondary` / `ghost` / `gold`(절제) | loading=PlayGlyph 펄스+`aria-busy`, disabled, **focus 링** | ⚠️ ccm=`CTA`(primary·ghost만). **secondary/gold·focus·min-h-44 신규** |
| **Card / Glass** | Card(`paper-deep`+1px rule) / Glass(`nav-bg`+blur, nav·모달만) | hover 보더 강조 | ✅ ccm `Card` 재사용(토큰 audit) |
| **Input/Select/Textarea** | 금액 입력(`font-data tnum`+`ASSA` 어드온, MAX 44px) | focus 링+brand 보더, error 보더 destructive+`alert-triangle`+메시지+`role=alert`, disabled | ⚠️ **신규**(ccm Field=Vesting 로컬 함수, Field2 없음) |
| **Badge** | 상태(positive/warning/destructive/coral/중립) `radius-pill` `font-data` | — | ⚠️ **신규**(ccm Tag 없음) |
| **Tier** | veASSA 등급(gold 보더+골드 면+`zap`, 상위 채도↑) | — | 신규 |
| **Modal** | `elev-3`+`radius-lg`, 백드롭 Glass, **focus-trap·Esc** | 진입 scale 0.98→1(훅 가드) | 신규 |
| **Nav** | SiteNav / AnchorNav / PortalNav | active=색+**굵기/2px 언더라인+aria-current**, sticky blur, 모바일 드로어 | ✅ 사이트 크롬 재사용(active 색외지표 보강) |
| **WalletButton** | 미연결(primary+wallet) / 연결(secondary+네트워크칩+주소칩) | 잘못된 체인=destructive "전환" | ⚠️ **신규**(RainbowKit 래퍼, WalletStatusBar 없음) |
| **Stat** | 라벨+값(`data-xl` tnum)+델타(positive/destructive+화살표) | — | ✅ ccm `Stat` 재사용(StatCard는 신규 추출) |
| **Step** | 수평/수직: 완료=positive+check, 현재=coral 보더+펄스, 대기=rule | Approve→Confirm→Receipt | ⚠️ **신규**(ccm Step 없음) |
| **ProgressBar** | 트랙 surface-2 + 필 brand(또는 brand→coral) `radius-pill` + tnum % | 펜딩=WaveLines 흐름(훅 가드) | ⚠️ **신규** |
| **Toast** | `elev-2`+상태 아이콘+4px 보더(positive/destructive/중립) | 자동 5s + `aria-live="polite"`, tx hash link | ⚠️ **신규** |
| **GateChecklist** | 4단계 스텝퍼 | done green / 진행중 coral / 대기 rule | 신규(Step 확장) |
| **VestingCurve / DecayCurve** | SVG/Recharts(TGE 점프·cliff·linear / veASSA 감쇠) | now 마커, vested solid·예정 dashed, **데이터테이블·aria-label, 훅 가드** | 신규 |
| **CountdownTimer** | `font-data tnum` `00d 00:00:00` | 서버시각 동기, 미동기 `--:--:--`, 점멸 reduced-motion off(**훅 가드**) | 신규 |
| **PreSignReview** | 인라인 확인 카드(주소·금액·베스팅·가스·슬리피지 0) | — | 신규 |
| **AntiPhishingBanner** | sticky 얇은 바, `role="note"` | 세션 1회 재노출 | 신규 |
| **CopyableAddress** | `shortAddress`+복사(copy→check 1.5s)+`withExplorer` | focus 링 | ⚠️ **토큰화 리팩터 필요**(아래) |
| **AddAssaToWallet** | `wallet_watchAsset` | — | ✅ ccm `AddCCMToWallet` 포팅 |

⚠️ **CopyableAddress 리팩터(high 갭, 실측):** ccm은 `bg-neutral-800/50`·`text-neutral-500`·`focus:ring-green-500` **하드코딩** → '무변경'과 양립 불가, 라이트 테마 미추적, 비브랜드 포커스색. 교체: `bg-neutral-800/50`→`var(--surface-2)`, `text-neutral-500/200`→`var(--ink-soft)`/`var(--ink)`, `focus:ring-green-500`→`:focus-visible outline var(--brand)`. 복사/탐색기 아이콘 버튼에 **44×44 투명 hit-area** 부여(실측 14px SVG). `withExplorer` aria-label 유지.

---

## 5. 반응형 · 접근성 · 성능 · i18n · 모션 · 구현 매핑

### 5.1 반응형 (375 / 768 / 1024 / 1440)

| 폭 | 레이아웃 |
|---|---|
| **375** | 1열. nav→햄버거 드로어(44px). site `px-6`, AnchorNav 가로스크롤. 세일 라운드=scroll-snap 캐러셀, GateChecklist 세로 아코디언, 구매패널 sticky 하단 CTA 바. 도넛 세로 스택 |
| **768** (`md`) | nav 인라인. 2열. `px-14`. 세일 입력+요약 2단 |
| **1024** | portal/admin `max-w-5xl`. 대시보드 3열. 세일 3컬럼+우측 베스팅 곡선 |
| **1440** | site Hero 와이드 여백. 콘텐츠 폭 상한 |

⚠️ **터치 타깃 44px = 신규 적용(계승 아님).** 실측: ccm CTA `px-4 py-2.5`+11px≈31px, CopyableAddress 버튼≈14~18px, 햄버거 36px, AnchorNav py-3≈33px — 전부 미달. 프리미티브 fork 시 `min-h-[44px]`(또는 py 상향) + 아이콘 버튼 44×44 투명 hit-area. **햄버거/복사/MAX/라운드칩 전수 점검(§7).** py 증가가 11px 라벨 비례를 깨므로 라벨 폰트 재검토. `inputmode="decimal"`. `scroll-snap`+`scroll-margin-top`(nav 64px).

### 5.2 접근성 (WCAG 2.1 AA)

- **대비(실측 반영):** 본문 4.5:1, 대형/UI 3:1. ⚠️ **흰 글자 on #EF2525=4.23:1 FAIL → Primary bg=brand-pressed.** 골드=액센트/보더만. 다크 `#0B0B14`+`#F8FAFC`.
- **포커스(신규):** ⚠️ ccm 프리미티브에 focus-visible **전무**. 전역 `:focus-visible{outline:2px var(--brand-on-dark);offset 2px}` 신규 도입 + 모든 interactive 프리미티브(버튼·링크·입력·라운드 카드·스텝·CopyableAddress)에 적용 게이트화. 라이트 포커스링=brand-pressed.
- **키보드:** Tab 도달·Esc 닫기·포커스 트랩(드로어·모달). 라운드 선택 roving tabindex.
- **시맨틱:** `<header>`/`<nav aria-label>`/`<main>`, h1→h2 위계. AnchorNav `aria-label`.
- **상태 전달(색 단독 금지 — 확장):** pending/success/fail은 색+Lucide 아이콘+텍스트. ⚠️ **내비 active·ProgressBar·티어·스테이크 완료까지 색외지표(굵기/언더라인/아이콘/`aria-current`) 강제.** 반피싱·No-Yield 배너 `role="note"`.
- **트랜잭션 aria-live(신규):** 금액·라운드·가스 음성 안내, 상태 전이 `aria-live="polite"`. user-rejected=neutral.
- **차트 a11y(신규):** 모든 데이터 차트 (1)동등 데이터 테이블(`HairlineTable`, sr-only/토글) (2)세그먼트 패턴/직접 라벨+값 (3)`figure role="img" aria-label` 요약 (4)키보드 포커스 툴팁. **'차트=색 단독 금지·데이터 테이블 동봉' 명문화.**
- **i18n a11y:** `<html lang>` 동적, 한국어 `word-break: keep-all`.

### 5.3 성능 (LCP < 2.5s)

- **코드분할:** `React.lazy`+`Suspense` 라우트 분할(portal Sale 815줄·차트). 랜딩 Hero 우선·하단 지연.
- **차트:** ⚠️ ccm 차트는 **전부 인라인 SVG(recharts 의존성 0)**. SVG 패턴 fork는 동적 import 불필요. Recharts 신규 도입 시(Dashboard 도넛·BME 한정) 동적 import.
- **스켈레톤:** 인덱서 조회 중 고정 높이 스켈레톤(CLS 0). ccm `ValueAccrualLive`·`TVLLive` SVG 패턴.
- **데이터:** 인덱서/D1 캐시 우선 + 온체인 검증. 직접 RPC는 트랜잭션 전송만.
- **에셋:** `WaveMark`/`MarkSymbol`/wave 인라인 SVG. 폰트 `font-display: swap`·서브셋(Righteous 라틴·Pretendard/Black Han Sans CJK). LCP=Hero 텍스트→폰트 preload. CLS: sticky nav 높이 고정·이미지 dimension 명시.

### 5.4 i18n (ko 기본 / en / ja)

⚠️ 실측: ccm 4앱 전부 `en` 단일(`supportedLngs:['en']`, `lng:'en'`). ASSA ko/en/ja는 **구조 재사용 + 콘텐츠 전량 신규(3언어×4앱 독립 인스턴스)** — '재사용+적응'보다 비용 큼.

- `i18n.ts` `supportedLngs:['ko','en','ja']`, `fallbackLng:'ko'`. 백엔드 `VALID_LANGS`에 ko/ja 신규.
- ccm 네임스페이스 패턴(`nav`/`vesting`/`earth` 등) → 앱별 `ko.json`/`en.json`/`ja.json` 1:1 미러.
- 폰트: Latin=Righteous/Poppins, CJK 본문=Pretendard/Noto Sans JP, **CJK 타이틀=각진 디스플레이(결정#7)**. ⚠️ `:lang()` 분기가 **카운트다운·차트축·금액 등 data 폰트 영역까지 전파되는지 검증 케이스 추가**.
- 로케일: KRW 30/50/70원 고정 + USDC 병기, `Intl` 일자·숫자, tnum.
- **다국어 검수 게이트(법무+보안):** "이자 없음" 고지·SIWE `APP_STATEMENTS`·반피싱 배너·**revert 에러 디코딩 문구** 3개국어.
- SEO i18n: `hreflang`·OG 다국어·언어별 sitemap.

### 5.5 모션 + reduced-motion

wave/▶ 모티프를 구분선·배경·로딩·CTA hover·진행바에 시스템화. hover 150–300ms, 섹션갭 48px+·scroll-snap. AI 슬롭 금지 — hover는 색·border·미세 transform만. ⚠️ **CSS 리셋 + `useReducedMotion()` 훅 가드 병행**(§1.4): CSS는 transition·CSS animation, 훅은 JS/`setInterval`/rAF(WaveLines·CountdownTimer·BME 라이브·진행바 펄스). 계승된 ccm 라이브 컴포넌트는 훅 가드 확인.

### 5.6 구현 매핑 (컴포넌트 → 4앱 + 공유 패키지)

DEVELOPMENT_PLAN §3 **옵션 A**(별도 공유 패키지 `assa-ccm-shared` + git 의존성).

| 레이어 | 공유 위치 | 소비 | ccm 소스(실측 경로) |
|---|---|---|---|
| chains/config | `packages/config` | 4앱+Worker | `wagmi.ts`·`env.ts`(8453/84532·IS_MAINNET) |
| ABI·주소 | `packages/abi` | 4앱+Worker | `contracts.ts`(typechain, freeze 핀) |
| auth/session | 공유 | portal/admin/Worker | `siwe.ts`·`session.ts`(ALLOWED_DOMAINS 정확집합) |
| UI 프리미티브·토큰 | `packages/ui` | 4앱 | ⚠️ **`portal/src/components/site/primitives.tsx`**(frontend엔 없음)·`index.css`(§1.0a audit 후 스왑) |
| site 크롬 | site + 일부 공유 | site | `SiteNav`·`AnchorNav`·`SiteFooter`·`Section`·`Heading`·`LegalLayout`·`ThemeProvider`/`ThemeToggle` |
| brand | `packages/ui` | 4앱 | `WaveMark`·`MarkSymbol`·`WaveLines`·`PlayGlyph`·`FanNetwork` |

⚠️ **경로 정정:** `primitives.tsx`는 **portal/admin의 `components/site/`에만** 존재(마케팅 site엔 없음). 마케팅 site는 `Section`/`Heading`/`SectionLabel`/`HairlineTable`/`LegalLayout`+`brand`만. 공유 패키지 추출 시 **portal 프리미티브를 원천으로 site가 import**(현재 산재 → 끌어올리기는 신규 작업).

**이관 순서(빅뱅 금지, 각 단계 ccm 회귀 게이트):** ① session+chains/config → ② viem 헬퍼·ABI → ③ UI 프리미티브 → ④ 도메인 훅. M1부터 최소 추출 후 fork가 처음부터 공유 import.

**산출물 파일 매핑:**

| 파일 | 내용 | 출처 |
|---|---|---|
| `frontend/src/index.css` | `@theme`+`[data-theme]` 토큰·폰트·반경·모션·reduced-motion·**:focus-visible** | ccm 적응(§1.0a audit) |
| `frontend/src/lib/tokens.ts`·`theme.ts` | TS 토큰 미러(+`--data-*`) + `ThemeContext`/`useTheme` | ccm 재사용 |
| `*/hooks/useReducedMotion.ts` | matchMedia 구독 훅 | ✅ ccm 재사용(전 모션 구독) |
| `frontend/src/components/site/` | ThemeProvider/Toggle/Section/Heading/SectionLabel/HairlineTable/SiteNav/AnchorNav | ccm 재사용(토큰 스왑·active 색외지표) |
| `frontend/src/components/brand/` | WaveMark(글리프 2 path 그룹)/MarkSymbol/WaveLines/PlayGlyph/FanNetwork | ccm Wordmark/SignalPlot/NodeNetwork 적응 |
| `portal/src/components/site/primitives.tsx` | Card/Stat/H1~3/Lede/DefRow(재사용) + Button변형/Input/Badge/Step/ProgressBar/Toast/WalletButton(신규) | ccm + 신규 |
| `portal/src/components/CopyableAddress.tsx` | 주소·복사·탐색기 | ⚠️ 토큰화 리팩터+44px |

**신규 컴포넌트(전부 a11y DoD 적용):** portal `/stake` veASSA UI·DecayCurve·무이자 카피, admin `/staking`·`/bme`, site `team`/`faq` 섹션, BME 소각 대시보드, GateChecklist·PreSignReview·CountdownTimer·AntiPhishingBanner·VestingCurve·에러 디코딩 맵·MarkSymbol.

---

## 6. 결정 필요 사항 (⚠️) + 권고

> ⚠️ **선행 차단:** #9(베스팅 모델=DEVELOPMENT_PLAN 원결정 **#4**)·#10(게이팅) 확정 전 Dashboard/Vesting/Sale claim 분리 착수 금지.

| # | 결정 | 옵션 | **권고** | plan 원결정 |
|---|---|---|---|---|
| 1 | Sale 위치 | site vs portal | **portal**(지갑·KYC·tx 보안) | — |
| 2 | 라우트 형태 | 2단 중첩 URL vs 1단 평탄 | **Layout 중첩 셸 + 1단 평탄 URL**(ccm 실패턴) | — |
| 3 | 서브도메인 | 단일 vs 4분리 | **분리**(쿠키·CSP·반피싱) | — |
| 4 | 테마 기본 | 라이트 vs 다크 | **다크 기본+라이트 토글**(site), portal/admin force dark | — |
| 5 | navy/gold·레드3계열 | 본문 vs 액센트 | **gold=면·보더·티어만(텍스트 금지)**, navy=다크 캔버스, 데이터=`--data-*`, 레드3계열 **ΔE 분리** | — |
| 6 | CJK 본문 | Noto KR vs Pretendard | **Pretendard(KO)** + Noto Sans JP(JA), Noto KR 폴백 | — |
| 7 | **CJK 디스플레이** | Pretendard ExtraBold vs 각진 디스플레이 | **각진 CJK 디스플레이(Black Han Sans/Noto JP 900) 실측 게이트** — Righteous 라틴전용, Pretendard는 라운드라 BI 각짐과 이질 | — |
| 8 | 차트 라이브러리 | ccm 인라인 SVG vs Recharts | **재사용=ccm SVG 패턴 fork(의존성 0)**, Recharts는 Dashboard 도넛·BME 등 **신규 화면 한정** 도입 | — |
| 9 | **베스팅 인덱싱** | id-indexed vs `releasable(address)` | **CCMVesting self-contained id-indexed 유지**(`claimable(round,addr)` 루프) — Dashboard/Vesting/claim 분리의 선행 | **#4** |
| 10 | 세일 게이팅 | 온체인 whitelist boolean vs merkle proof 주입 | **per-round whitelist 유지(컨트랙트 무변경)** — KYCRegistry는 프런트/백엔드 게이팅+온체인 진실원천 병용. proof-fetch UI는 스펙 모델 채택 시만 | — |
| 11 | 소스 공유 | 옵션 A vs 모노레포 | **옵션 A**(별도 패키지+git 의존성) | **#5** |
| 12 | 완료 상태 색 | 레드 통일 vs Green 분리 | **완료=Green, 진행중=Coral, CTA=brand-pressed**(WCAG·의미) | — |
| 13 | **moss/clay 매핑** | 플랫 리네임 vs 의미 분기 | **§1.0a 3분류 audit 후 분기**(브랜드/데이터/positive) — 플랫 리네임은 데이터·성공 오염 | — |
| 14 | **admin 세일 라우트명** | `/tge` 유지 vs `/sale` rename | rename 시 명시 결정 + **personas.ts 두 맵에 신규 키 추가 선행** | **#14**(SIWE) |
| 15 | **BI 마스터 weight** | 굵은 워드마크 vs 얇은 락업 | **굵은 워드마크=Primary**, 얇은 ASSA=세컨더리, ▶+wave 심볼=마크 | — |

---

## 7. 즉시 착수 (첫 스프린트 체크리스트)

**디자인 토큰 (WS2.1 — moss audit 선행)**
- [ ] ⚠️ **moss/clay audit(§1.0a)**: `grep -r "moss\|clay\|--moss\|text-moss"` 전수(실측 ~237건) → 브랜드/데이터/positive 3분류 분기 치환 → `git diff`로 데이터·성공이 레드로 새지 않음 확인.
- [ ] `frontend/src/index.css` fork: CSS변수 ASSA 스왑(`--brand`#EF2525/`--coral`#E0563F/`--gold`/`--data-1`,`--data-2`) + 라이트/다크(다크 기본, **라이트=순백 브랜드 결정**) + **Primary bg=brand-pressed** + **:focus-visible 신규**.
- [ ] 폰트 import 교체: Space Grotesk/JetBrains Mono → Righteous/Poppins/Chakra Petch/Pretendard. `:lang` 분기 + `.tnum` + **CJK 디스플레이 후보(결정#7)**.
- [ ] `lib/tokens.ts` TS 미러(+`--data-*`) + `ThemeProvider`(`DEFAULT_THEME="dark"`) 동작 확인.
- [ ] `pa11y`/`axe` CI 게이트 + **버튼 라벨 실측 케이스**(흰 글자 on 면색) 추가.

**핵심 컴포넌트 (실재=토큰 audit / 신규=a11y DoD)**
- [ ] `WaveMark` — logo01.png 실측 글리프(**path 그룹 ① 온전한 ASSA ② 좌측 독립 3줄 wave 스트라이프**), `brand`/`ink` `currentColor`. `MarkSymbol`(▶+wave, OG/favicon).
- [ ] `WaveLines`(데이터색 `--data-1`, **훅 가드**)·`PlayGlyph`·`FanNetwork`.
- [ ] 프리미티브: `Card`/`Stat`/`H1~3` 토큰 audit 후 렌더 검증 / **Button 변형·focus·min-h-44 신규**.
- [ ] **CopyableAddress 리팩터**: 하드코딩 색(`neutral-800/50`·`green-500`)→토큰, 44×44 hit-area, BaseScan link.

**Landing 히어로 첫 스프린트 (WS2.2)**
- [ ] `Earth.tsx` → `Home.tsx` fork(**ASSA 재배치 순서**, §2.2), 11섹션 골격 + AnchorNav 6앵커(active 색외지표).
- [ ] Hero 2-컬럼: 좌 `Heading`(pre/em, em=brand) + CTA 2개(세일 external/백서, **Primary bg=brand-pressed**), 우 카운트다운 카드(`CountdownTimer` tnum, 훅 가드).
- [ ] Hero 배경 ▶wave(WaveLines+PlayGlyph, **useReducedMotion 가드**, opacity≤0.12).
- [ ] SiteNav: WaveMark + NAV_ITEMS(앵커+백서) + APP CTA(external) + 언어셀렉터(ko/en/ja) + ThemeToggle(44px 햄버거).
- [ ] 공식 도메인 배너(Layout 레벨, `shield-alert`, `role="note"`, `ALLOWED_DOMAINS` 정확집합 빌드핀) + SiteFooter fork.
- [ ] i18n ko 기본 + **백엔드 VALID_LANGS·SEO hreflang·OG MarkSymbol** + LCP<2.5s(폰트 preload, 아래폴드 lazy).

---

*본 문서는 ASSA WAVE 디자인 파운데이션과 ccm 실측 IA를 단일 진실원천으로 삼되, 적대적 비평으로 검증한 실측 사실을 우선한다. **핵심 정정:** ① ccm 재사용은 '변수 스왑'이 아니라 **moss/clay 의미 분기 audit + focus·44px·에러디코딩·Step/Input/Toast/ProgressBar/WalletButton 신규 구축**을 동반한다(critical). ② 흰 글자 on #EF2525=4.23:1 FAIL → **Primary bg=brand-pressed**(WCAG). ③ 세일은 ccm `purchase`/`whitelist` boolean/self-contained 모델로, **회계 재작성 fork**이며 컨트랙트 모델(결정#4·#10)은 미확정. ④ 차트는 ccm 전부 인라인 SVG(Recharts는 신규 의존성). ⑤ 워드마크는 'A 좌측 독립 wave 스트라이프'이고, BI 마스터는 굵은 워드마크. **실질 신규 디자인:** portal `/stake` veASSA(무이자 카피·DecayCurve)·BME 소각 대시보드·세일 GateChecklist/PreSignReview/에러디코딩·WaveMark/MarkSymbol/PlayGlyph·ko/en/ja i18n·신규 프리미티브 셋(a11y DoD). §6 결정(#4 베스팅·#10 게이팅·#13 moss audit·#15 BI weight) 확정 후 §7 착수.*
