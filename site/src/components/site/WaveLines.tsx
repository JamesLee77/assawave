import { useReducedMotion } from "../../lib/useReducedMotion";

// 사인 곡선 path 생성 — viewBox 밖까지(-200~1640) 그려 drift 시 가장자리가 안 보이게.
function sinePath(amp: number, yMid: number, wavelength: number, phase: number): string {
  const pts: string[] = [];
  for (let x = -200; x <= 1640; x += 12) {
    const y = yMid + amp * Math.sin((x / wavelength) * Math.PI * 2 + phase);
    pts.push(`${x},${y.toFixed(1)}`);
  }
  return "M" + pts.join(" L");
}

const LINES = [
  { amp: 46, yMid: 220, wavelength: 520, phase: 0, opacity: 0.12 },
  { amp: 38, yMid: 300, wavelength: 460, phase: 1.1, opacity: 0.09 },
  { amp: 30, yMid: 380, wavelength: 600, phase: 2.3, opacity: 0.07 },
];

/**
 * Hero 배경 wave 3줄 — §3.1: 데이터색(--data-1), opacity≤0.12, reduced-motion 가드.
 * 장식(데이터 아님)이지만 디자인 명세대로 data-1 사용. 모션 허용 시에만 미세 drift.
 */
export default function WaveLines({ className }: { className?: string }) {
  const reduced = useReducedMotion();
  return (
    <svg
      className={className}
      viewBox="0 0 1440 600"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      {!reduced && (
        <style>{`
          @keyframes assa-wave-drift { from { transform: translateX(-30px) } to { transform: translateX(30px) } }
          .assa-wave-g { animation: assa-wave-drift var(--dur) ease-in-out infinite alternate; }
        `}</style>
      )}
      {LINES.map((l, i) => (
        <g
          key={i}
          className={reduced ? undefined : "assa-wave-g"}
          style={{ ["--dur" as string]: `${14 + i * 4}s` }}
        >
          <path
            d={sinePath(l.amp, l.yMid, l.wavelength, l.phase)}
            style={{ stroke: "var(--data-1)", strokeWidth: 1.5 }}
            strokeOpacity={l.opacity}
          />
        </g>
      ))}
    </svg>
  );
}
