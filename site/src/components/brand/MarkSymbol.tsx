// ASSA WAVE 심볼 마크 — 실제 BI(docs/assa-bi/3197611bd3cf6.png) 투명 추출본.
// ▶ 재생 + 3줄 wave 음파 모티프 + 얇은 ASSA. OG/favicon/Hero 비주얼.

type Props = { size?: number; className?: string; title?: string };

export default function MarkSymbol({ size = 96, className, title = "ASSA WAVE" }: Props) {
  return (
    <img
      src="/brand/assa-mark.png"
      alt={title}
      width={size}
      height={size}
      style={{ width: size, height: "auto" }}
      className={className}
      draggable={false}
    />
  );
}
