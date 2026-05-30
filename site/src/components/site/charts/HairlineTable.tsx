import type { ReactNode } from "react";

export type HairlineRow = {
  key: string;
  /** 선두 색 스와치(차트 세그먼트 색과 동기). */
  swatch?: string;
  cells: ReactNode[];
  active?: boolean;
};

type Props = {
  headers: string[];
  /** 컬럼 정렬(헤더/셀 공통). 기본 left, 숫자열은 right. */
  aligns?: ("left" | "right")[];
  rows: HairlineRow[];
  onRowHover?: (key: string | null) => void;
  caption?: string;
  /** 스크린리더 전용(차트의 접근 가능한 데이터테이블로만 쓸 때). */
  srOnly?: boolean;
  className?: string;
};

/**
 * Hairline 데이터 테이블 — radius-none, tabular-nums, 행 hover 동기.
 * 차트(AllocationRing/VestingTimeline)의 접근 가능한 데이터 표현 겸 범례.
 */
export default function HairlineTable({
  headers,
  aligns,
  rows,
  onRowHover,
  caption,
  srOnly,
  className,
}: Props) {
  const al = (i: number) => (aligns?.[i] === "right" ? "text-right" : "text-left");
  return (
    <table
      className={`w-full border-collapse text-sm ${srOnly ? "sr-only" : ""} ${className ?? ""}`}
    >
      {caption ? <caption className="sr-only">{caption}</caption> : null}
      <thead>
        <tr className="border-b border-rule">
          {headers.map((h, i) => (
            <th
              key={i}
              scope="col"
              className={`py-2 font-data text-[11px] uppercase tracking-[0.12em] text-ink-soft font-normal ${al(i)}`}
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr
            key={r.key}
            className={`border-b border-rule transition-colors ${r.active ? "bg-paper-deep" : ""}`}
            onMouseEnter={onRowHover ? () => onRowHover(r.key) : undefined}
            onMouseLeave={onRowHover ? () => onRowHover(null) : undefined}
          >
            {r.cells.map((c, i) => (
              <td key={i} className={`py-2.5 ${i === 0 ? "" : "tnum"} ${al(i)}`}>
                {i === 0 && r.swatch ? (
                  <span className="inline-flex items-center gap-2">
                    <span
                      aria-hidden="true"
                      className="inline-block h-2.5 w-2.5 shrink-0"
                      style={{ background: r.swatch }}
                    />
                    {c}
                  </span>
                ) : (
                  c
                )}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
