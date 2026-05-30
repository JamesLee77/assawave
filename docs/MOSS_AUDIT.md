# ASSA WAVE — moss/clay Token Audit (Executing §1.0a · Decision #13)

> Reference Date: 2026-05-30 · Target: ccm `frontend/src` (Measured) · Decision #13 Confirmed (3-Category Semantic Branching) · Related: `ASSA_WAVE_SITE_DESIGN.md §1.0a`, `DEVELOPMENT_PLAN.md` WS2.1
>
> **Purpose:** Map the single accent `--moss` (Green) and secondary `--clay` (Terracotta) from ccm to ASSA semantic tokens via **branching mapping**. ⚠️ Flat renaming (wholesale moss → brand) is prohibited — doing so will contaminate data and positive colors with red.

---

## 1. Measurement & Aggregation (ccm `frontend/src`)

| Token / Class | Total Usage | Notes |
|---|---|---|
| `--moss` family | **425** | `--moss` #2dbf63 (Single Accent), `--moss2`/`--moss-2` #5fe089 |
| `--clay` family | **31** | #c8602e(light)/#e88a4e(dark) Terracotta |
| `text-moss` | 230 | Mostly SectionLabel eyebrow (`font-mono uppercase text-moss`) + emphasis |
| `italic-moss` | 13 | Heading `em` emphasis (`.italic-moss` = color:var(--moss) + weight 600) |
| `border-moss` | 7 | SiteNav active border & cards |
| `bg-moss` | 5 | SiteNav CTA hover fill |
| SVG `stroke`/`fill` `var(--moss)` | ~50 | Charts / Data visualization |
| `::selection` | 1 (index.css) | Selection area background |

**Color Definition (ccm index.css):** light `--paper` #f5f3ec (Warm Cream) · `--ink` #0c0f10 / dark `--paper` #0a0e0c · `--ink` #eef1ea. `[data-theme]` swap + `@theme` references `--color-*`.

---

## 2. Three-Category Mapping (Semantics → ASSA Tokens)

| Category | ccm Measured Usage | ASSA Mapping | ⚠️ Prohibited |
|---|---|---|---|
| **BRAND / Emphasis** | `.italic-moss`(em), `::selection`, SectionLabel eyebrow, SiteNav active (`text-moss border-moss`, hover `bg-moss`), CTA | `--brand` (Surface) · **`--brand-on-light`/`--brand-on-dark` (Text, AA)** | — |
| **DATA / Measurement** | Chart SVG `stroke`/`fill`: VestingTimeline · AllocationRing · EmissionCurve · ScenarioCurve · RiskMatrix · DataFlow · ValueAccrualLive · CapitalReturns etc. + `clay` = 2nd series (MarketShareTimeline · GradeRadar · Economics · ContractMap) | `--data-1..5` (Neutral Multi-color) | **brand red** |
| **POSITIVE** | "balanced/healthy/completed" status (InvariantTicker `balanced ? --moss : --clay`) | `--positive` (Keep Green) | brand red |
| **WARNING / Negative** | `clay` = unbalanced / negative / comparative value (InvariantTicker clay, Vs `text-clay`) | `--warning` / `--coral` | brand red (confusing) |

---

## 3. Key Findings — Why Flat Renaming is Risky (Empirical Validation)

- **The vast majority** of `text-moss` (230) usages are SectionLabel eyebrow + emphasis = BRAND → Replacing with red is OK.
- However, **if chart SVGs (~50) and positive states are replaced with red**:
  - ❌ **All data lines** in VestingTimeline, AllocationRing, and EmissionCurve become red → Cannot distinguish multiple series, data contaminated with the brand color.
  - ❌ The `balanced` (positive) state in InvariantTicker is inverted to **red (danger)**.
  - ❌ `clay` negative/warning values are confused with brand red.
- **Conclusion:** Branch and replace brand usages, but **force separate tokens for data/positive/warning**. (Design Principle #3 — "Do not use brand red for data and error colors")

---

## 4. Fork Operational Rules (When Forking Components — WS2.1 Gate)

1. Perform a full search using `grep -rn 'moss\|clay\|--moss\|text-moss\|--clay' src`.
2. Classify each usage according to the table in §2:
   - Chart/SVG `stroke` & `fill` → `--data-*` (In JS, reference `getTokens(theme).data[n]`)
   - `balanced`/`success`/completed → `--positive`
   - `clay` negative/warning → `--warning`
   - Others (`text`/`border`/`bg`/`em`/`::selection`) → `--brand` (with text using `--brand-on-*`)
3. Check `git diff` to ensure **data and positive colors have not leaked into red**.
4. Since charts read colors from JS, reference `getTokens(theme).data[n]` in `lib/tokens.ts` instead of classes.

> Deliverables: `site/src/index.css` (branched token definitions), `site/src/lib/tokens.ts` (runtime mirror). Apply the above rules when forking components (e.g., Earth → Home).
