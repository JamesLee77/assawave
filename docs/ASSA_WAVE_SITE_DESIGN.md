# ASSA WAVE — Site Planning & Design System

> **Version:** v1.1 (Final reflecting adversarial critique) · **Base Date:** 2026-05-30 · **Official Domain:** assawave.io (Single)
> **Single Source of Truth (SSoT):** ASSA WAVE Design Foundation + ccm actual source IA (Base mainnet live) + 2 actual BI assets + 3 specifications (SITE/CONTRACTS/DEVELOPMENT_PLAN)
> **Status:** Phase 1 (MVP) Detailed / Phase 2·3 Outline
>
> **v1.1 Change Summary (Reflecting critical/high gaps):**
> 1. ⚠️ **Withdrew the premise of "Reusable without changes just by swapping color variables."** ccm uses a single accent color `--moss` (green) **237 times** interchangeably across brand, data, positive, and `::selection` → cannot be replaced with red across the board. Branched by semantic meaning via **§1.0a moss 3-classification audit table**.
> 2. **Corrected wordmark glyph specification** — 'Replacing left stroke of A' (error) → 'Intact A + left independent wave stripe'. **Separated roles of 2 BI assets (Symbol/Wordmark)**.
> 3. **Reflected WCAG actual measurements** — White text on #EF2525 = 4.23:1 **FAIL**. Finalized Primary background as `--brand-pressed` (#C81E14).
> 4. **Completely corrected 'reusable' labels** — Based on actual measurements, Step/Input/Badge/Toast/ProgressBar/WalletButton/Recharts are **new**. focus-visible, 44px, and error decoding are **absent** in ccm → newly built.
> 5. **Specified 2 sale contract models** — ccm actual measurements (`purchase`/`whitelist` boolean/self-contained) vs ASSA specification (`buy` + proof). Sale is not 'reused' but a **accounting rewrite fork**.

---

## 0. Overview

### 0.1 Purpose — Single Product for 2 Audiences

The ASSA WAVE site simultaneously persuades two audiences with **a single design system**.

- **(a) Investors** — Participate in the token sale. Core values are **Trust, Transparency, and Moderation**. 3-round sale, tokenomics, vesting, audit, and legal gate. Tone: Data-driven, Hairline tables, `tabular-nums`.
- **(b) K-pop Fans** — Participate in the Web3 music economy. Core values are **Enthusiasm, Belonging, and Speed**. Staking (veASSA), consumption (BME burn), and nodes (Phase 2). Tone: Vibrant, bold, duotone, wave/▶ motifs.

The design tension is resolved through a tone gradation of **"Fandom (Vibrant) at the top, transitioning to Investor (Moderation) further down,"** and consistent visualization of the BME narrative where **supply (mining emission) is absorbed by demand (staking lockup and consumption burn)**.

### 0.2 Brand Summary (2 Actual BI Assets — Role Separation)

⚠️ **There are 2 official BI assets with different weights** (Reflecting high gap in critique). Instead of treating them as contradictory, they are separated by lockup roles.

| Asset | File | Composition (Actual) | Role |
|---|---|---|---|
| **Wordmark (Primary)** | `logo01.png` | **Bold and blocky white 'ASSA'** glyph (on red surface). The first 'A' is an **intact bold A glyph**, with a **3-line upward-sloping wave stripe attached as a separate element on its left** (= hybrid of ▶ play / sound wave). ⚠️ It does **not** 'replace the left stroke of A'. | Main logo. Top-left of nav, hero, document headers. **Bold weight is the master.** |
| **Symbol Mark (Mark)** | `3197611bd3cf6.png` | Symbol of a **▶ play triangle (coral) with a 3-line wave entering it** + a **thin, light 'ASSA'** lockup underneath. | Standalone symbol (app icon, OG, favicon, loading). Thin ASSA lockup is restricted to **secondary/subtitle use only**. |

- **Colors (Actual Measurements):** Red #EF2525 · Coral #D93A26 · White. (The deck-derived navy/gold is **not in the actual logo** → Re-adjusted role as accents: navy = dApp dark canvas, gold = exclusive investor/tier accent, text prohibited.)
- **Motif:** Systematized the 3-line wave + ▶ play into dividers, backgrounds, loading, CTAs, and scroll indicators.
- **Glyph Helper Implementation:** ccm `Wordmark` is not font text but a custom SVG path helper (`wordmark-paths.ts`). ASSA `WaveMark` has the same structure — **2 path groups (① intact ASSA glyph, ② left independent 3-line wave stripe)** to specify the `logo01.png` actual geometry. Do not rely on fonts.

### 0.3 Five Design Principles

