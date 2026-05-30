import type { ReactNode, CSSProperties } from "react";

type Props = {
  id?: string;
  /** 반전(다크 면) 섹션. ccm Problem 패턴 — ASSA에서는 테마에 따라 ink/paper 스왑. */
  inverted?: boolean;
  /** 상단 hairline 제거(첫 섹션 등). */
  noBorder?: boolean;
  className?: string;
  /** 내부 콘텐츠 래퍼에 추가 스타일. */
  style?: CSSProperties;
  children: ReactNode;
};

/**
 * 표준 페이지 섹션 — 상단 hairline + 반응형 수직 리듬.
 * ccm Section(고정 56px 패딩)을 ASSA 반응형(375/768/1024/1440 §5.1)으로 재작성:
 * 고정 패딩 대신 max-w-7xl 컨테이너 + px-5/md:px-10 + py-20/md:py-28.
 */
export default function Section({
  id,
  inverted,
  noBorder,
  className,
  style,
  children,
}: Props) {
  return (
    <section
      id={id}
      className={noBorder ? "" : "border-t border-rule"}
      style={
        inverted
          ? { background: "var(--ink)", color: "var(--paper)" }
          : undefined
      }
    >
      <div
        className={`mx-auto max-w-7xl px-5 md:px-10 py-20 md:py-28 ${className ?? ""}`}
        style={style}
      >
        {children}
      </div>
    </section>
  );
}
