import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useChartTheme } from "../../../lib/useChartTheme";
import { ALLOCATIONS, roleColor, TOTAL_SUPPLY_LABEL } from "../../../lib/tokenomics";
import HairlineTable from "./HairlineTable";

const CX = 150;
const CY = 150;
const R_OUTER = 130;
const R_INNER = 84;

function pt(r: number, aRad: number): [number, number] {
  return [CX + r * Math.cos(aRad), CY + r * Math.sin(aRad)];
}

// 도넛 세그먼트 path (top=-90°에서 시계방향).
function arc(a0: number, a1: number, rOuter: number, rInner: number): string {
  const large = a1 - a0 > Math.PI ? 1 : 0;
  const [x0, y0] = pt(rOuter, a0);
  const [x1, y1] = pt(rOuter, a1);
  const [x2, y2] = pt(rInner, a1);
  const [x3, y3] = pt(rInner, a0);
  return `M${x0} ${y0} A${rOuter} ${rOuter} 0 ${large} 1 ${x1} ${y1} L${x2} ${y2} A${rInner} ${rInner} 0 ${large} 0 ${x3} ${y3} Z`;
}

export default function AllocationRing() {
  const { t } = useTranslation("home");
  const tok = useChartTheme();
  const [active, setActive] = useState<string | null>(null);

  let cum = 0;
  const segs = ALLOCATIONS.map((a) => {
    const a0 = -Math.PI / 2 + (cum / 100) * Math.PI * 2;
    cum += a.pct;
    const a1 = -Math.PI / 2 + (cum / 100) * Math.PI * 2;
    const color = roleColor(tok, a.role);
    const mid = (a0 + a1) / 2;
    return { ...a, a0, a1, color, mid, label: t(`tokenomics.alloc.${a.key}`) };
  });

  const summary = segs.map((s) => `${s.label} ${s.pct}%`).join(", ");

  return (
    <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-8 md:gap-10 items-center">
      <figure className="m-0" role="img" aria-label={`$ASSA allocation: ${summary}. Total supply ${TOTAL_SUPPLY_LABEL}.`}>
        <svg viewBox="0 0 300 300" className="w-full max-w-[300px] mx-auto h-auto">
          {segs.map((s) => {
            const on = active === s.key;
            const [dx, dy] = on ? pt(8, s.mid).map((v, i) => v - (i === 0 ? CX : CY)) : [0, 0];
            return (
              <path
                key={s.key}
                d={arc(s.a0, s.a1, R_OUTER, R_INNER)}
                fill={s.color}
                fillOpacity={active && !on ? 0.4 : 1}
                stroke="var(--paper)"
                strokeWidth={2}
                style={{ transform: `translate(${dx}px, ${dy}px)`, transition: "transform 140ms, fill-opacity 140ms", cursor: "pointer" }}
                onMouseEnter={() => setActive(s.key)}
                onMouseLeave={() => setActive(null)}
              />
            );
          })}
          {/* 중앙 홀 — 총공급 */}
          <text x={CX} y={CY - 6} textAnchor="middle" className="font-display" style={{ fill: "var(--ink)", fontSize: 34 }}>
            {TOTAL_SUPPLY_LABEL}
          </text>
          <text x={CX} y={CY + 18} textAnchor="middle" className="font-data" style={{ fill: "var(--ink-soft)", fontSize: 10, letterSpacing: "0.14em" }}>
            HARD CAP
          </text>
        </svg>
      </figure>

      <HairlineTable
        caption="$ASSA token allocation"
        headers={[t("tokenomics.tableCategory"), t("tokenomics.tableShare")]}
        aligns={["left", "right"]}
        onRowHover={setActive}
        rows={segs.map((s) => ({
          key: s.key,
          swatch: s.color,
          active: active === s.key,
          cells: [s.label, `${s.pct}%`],
        }))}
      />
    </div>
  );
}
