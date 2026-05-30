# ASSA WAVE Site — Hallyu Cinematic Redesign Planning & Development Plan

> **Version:** v1.0 · **Date:** 2026-05-30 · **Official Domain:** assawave.io
> **Parent Documents:** `ASSA_WAVE_SITE_DESIGN.md` (Design Single Source of Truth) · `DEVELOPMENT_PLAN.md` (Overall Development Plan)
> **Target:** Marketing site (`site/`) landing page. App/Portal/Admin are out of scope.
> **Status:** Foundation (Increments 1 & 2) applied / Photos (Increment 3) pending `GEMINI_API_KEY` gate.

---

## 0. Why This Document Is Needed (Problem Definition)

User Feedback (2026-05-30) - 2 Issues:

1. **2-tier Menu Structure** — Overkill compared to the content.
2. **Overly Technical Design** — Even though it's fandom/entertainment, the tone became overly technical due to borrowing patterns from CCM (a carbon credit technology project). **Photos should be used, and entertainment sites should be referenced.**

### 0.1 Diagnosis — "Hallyu Pulse (Techno)" Build Deviated from Design Intent

The previous build ("Hallyu Pulse / Techno-Performance") was effectively using the **crypto trading/developer dashboard syntax**:

| Signal | Location | Why It Is "Technical" |
|---|---|---|
| chamfer (angled clip corners) | All cards & panels | Hardware/sci-fi signal |
| bg-grid (background grid) + scan line | Hero, Top notification bar | Terminal/HUD |
| Equalizer SVG (21 bars + waveform) | Hero main visual | Zero human presence or excitement; abstract engineered graphics as the protagonist |
| mono `font-data` + uppercase tracking | All section labels (`§ 04`, `SUBLABEL`) | Spec sheet/Terminal |
| Hub-spoke wire diagram | Solution | Engineering diagram |
| RISC-V node SVG | Node | Hardware blueprint |
| `border + bg-paper-deep` rectangular card + `borderTop` data color | All sections | Datasheet |

**Core Contradiction:** Fandom should spotlight *people, artists, stages, and excitement*, but the build did the exact opposite, putting *abstract technical graphics* in the spotlight.

> ⚠️ `ASSA_WAVE_SITE_DESIGN.md` §0.1 already specifies the tone gradation: **"Top = Fandom (Vibrant & Bold), Bottom = Investors (Restrained)"**. The Techno build deviated from this intent, and this redesign is a **return to the design intent** (not a new direction).

### 0.2 References (refero.design Research)

Common patterns of entertainment/music/fan platforms:

| Site | Pattern | Key Takeaways |
|---|---|---|
| **Spotify for Artists** | Full-bleed artist photo hero + large single-line white headline + single nav + 4-column footer | Dark cinematic + photo-led + **single nav** |
| **Patreon** | Full-bleed portrait photo + color wash (blue) + ultra-large thin typography | Color as a mood overlay on photos |
| **The Pop Manifesto** | Highly saturated color field + oversized typography + photos as content | Fandom energy (zine style) |
| **Tidal / Vevo** | Dark, photo-led, bold sans-serif | Music brand dark cinematic |

Commonalities: **Photo-led, single-line menu, pill buttons, color overlay for mood, zero technical decorations (grid/chamfer/equalizer).**

---

## 1. Confirmed Direction (User Decision 2026-05-30)

