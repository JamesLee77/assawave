// ASSA WAVE 디자인 토큰 — index.css [data-theme] 변수의 TS 미러.
//
// 용도: 런타임 SVG/차트(VestingTimeline·AllocationRing·EmissionCurve 등)가 색을
//       JS 값으로 읽을 때 사용. CSS 클래스가 아니라 이 함수를 참조한다.
// 결정 #13 (moss audit): data 팔레트에는 brand red를 절대 넣지 않는다.
//   - 브랜드 강조 = brand / brandOn* (텍스트는 AA 보정값)
//   - 데이터 측정 = data[] (중립 다색)
//   - 상태       = positive / warning / destructive
// index.css의 :root/[data-theme] 값과 1:1로 일치시켜 유지보수한다.

export type ThemeName = "light" | "dark";

export interface Tokens {
  // surface / text
  paper: string;
  paperDeep: string;
  ink: string;
  inkSoft: string;
  rule: string;
  // brand
  brand: string;
  brandHover: string;
  brandPressed: string;
  /** 해당 테마에서 AA를 만족하는 레드 텍스트/링크/포커스 색 */
  brandOn: string;
  coral: string;
  // semantic state
  positive: string;
  warning: string;
  destructive: string;
  gold: string;
  /** 차트/데이터 시각화 전용 중립 다색 — brand red 미포함 */
  data: readonly string[];
}

const LIGHT: Tokens = {
  paper: "#ffffff",
  paperDeep: "#f5f5f7",
  ink: "#0f172a",
  inkSoft: "#475569",
  rule: "#e3e3ea",
  brand: "#ef2525",
  brandHover: "#d93a26",
  brandPressed: "#c81e14",
  brandOn: "#c81e14",
  coral: "#d9531f",
  positive: "#1f9d57",
  warning: "#b45309",
  destructive: "#dc2626",
  gold: "#b8860b",
  data: ["#2f7d8c", "#c4702a", "#5b54b8", "#2f8f5b", "#8a6d3b"],
};

const DARK: Tokens = {
  paper: "#0b0b14",
  paperDeep: "#14141f",
  ink: "#f8fafc",
  inkSoft: "#94a3b8",
  rule: "#1e1e2a",
  brand: "#ef2525",
  brandHover: "#ff3b3b",
  brandPressed: "#c81e14",
  brandOn: "#ff6b5e",
  coral: "#ff7a5e",
  positive: "#34d399",
  warning: "#fbbf24",
  destructive: "#f87171",
  gold: "#f59e0b",
  data: ["#4cc4d6", "#e0863a", "#8b80f0", "#4fb477", "#c9a24b"],
};

const TOKENS: Record<ThemeName, Tokens> = { light: LIGHT, dark: DARK };

/** 현재 테마의 토큰 묶음을 반환. 차트/SVG에서 색을 JS로 읽을 때 사용. */
export function getTokens(theme: ThemeName): Tokens {
  return TOKENS[theme];
}

/** <html data-theme> 속성에서 현재 테마를 읽는다(기본 dark). SSR/초기 렌더 안전. */
export function readTheme(): ThemeName {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}
