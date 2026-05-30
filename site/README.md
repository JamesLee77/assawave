# assawave / site

ASSA WAVE 마케팅 사이트 (`assawave.io`) — ccm `frontend/` fork 기반.
Vite + React 18 + Tailwind 4 + wagmi/viem + RainbowKit. 기본 다크 + 라이트 토글.

## 실행

```bash
cd site
npm install
npm run dev        # http://localhost:5173
npm run build      # tsc -b && vite build → dist/  (검증: ✓ typecheck + build 통과)
npm run typecheck
```
환경변수: `.env.example` 참고 (WalletConnect projectId·Base RPC·app 서브도메인).

## 현재 상태 (WS2.1 — §7 즉시 착수)

✅ **디자인 토큰 파운데이션**
- `src/index.css` — ASSA 의미 토큰(brand/data/positive/warning/destructive/gold + paper/ink/rule), 다크·라이트, Primary=`--brand-pressed`(WCAG), `:focus-visible`(신규), reduced-motion(신규), Righteous/Poppins/Chakra Petch/Pretendard 폰트.
- `src/lib/tokens.ts` — index.css의 TS 미러. 차트/SVG가 색을 JS로 읽을 때 `getTokens(theme)`.
- 근거: `../docs/MOSS_AUDIT.md` (ccm `--moss` 425회 3분류 audit, 결정 #13).

✅ **앱 스캐폴드 (빌드 검증 완료)**
- Vite8 + React18 + Tailwind4 + wagmi/viem + RainbowKit (ccm `frontend/` fork).
- `vite.config.ts`·`tsconfig*`·`index.html`(lang=ko, 테마 bootstrap)·`main.tsx`·`App.tsx`.
- `lib/wagmi.ts`(Base/Sepolia)·`lib/i18n.ts`(ko 기본/en/ja)·`lib/theme.ts`.
- `ThemeProvider`(기본 다크)+`ThemeToggle`(SVG, 44px), `WaveMark`(BI 워드마크 근사), `Layout`(SiteNav+반피싱 배너+Footer).
- `pages/Home.tsx`(Hero + 토큰 데모 스와치), `pages/Legal.tsx`(약관/개인정보/고지 스텁), locales ko/en/ja.

## 다음 단계 (미완)

- [ ] `WaveMark` 정밀 path-traced 글리프(logo01.png 실측) + `MarkSymbol`(▶+wave, OG/favicon)
- [ ] site 크롬 분리: SiteNav/AnchorNav/SiteFooter/Section/Heading + `CopyableAddress`
- [ ] `Earth.tsx` → `Home.tsx` fork (ASSA 11섹션 재배치) + Hero 카운트다운/▶wave 애니(useReducedMotion 가드)
- [ ] 컴포넌트 fork 시 **moss/clay 분기 치환**(`MOSS_AUDIT.md §4`) — 차트=`--data-*`, positive=`--positive`
- [ ] `pa11y`/`axe` CI 게이트 + 실제 i18n 번역 + SEO/OG/hreflang

## 참조

- 디자인 시스템·IA·페이지 기획: `../docs/ASSA_WAVE_SITE_DESIGN.md`
- 개발 계획: `../docs/DEVELOPMENT_PLAN.md` (WS2.1 = audit 기반 의미 분기)
- moss audit: `../docs/MOSS_AUDIT.md`
- fork 원본: `../../ccm/frontend/`
