import type { ReactNode } from "react";

// 사이즈는 className(Tailwind arbitrary)로 — 인라인 fontWeight를 쓰면 index.css의
// `:lang(ko/ja) h1,h2,h3 { font-weight }` 오버라이드(CJK 디스플레이 굵기)를 덮어쓰므로 금지.
const SIZE = {
  h1: "text-[clamp(44px,7vw,96px)] leading-[0.96] tracking-[-0.025em]",
  h2: "text-[clamp(34px,5vw,60px)] leading-[1.05] tracking-[-0.02em]",
  h3: "text-[clamp(26px,3vw,34px)] leading-[1.1] tracking-[-0.015em]",
} as const;

type Variant = keyof typeof SIZE;

type Props = {
  as?: Variant;
  pre: ReactNode;
  em?: ReactNode;
  /** em 앞에 줄바꿈(기본 true). false면 공백으로 이어붙임. */
  br?: boolean;
  className?: string;
  maxWidth?: number | string;
};

/**
 * 디스플레이 헤딩 — "앞부분. *강조부분.*" 패턴.
 * ccm Heading fork. em 강조 = ccm `.italic-moss` → ASSA `.italic-brand`
 * (테마인지 brand-on, AA 보정; index.css 정의). font-display + h태그 →
 * index.css base/:lang 규칙 상속(CJK 굵기 자동).
 */
export default function Heading({
  as = "h2",
  pre,
  em,
  br = true,
  className,
  maxWidth,
}: Props) {
  const Tag = as as keyof React.JSX.IntrinsicElements;
  return (
    <Tag
      className={`font-display ${SIZE[as]} ${className ?? ""}`}
      style={maxWidth ? { maxWidth } : undefined}
    >
      {pre}
      {em ? (
        <>
          {br ? <br /> : " "}
          <em className="italic-brand">{em}</em>
        </>
      ) : null}
    </Tag>
  );
}
