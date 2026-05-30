# ASSA WAVE — moss/clay 토큰 audit (§1.0a 실행 · 결정 #13)

> 기준일 2026-05-30 · 대상 ccm `frontend/src` (실측) · 결정 #13 확정(3분류 의미 분기) · 관련: `ASSA_WAVE_SITE_DESIGN.md §1.0a`, `DEVELOPMENT_PLAN.md` WS2.1
>
> **목적:** ccm의 단일 accent `--moss`(녹색)·보조 `--clay`(테라코타)를 ASSA 의미 토큰으로 **분기 매핑**한다. ⚠️ 플랫 리네임(moss→brand 일괄) 금지 — 데이터·positive 색이 레드로 오염된다.

---

## 1. 실측 집계 (ccm `frontend/src`)

| 토큰/클래스 | 총 사용 | 비고 |
|---|---|---|
| `--moss` 계열 | **425** | `--moss` #2dbf63 (단일 accent), `--moss2`/`--moss-2` #5fe089 |
| `--clay` 계열 | **31** | #c8602e(light)/#e88a4e(dark) 테라코타 |
| `text-moss` | 230 | 대부분 SectionLabel eyebrow(`font-mono uppercase text-moss`) + 강조 |
| `italic-moss` | 13 | Heading `em` 강조 (`.italic-moss` = color:var(--moss)+weight 600) |
| `border-moss` | 7 | SiteNav active 보더·카드 |
| `bg-moss` | 5 | SiteNav CTA hover 채움 |
| SVG `stroke`/`fill` `var(--moss)` | ~50 | 차트/데이터 시각화 |
| `::selection` | 1 (index.css) | 선택 영역 배경 |

**색 정의(ccm index.css):** light `--paper`#f5f3ec(웜크림)·`--ink`#0c0f10 / dark `--paper`#0a0e0c·`--ink`#eef1ea. `[data-theme]` 스왑 + `@theme`에서 `--color-*` 참조.

---

## 2. 3분류 매핑 (의미 → ASSA 토큰)

| 분류 | ccm 실측 사용처 | ASSA 매핑 | ⚠️ 금지 |
|---|---|---|---|
| **BRAND / 강조** | `.italic-moss`(em), `::selection`, SectionLabel eyebrow, SiteNav active(`text-moss border-moss`, hover `bg-moss`), CTA | `--brand`(면)·**`--brand-on-light`/`--brand-on-dark`(텍스트, AA)** | — |
| **DATA / 측정** | 차트 SVG `stroke`/`fill`: VestingTimeline·AllocationRing·EmissionCurve·ScenarioCurve·RiskMatrix·DataFlow·ValueAccrualLive·CapitalReturns 등 + `clay`=2nd 시리즈(MarketShareTimeline·GradeRadar·Economics·ContractMap) | `--data-1..5` (중립 다색) | **brand red** |
| **POSITIVE** | "balanced/healthy/완료" 상태(InvariantTicker `balanced ? --moss : --clay`) | `--positive`(녹색 유지) | brand red |
| **WARNING / negative** | `clay`=unbalanced·부정/비교값(InvariantTicker clay, Vs `text-clay`) | `--warning` / `--coral` | brand red(혼동) |

---

## 3. 핵심 발견 — 플랫 리네임이 위험한 이유 (실측 검증)

- `text-moss`(230)의 **대다수는 SectionLabel eyebrow + 강조 = BRAND** → 레드 치환 OK.
- 그러나 **차트 SVG(~50)와 positive 상태를 레드로 치환하면**:
  - ❌ VestingTimeline·AllocationRing·EmissionCurve의 **데이터 라인이 전부 레드** → 다중 시리즈 구분 불가, 데이터=브랜드색 오염
  - ❌ InvariantTicker `balanced`(=좋음) 상태가 **레드(=위험)로 역전**
  - ❌ `clay` 부정/경고값이 brand red와 혼동
- **결론:** brand는 분기 치환, **data/positive/warning은 별도 토큰 강제**. (디자인 원칙 #3 — "데이터·에러색에 brand red 금지")

---

## 4. fork 운영 규칙 (컴포넌트 fork 시 — WS2.1 게이트)

1. `grep -rn 'moss\|clay\|--moss\|text-moss\|--clay' src` 전수.
2. 각 사용처를 §2 표로 분류:
   - 차트/SVG `stroke`·`fill` → `--data-*` (JS는 `getTokens(theme).data[n]`)
   - `balanced`/`success`/완료 → `--positive`
   - `clay` 부정/경고 → `--warning`
   - 그 외 `text`/`border`/`bg`/`em`/`::selection` → `--brand`(+텍스트는 `--brand-on-*`)
3. `git diff`로 **데이터·positive가 레드로 새지 않았는지** 확인.
4. 차트는 JS에서 색을 읽으므로 클래스가 아니라 `lib/tokens.ts`의 `getTokens(theme).data[n]` 참조.

> 산출물: `site/src/index.css`(분기 토큰 정의), `site/src/lib/tokens.ts`(런타임 미러). 컴포넌트(Earth→Home 등) fork 시 위 규칙 적용.
