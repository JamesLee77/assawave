# AI Mood-Image Generation — Runbook

> What's needed to (re)generate the site's AI mood images. **Not required to run,
> build, or deploy the site** — the current images already ship as static assets
> and are live. This is only for creating new images or refreshing existing ones.

## TL;DR

1. Set `GEMINI_API_KEY` (your credential — see below).
2. Generate images with the **nano-banana** skill (Google Gemini 3 Pro Image).
3. Save into `site/public/brand/` using the exact filenames in the table below.
4. Verify (`npm run build`, `/browse` desktop + mobile, light + dark), then deploy.

## 1. Prerequisite — `GEMINI_API_KEY` (the only blocker)

- Get a key from **Google AI Studio** → https://aistudio.google.com (free tier exists).
- It is a **credential** — the owner sets it; never paste the value into chat or commit it.
- Provide it for a session so the agent can use it:
  ```
  ! export GEMINI_API_KEY=...your_key...
  ```
  …or persist it in `~/.zshrc`. `genai` + `Pillow` are already installed.
- The agent **cannot create the key** (it's tied to your Google account/billing); everything
  else (prompting, generation, placement, tuning, verification) the agent does.

## 2. Tool

nano-banana skill (text→image / edit / compose, Gemini 3 Pro Image). Script:
```
~/.claude/plugins/marketplaces/devon-claude-skills/plugins/nano-banana/skills/nano-banana/scripts/generate_image.py \
  "<prompt>" <output-path> --aspect <ratio> --size 2K
```

## 3. Image slots in use (authoritative — supersedes the old `engine-*.jpg` table)

All live under `site/public/brand/`. Filenames must match exactly (the code references these):

| File | Role | Aspect | Prompt direction |
|------|------|--------|------------------|
| `hero-crowd.jpg` | Hero background | 16:9 | Massive K-pop arena from behind the crowd, thousands of red lightsticks + phone lights, bright stage glow ahead, dominant red #EF2525, deep dark tones, volumetric haze, 35mm, **no identifiable faces** (backs/silhouettes) |
| `singer-performance.png` | Solution / engine card | ~4:5 | Stage performance silhouette under cinematic moody light, sound-wave streaks, dark, **no identifiable faces** |
| `mobile-singing.png` | Solution / engine card | ~4:5 | Hands holding a phone singing on a mobile app, warm rim light, bokeh, cinematic dark, **no faces** |
| `album-artwork.png` | Solution / engine card | ~1:1 | Abstract album-art / merch under amber-to-red stage light, sea of raised hands, bokeh, dark, **no faces** |

(Exact section placement is in `site/src/components/site/sections/{Hero,SolutionTrinity,NodeNetwork}.tsx` — verify before swapping.)

## 4. Hard constraints

- **No identifiable real people** — copyright + portrait rights; scraping idols is prohibited. Use backs of crowds, silhouettes, hands, objects, lighting.
- **Dark-cinematic** mood; brand red **#EF2525** dominant; entertainment/Hallyu tone.
- Hero + solution cards sit on a **fixed dark backdrop** so white text stays legible in both themes — keep images dark enough at the text zones.

## 5. Workflow

1. Generate each slot (parallel is fine) → save to `site/public/brand/<exact-name>`.
2. `cd site && npm run build` (tsc + vite) — must stay green.
3. `/browse` verify the live-ish preview: hero + cards render, text-on-photo contrast OK, **desktop + mobile**, **light + dark**.
4. Deploy: `npm run deploy` (→ `assawave-site`); confirm `assawave.io` serves the fresh bundle.

## Status

Current mood images are generated, committed, and live (verified desktop + mobile). Run
this only to refresh them. See `SITE_REDESIGN_HALLYU_CINEMATIC.md` for the broader design
context.
