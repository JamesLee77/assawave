import { useEffect, useState } from "react";

// ⚠️ 신규(ccm 부재): JS 애니메이션용 reduced-motion 훅.
// 디자인 §1.4 — CSS @media 리셋과 병행. SVG/JS 모션(WaveLines 등)은 이 훅으로
// 가드한다. SSR/초기 렌더 안전: 첫 값은 false(모션 허용)로 두고 mount 후 동기화.
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return reduced;
}
