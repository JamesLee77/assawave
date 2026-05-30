# assawave / site

ASSA WAVE 마케팅 사이트 (`assawave.io`) — ccm `frontend/` fork 기반.
Vite + React 18 + Tailwind 4 + wagmi/viem + RainbowKit. 기본 다크 + 라이트 토글.

## 현재 상태 (WS2.1 — §7 즉시 착수)

✅ **디자인 토큰 파운데이션 (이번 단계)**
- `src/index.css` — ASSA 의미 토큰(brand/data/positive/warning/destructive/gold + paper/ink/rule), 다크·라이트, Primary=`--brand-pressed`(WCAG), `:focus-visible`(신규), reduced-motion(신규), Righteous/Poppins/Chakra Petch/Pretendard 폰트.
- `src/lib/tokens.ts` — index.css의 TS 미러. 차트/SVG가 색을 JS로 읽을 때 `getTokens(theme)` 참조.
- 근거: `../docs/MOSS_AUDIT.md` (ccm `--moss` 425회 3분류 audit, 결정 #13).

## 다음 단계 (미완 — scaffold 필요)

- [ ] 앱 스캐폴드 fork: `package.json`·`vite.config.ts`·`tsconfig`·`tailwind`·`index.html`·`src/main.tsx`·`src/App.tsx` (ccm `frontend/` 설정 fork)
- [ ] `ThemeProvider`(`DEFAULT_THEME="dark"`) + `ThemeToggle` fork
- [ ] 핵심 컴포넌트: `WaveMark`/`MarkSymbol`(BI SVG path), site 크롬(SiteNav/AnchorNav/SiteFooter/Section/Heading), `CopyableAddress`
- [ ] `Earth.tsx` → `Home.tsx` fork (ASSA 11섹션 재배치) + Hero(카운트다운·▶wave) + 공식 도메인 배너
- [ ] 컴포넌트 fork 시 **moss/clay 분기 치환**(`MOSS_AUDIT.md §4` 운영 규칙) — 차트=`--data-*`, positive=`--positive`
- [ ] `pa11y`/`axe` CI 게이트 + i18n ko/en/ja

## 참조

- 디자인 시스템·IA·페이지 기획: `../docs/ASSA_WAVE_SITE_DESIGN.md`
- 개발 계획: `../docs/DEVELOPMENT_PLAN.md` (WS2.1 = audit 기반 의미 분기)
- moss audit: `../docs/MOSS_AUDIT.md`
- fork 원본: `../../ccm/frontend/`
