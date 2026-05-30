// ASSA WAVE 워드마크 — 실제 BI(docs/assa-bi/download.jpg) 투명 추출본.
// site/public/brand/assa-wordmark-{red,white}.png (red 259x79 · white 616x194).
// 이미지는 고정색이라 currentColor 미적용 — variant로 선택.

type Props = {
  height?: number;
  className?: string;
  variant?: "red" | "white";
  title?: string;
};

export default function WaveMark({
  height = 28,
  className,
  variant = "red",
  title = "ASSA WAVE",
}: Props) {
  const src =
    variant === "white"
      ? "/brand/assa-wordmark-white.png"
      : "/brand/assa-wordmark-red.png";
  return (
    <img
      src={src}
      alt={title}
      style={{ height, width: "auto" }}
      className={className}
      draggable={false}
    />
  );
}