1. **One Token, Two Audiences.** Present sale (investors) and dApp (fans) with a single token and primitives. Branch the tone not by components, but by **context, copy, and frequency of emphasis**.
2. **ccm Code Reuse = Variable Swap + Class Audit.** ⚠️ **Does not end with a simple variable value swap.** Since ccm `--moss` (single accent) is used interchangeably (237 times) for brand, data, and positive states, CSS variables must be branched and mapped **after semantic classification of usage (§1.0a)** for component code reuse to be viable without modification.
3. **Separate Tones for Red (Brand/CTA), Gold (Accent Only), Progress (Neutral), and Danger (Destructive).** Red is both a music brand and a danger color → avoid abuse for errors. Since the 3 red families (#EF2525 / #D93A26 / #DC2626) are close, use **ΔE separation (§1.1)** to visually distinguish 'Brand vs. Progress vs. Danger.' Gold is limited to surfaces and borders (text prohibited). Never use brand red for data visualization.
4. **Trust in the Details.** Display "what, to whom, and exactly how much" before every transaction signature. No infinite approvals (approve exact amounts). Hardcode contract addresses and display verified indicators. Keep the anti-phishing banner active at all times.
5. **Motion is Meaning, Not Decoration.** Systematize wave/▶ in loading, progress, and transitions. Avoid AI slop (purple gradients, meaningless glassmorphism, layout-shifting hovers). Target 150–300ms. ⚠️ **Implement both CSS resets and `useReducedMotion()` hook guards** for reduced-motion (JS animations cannot be stopped by CSS alone, §1.4).

### 0.4 ccm IA Reuse Premise (Proven 4-App Structure)

ASSA adopts the **4-app separate structure** of the ccm actual source code as the reference standard. Separating marketing (public), dApp (wallet), admin (operations), and sandbox is justified as their security levels, deployment cycles, and bundles are fundamentally different.

| App | Domain | ccm Source | Core |
|---|---|---|---|
| **site** (Marketing) | `assawave.io` | `frontend/` | Anchored single-scroll landing + legal. Light/dark toggle. |
| **portal** (dApp) | `app.assawave.io` | `portal/` | 1-tier flat URL + nested layout (shared shell) + wallet. Dark by default. |
| **admin** (Operations) | `admin.assawave.io` | `admin/` | CF Access SSO + persona RBAC. Dark. |
| **testnet** (Sandbox) | `testnet.assawave.io` | testnet | Playground. Base Sepolia. |

> **Token Architecture (Proven):** ccm `index.css` defines all colors as pure CSS variables in `:root`/`[data-theme]` and **only references** them in `@theme` as `--color-*`. Swapping themes via `ThemeProvider`'s `DEFAULT_THEME="dark"` + `document.documentElement.dataset.theme` enables theme switching without re-rendering. This two-tier structure is inherited, but **swapping variable values must be preceded by the §1.0a audit** (critical gap in critique).

### 0.5 Reference Documents

- Site Spec: `/Users/hyunsuklee/Developer/web3/assawave/docs/ASSA_WAVE_SITE_SPEC.md`
- Contracts Spec: `/Users/hyunsuklee/Developer/web3/assawave/docs/ASSA_WAVE_CONTRACTS_SPEC.md`
- Development Plan: `/Users/hyunsuklee/Developer/web3/assawave/docs/DEVELOPMENT_PLAN.md`
- BI Actual Measurements: `/Users/hyunsuklee/Developer/web3/assawave/docs/assa-bi/{logo01.png (wordmark), 3197611bd3cf6.png (symbol mark)}`
- ccm IA Actual Reference Files: `frontend/src/pages/Earth.tsx` · `portal/src/pages/Sale.tsx` · `portal/src/components/site/primitives.tsx` · `portal/src/components/CopyableAddress.tsx` · `admin/src/lib/personas.ts` · `frontend/src/hooks/useReducedMotion.ts`

---

## 1. Design System

### 1.0 Token Architecture — Inheriting ccm Patterns + Semantic Branching

```
[data-theme] CSS Variables (Single Source of Truth, theme-specific branching)
        │  Reference
        ▼
@theme  --color-* (Tailwind utility generation: bg-brand, text-ink, border-rule …)
        │  Usage
        ▼
Components (Semantic utilities only — hardcoded hex prohibited)
```

The proven naming conventions of ccm (`paper`/`ink`/`rule`/`paper-deep`) are maintained. However, **the single accent slots `moss`/`clay` are branched semantically in ASSA** (see §1.0a below). The TS mirror in `lib/tokens.ts` maintains the same branching (referencing `getTokens(theme)` in runtime charts and SVGs).

### 1.0a ⚠️ moss/clay Audit — Plain Renaming Prohibited (Resolving Critical Gap)

**Actual Measurements:** ccm `--moss` (green #2dbf63) is used as a **single accent color** across `text-moss` 237 times + `italic-moss` (Heading em) + `SectionLabel` + `SignalPlot` data line (`var(--moss)`) + `::selection`. `--clay` (terracotta #c8602e) is used in 16 secondary places. **If these are replaced globally** with ASSA `--brand` (red), chart data, success states, and selection areas will all be contaminated with red, directly violating Principle #3 ('red as data/error color prohibited').

**Resolution: Classify usage into 3 semantic categories and map accordingly (per-component class audit is mandatory).**

| ccm Original Usage (`--moss`/`text-moss`/`--clay`) | Semantic Category | ASSA Mapped Variable | Example |
|---|---|---|---|
| CTA Fill · `italic`/`em` Brand Accent · Active Highlight · `::selection` | **Brand/Emphasis** | `--brand` (surface) · `--brand-on-dark` (text) | Hero em, AnchorNav active, Selection area |
| `SignalPlot`/Chart Data Lines · Measurement Visualization · Sparklines | **Data/Measurement** | `--data-1` (neutral teal) · `--ink-soft` · `--coral` (secondary family) | WaveLines data, donut segment |
| "Success / Complete / Positive / Claimable > 0 / Vested" states | **Positive** | `--positive` (Keep green) | Claim available, Vesting complete, tx success |
| `--clay` (secondary accent · close to warning) | Secondary/Warning | `--coral` (secondary accent) or `--warning` (warning) | revocable tag, progress emphasis |

> **Operational Rule:** On fork, grep all instances of `moss\|clay` → replace with branched variables based on the table above → verify with `git diff` that data/positive has not leaked to red. This audit is established as the **§7 First Sprint Gate**. (Upgraded 'color swap' in DEVELOPMENT_PLAN WS2.1 to 'semantic branching based on audit.')

### 1.1 Color Tokens

#### Semantic Slots (Role Separation — ΔE Separation of 3 Red Families)

| Slot | Role | Notes |
|---|---|---|
| `--brand` / `--brand-hover` / `--brand-pressed` | BI Red. Wordmark · ▶ motifs | #EF2525 / #FF3B3B (dark) · #D93A26 (light) / **#C81E14** |
| `--brand-on-dark` | Red text/link/focus ring on dark (ensuring AA) | #FF5A4D |
| `--coral` | BI Coral. Secondary accent · progress states · end point of wave gradient. ⚠️ **Avoid value conflict** with brand-hover | **#E0563F** (shifted toward orange) |
| `--gold` | Exclusive **accent/border** for investors and veASSA tiers. Prohibited in body text | Inherited deck gold |
| `--data-1` / `--data-2` | Neutral colors for charts and data visuals (avoid brand red) | Teal #2DD4BF / Slate #64748B |
| `--paper` / `--paper-deep` | Canvas / Deep surfaces for panels and cards | Inherited ccm naming |
| `--surface` / `--surface-2` | Elevated surfaces for inputs, modals, etc. | dApp component surface |
| `--ink` / `--ink-soft` | Body text / Muted text | |
| `--rule` | Hairlines, borders, dividers | ccm core structural token |
| `--positive` / `--warning` / `--destructive` | Success (green) / Warning (amber) / Danger | destructive = #DC2626, **ΔE separated** from brand |
| `--nav-bg` | Translucent nav background (backdrop-blur) | ccm pattern |

#### Visual Separation Rules for the 3 Red Families (High Gap)

Separate `--brand` #EF2525 (brand) / `--coral` #E0563F (progress, orange-biased) / `--destructive` #DC2626 (danger) by **saturation and hue angle**, and **never rely on color alone**:
- In progress = `--coral` + spinner/`--dur-wave` pulse (different animations)
- Danger = `--destructive` + `alert-triangle` icon + text labels (3-way redundancy)
- Brand = `--brand` surface + fixed CTA positioning (top-right/bottom)

#### `index.css` — `@theme` + Light/Dark (Site Defaults to Dark)

```css
@import "tailwindcss";
@import "@rainbow-me/rainbowkit/styles.css";

/* Fonts (§1.2) */
@import "@fontsource/righteous/400.css";
@import "@fontsource/poppins/300.css";  @import "@fontsource/poppins/400.css";
@import "@fontsource/poppins/500.css";  @import "@fontsource/poppins/600.css";
@import "@fontsource/poppins/700.css";
@import "@fontsource/chakra-petch/400.css"; @import "@fontsource/chakra-petch/500.css";
@import "@fontsource/chakra-petch/600.css";
@import "@fontsource-variable/pretendard";          /* CJK default (KO) */
@import "@fontsource/black-han-sans/400.css";        /* CJK display candidate (§1.2 decision #7) */
@import "@fontsource/noto-sans-jp/400.css"; @import "@fontsource/noto-sans-jp/700.css"; @import "@fontsource/noto-sans-jp/900.css";

/* Single Source of Truth — Swapped with [data-theme]. Defined with Light as base, but Site defaults to Dark theme. */
:root,
[data-theme="light"] {
  --brand: #EF2525;  --brand-hover: #D93A26;  --brand-pressed: #C81E14;
  --brand-on-dark: #C81E14;            /* Light body red is pressed tone (on white 5.75:1) */
  --coral: #E0563F;  --gold: #B7791F;  /* Lowered light gold saturation to secure contrast on surfaces */
  --data-1: #0D9488; --data-2: #475569;

  /* ⚠️ ccm light is warm cream (#f5f3ec) but ASSA adopts pure white = brand decision (deviates from ccm parity). */
  --paper: #FFFFFF;  --paper-deep: #F5F5F7;
  --surface: #FFFFFF; --surface-2: #F0F0F3;
  --ink: #0F172A;    --ink-soft: #475569;
  --rule: #E2E2E8;   --nav-bg: rgba(255,255,255,0.86);

  --positive: #16A34A;  --warning: #B45309;  --destructive: #DC2626;
  color-scheme: light;
}

[data-theme="dark"] {
  --brand: #EF2525;  --brand-hover: #FF3B3B;  --brand-pressed: #C81E14;
  --brand-on-dark: #FF5A4D;            /* Red for text/links/focus rings on dark (AA 4.5:1+) */
  --coral: #E0563F;  --gold: #FBBF24;
  --data-1: #2DD4BF; --data-2: #94A3B8;

  --paper: #0B0B14;  --paper-deep: #14141F;     /* Inky navy black */
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

/* ⚠️ Focus Ring — Absent in ccm primitives (Newly built, critical gap) */
:focus-visible { outline: 2px solid var(--brand-on-dark); outline-offset: 2px; }
[data-theme="light"] :focus-visible { outline-color: var(--brand-pressed); }

/* ccm moss usages like ::selection are brand after §1.0a branching */
::selection { background: var(--brand); color: #fff; }
```

#### WCAG AA Verification Rules (Reflecting Actual Measurements — Critical Gap)

- ⚠️ **White text on #EF2525 = 4.23:1 → Normal text AA (4.5:1) FAIL** (Actual measurements). Therefore, **Primary button background is finalized as `--brand-pressed` #C81E14** (white text 5.0:1+). brand #EF2525 is restricted **only** to surfaces, icons, 1px borders, and large bold elements (18px+ bold, 3:1).
- **Red Text:** Dark = `--brand-on-dark` #FF5A4D, Light body size = `--brand-pressed` #C81E14 (on white 5.75:1). Pure #EF2525 is prohibited in body text.
- **Gold is Accent-Only, Text Prohibited:** Borders, underlines, tier badge surfaces, icons. Text on gold must be `--ink`. Light gold is lowered in saturation (#B7791F).
- **Use only `--data-*`/`--positive`/`--coral` for data visualization** — avoid brand red (to prevent confusion with CTA and contamination of donuts).
- `--destructive` requires a **3-way redundancy** of color + icon (`alert-triangle`) + text label (safe for color-blindness).
- **CI Gate:** `pa11y`/`axe` — prevents contrast regression during token changes. **Added explicit clarification for button label measurements** (white text on surface color).

### 1.2 Typography

| Role | Font | Purpose | Weight |
|---|---|---|---|
| Display (Latin) | **Righteous** | Hero, Section Title, CTA Label. Matches blocky BI wordmark. Latin only. | 400 |
| Body / UI | **Poppins** | Body, Buttons, Inputs, Navigation, Cards | 300–700 |
| Data | **Chakra Petch** | Numbers, Amounts, Addresses, Countdowns, Chart Axes. `tabular-nums` mandatory. | 400/500/600 |
| CJK Body | **Pretendard** (KO) / **Noto Sans JP** (JA) | KO/JA Body. Noto Sans KR fallback. | 400–800 |
| CJK Display | **Black Han Sans** (KO) / **Noto Sans JP 900** (JA) | KO/JA Titles (to match blocky BI). ⚠️ Decision #7 actual gate. | 400/900 |

⚠️ **CJK Title BI Parity (Medium Gap):** Pretendard ExtraBold is a rounded humanist font, feeling foreign next to the BI's 'blocky geometric' tone. For KO/JA **titles**, prioritize blocky CJK display fonts (Black Han Sans / Noto Sans JP 900 + negative letter-spacing) and finalize only after passing the **actual comparison gate** (Decision #7). Keep Pretendard/Noto for body text. Righteous is **Latin-only** (strictly prohibited for CJK).

```css
html { font-family: var(--font-body); }
:lang(ko), :lang(ja) { font-family: var(--font-cjk); }
.font-display { font-family: var(--font-display); letter-spacing: -0.01em; }
:lang(ko) .font-display, :lang(ja) .font-display {
  font-family: var(--font-cjk-display); letter-spacing: -0.02em;
}
.tnum { font-family: var(--font-data); font-variant-numeric: tabular-nums; }
```

**Coexistence Rules:** Auto-branch font stacks using the `lang` attribute. Numbers use Chakra Petch + `tabular-nums` regardless of language (preventing digit jumping = CLS stability). **Verify `:lang()` propagation even to data font areas** such as countdowns, chart axes, and amounts (§5.4).

**Type Scale**

| Token | Size (Clamp) | Line-Height | Weight | Font |
|---|---|---|---|---|
| `display-hero` | `clamp(56px, 9vw, 120px)` | 0.92 | 400 | Righteous |
| `display-1` (h1) | `clamp(40px, 6vw, 72px)` | 1.0 | 400 | Righteous |
| `display-2` (h2) | `clamp(32px, 4.5vw, 52px)` | 1.05 | 400 | Righteous |
| `heading-3` (h3) | `clamp(22px, 2.5vw, 30px)` | 1.15 | 600 | Poppins |
| `body-lg` / `body` / `body-sm` | 18 / 16 / 14px | 1.6 | 400 | Poppins |
| `label` (SectionLabel) | 12px / `0.16em` / UPPERCASE | 1.4 | 600 | Chakra Petch |
| `data-xl` (Large amount) | `clamp(28px, 4vw, 44px)` | 1.0 | 600 tnum | Chakra Petch |

> Inherit ccm's `Heading`/`SectionLabel` structure, but replace with `font-display` mapping (Space Grotesk → Righteous), accent (`italic-moss` → `--brand`, **no italics, blocky glyphs**), and SectionLabel colors (`text-moss` → §1.0a branching). ⚠️ Actual Measurements: SectionLabel is `var(--ink-soft)`, and only the active accent is moss → replace only the active parts with brand.

### 1.3 Spacing · Radii · Elevation

**Spacing:** 8px base `4·8·12·16·24·32·48·64·96·128`. Section gap 48px+ mandatory. Landing section vertical padding: desktop `120px` / tablet `80px` / phone `56px`. portal container: `max-w-5xl mx-auto px-6 md:px-14 py-10 md:py-14` (ccm `Layout`). Anchored sections in landing use `scroll-snap-align: start` + `scroll-margin-top` matching the nav height.

**Radii:** ccm is sharp (radius 0). ASSA introduces slight rounding for an entertainment tone, contrasting with the blocky geometry of wave/▶.

| Token | Value | Intended Use |
|---|---|---|
| `--radius-sm` / `md` / `lg` | 6 / 10 / 16px | Inputs & badges / Buttons & cards / Modals & hero cards |
| `--radius-pill` | 999px | Tier chips, filters, progress tracks |
| `--radius-none` | 0 | Wave lines, ▶ clip paths, data tables (Inheriting `HairlineTable`) |

**Elevation (Dark Priority — Surface levels + 1px rule, minimal glow)**

| Token | Dark | Light |
|---|---|---|
| `--elev-1` (Card) | `surface` + `1px rule` | `0 1px 2px rgba(15,23,42,.06)` |
| `--elev-2` (Dropdown) | `surface-2` + `1px rule` | `0 4px 16px rgba(15,23,42,.10)` |
| `--elev-3` (Modal) | `surface-2` + `0 0 0 1px rule` + backdrop | `0 12px 40px rgba(15,23,42,.16)` |
| `--glow-brand` | `0 0 24px rgba(239,37,37,.28)` (CTA hover & play button only) | Unused |

> Glassmorphism (translucency + blur) is restricted strictly to **nav background and modal backdrop** (avoiding AI slop).

### 1.4 Motion Tokens + reduced-motion (CSS + JS Hook Parity — High Gap)

```css
@theme {
  --ease-out:   cubic-bezier(0.16, 1, 0.3, 1);
  --ease-inout: cubic-bezier(0.65, 0, 0.35, 1);
  --dur-fast: 150ms; --dur-base: 220ms; --dur-slow: 320ms;
  --dur-wave: 1600ms;  /* wave flow & ▶ pulse decorative loop */
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important; animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important; scroll-behavior: auto !important;
  }
}
```

- ⚠️ **CSS resets alone cannot stop JS animations.** ccm owns a `useReducedMotion()` hook (subscribing to `matchMedia`) which is subscribed to by live components like `AllocationRing` (Actual measurements). All of ASSA's **JS/rAF/`setInterval`-driven motions** (`WaveLines`, `PlayGlyph`, `FanNetwork`, `CountdownTimer`, live BME tally, sale progress bar pulse) **subscribe to `useReducedMotion()` to guard loops**. CSS resets act as a secondary safety net.
- Hover actions only use color, borders, and `translateY(-2px)` — **layout shifts strictly prohibited**. Shadows/glows belong to separate transitions to block reflow.
- Section reveal: `IntersectionObserver` `opacity 0→1 + translateY 16→0`, one-time only.
- Countdown updates (number changes) are maintained (not considered animation); only flashing is disabled under reduced-motion.

### 1.5 Icons + wave/▶ Motif System

**Icons:** `lucide-react` exclusively (stroke 1.6–2.0, 24px, `currentColor`). Emojis strictly prohibited. Standard mapping: Wallet = `wallet`, Sale = `coins`, Vesting = `calendar-clock`, Lock = `lock`, veASSA Power = `zap`, Copy = `copy`/`check`, Explorer = `external-link`, Warning = `alert-triangle`, Success = `check-circle`, Anti-phishing = `shield-alert`, Burn = `flame`, Play = `play`.

**wave/▶ Brand Data Visuals** (Replacing ccm `SignalPlot`/`NodeNetwork`. Inherits CSS variable routing, `aria-hidden`, and viewBox patterns, **but data color is `--data-*`**):

| Component | ccm Source | ASSA Adaptation |
|---|---|---|
| `WaveMark` | `Wordmark` (SVG path) | `logo01.png` actual glyph = **path groups: ① intact ASSA, ② left independent 3-line wave stripe**. 2 colors: `brand`/`ink`, tracks `currentColor`. |
| `MarkSymbol` | (New, 3197611bd3cf6.png) | **▶ + wave symbol** (app icon, OG, favicon, loading). Coral ▶ + wave entering. |
| `WaveLines` | `SignalPlot` | 3-line sine wave. `stroke-dashoffset` flow (`--dur-wave`, **hook guarded**). Used for dividers and backgrounds. Data lines use `--data-1`. |
| `PlayGlyph` | (New, BI ▶) | clip-path/SVG ▶ triangle. CTA prefix and loading spinner. `--radius-none`. |
| `FanNetwork` | `NodeNetwork` | Fan-node connection web (center hub = 'ASSA'). Staking/node sections. Node color uses `--data-*`. |

All motif SVGs use `aria-hidden="true"` + only reference brand/ink/rule/**data** variables (automatic theme tracking). Usage: Section dividers (WaveLines 1px), hero background (low-contrast wave opacity ≤ 0.12), loading (PlayGlyph pulse), CTA left-side ▶, scroll-snap entrance reveal.

### 1.6 Component Primitives (Summary — Real/New Breakdown is in §4)

⚠️ **Restrict 'reusability' to actual measurements** (High gap in critique). The actual primitives existing in ccm (`portal/src/components/site/primitives.tsx`) are only **`Card`, `CTA` (primary/ghost only), `Stat`, `SectionLabel`, `H1~H3`, `Lede`, and `DefRow`**. **Button variants (secondary/gold), Inputs, Badges, Steps, Toasts, ProgressBars, WalletButtons, focus rings, and 44px touch targets are absent in ccm → new.** Common new DoD: 44px minimum target, `:focus-visible` ring, `disabled` opacity 0.5, and **6 standard states (default/hover/focus/disabled/loading/error)**.

---

## 2. Information Architecture (IA), Sitemap, & Navigation

### 2.0 IA Governance — Decision Summary

| Decision | ccm Actual (Measured) | ASSA Adoption | Rationale |
|---|---|---|---|
| **App Separation** | 4 apps: site/portal/admin/testnet | **Same 4 apps** | Security level, deployment cycle, and bundle isolation. |
| **Sale Location** | `portal/pages/Sale.tsx` (dApp) | **Maintained in portal** | Sale requires wallets, KYC, and transactions → dApp security context. |
| **Route Structure** | **Nested Layout Route + 1-Tier Flat URL** | **Same pattern** (Spec `/app/stake` 2-tier → portal `/stake` 1-tier) | ⚠️ ccm shares shell via **nested** `<Route element={<Layout/>}>`. The difference is only URL depth (1-tier) — it is not 'nested Layout is unnecessary' but 'nested shell, 1-tier URL'. |
| **Subdomains** | `*.ccmnetwork.net` | `assawave.io` / `app.*` / `admin.*` / `testnet.*` | Cookie, session, and CSP boundaries; anti-phishing exact domain. |
| **Default Theme** | site toggle · portal/admin force dark | **Dark by default + light toggle** (site), portal/admin dark | Foundation design. |

> ⚠️ **Anti-phishing IA Invariant:** Official domain is **exclusively** `assawave.io`. Defensive domains (`.ai`/`.net`/similar typos) must 301 redirect. SIWE `ALLOWED_DOMAINS` prohibits wildcards and must match the exact set. Display "Official: assawave.io" persistent banner on all app footers and sale screens.

### 2.1 Full Sitemap (4 Apps)

```
assawave.io ── Marketing (site / frontend)  ── Public, SEO, Light toggle
├─ /                  Landing — Anchored single scroll (AnchorNav)
│   └ #hero #manifesto #solution #tokenomics #sale #market
│     #mining #roadmap #team #faq
├─ /whitepaper        Whitepaper (LegalLayout)
├─ /terms /privacy /disclaimer   Legal (LegalLayout)
├─ /tokenomics → /#tokenomics    Legacy anchor redirect
├─ /roadmap   → /#roadmap        Legacy anchor redirect
└─ /sale → app.assawave.io/sale  (External CTA to Portal)

app.assawave.io ── dApp (portal)  ── Wallet, SIWE, Dark default
│   Layout (App shell + RainbowKit Connect + Network Guard) Nested Routes · 1-Tier Flat URL
├─ /          Home (Portfolio overview)
├─ /sale      Token Sale   ★ Sale is here (Not marketing)
├─ /dashboard Dashboard (Balances, claimable, lockup summary, BME burn trends)
├─ /vesting   Vesting (Category schedules, curves, claims)
├─ /stake     Lock / veASSA (No-yield lockup)  ★ New (Replaces ccm migrate slot)
└─ /settings  Settings (locale, wallet, session)
   ✗ /migrate  ccm exclusive — Removed

admin.assawave.io ── Operations (admin)  ── CF Access + persona RBAC
├─ / TokenAdmin(index) · /tge SaleAdmin(TGE) · /vesting VestingAdmin
├─ /kyc KycAdmin · /timelock TimelockAdmin
├─ /staking StakingAdmin ★ New · /bme BMEAdmin ★ New
└─ /e2e E2eSetup (!IS_MAINNET gate)

testnet.assawave.io ── Sandbox (testnet)  ── Base Sepolia
└─ / Playground (Portal mirror + free mints & time warp controls)
```

### 2.2 site (Marketing) Route Map

**Landing = Anchored Single Scroll.** ⚠️ The 11 ASSA sections are a **reordering** of ccm sections — ccm actual `Earth.tsx` order is `Hero→Market→Trinity→Problem→WrapSim→Grades→Architecture→Mining→Tokenomics→Scenarios→Defi→Vs→Roadmap→Risks→Manifesto` (with Manifesto **at the very end**). ASSA reorders them downward and drops some:

| # | Anchor | ASSA Section | AnchorNav | ccm Source (Reordered/Absorbed) | Size |
|---|---|---|---|---|---|
| 1 | `hero` | Hero (ASSA, wave, sale CTA, countdown) | — | `Hero` | M |
| 2 | `manifesto` | Manifesto/Problem | ● | Moved up `Manifesto` (originally last) + `Problem` | S |
| 3 | `solution` | Solution/Trinity (streaming, consumption, node) | ● | `Trinity` | S |
| 4 | `tokenomics` | Tokenomics (allocation donut, BME, vesting) | ● | `Tokenomics` (SVG chart) | M |
| 5 | `sale` | Token Sale (3 rounds, progress bar, countdown) | ● | New (Adapted from SVG live patterns) | M |
| 6 | `market` | Market/Scenarios (TAM, MAU, scenarios) | ● | `Market` + `Scenarios` | M |
| 7 | `mining` | Mining (Phase 2 outline) | — | `Mining` | S |
| 8 | `roadmap` | Roadmap (M1~M5) | ● | `Roadmap` | S |
| 9 | `team` | Team & Partners (MagicSing) | — | New (`Grades`/`Vs` grid pattern adapted) | S |
| 10 | `faq` | FAQ | — | `Risks` (accordion) | S |
| 11 | — | Official Domain Banner + Footer | — | `SiteFooter` | S |

**Drop/Absorption (Intended):** `WrapSim`, `Grades`, `Architecture`, `Defi`, and `Vs` are either dropped in ASSA or absorbed into the Tokenomics/Team sections. ccm `/defi`, `/markets`, and `/ccmine` routes are removed. `AnchorNav items` = `[manifesto, solution, tokenomics, sale, market, roadmap]` (6 items to prevent overcrowding). ccm active section tracking via `IntersectionObserver` is inherited, but active highlights are brand via §1.0a branching. Legacy anchors use `<Navigate replace>`.

### 2.3 portal (dApp) Route Map

**Nested Layout Route + 1-Tier Flat URL.** 1-tier routes under `<Route element={<Layout/>}>` (PortalNav + Connect + Footer shell).

| Route | Page | ccm Source | Action (Based on actual source) |
|---|---|---|---|
| `/` | Home | `portal/pages/Home` | Reused + token audit |
| `/sale` | Token Sale | `Sale.tsx` (815 lines) | ⚠️ **Accounting rewrite fork** (§3.2, requires claim separation & gating decisions first) |
| `/dashboard` | Dashboard | `Dashboard.tsx` | Reused + adapted (StatCard defined locally → extract to primitive) |
| `/vesting` | Vesting | `Vesting.tsx` (215 lines) | Reused + adapted (New error handling) |
| `/stake` | Lock/veASSA | **New** (pattern adapted) | New |
| `/settings` | Settings | `Settings.tsx` | Reused |

**PortalNav Changes:** Removed `migrate` and added `stake` compared to ccm. **Network Guard:** ccm `wagmi.ts` + `env.ts` single-chain pin at build time (`IS_MAINNET` → 8453/84532) structurally blocks incorrect chain transactions.

### 2.4 admin (Operations) Route Map + Persona RBAC

ccm admin uses **persona-based RBAC** (`lib/personas.ts`) — inherited exactly. 4-tier defense: ① CF Access, ② persona UI (hiding irrelevant tabs & disabling writes), ③ portal-api SIWE audit log, ④ on-chain RBAC.

| Route (Actual Path) | Page | ccm | Persona |
|---|---|---|---|
| `/` (index) | TokenAdmin | Reused | super_admin · read_only |
| **`/tge`** | SaleAdmin (TGE) | `TgeAdmin` | super_admin · treasury · read_only |
| `/vesting` | VestingAdmin | Reused | super_admin · compliance · read_only |
| `/kyc` | KycAdmin | Reused | super_admin · compliance · read_only |
| `/timelock` | TimelockAdmin | Reused | super_admin · treasury · read_only |
| `/staking` | StakingAdmin | **New** | super_admin · treasury |
| `/bme` | BMEAdmin | **New** | super_admin · treasury |
| `/e2e` | E2eSetup | Reused | `!IS_MAINNET` gate |

⚠️ **Correction on Actual Paths:** ccm sale route is **`/tge`** (not `/sale`). If ASSA wants to rename it to `/sale`, record it as an explicit decision. **For the new `/staking` and `/bme` routes, adding keys to both `PERSONA_ROUTES.treasury` and `PERSONA_WRITES.treasury` maps is a prerequisite** (currently keys are missing — without this, treasury cannot access them). Persona definitions (Actual): `super_admin` (All privileges) / `treasury` (Token · TGE · Timelock · **+Staking · BME**) / `compliance` (KYC · Vesting, zero fund movement) / `read_only` (view-only). `Layout` filters the navigation via `canViewRoute`. ⚠️ DEVELOPMENT_PLAN Decision #14: Upgraded ccm shared bearer single-point-of-failure to **Safe Member SIWE signatures** (mandatory for Phase 1).

### 2.5 Comprehensive Navigation System

| Navigation | Position | App | Behavior |
|---|---|---|---|
| **SiteNav** | Sticky top | site | Mixed anchors + real routes, App CTA (external), language selector, ThemeToggle, mobile drawer (Esc, scroll lock, 44px hamburger) |
| **AnchorNav** | Below SiteNav `top-[64px]` | site | In-page anchors, IntersectionObserver active tracking, mobile horizontal scroll. ⚠️ active state uses color + **bold weight / 2px underline / `aria-current`** (color alone prohibited, high gap) |
| **PortalNav** | Sticky top | portal | 1-tier NavLink + Connect, TESTNET badge (`!IS_MAINNET`) |
| **admin Layout nav** | Sticky top | admin | Persona-filtered NavLink + Connect + Safe/Persona/E2e badges |

**Branding:** `WaveMark` (logo01.png actual glyph) is shared across all app nav top-lefts. **`MarkSymbol`** (symbol) is used for favicon, OG, and loading.

---

## 3. Page-by-Page Design Planning

### 3.1 Landing (site, `/`)

**Pattern:** ccm anchored single-scroll reordering. Route shells, SEO/OG, i18n, legal layouts, and SVG chart primitives are pattern forks, with only the section content, copy, and colors adapted to ASSA (subject to the §1.0a audit).

**SiteNav Structure:**
```
[ ▶ASSA WAVE | K-POP · WEB3 ]  Sale  Tokenomics  Roadmap  Whitepaper  [Launch App ↗] [KO▾] [◐]
```
Left-aligned `WaveMark` + caption (replacing ccm "Carbon Credit"). NAV_ITEMS = Anchors (`/#sale` etc.) + real routes (`/whitepaper`). APP CTA = `app.assawave.io` (external, fills with `--brand-pressed` on hover · white text matches AA). Extras: Language selector (KO/EN/JA) + ThemeToggle. ccm `CarbonPriceBadge` slot → sale countdown micro-badge (only active during rounds).

**Section-by-Section Tone & Visuals (Vibrant at top, Moderation at bottom):**

- **1. Hero** (2-column `1.4fr/1fr`): Left = `Heading h1` pre `"Own K-pop"` / em `"The New Wave, ASSA WAVE"` + lead paragraph + 2 CTAs (`Join Sale ↗` with `--brand-pressed` fill / `View Whitepaper` outline). Right = Sale countdown card (Righteous 84px `D-12:04:33:17` tnum + 2-column stat). Background = ▶ left-to-right progress + 3-line wave flow SVG (`WaveLines`, data color `--data-1`, `useReducedMotion` guarded, opacity ≤ 0.12). Micro-copy: "ASSA = Protagonist of the Stage."
- **2. Manifesto/Problem**: Full-width manifesto → 3-column problem blocks (Streaming revenue not flowing back / Fan labor unpaid / Centralization lock-in). wave divider. Tone: Resolute.
- **3. Solution/Trinity**: `FanNetwork` (adapted from `NodeNetwork`). 3 pillars: streaming (WAVE), consumption (burn), and nodes (mining) circulate around $ASSA, showing supply-demand balance arrows. Node color uses `--data-*`. Tone: Structural.
- **4. Tokenomics** (Forked from ccm SVG chart pattern): `AllocationRing` (allocation donut, synchronized with hover table, **segment colors = `--data-*`/`--coral`/`--gold`, brand red prohibited**) · Live Cumulative Burn (`ValueAccrualLive` SVG pattern) · 2 cards for no-yield lockup/consumption burn (**explicitly stating no interest**) · `VestingTimeline` (TGE/cliff/linear per category). Tone: Data-driven, Hairline.
- **5. Token Sale**: 3-round cards, showing unit price, caps, progress bars, end-timers, and vesting summaries. Active round features brand border + glow. CTA → `app.assawave.io/sale`. Guard copy (KYC, US/CN restrictions, USDC, official contract). Inline anti-phishing micro-banner. Tone: Trust, transparency.
- **6. Market/Scenarios**: Metric stats band (TAM, installs, MAU) → demand/supply scenario line & area. ⚠️ **Prioritize ccm SVG pattern forks even for site marketing charts** (Recharts introduces a new dependency, §Decision #8). Tone: Investor data.
- **7. Mining** (Phase 2): Node mining, front-loaded emission, and auto-stake outline. **"Phase 2" badge**. 1-screen.
- **8. Roadmap**: M1 to M5. Current phase uses brand marker.
- **9. Team & Partners**: Team/advisor grid + MagicSing connection + partner logo row (grayscale, hover to color). **Prohibit image scraping** (use provided assets only).
- **10. FAQ**: Accordion (How to buy / KYC & jurisdictions / **What is no-yield staking?** / Utility / Contract safety).
- **11. Official Domain Banner (Anti-phishing) + Footer**: See §3.1.5.

**Official Domain Banner (Persistent):** Full-width right before the footer (Layout level, all pages). `⚠ Official domain is exclusively assawave.io. All sales on .ai/.net, DM, or airdrop links are scams. Contract: 0xASSA… [Copy]`. Matches build pins `IS_MAINNET` and `ALLOWED_DOMAINS` (exact set). `role="note"`. Icon = `shield-alert`. Red is restricted to this banner.

**SEO/i18n:** `['ko','en','ja']`, ko by default. `react-helmet` title/description/canonical (`assawave.io`)/`hreflang`/sitemap. OG = `MarkSymbol` (▶ wave) on dark canvas. LCP < 2.5s (Hero font preload, below-fold elements load via `React.lazy`).

### 3.2 Token Sale (portal, `/sale`)

⚠️ **Explicit Contract Models (Critical Gap).** ccm Sale is not 'reused' but an **accounting rewrite fork** (DEVELOPMENT_PLAN WS1.4: claimable rewritten, Pausable added, gating decisions).

| | **ccm Actual ABI** (`Sale.tsx`) | **ASSA Target Spec ABI** |
|---|---|---|
| Buy | `purchase(roundId, amount)` | `buy(roundId, assaAmount, proof[])` |
| Claim | `claim(roundId)` (self-contained vesting) | Loaded to external `TokenVesting` |
| Gating | On-chain `whitelist[round][addr]` **boolean read** | Merkle `proof[]` + `merkleRoot` |
| Round Struct | `{priceUsdc, hardCapTokens, soldTokens, cliffSeconds, vestSeconds, startTime, endTime, active}` | `{…, priceUsdcPerAssa, merkleRoot, tgeBps, cliff, duration}` |
| TGE | None (cliff/vest only) | `tgeBps` (0/500/1000) |

⚠️ **Do not portray unconfirmed models (Decisions #4 & #10) as finalized facts in this document.** The UI below assumes the **ASSA spec model is adopted**. If the ccm model is retained, the proof-fetching UI is not rendered (Decision #10 recommendation = maintain per-round whitelist).

**The 5 Commandments:** ① Trust first (what/who/how much right before signing). ② Prohibit infinite approvals (✅ ccm `approve(sale, usdcRequired)` for exact amount, `MaxUint256` unused — **already met, maintain**). ③ Hardcode addresses + display verified + persistent anti-phishing. ④ On-chain is the source of truth (rendered via indexer but cross-checked via RPC right before signing). ⑤ Red = CTA (bg is `--brand-pressed`), Gold = tiers, Progress = coral, Danger = #DC2626.

**Page Structure (Scroll):**
```
AntiPhishingBanner (sticky) → SaleHeader (Global countdown, environment badge)
→ GateChecklist (Wallet → Base → Jurisdiction → KYC: 4 steps) → RoundCards (R1/R2/R3)
→ PurchasePanel (USDC input → approve → buy: 2 steps) → MyAllocations
→ ContractVerifyFooter → TxToast/Drawer
```

**Access Gate (Sequential Lock):** If preceding steps are unmet, lower cards/purchase panels are blurred (blur 2px + lock icon), highlighting only the current step.

| # | Step | Status Color | Action on Failure |
|---|---|---|---|
| 1 | Connect Wallet | Complete Green / Current Coral | RainbowKit Modal |
| 2 | Base Network | — | One-click `switchChain(8453)` |
| 3 | Jurisdiction | — | Block screen |
| 4 | KYC Verification | — | Sumsub/Persona Widget |

> **Complete = Green / In Progress = Coral / CTA = brand-pressed** (Avoid global red to prevent WCAG violations and semantic confusion). Each step features color + icon + text.

**KYC Gating:** ⚠️ **ccm Actual = On-chain `whitelist[round][addr]` boolean read** (no path for backend proof issuance, also specified in DEVELOPMENT_PLAN). Therefore:
- **If retaining ccm model (Decision #10 recommendation):** Gate per-round using the `whitelist(round, addr)` boolean. No proof-fetching UI.
- **If adopting ASSA spec model (New):** Fetch proof via `GET /sale/allowlist/:addr` → inject into `buy()`. By status: `Unverified` / `Under Review` (coral spinner) / `Approved` (green) / `Rejected` (destructive) / `Non-Round Address` (coral, locks that specific round).

**RoundCards:** ccm `RoundRow` (horizontal row) → 3 parallel cards (desktop 3-column / tablet 2+1 / mobile scroll-snap carousel).

| | R1 Private | R2 Strategic | R3 Community |
|---|---|---|---|
| Price (KRW frozen) | 30 KRW | 50 KRW | 70 KRW |
| tgeBps (Spec) | 0 | 500 (5%) | 1000 (10%) |
| cliff | 6m | 3m | 0 |
| duration | 18m | 12m | 6m |

> The unit price is the KRW-to-USDC frozen `priceUsdc` (actual measurement: 6 dec), which acts as the source of truth. The screen displays "30 KRW (Fixed)" primary + USDC conversion auxiliary + "Round USDC price is constant despite exchange rate fluctuations" tooltip.

Card Structure: Round number + status chip (Scheduled gold / LIVE flashing coral / Closed muted) → wave divider → Unit price (Righteous large) → Progress bar (`pct = soldTokens*10000/hardCapTokens` actual calculation, brand fill, 95%+ "Almost Sold Out" in gold, 100% SOLD OUT in gray) → Vesting chip (TGE/Cliff/Linear) → Countdown (Chakra Petch tnum 1s) → [Whitelist ✓][Select Round]. Selected card features brand border + subtle glow.

**PurchasePanel (New — state machine, PreSign, and Steps are absent in ccm):**
- Dual-input toggle: ASSA → USDC / USDC → ASSA. `usdcRequired = amount*priceUsdc/1e18` (actual calculation). MAX button (minimum of balance, remaining cap, and limit). Real-time grid with 3 boxes (`Stat` reused): My USDC balance, sale allowance, and eligibility.
- **2 Steps (Step, New):** ① `approve(sale, exact usdcRequired)` — **"Only for this purchase, no infinite approvals"** (Inherits ccm copy "One-time per amount") ② `purchase`/`buy`. If allowance ≥ required, Step ① is marked done automatically.
- **Confirmation Card before signing (`PreSignReview`, New, Inline):** Round, ASSA to receive, USDC to pay, recipient address (`CopyableAddress withExplorer` verified), vesting schedule, and estimated gas. **Display "Slippage is 0 (Fixed price)"** (slippage is for BME/DEX only, display single line). [Cancel][Sign & Buy].
- **TxState (New State Machine):** idle → pending (waiting for signature) → confirming (confirming on Basescan) → success (green receipt) / fail (destructive). ⚠️ **Announce state transitions via `aria-live="polite"` for screen readers** (waiting for signature, confirming, success, failure; high gap). **Error Decoding Map (New, i18n):** ⚠️ ccm actual prints raw english strings like `writeError.message.slice(0,280)` in `#ef4444` (near brand red) → **replaced entirely**: merkle/whitelist → "Verify whitelist/KYC eligibility", cap → "Exceeded remaining cap", paused → "Sale paused", user rejected → **silent neutral** (not treated as error). Mapped color = `--destructive` token + `alert-triangle` + text label (3-way redundancy) + `role="alert"`. Remove all inline `#ef4444`/rgba hardcoding.

**MyAllocations:** Allocation card per round + receipt (tx hash, Basescan link) + vesting progress + §6 vesting curve `now` marker. ⚠️ **Claims are routed to `/vesting`.** Actual: ccm `claimable`/`claim` logic is deeply embedded in the core of `Sale.tsx` (L143~262). Detaching it and moving it to Vesting is not a simple adaptation but a **claim separation restructuring (medium-scale new work)**, which must follow the **vesting indexing model confirmation (Decision #4)**. The sale screen only displays a link to "View Vesting Schedules".

**Guard Screens:** Unconnected wallet, incorrect network, jurisdictional block, sale undeployed (countdown + notification), and testnet badge.

### 3.3 Dashboard (portal, `/dashboard`)

ccm `Dashboard.tsx` StatCard skeleton (⚠️ StatCard is defined locally → extract to shared primitive) + **veASSA summary + BME burn trends** added.

```
PortalNav → main(max-w-5xl)
├ ① KPI 4 StatCards: Total ASSA Balance · Claimable (green highlight) · veASSA Power (gold) · Next Unlock (D-day)
├ ② Left (2/3) Position Donut | Right (1/3) Breakdown List
├ ③ BME Burn Trend (full-width Line/Area Chart)
├ ④ Transactions Table (Indexer pagination)
└ ⑤ Quick Actions (To Claim · To Lock · Add Token to Wallet)
```

- **KPI:** Label = Chakra Petch mono, Value = `data-xl` tnum. If Claimable > 0, features **Green** glowing border. veASSA = Gold accent. If next unlock is within 7 days, features a Gold pulse (hook-guarded). **Red highlight prohibited** (Green = action available, Gold = premium).
- **Position Donut:** SVG (ccm `AllocationRing` pattern) or Recharts (New, Decision #8). 4 segments (Liquid `--data-2` / Vesting-locked `--coral` / veASSA-locked `--gold` / Claimable `--positive`). **Brand red is unused.** ≤ 5 slices, direct labels, legend + value + pattern redundancy. ⚠️ **Accompany with a data table (`HairlineTable`, sr-only/toggle) · `figure role="img" aria-label` summary** (color alone prohibited, medium gap). Total in center is tnum.
- **BME Burn Trend:** AreaChart, aggregating `BMEBurner.Burned` indexer events. Since burning reduces supply, `--destructive`/`--coral` fill is allowed (but secure visual distance from toast/error red, keyboard focus tooltips). Top metrics: Total burned, burn rate, last 30 days.
- **Transactions:** `HairlineTable`. Time · Type (Purchase/Claim/Lock/Withdraw/Burn) · Amount (tnum) · Tx (Basescan link). Empty state.
- **Data Principle:** Indexer first, with core metrics (Claimable, veASSA power) cross-checked via RPC. If delayed, show "N seconds ago based on on-chain data" label.

### 3.4 Vesting (portal, `/vesting`)

ccm `Vesting.tsx` (215 lines) skeleton + **Timeline Line Chart** + **New Error Handling**.

- **Data:** ⚠️ **Vesting indexing model confirmation is a prerequisite (Decision #4).** ccm/CCMVesting is id-indexed (`scheduleIdsOf` → `schedules(id)` + `releasable(id)`), whereas the spec points to `releasable(address)`. If self-contained is retained, loop through `claimable(roundId, addr)`. **Do not start Dashboard/Vesting work before this is finalized.**
- **Schedule Card:** H3 "Schedule #id" + category tag (gold) · revocable (coral) · revoked (**destructive #DC2626**) + Progress bar (Green fill on rule track) + Field grid (Total, Released %, Claimable green, TGE unlock, Cliff end date, Full vesting date) + CTA "Claim X ASSA" (claimable > 0 & !revoked). If `tgeBps > 0`, show "TGE 5% Instant Unlock" auxiliary label.
- **Timeline Line Chart (New):** X = now → fullyVested, Y = cumulative unlocked. TGE jump → cliff flatline → linear → 100%. **Vertical marker at current time.** vested = solid Green, future = dashed. Toggle multiple schedules. **Accompany with a data table and aria-label.**
- **States (New):** writeError → **decode** then render in a `--destructive` box (⚠️ replace L160 raw english dump and `#ef4444` in actual source) + `role="alert"`, success → green, empty → "No vesting schedules found" + /sale link.

### 3.5 Lock / veASSA (portal, `/stake`) — No-Yield Lockup

> ⚠️ **Priority Constraint: Prevent "yield/interest" misunderstanding.** Spec Invariant 5 ("StakingLock lacks reward distribution pathways"). Replaces the ccm migrate slot as a **new page**. **Keep `/stake` route, but unify H1 and nav labels to "Lock / veASSA"** (blocks associations of "Stake = interest", medium gap).

**No-Yield Disclaimer (Mandatory, non-dismissible, positioned above the form, `role="note"`):**
> **This lockup does not pay interest (APY/rewards).** Locking $ASSA grants **veASSA weight** (ranking, governance, tiers). No new tokens are minted; only your **principal** is withdrawable upon maturity. (Non-transferable, weight decays over time).

- Visuals: Info tone (Gold/neutral border + `info` icon) + **color-independent text label 'No Rewards'** (for screen readers and color-blind safety, medium gap). **Red warning color prohibited** (not a threat, but a fact). Do not use the CTA label "Stake & Earn" → **"Lock for veASSA"**. "Estimated APY: **0% (Intended design)**" is always shown.
- **Lock Creation Form:** Spec `lock(amount, duration)` max 4y. approve → execute 2-Step.
```
Amount input (MAX) + Duration presets (1w, 1m, 3m, 6m, 1y, 2y, 4y hardcap)
→ Preview (Maturity date, initial veASSA = amount × (lock/MAXTIME), estimated tier, decay mini-graph)
→ Step1 Approve (Exact amount only, no infinite approval) → Step2 Lock for veASSA
```
- **veASSA Decay Curve:** X = today → maturity, Y = veASSA. `weight = amount × (lockRemaining/MAXTIME)` sloping downwards. Current marker + "Today X → Maturity 0". **Extension simulation:** moving curve via `increaseUnlockTime`/`increaseAmount` sliders (before = dashed, after = solid). **Tier threshold lines (Gold horizontal lines)** + "Maturity date to maintain tier". Data colors = `--data-*`/`--gold`. **Accompany with a data table and aria-label.**
- **My Locks List:** For each lock card, show principal, maturity date, current veASSA (decayed), tier (Gold badge), decay mini-graph + Actions (Extend duration, Increase amount [exact approve], Withdraw [active only after maturity, disabled + "In X days" otherwise]). **No early withdrawals/penalties (principal only)** copy displayed. "veASSA is non-transferable" chip.

### 3.6 Wallet & Auth (Common Shell · Guards)

**Non-Custodial** — Backend does not hold funds; users sign transactions directly.

- **Connection:** RainbowKit (MetaMask, Coinbase, WalletConnect) with custom dark canvas theme (accent = `--brand`). **Single-chain pin** (Build-time `app` = 8453 / `testnet` = 84532). If connected to another chain, show warning + "Switch to Base".
- **SIWE:** ccm `useSession`/`siwe.ts` 1:1. **On-chain reads do not require SIWE** (displayed simply by connecting wallet); SIWE is for off-chain personalization (notifications, KYC status) only → minimizes friction.
- **Guard States:** Unconnected / Incorrect network / Unauthenticated SIWE (restricted to personalization only) / KYC incomplete (**Sale buy() gating only**, not required for viewing) / Jurisdictional block (US/CN). Persistent anti-phishing banner active on all guards.
- **Transaction UX:** Display "What, which contract, and exactly how much" summary for all write transactions before signing; avoid infinite approvals. State machine + `aria-live`. Colors: Success = Green, Failure = #DC2626, Progress = coral, brand red is reserved for CTA/burn data.

### 3.7 Admin · Phase 2·3 (Outline)

- **Admin:** Persona-based RBAC (§2.4, **requires expanding two maps in personas.ts with new keys first**). New `StakingAdmin` (veASSA parameters, `MAXTIME`) · `BMEAdmin` (burn, LP, TWAP/Chainlink price sources). All writes require Safe member SIWE + audit logs. Reuses ccm admin primitives (dark).
- **Phase 2 (M4):** Consumption competition (`/compete` burn ranking) · Node operators (`/node` auto-stake) · NFT marketplace (ERC-1155) · MagicSing integration. If event indexer is overloaded, re-evaluate Ponder/Graph.
- **Phase 3 (M5):** Governance portal (veASSA voting) · All-Kill Pool/prediction market (VRF) · L3 migration (bridge UI).

---

## 4. Component Library

⚠️ **Correct 'reused/new' labels based on the actual codebase** (Critical/high gaps). **The actual primitives in ccm (`portal/src/components/site/primitives.tsx`) are only `Card`, `CTA` (primary/ghost only), `Stat`, `SectionLabel`, `H1~H3`, `Lede`, and `DefRow`**. Steps, Field2, Toasts, Badges, Tags, StatCard (local), ProgressBars, WalletStatusBars, focus rings, 44px, and error decoding are **absent in all apps → new**. New component DoD: **focus-visible rings, 44px hit-areas, aria-live (status), color-independent indicators, keyboard accessibility, and 6 standard states (default/hover/focus/disabled/loading/error)**.

| Component | Variant | Key States | Real/New (Measured) |
|---|---|---|---|
| **Button** | `primary` (**bg = brand-pressed**, white text AA, hover brand-hover + translateY-2px + glow) / `secondary` / `ghost` / `gold` (moderated) | loading = PlayGlyph pulse + `aria-busy`, disabled, **focus ring** | ⚠️ ccm = `CTA` (primary/ghost only). **secondary/gold, focus, min-h-44 are new** |
| **Card / Glass** | Card (`paper-deep` + 1px rule) / Glass (`nav-bg` + blur, nav/modal only) | hover border emphasis | ✅ ccm `Card` reused (token audited) |
| **Input/Select/Textarea** | Amount input (`font-data tnum` + `ASSA` addon, MAX 44px) | focus ring + brand border, error border destructive + `alert-triangle` + message + `role=alert`, disabled | ⚠️ **New** (ccm Field is a Vesting local function, Field2 absent) |
| **Badge** | Status (positive/warning/destructive/coral/neutral) `radius-pill` `font-data` | — | ⚠️ **New** (ccm Tag absent) |
| **Tier** | veASSA Tier (gold border + gold surface + `zap`, upper tiers feature higher saturation) | — | New |
| **Modal** | `elev-3` + `radius-lg`, backdrop Glass, **focus-trap & Esc** | entrance scale 0.98→1 (hook-guarded) | New |
| **Nav** | SiteNav / AnchorNav / PortalNav | active = color + **bold weight / 2px underline / aria-current**, sticky blur, mobile drawer | ✅ Site chrome reused (active color-independent indicators reinforced) |
| **WalletButton** | Unconnected (primary + wallet) / Connected (secondary + network chip + address chip) | incorrect chain = destructive "Switch" | ⚠️ **New** (RainbowKit wrapper, WalletStatusBar absent) |
| **Stat** | Label + Value (`data-xl` tnum) + Delta (positive/destructive + arrow) | — | ✅ ccm `Stat` reused (StatCard extracted as new) |
| **Step** | Horizontal/vertical: Complete = positive + check, Current = coral border + pulse, Waiting = rule | Approve → Confirm → Receipt | ⚠️ **New** (ccm Step absent) |
| **ProgressBar** | Track surface-2 + fill brand (or brand → coral) `radius-pill` + tnum % | pending = WaveLines flow (hook-guarded) | ⚠️ **New** |
| **Toast** | `elev-2` + status icon + 4px border (positive/destructive/neutral) | Auto-dismiss 5s + `aria-live="polite"`, tx hash link | ⚠️ **New** |
| **GateChecklist** | 4-step stepper | done green / in progress coral / waiting rule | New (Step extension) |
| **VestingCurve / DecayCurve** | SVG/Recharts (TGE jump, cliff, linear / veASSA decay) | now marker, vested solid, future dashed, **data table, aria-label, hook-guarded** | New |
| **CountdownTimer** | `font-data tnum` `00d 00:00:00` | Server time synced, unsynced `--:--:--`, flashing off on reduced-motion (**hook-guarded**) | New |
| **PreSignReview** | Inline confirmation card (address, amount, vesting, gas, slippage 0) | — | New |
| **AntiPhishingBanner** | Sticky thin bar, `role="note"` | Re-exposed once per session | New |
| **CopyableAddress** | `shortAddress` + copy (copy → check 1.5s) + `withExplorer` | focus ring | ⚠️ **Requires tokenization refactoring** (below) |
| **AddAssaToWallet** | `wallet_watchAsset` | — | ✅ ccm `AddCCMToWallet` ported |

⚠️ **CopyableAddress Refactor (High Gap, Measured):** ccm uses **hardcoded** `bg-neutral-800/50` · `text-neutral-500` · `focus:ring-green-500` → incompatible with 'unmodified reuse', fails to track the light theme, and uses a non-brand focus color. Replace: `bg-neutral-800/50` → `var(--surface-2)`, `text-neutral-500/200` → `var(--ink-soft)`/`var(--ink)`, and `focus:ring-green-500` → `:focus-visible outline var(--brand)`. Assign a **44×44 transparent touch target** to copy/explorer icon buttons (actual size is a 14px SVG). Maintain `withExplorer` aria-label.

---

## 5. Responsive, Accessibility, Performance, i18n, Motion, & Implementation Mapping

### 5.1 Responsive (375 / 768 / 1024 / 1440)

| Width | Layout |
|---|---|
| **375** | 1 column. nav → hamburger drawer (44px). site `px-6`, AnchorNav horizontal scroll. Sale rounds = scroll-snap carousel, GateChecklist vertical accordion, purchase panel sticky bottom CTA bar. Donut vertical stack. |
| **768** (`md`) | nav inline. 2 columns. `px-14`. Sale input + summary 2-tier. |
| **1024** | portal/admin `max-w-5xl`. Dashboard 3 columns. Sale 3 columns + right vesting curve. |
| **1440** | site Hero wide margins. Upper limit on content width. |

⚠️ **44px Touch Targets = Newly Applied (Not inherited).** Actual: ccm CTA `px-4 py-2.5` + 11px ≈ 31px, CopyableAddress buttons ≈ 14~18px, hamburger 36px, AnchorNav py-3 ≈ 33px — all sub-standard. When forking primitives, apply `min-h-[44px]` (or increase py) + 44×44 transparent touch targets for icon buttons. **Conduct full audit of hamburgers, copies, MAX, and round chips (§7).** Since increasing py breaks the 11px label proportion, review label fonts. `inputmode="decimal"`. `scroll-snap` + `scroll-margin-top` (nav 64px).

### 5.2 Accessibility (WCAG 2.1 AA)

- **Contrast (Reflected actual measurements):** Body 4.5:1, large/UI 3:1. ⚠️ **White text on #EF2525 = 4.23:1 FAIL → Primary bg = brand-pressed.** Gold = accent/border only. Dark `#0B0B14` + `#F8FAFC`.
- **Focus (New):** ⚠️ focus-visible is **entirely absent** in ccm primitives. Newly introduce global `:focus-visible{outline:2px var(--brand-on-dark);offset 2px}` + establish as a gate for all interactive primitives (buttons, links, inputs, round cards, steps, CopyableAddress). Light theme focus ring = brand-pressed.
- **Keyboard:** Tab navigation, Esc key to close, and focus trapping (drawers, modals). Round selection roving tabindex.
- **Semantics:** `<header>`/`<nav aria-label>`/`<main>`, h1 → h2 hierarchy. AnchorNav `aria-label`.
- **Status Conveyance (Prohibit color alone — Expanded):** pending/success/fail use color + Lucide icon + text. ⚠️ **Mandate color-independent indicators (bold weight / underlines / icons / `aria-current`) even for active navigation, ProgressBars, tiers, and stake completion.** Anti-phishing and No-Yield banners use `role="note"`.
- **Transaction aria-live (New):** Voice guidance for amounts, rounds, and gas, with state transitions via `aria-live="polite"`. user-rejected is silent neutral.
- **Chart Accessibility (New):** All data charts (1) provide equivalent data tables (`HairlineTable`, sr-only/toggle), (2) feature segment patterns/direct labels + values, (3) include `figure role="img" aria-label` summaries, (4) feature keyboard focus tooltips. **Codify 'charts must not rely on color alone and must accompany data tables'.**
- **i18n Accessibility:** `<html lang>` dynamic, Korean `word-break: keep-all`.

### 5.3 Performance (LCP < 2.5s)

- **Code Splitting:** Route splitting via `React.lazy` + `Suspense` (portal Sale 815 lines · charts). Prioritize landing Hero; delay below-fold elements.
- **Charts:** ⚠️ ccm charts are **entirely inline SVG (zero recharts dependencies)**. Forking SVG patterns does not require dynamic imports. If introducing Recharts (limited to Dashboard donut & BME only), import dynamically.
- **Skeletons:** Render fixed-height skeletons while indexer queries (CLS 0). ccm `ValueAccrualLive` · `TVLLive` SVG patterns.
- **Data:** Prioritize indexer/D1 cache + on-chain validation. Direct RPC is limited strictly to transaction broadcasts.
- **Assets:** Inline SVG for `WaveMark`/`MarkSymbol`/waves. Fonts use `font-display: swap` · subsets (Righteous Latin · Pretendard/Black Han Sans CJK). LCP = Hero text → font preload. CLS: fixed sticky nav height · explicit image dimensions.

### 5.4 i18n (ko Default / en / ja)

⚠️ Actual Measurements: All 4 ccm apps are `en` single-instance (`supportedLngs:['en']`, `lng:'en'`). ASSA ko/en/ja requires **structural reuse + entirely new content (3 languages × 4 apps independent instances)** — more expensive than 'reuse + adapt'.

- `i18n.ts` `supportedLngs:['ko','en','ja']`, `fallbackLng:'ko'`. Add ko/ja to backend `VALID_LANGS`.
- ccm namespace pattern (`nav`/`vesting`/`earth` etc.) → 1:1 mirror of `ko.json`/`en.json`/`ja.json` per app.
- Fonts: Latin = Righteous/Poppins, CJK Body = Pretendard/Noto Sans JP, **CJK Title = blocky display (Decision #7)**. ⚠️ **Add validation cases to ensure `:lang()` branching propagates to data font areas** such as countdowns, chart axes, and amounts.
- Locale: KRW 30/50/70 frozen + USDC conversion, `Intl` dates/numbers, tnum.
- **Multilingual Audit Gate (Legal + Security):** 3-language check for the "No-Yield" disclaimer, SIWE `APP_STATEMENTS`, anti-phishing banners, and **revert error decoding strings**.
- SEO i18n: `hreflang` · multilingual OG · language-specific sitemaps.

### 5.5 Motion + reduced-motion

Systematize the wave/▶ motifs into dividers, backgrounds, loading, CTA hovers, and progress bars. Hover duration 150–300ms, section gaps 48px+, scroll-snap. Prohibit AI slop — hover only uses color, borders, and micro-transforms. ⚠️ **Parallel implementation of CSS resets + `useReducedMotion()` hook guards (§1.4)**: CSS covers transitions and CSS animations, while the hook covers JS/`setInterval`/rAF (WaveLines, CountdownTimer, live BME, progress bar pulses). Verify hook guards on inherited ccm live components.

### 5.6 Implementation Mapping (Components → 4 Apps + Shared Package)

DEVELOPMENT_PLAN §3 **Option A** (separate shared package `assa-ccm-shared` + git dependency).

| Layer | Shared Location | Consumption | ccm Source (Actual Path) |
|---|---|---|---|
| chains/config | `packages/config` | 4 apps + Worker | `wagmi.ts` · `env.ts` (8453/84532 · `IS_MAINNET`) |
| ABI/Addresses | `packages/abi` | 4 apps + Worker | `contracts.ts` (typechain, frozen pins) |
| auth/session | Shared | portal/admin/Worker | `siwe.ts` · `session.ts` (ALLOWED_DOMAINS exact set) |
| UI Primitives/Tokens | `packages/ui` | 4 apps | ⚠️ **`portal/src/components/site/primitives.tsx`** (absent in frontend) · `index.css` (§1.0a audit then swap) |
| site Chrome | site + partially shared | site | `SiteNav` · `AnchorNav` · `SiteFooter` · `Section` · `Heading` · `LegalLayout` · `ThemeProvider`/`ThemeToggle` |
| brand | `packages/ui` | 4 apps | `WaveMark` · `MarkSymbol` · `WaveLines` · `PlayGlyph` · `FanNetwork` |

⚠️ **Correction on Paths:** `primitives.tsx` **only exists in portal/admin's `components/site/`** (absent in marketing site). Marketing site only uses `Section`/`Heading`/`SectionLabel`/`HairlineTable`/`LegalLayout` + `brand`. When extracting the shared package, **the site imports portal primitives as its source** (currently scattered → pulling up is new work).

**Migration Order (No big bang, ccm regression gates at each step):** ① session + chains/config → ② viem helpers/ABI → ③ UI primitives → ④ domain hooks. Extract minimally from M1, so the fork imports from shared from the beginning.

**Deliverables Mapping:**

| File | Content | Source |
|---|---|---|
| `frontend/src/index.css` | `@theme` + `[data-theme]` tokens, fonts, radii, motion, reduced-motion, **:focus-visible** | ccm adaptation (§1.0a audit) |
| `frontend/src/lib/tokens.ts` · `theme.ts` | TS token mirror (+ `--data-*`) + `ThemeContext`/`useTheme` | ccm reuse |
| `*/hooks/useReducedMotion.ts` | matchMedia subscription hook | ✅ ccm reuse (subscribes all motion) |
| `frontend/src/components/site/` | ThemeProvider/Toggle/Section/Heading/SectionLabel/HairlineTable/SiteNav/AnchorNav | ccm reuse (token swap, active color-independent indicators) |
| `frontend/src/components/brand/` | WaveMark (glyph 2-path groups) / MarkSymbol / WaveLines / PlayGlyph / FanNetwork | ccm Wordmark/SignalPlot/NodeNetwork adaptation |
| `portal/src/components/site/primitives.tsx` | Card/Stat/H1~3/Lede/DefRow (reused) + Button variants/Input/Badge/Step/ProgressBar/Toast/WalletButton (new) | ccm + New |
| `portal/src/components/CopyableAddress.tsx` | Address, copy, explorer | ⚠️ Tokenization refactor + 44px |

**New Components (all applying a11y DoD):** portal `/stake` veASSA UI, DecayCurve, No-Yield copy, admin `/staking` & `/bme`, site `team` & `faq` sections, BME burn dashboard, GateChecklist, PreSignReview, CountdownTimer, AntiPhishingBanner, VestingCurve, error decoding map, and MarkSymbol.

---

## 6. Decisive Actions Required (⚠️) + Recommendations

> ✅ **Pre-requisite Blocks Cleared (Confirmed 2026-05-30):** #9 Vesting = **maintain ccm id-indexed** · #10 Gating = **maintain per-round whitelist** · #13 moss = **3-way semantic audit**. → Blockers cleared for detaching Dashboard/Vesting/Sale claims.

| # | Decision | Options | **Recommendation** | Original Plan Decision |
|---|---|---|---|---|
| 1 | Sale Location | site vs portal | **portal** (wallet, KYC, tx security) | — |
| 2 | Route Structure | 2-tier nested URL vs 1-tier flat | **Nested Layout Shell + 1-Tier Flat URL** (ccm proven pattern) | — |
| 3 | Subdomains | Single vs 4-way separation | **Separation** (cookies, CSP, anti-phishing) | — |
| 4 | Theme Default | Light vs Dark | **Dark default + light toggle** (site), portal/admin force dark | — |
| 5 | navy/gold · 3 red families | Body vs Accent | **gold = surface, border, tier only (text prohibited)**, navy = dark canvas, data = `--data-*`, 3 red families **ΔE separated** | — |
| 6 | CJK Body | Noto KR vs Pretendard | **Pretendard (KO)** + Noto Sans JP (JA), Noto KR fallback | — |
| 7 | **CJK Display** | Pretendard ExtraBold vs Blocky Display | **Blocky CJK Display (Black Han Sans/Noto JP 900) actual comparison gate** — Righteous is Latin-only; Pretendard is rounded and clashes with blocky BI | — |
| 8 | Chart Library | ccm inline SVG vs Recharts | **Reuse = ccm SVG pattern fork (zero dependencies)**; Recharts is limited to **new screens only** like Dashboard donut & BME | — |
| 9 | **Vesting Indexing** | id-indexed vs `releasable(address)` | ✅ **Confirmed: Maintain CCMVesting self-contained id-indexed** (loop through `claimable(roundId, addr)`) | **#4** |
| 10 | Sale Gating | on-chain whitelist boolean vs merkle proof injection | ✅ **Confirmed: Maintain per-round whitelist (zero contract changes)** — KYCRegistry serves frontend/backend gating + on-chain source of truth in parallel. Proof-fetching UI unnecessary. | Plan **#3** |
| 11 | Source Sharing | Option A vs Monorepo | **Option A** (separate package + git dependency) | **#5** |
| 12 | Complete Status Color | Red unification vs Green separation | **Complete = Green, In Progress = Coral, CTA = brand-pressed** (WCAG/semantics) | — |
| 13 | **moss/clay Mapping** | Flat renaming vs Semantic branching | ✅ **Confirmed: Branch after §1.0a 3-way audit** (brand, data, positive). Upgrade WS2.1 to audit-based semantic branching | — |
| 14 | **admin Sale Route Name** | Keep `/tge` vs Rename `/sale` | Rename requires explicit decision + **adding new keys to two maps in personas.ts first** | **#14** (SIWE) |
| 15 | **BI Master Weight** | Bold wordmark vs Thin lockup | **Bold wordmark = Primary**, thin ASSA = secondary, ▶ + wave symbol = mark | — |

---

## 7. Immediate Execution (First Sprint Checklist)

**Design Tokens (WS2.1 — preceding moss audit)**
- [ ] ⚠️ **moss/clay audit (§1.0a)**: grep all instances of `moss\|clay\|--moss\|text-moss` (actual ~237 cases) → replace with brand/data/positive 3-way branching → verify with `git diff` that data and success have not leaked to red.
- [ ] `frontend/src/index.css` fork: Swap CSS variables for ASSA (`--brand` #EF2525 / `--coral` #E0563F / `--gold` / `--data-1`, `--data-2`) + Light/Dark (dark by default, **light = pure white brand decision**) + **Primary bg = brand-pressed** + **New :focus-visible**.
- [ ] Replace font imports: Space Grotesk/JetBrains Mono → Righteous/Poppins/Chakra Petch/Pretendard. `:lang` branching + `.tnum` + **CJK Display Candidates (Decision #7)**.
- [ ] `lib/tokens.ts` TS mirror (+ `--data-*`) + verify `ThemeProvider` (`DEFAULT_THEME="dark"`) operation.
- [ ] `pa11y`/`axe` CI gate + **button label actual measurement case** (white text on surface color) added.

**Core Components (Real = Token Audited / New = a11y DoD)**
- [ ] `WaveMark` — `logo01.png` actual glyph (**path groups: ① intact ASSA, ② left independent 3-line wave stripe**), `brand`/`ink` `currentColor`. `MarkSymbol` (▶ + wave, OG/favicon).
- [ ] `WaveLines` (data color `--data-1`, **hook-guarded**) · `PlayGlyph` · `FanNetwork`.
- [ ] Primitives: Render verification after token auditing `Card`/`Stat`/`H1~3` / **New Button variants, focus, min-h-44**.
- [ ] **CopyableAddress Refactor**: Replaces hardcoded colors (`neutral-800/50`, `green-500`) with tokens, 44×44 touch targets, and Basescan link.

**Landing Hero First Sprint (WS2.2)**
- [ ] `Earth.tsx` → `Home.tsx` fork (**ASSA reordered sequence**, §2.2), 11-section skeleton + AnchorNav 6-anchors (active with color-independent indicators).
- [ ] Hero 2-column: Left = `Heading` (pre/em, em = brand) + 2 CTAs (sale external/whitepaper, **Primary bg = brand-pressed**), Right = Countdown card (`CountdownTimer` tnum, hook-guarded).
- [ ] Hero background ▶ wave (WaveLines + PlayGlyph, **useReducedMotion guarded**, opacity ≤ 0.12).
- [ ] SiteNav: WaveMark + NAV_ITEMS (anchors + whitepaper) + APP CTA (external) + language selector (ko/en/ja) + ThemeToggle (44px hamburger).
- [ ] Persistent domain banner (Layout level, `shield-alert`, `role="note"`, `ALLOWED_DOMAINS` exact set build pin) + SiteFooter fork.
- [ ] i18n ko default + **backend VALID_LANGS, SEO hreflang, OG MarkSymbol** + LCP < 2.5s (font preload, below-fold elements lazy loaded).

---

*This document takes the ASSA WAVE Design Foundation and the ccm actual source IA as the single source of truth, but prioritizes measured facts validated through adversarial critique. **Key Corrections:** ① ccm reuse is not a simple 'variable swap' but entails a **moss/clay semantic audit and the new construction of focus states, 44px targets, error decoding, and Step/Input/Toast/ProgressBar/WalletButton** (critical). ② White text on #EF2525 = 4.23:1 FAIL → **Primary bg = brand-pressed** (WCAG). ③ Sale uses ccm's `purchase`/`whitelist` boolean/self-contained model, representing an **accounting rewrite fork**, and the contract model (Decisions #4 & #10) remains unconfirmed. ④ Charts in ccm are entirely inline SVG (Recharts is a new dependency). ⑤ The wordmark is 'intact A + left independent wave stripe', and the master BI is the bold wordmark. **Substantially New Designs:** portal `/stake` veASSA (no-yield copy, DecayCurve), BME burn dashboard, sale GateChecklist/PreSignReview/error decoding, WaveMark/MarkSymbol/PlayGlyph, ko/en/ja i18n, and new primitives set (a11y DoD). Execution of §7 begins after §6 decisions (#4 Vesting, #10 Gating, #13 moss audit, #15 BI weight) are finalized.*
