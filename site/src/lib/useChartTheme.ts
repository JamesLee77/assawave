import { useEffect, useState } from "react";
import { getTokens, readTheme, type Theme, type Tokens } from "./tokens";

/**
 * 차트용 테마 반응 토큰 훅. readTheme()는 반응형이 아니므로 <html data-theme> 변경을
 * MutationObserver로 구독 → 라이트/다크 토글 시 차트가 즉시 재색(토큰 구동 증명).
 * 반환: 현재 테마의 Tokens(getTokens). 차트 데이터 색은 roleColor(t, role)로만 얻을 것.
 */
export function useChartTheme(): Tokens {
  const [theme, setTheme] = useState<Theme>(() => readTheme());
  useEffect(() => {
    if (typeof document === "undefined" || typeof MutationObserver === "undefined") return;
    const el = document.documentElement;
    const mo = new MutationObserver(() => setTheme(readTheme()));
    mo.observe(el, { attributes: true, attributeFilter: ["data-theme"] });
    setTheme(readTheme());
    return () => mo.disconnect();
  }, []);
  return getTokens(theme);
}
