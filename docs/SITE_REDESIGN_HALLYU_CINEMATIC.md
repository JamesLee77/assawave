# ASSA WAVE 사이트 — Hallyu Cinematic 리디자인 기획 & 개발계획

> **버전:** v1.0 · **기준일:** 2026-05-30 · **공식 도메인:** assawave.io
> **상위 문서:** `ASSA_WAVE_SITE_DESIGN.md`(디자인 단일 진실원천) · `DEVELOPMENT_PLAN.md`(전체 개발계획)
> **대상:** 마케팅 site (`site/`) 랜딩 페이지. 앱/포털/어드민은 범위 밖.
> **상태:** 파운데이션(증분 1·2) 적용 완료 / 사진(증분 3)은 `GEMINI_API_KEY` 게이트 대기.

---

## 0. 왜 이 문서가 필요한가 (문제 정의)

사용자 피드백(2026-05-30) 2건:

1. **메뉴가 2단 구조** — 콘텐츠 대비 과하다.
2. **너무 기술적인 디자인** — 팬덤/엔터테인먼트인데 ccm(탄소배출권 기술 프로젝트)을 가져오면서 톤이 기술적으로 변질됐다. **사진을 쓰고 엔터테인먼트 사이트를 참조**해야 한다.

### 0.1 진단 — "Hallyu Pulse(테크노)" 빌드가 설계 의도에서 이탈했다

직전 빌드("Hallyu Pulse / Techno-Performance")는 사실상 **크립토 트레이딩/개발자 대시보드 문법**이었다:

| 신호 | 위치 | 왜 "기술적"인가 |
|---|---|---|
| chamfer (각진 클립 코너) | 전 카드·패널 | 하드웨어/sci-fi 신호 |
| bg-grid (배경 격자) + scan line | Hero, 고지바 | 터미널/HUD |
| 이퀄라이저 SVG (21바 + 파형) | Hero 메인 비주얼 | 사람·열기 0, 추상 엔지니어드 그래픽이 주인공 |
| mono `font-data` + uppercase tracking | 모든 섹션 라벨 (`§ 04`, `SUBLABEL`) | 스펙시트/터미널 |
| 허브-스포크 와이어 다이어그램 | Solution | 엔지니어링 다이어그램 |
| RISC-V 노드 SVG | Node | 하드웨어 도면 |
| `border + bg-paper-deep` 직각 카드 + `borderTop` data색 | 전 섹션 | 데이터시트 |

**핵심 모순:** 팬덤은 *사람·아티스트·무대·열기*가 주인공인데, 빌드는 정반대로 *추상 기술 그래픽*을 주인공으로 세웠다.

> ⚠️ `ASSA_WAVE_SITE_DESIGN.md` §0.1은 이미 **"상단=팬덤(Vibrant·볼드), 하단으로 갈수록 투자자(절제)"** 톤 그라데이션을 명시한다. Techno 빌드는 이 의도에서 이탈했고, 본 리디자인은 **설계 의도로의 복귀**다(신규 방향이 아님).

### 0.2 레퍼런스 (refero.design 조사)

엔터테인먼트/음악/팬 플랫폼의 공통 문법:

| 사이트 | 패턴 | 시사점 |
|---|---|---|
| **Spotify for Artists** | 풀블리드 아티스트 사진 히어로 + 큰 화이트 헤드라인 한 줄 + 단일 nav + 하단 4컬럼 | 다크 시네마틱 + 사진 주인공 + **단일 nav** |
| **Patreon** | 풀블리드 인물 사진 + 컬러 워시(블루) + 초대형 얇은 타이포 | 컬러를 사진 위 무드로 |
| **The Pop Manifesto** | 채도 높은 컬러 필드 + 오버사이즈 타이포 + 사진을 콘텐츠로 | 팬덤 에너지(zine) |
| **Tidal / Vevo** | 다크, 사진-led, 볼드 산세리프 | 음악 브랜드 다크 시네마틱 |

공통점: **사진이 주인공 · 메뉴 한 줄 · pill 버튼 · 컬러는 사진 위 무드 · 기술 장식(grid/chamfer/이퀄라이저) 0.**

---

## 1. 확정 방향 (사용자 결정 2026-05-30)

