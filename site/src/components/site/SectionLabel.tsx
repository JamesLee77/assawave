import type { ReactNode } from "react";

type Props = {
  /** 섹션 번호, 예: "§ 03". ink-soft mono로 렌더. */
  index?: string;
  children: ReactNode;
  className?: string;
};

/**
 * 섹션 eyebrow 라벨. ccm `font-mono uppercase text-moss` → ASSA `.eyebrow`
 * (font-data · 0.16em · uppercase · 테마인지 brand-on, index.css 정의)로 재색.
 * moss audit §2: eyebrow = BRAND 분류.
 */
export default function SectionLabel({ index, children, className }: Props) {
  return (
    <div className={`eyebrow ${className ?? ""}`}>
      {index ? <span className="text-ink-soft">{index} · </span> : null}
      {children}
    </div>
  );
}
