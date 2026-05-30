// ASSA WAVE 토크노믹스 — 차트·테이블 단일 진실 소스.
//
// 출처: docs/ASSA_WAVE_CONTRACTS_SPEC.md §3.1~3.4 (배분 %는 :235 "40/12/5/10/10/5/8/5/5"
// authoritative, 라벨 매핑은 §3.3 베스팅 카테고리에서 추론). 세일/베스팅 수치는 §3.2/§3.3 표.
// ⚠️ moss audit #13: 차트 색은 절대 brand red 미사용 → 전부 data/coral/gold/positive 롤.
// 색은 여기 저장하지 않고 role만 저장 → 차트가 getTokens(theme)에서 런타임 해석(테마 반응).

import type { Tokens } from "./tokens";

// ⚠️ brand red / destructive(에러 레드)는 의도적으로 제외 — 차트 데이터 마크에 red 누수 차단.
//    경고/부정 데이터는 coral 사용. destructive는 반피싱 배너 chrome에서 CSS 변수로 직접 참조.
export type ChartRole =
  | "data-1" | "data-2" | "data-3" | "data-4" | "data-5"
  | "coral" | "gold" | "positive" | "ink-soft";

/** role → 현재 테마의 실제 색. 차트 데이터 마크는 이 함수로만 색을 얻는다(brand red 차단). */
export function roleColor(t: Tokens, role: ChartRole): string {
  switch (role) {
    case "data-1": return t.data[0];
    case "data-2": return t.data[1];
    case "data-3": return t.data[2];
    case "data-4": return t.data[3];
    case "data-5": return t.data[4];
    case "coral": return t.coral;
    case "gold": return t.gold;
    case "positive": return t.positive;
    case "ink-soft": return t.inkSoft;
  }
}

export const TOTAL_SUPPLY_LABEL = "10B";
export const TOTAL_SUPPLY_FULL = "10,000,000,000 ASSA";

export type Allocation = { key: string; pct: number; role: ChartRole };
// 배분 % authoritative(CONTRACTS_SPEC:235), 합계 100. 라벨은 i18n(home.tokenomics.alloc.*).
export const ALLOCATIONS: Allocation[] = [
  { key: "sale", pct: 40, role: "data-1" },
  { key: "treasury", pct: 12, role: "data-2" },
  { key: "team", pct: 10, role: "data-3" },
  { key: "investor", pct: 10, role: "data-4" },
  { key: "mining", pct: 8, role: "data-5" },
  { key: "partner", pct: 5, role: "coral" },
  { key: "ecoMarketing", pct: 5, role: "gold" },
  { key: "founder", pct: 5, role: "data-2" },
  { key: "community", pct: 5, role: "data-3" },
];

export type VestingRow = {
  key: string;
  tgePct: number;
  cliffMonths: number;
  linearMonths: number;
  role: ChartRole;
};
// §3.3 표. Investor cliff/linear은 범위 중앙값(6–12→9, 18–24→21). ECO TGE '일부'→0 placeholder.
export const VESTING: VestingRow[] = [
  { key: "r1", tgePct: 0, cliffMonths: 6, linearMonths: 18, role: "data-1" },
  { key: "r2", tgePct: 5, cliffMonths: 3, linearMonths: 12, role: "data-1" },
  { key: "r3", tgePct: 10, cliffMonths: 0, linearMonths: 6, role: "data-1" },
  { key: "investor", tgePct: 0, cliffMonths: 9, linearMonths: 21, role: "data-4" },
  { key: "founder", tgePct: 0, cliffMonths: 12, linearMonths: 48, role: "gold" },
  { key: "team", tgePct: 0, cliffMonths: 12, linearMonths: 36, role: "gold" },
  { key: "partner", tgePct: 0, cliffMonths: 6, linearMonths: 24, role: "coral" },
  { key: "ecoMarketing", tgePct: 0, cliffMonths: 0, linearMonths: 30, role: "data-3" },
];

export const BURN = {
  consumptionBurnPct: 70, // 소비 spend → 70% burn / 30% prize (§3.4)
  bmeB2cPct: 20, // BME B2C 매출 → 20% buy+burn
  bmeB2bRange: "30–40%", // BME B2B 매출 → 30~40% buy+burn
} as const;

// ── Market (⚠️ 추정치 — 문서에 확정 수치 없음, 확정 전 placeholder. 출처 확보 후 교체) ──
export type MarketStat = { key: string; value: string };
export const MARKET_STATS: MarketStat[] = [
  { key: "tam", value: "$12B+" },
  { key: "installs", value: "2M+" },
  { key: "mau", value: "480K" },
  { key: "share", value: "3%" },
];

// 수요/공급 시나리오(예시 모델, Phase 타임라인). 공급=front-loaded emission 감소,
// 수요=락업+소각 흡수 증가, 균형=순흡수(수요-공급). 0~1 정규화 값.
export type ScenarioPoint = { t: number; supply: number; demand: number };
export const SCENARIO: ScenarioPoint[] = [
  { t: 0, supply: 0.95, demand: 0.15 },
  { t: 1, supply: 0.78, demand: 0.34 },
  { t: 2, supply: 0.6, demand: 0.52 },
  { t: 3, supply: 0.45, demand: 0.66 },
  { t: 4, supply: 0.33, demand: 0.78 },
  { t: 5, supply: 0.24, demand: 0.88 },
];
export const SCENARIO_LABELS = ["TGE", "Y1", "Y2", "Y3", "Y4", "Y5"];