| 항목 | 결정 | 비고 |
|---|---|---|
| **사진 출처** | **AI 생성 무드 이미지** | 콘서트 군중·무대 조명·응원봉·실루엣 등 *특정 인물 아닌* 원본. 실제 아이돌 사진은 저작권·초상권(스크래핑 금지)으로 **사용 불가**. nano-banana(Gemini 3 Pro Image)로 생성. |
| **비주얼 무드** | **다크 시네마틱** | Spotify for Artists/Tidal/Vevo류. 다크 캔버스 유지 + 풀블리드 사진 + 화이트 타이포 + 레드 포인트. 현 다크 기반 재활용 → 리빌드 최소. |
| **메뉴** | **단일 네비** | 헤더 1줄(로고 + 섹션 링크 + Open App pill + 테마). 별도 AnchorNav 바 제거. |
| **브랜드 레드** | **유지** (#EF2525) | WCAG: 흰 글자 면은 `--brand-pressed`(#C81E14). 사진 위 강조는 `#ff7a6b`(다크 고정). |

### 1.1 디자인 시스템 변경 요약 ("Hallyu Pulse" → "Hallyu Cinematic")

| 토큰/문법 | Before (Techno) | After (Cinematic) |
|---|---|---|
| 코너 | chamfer(각진 클립) | **라운드** (`.chamfer`=border-radius 20/14/28, `.card`=20px) |
| 버튼 | chamfer 클립 | **pill** (`border-radius:999px`) + 사진용 `.btn-on-photo` |
| 라벨 | `font-data` mono · uppercase · tracking 0.16em | body 폰트 · tracking 0.08em (`.eyebrow` 완화) |
| 배경 장식 | bg-grid · scan line | **제거** |
| 사진 | 없음 (SVG 일러스트만) | **media-frame · media-cover · scrim-b/l/veil · stage-fallback** 유틸 |
| Hero 비주얼 | 이퀄라이저 SVG | **풀블리드 사진 + 무대 조명 stage-fallback** |
| Solution | 허브-스포크 와이어 | **3 시네마틱 미디어 카드** (사진 슬롯) |
| 데이터 그리드 | 직각 hairline | 라운드(`rounded-[20px] overflow-hidden rim`) |
| glow / 레드 강조 | (유지) | **유지** — 시네마틱 무드에 부합 |

> 토큰·팔레트(WCAG 감사값, moss audit DATA 분류)는 **그대로 보존**. Tailwind 기본 `rounded-*` 스케일과 충돌 방지를 위해 `@theme` radius 토큰은 도입하지 않고, 커스텀 클래스엔 리터럴 값·마크업엔 Tailwind 기본 유틸을 쓴다.

---

## 2. 콘텐츠 결정

| 항목 | 결정 |
|---|---|
| Hero 카피 | 기존 유지 — "The new wave of K-pop fandom, **owned by fans.**" (이미 팬덤 지향) |
| Hero 하단 밴드 | 토큰 스펙(facts) 제거 → **가치 밴드**(chips: Streaming→Value / Fan rewards / On-chain proof / Fan-owned). Spotify식 4컬럼. |
| 죽은 카피 | `hero.facts` / `factsLabel` / `factsBadge` / `vizLabel` / `vizFoot` / `vizChannels` **삭제**(이퀄라이저 제거로 미사용). |
| 언어 | 영어 전용 유지 (i18n `lng:"en"`, ko/ja 미로드). |
| 노세일 | 유지 (토큰 판매 표면 없음 — KR 법무). |
| 데이터 차트 | 토크노믹스 도넛/소각/베스팅·시장 시나리오 차트는 **유지**(토큰 프로젝트에 정당). 단 프레이밍 라벨만 de-mono. |
| RISC-V 노드 SVG | 유지(정당한 제품 컨셉 비주얼). 증분 3에서 시네마틱 사진 백드롭 적용. |

---

## 3. 개발계획 (증분 단위)

### ✅ 증분 1 — 파운데이션 + 메뉴 + Hero (완료, 키 불필요)

- `index.css` 재작성: 라운드·pill·라벨 완화·사진 유틸(`.card .media-frame .media-cover .scrim-* .stage-fallback`)·`.btn-on-photo`. bg-grid/scan/eqbar 제거.
- `Layout.tsx`: **2단→1단** 단일 네비 + 슬림 반피싱 스트립(스캔 제거) + 푸터 정리.
- `Home.tsx`: 중복 `AnchorNav` 제거.
- `Hero.tsx`: 이퀄라이저 → **풀블리드 시네마틱 히어로**(stage-fallback + 사진 슬롯 `/brand/hero-crowd.jpg` + pill CTA + 가치 밴드).
- 검증: typecheck clean · build green · 데스크톱/모바일 스크린샷 OK.

### ✅ 증분 2 — 섹션 일관화 (완료, 키 불필요)

- Solution: 허브-스포크 와이어 **제거** → 3 시네마틱 미디어 카드(스테이지 백드롭 + 사진 슬롯 `/brand/engine-{streaming,spending,nodes}.jpg`).
- Tokenomics/Market/Node: 카드 → `.card` 라운드, `borderTop` data색 → 컬러 액센트 바, 데이터 그리드 라운드, mono 라벨 de-mono, `§` 제거, 보조 CTA pill화.
- Manifesto: FAIL/eyebrow 라벨 de-mono.
- 죽은 컴포넌트 삭제: `AnchorNav.tsx`, `WaveLines.tsx`. 죽은 카피 정리(en.json).
- 검증: typecheck clean · build green.

### ⏳ 증분 3 — AI 무드 이미지 (키 필요 = `GEMINI_API_KEY`)

> **이것이 품질 점프의 핵심 레버다.** 증분 1·2는 사진을 받을 *그릇*을 만들었다. 그릇이 비어 있는 동안(stage-fallback 그래디언트)에는 히어로·카드가 다소 비어 보이는 것이 정상이다. 실제 사진이 들어가야 "엔터테인먼트" 품질이 완성된다.

**선행 조건:** 사용자가 `~/.zshrc`에 `export GEMINI_API_KEY=...` 추가(자격증명 — 채팅 붙여넣기 금지). genai·Pillow는 설치 완료.

**생성 스크립트:** `~/.claude/.../nano-banana/scripts/generate_image.py "<prompt>" <out> --aspect <r> --size 2K`

**이미지 슬롯 (파일명은 코드와 일치해야 함):**

| 파일 | 슬롯 | 비율 | 프롬프트(요지 — *식별 가능한 실존 인물 금지*) |
|---|---|---|---|
| `site/public/brand/hero-crowd.jpg` | Hero 배경 | 16:9 | "Massive K-pop arena concert seen from behind the crowd, thousands of red lightsticks and phone lights, bright stage glow ahead, cinematic bokeh, deep dark tones, dominant red #EF2525 light, shot from back of arena, no identifiable faces (backs of heads / silhouettes), shot on 35mm, volumetric haze" |
| `site/public/brand/engine-streaming.jpg` | Solution 카드 1 | 4:5 | "Close-up of headphones glowing teal in the dark, sound-wave light streaks, cinematic, moody, no faces" |
| `site/public/brand/engine-spending.jpg` | Solution 카드 2 | 4:5 | "Concert merch / lightstick under warm amber stage light, sea of hands raised, bokeh, cinematic dark, no identifiable faces" |
| `site/public/brand/engine-nodes.jpg` | Solution 카드 3 | 4:5 | "Abstract indigo network of light nodes over a dark stage, edge-device glow, cinematic, no faces" |
| `site/public/brand/node-stage.jpg` (신규 슬롯) | Node 백드롭 | 3:2 | "Single edge-AI device glowing on a dark stage with red rim light, cinematic product hero, no faces" |

**작업 순서:** 슬롯 병렬 생성(Workflow fan-out 가능) → `public/brand/`에 저장 → 스크림/대비 튜닝(특히 라이트 테마에서 사진 위 흰 글자 대비) → 모바일/다크/라이트 스크린샷 검증.

### ⏳ 증분 4 — 보류 섹션 (별도, 키 불필요)

`ASSA_WAVE_SITE_DESIGN.md` §3.1 기준: Roadmap(M1~M5) · FAQ(아코디언) · 상시 반피싱 배너(완료) · SiteFooter 업그레이드. **Team & Partners는 사용자 지시로 보류.**

---

## 4. 수용 기준 (Acceptance)

- [ ] 메뉴 1줄 (적층/중복 nav 없음) — ✅ 증분 1
- [ ] Hero가 사진 주인공 (추상 그래픽 아님) — 그릇 ✅ / 사진 ⏳ 증분 3
- [ ] 전 섹션 라운드·pill 일관 — ✅ 증분 2
- [ ] mono 터미널 라벨 제거 — ✅ 증분 2
- [ ] 실제 무드 사진 5컷 적용 — ⏳ 증분 3 (`GEMINI_API_KEY` 게이트)
- [ ] 라이트/다크 모두 사진 위 텍스트 대비 WCAG AA — ⏳ 증분 3
- [ ] typecheck clean · build green — ✅ 유지
- [ ] 적대적 디자인 리뷰(톤·대비·접근성·반응형) 통과 — ⏳ 증분 3 후

---

## 5. 리스크 / 의존성

1. **품질 점프는 `GEMINI_API_KEY`에 종속.** 키 없이는 시네마틱 *구조*까지만 가능(사진 빈 그릇). → 사용자 키 설정이 다음 세션 선행 조건.
2. **사진 위 텍스트 대비(라이트 테마).** Hero/Solution 카드는 다크 고정 백드롭에 흰 글자 — 라이트 테마에서도 안전. 단 Node 등 테마 반응 SVG는 다크 백드롭 강제 시 라이트 테마에서 깨지므로 증분 3에서 사진+고정 다크 처리.
3. **저작권/초상권.** 실존 아이돌·3자 제품 사진 금지. AI 생성도 *식별 가능한 실존 인물* 회피(군중 뒤·실루엣·손·사물).
4. **Reown/WalletConnect 콘솔 403/400** — 스캐폴드 projectId 노이즈, 랜딩 무관.
