import { useEffect, useState } from "react";

export type Countdown = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  done: boolean;
};

function diff(target: number): Countdown {
  const ms = Math.max(0, target - Date.now());
  const s = Math.floor(ms / 1000);
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
    done: ms === 0,
  };
}

/** 2자리 0패딩. */
export const pad2 = (n: number): string => String(n).padStart(2, "0");

/**
 * 라이브 카운트다운 — Hero 세일 카드/세일 섹션 타이머용.
 * 브라우저 SPA 전용(SSR 없음)이라 Date.now/setInterval 사용 안전.
 */
export function useCountdown(targetISO: string): Countdown {
  const target = new Date(targetISO).getTime();
  const [c, setC] = useState<Countdown>(() => diff(target));
  useEffect(() => {
    const id = window.setInterval(() => setC(diff(target)), 1000);
    return () => window.clearInterval(id);
  }, [target]);
  return c;
}
