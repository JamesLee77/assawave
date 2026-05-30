// ASSA WAVE 워드마크 — BI logo01.png 기반.
// ⚠️ 스캐폴드 근사치: 'ASSA' 디스플레이 텍스트 + 좌측 독립 3줄 wave 스트라이프.
//    정밀 path-traced 글리프(logo01.png 실측)는 후속 단계에서 wordmark-paths.ts로 교체.
// 색은 currentColor — 부모가 text-brand / text-ink로 제어.

type Props = {
  /** 높이(px). width는 비율 자동. */
  height?: number;
  className?: string;
  title?: string;
};

export default function WaveMark({ height = 28, className, title = "ASSA WAVE" }: Props) {
  return (
    <svg
      height={height}
      viewBox="0 0 220 60"
      fill="none"
      role="img"
      aria-label={title}
      className={className}
      style={{ color: "currentColor" }}
    >
      {/* 좌측 독립 3줄 wave 스트라이프 (▶/음파 모티프) — A 좌측에 별개 요소 */}
      <g fill="currentColor">
        <path d="M2 22 L34 22 L26 30 L2 30 Z" />
        <path d="M2 33 L30 33 L22 41 L2 41 Z" />
        <path d="M2 44 L26 44 L18 52 L2 52 Z" />
      </g>
      {/* 워드마크 — 각진 디스플레이. 스캐폴드는 폰트 텍스트, 후속 path 교체 */}
      <text
        x="44"
        y="46"
        fontFamily="Righteous, system-ui, sans-serif"
        fontSize="46"
        fontStyle="italic"
        letterSpacing="-1"
        fill="currentColor"
      >
        ASSA
      </text>
    </svg>
  );
}