| Item | Decision | Notes |
|---|---|---|
| **Photo Source** | **AI-generated Mood Images** | Original images of concert crowds, stage lighting, lightsticks, silhouettes, etc., *without specific individuals*. Actual idol photos are **not allowed** due to copyright and portrait rights (scraping prohibited). Generated using nano-banana (Gemini 3 Pro Image). |
| **Visual Mood** | **Dark Cinematic** | Similar to Spotify for Artists/Tidal/Vevo. Retains the dark canvas + full-bleed photos + white typography + red accents. Reuses the current dark base → minimizes rebuilding. |
| **Menu** | **Single Navigation** | Single-line header (logo + section links + "Open App" pill + theme). Removes the separate AnchorNav bar. |
| **Brand Red** | **Retain** (#EF2525) | WCAG: White text contrast surface is `--brand-pressed` (#C81E14). Emphasis on photos is `#ff7a6b` (dark-locked). |

### 1.1 Summary of Design System Changes ("Hallyu Pulse" → "Hallyu Cinematic")

| Token/Syntax | Before (Techno) | After (Cinematic) |
|---|---|---|
| Corners | chamfer (angled clip) | **Rounded** (`.chamfer` = border-radius 20/14/28, `.card` = 20px) |
| Buttons | chamfer clip | **Pill** (`border-radius: 999px`) + `.btn-on-photo` for photos |
| Labels | `font-data` mono · uppercase · tracking 0.16em | Body font · tracking 0.08em (relaxed `.eyebrow`) |
| Background Deco | bg-grid · scan line | **Removed** |
| Photos | None (SVG illustration only) | **media-frame · media-cover · scrim-b/l/veil · stage-fallback** utilities |
| Hero Visual | Equalizer SVG | **Full-bleed photo + stage-lighting stage-fallback** |
| Solution | Hub-spoke wire | **3 Cinematic Media Cards** (photo slots) |
| Data Grid | Right-angle hairline | Rounded (`rounded-[20px] overflow-hidden rim`) |
| Glow / Red Accent | (Retained) | **Retained** — aligns with cinematic mood |

> The tokens and palette (WCAG audited values, moss audit DATA classification) are **preserved exactly**. To avoid conflicts with standard Tailwind `rounded-*` scales, we do not introduce `@theme` radius tokens. Instead, we use literal values for custom classes and standard Tailwind utilities in the markup.

---

## 2. Content Decisions

| Item | Decision |
|---|---|
| Hero Copy | Retain existing — "The new wave of K-pop fandom, **owned by fans.**" (already fandom-oriented) |
| Hero Bottom Band | Remove token specs (facts) → **Value Band** (chips: Streaming→Value / Fan rewards / On-chain proof / Fan-owned). Spotify-style 4 columns. |
| Dead Copy | **Delete** `hero.facts` / `factsLabel` / `factsBadge` / `vizLabel` / `vizFoot` / `vizChannels` (unused due to equalizer removal). |
| Language | Keep English-only (i18n `lng: "en"`, ko/ja not loaded). |
| No-sale | Retain (no token sales surfaces — KR legal requirement). |
| Data Charts | **Retain** Tokenomics donut/burn/vesting and market scenario charts (justified for a token project). However, de-mono the framing labels only. |
| RISC-V Node SVG | Retain (justified product concept visual). Cinematic photo backdrop applied in Increment 3. |

---

## 3. Development Plan (by Increments)

### ✅ Increment 1 — Foundation + Menu + Hero (Complete, no key needed)

- Rewrite `index.css`: rounded, pill, relaxed labels, photo utilities (`.card .media-frame .media-cover .scrim-* .stage-fallback`), `.btn-on-photo`. Removed bg-grid/scan/eqbar.
- `Layout.tsx`: **2-tier → 1-tier** single navigation + slim anti-phishing strip (scan line removed) + footer clean-up.
- `Home.tsx`: Remove redundant `AnchorNav`.
- `Hero.tsx`: Equalizer → **Full-bleed cinematic hero** (stage-fallback + photo slot `/brand/hero-crowd.jpg` + pill CTA + value band).
- Validation: typecheck clean · build green · Desktop/Mobile screenshots OK.

### ✅ Increment 2 — Section Harmonization (Complete, no key needed)

- Solution: **Remove** hub-spoke wire → 3 Cinematic Media Cards (stage backdrop + photo slots `/brand/engine-{streaming,spending,nodes}.jpg`).
- Tokenomics/Market/Node: Cards → `.card` rounded, `borderTop` data color → color accent bar, data grid rounded, mono labels de-monoed, `§` removed, secondary CTA made into pills.
- Manifesto: De-mono FAIL/eyebrow labels.
- Delete dead components: `AnchorNav.tsx`, `WaveLines.tsx`. Clean up dead copy (en.json).
- Validation: typecheck clean · build green.

### ⏳ Increment 3 — AI Mood Images (Requires key = `GEMINI_API_KEY`)

> **This is the core lever for the quality jump.** Increments 1 and 2 created the *vessel* to receive the photos. While the vessel is empty (stage-fallback gradient), it is normal for the hero/cards to look somewhat bare. The "entertainment" quality is only complete once actual photos are populated.

**Prerequisites:** User adds `export GEMINI_API_KEY=...` to `~/.zshrc` (credentials — do not paste in chat). genai and Pillow are already installed.

**Generation Script:** `~/.claude/.../nano-banana/scripts/generate_image.py "<prompt>" <out> --aspect <r> --size 2K`

**Image Slots (filenames must match the code):**

| File | Slot | Aspect Ratio | Prompt (Summary — *No identifiable real people allowed*) |
|---|---|---|---|
| `site/public/brand/hero-crowd.jpg` | Hero background | 16:9 | "Massive K-pop arena concert seen from behind the crowd, thousands of red lightsticks and phone lights, bright stage glow ahead, cinematic bokeh, deep dark tones, dominant red #EF2525 light, shot from back of arena, no identifiable faces (backs of heads / silhouettes), shot on 35mm, volumetric haze" |
| `site/public/brand/engine-streaming.jpg` | Solution card 1 | 4:5 | "Close-up of headphones glowing teal in the dark, sound-wave light streaks, cinematic, moody, no faces" |
| `site/public/brand/engine-spending.jpg` | Solution card 2 | 4:5 | "Concert merch / lightstick under warm amber stage light, sea of hands raised, bokeh, cinematic dark, no identifiable faces" |
| `site/public/brand/engine-nodes.jpg` | Solution card 3 | 4:5 | "Abstract indigo network of light nodes over a dark stage, edge-device glow, cinematic, no faces" |
| `site/public/brand/node-stage.jpg` (New Slot) | Node backdrop | 3:2 | "Single edge-AI device glowing on a dark stage with red rim light, cinematic product hero, no faces" |

**Workflow:** Parallel generation of slots (Workflow fan-out possible) → Save to `public/brand/` → Scrim/contrast tuning (especially white text contrast on photos in light theme) → Validation of mobile/dark/light screenshots.

### ⏳ Increment 4 — Deferred Sections (Separate, no key needed)

Based on `ASSA_WAVE_SITE_DESIGN.md` §3.1: Roadmap (M1~M5) · FAQ (Accordion) · Standing anti-phishing banner (Complete) · SiteFooter upgrade. **Team & Partners are deferred by user request.**

---

## 4. Acceptance Criteria

- [ ] Single-line menu (no stacked/redundant nav) — ✅ Increment 1
- [ ] Hero is photo-led (not abstract graphics) — Vessel ✅ / Photos ⏳ Increment 3
- [ ] Consistent rounded corners & pills across all sections — ✅ Increment 2
- [ ] Remove mono terminal labels — ✅ Increment 2
- [ ] Apply 5 actual mood photos — ⏳ Increment 3 (`GEMINI_API_KEY` gate)
- [ ] WCAG AA text contrast on photos for both light/dark themes — ⏳ Increment 3
- [ ] typecheck clean · build green — ✅ Maintained
- [ ] Pass adversarial design review (tone, contrast, accessibility, responsiveness) — ⏳ After Increment 3

---

## 5. Risks / Dependencies

1. **Quality jump depends on `GEMINI_API_KEY`.** Without the key, only the cinematic *structure* is possible (empty vessels for photos). → User key setup is a prerequisite for the next session.
2. **Text contrast on photos (light theme).** Hero/Solution cards have a fixed dark backdrop with white text — safe even in light theme. However, theme-responsive SVGs such as Node may break in light theme if a dark backdrop is forced, so we will handle this with photo + fixed dark treatment in Increment 3.
3. **Copyright/Portrait rights.** No real idols or third-party product photos. AI generation must also avoid *identifiable real people* (backs of crowds, silhouettes, hands, objects).
4. **Reown/WalletConnect console 403/400** — scaffold projectId noise, irrelevant to the landing page.
