import { useTranslation } from "react-i18next";
import { useChartTheme } from "../../../lib/useChartTheme";
import { VESTING, roleColor } from "../../../lib/tokenomics";
import HairlineTable from "./HairlineTable";

const PAD_L = 150;
const PAD_R = 20;
const PAD_T = 16;
const ROW_H = 38;
const AXIS_H = 40;
const W = 760;
const MAX_M = 60;
const TICKS = [0, 12, 24, 36, 48, 60];

export default function VestingTimeline() {
  const { t } = useTranslation("home");
  const tok = useChartTheme();

  const innerW = W - PAD_L - PAD_R;
  const xForM = (m: number) => PAD_L + (m / MAX_M) * innerW;
  const H = PAD_T + VESTING.length * ROW_H + AXIS_H;

  const rows = VESTING.map((v) => ({ ...v, label: t(`tokenomics.vest.${v.key}`), color: roleColor(tok, v.role) }));
  const summary = rows
    .map((r) => `${r.label}: TGE ${r.tgePct}%, cliff ${r.cliffMonths}m, linear ${r.linearMonths}m`)
    .join("; ");

  return (
    <div>
      <figure className="m-0" role="img" aria-label={`Vesting by category: ${summary}`}>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
          {/* 월 축 그리드 */}
          {TICKS.map((m) => (
            <g key={m}>
              <line
                x1={xForM(m)}
                y1={PAD_T}
                x2={xForM(m)}
                y2={PAD_T + VESTING.length * ROW_H}
                style={{ stroke: "var(--rule)" }}
                strokeDasharray={m === 0 ? undefined : "3 4"}
              />
              <text
                x={xForM(m)}
                y={H - AXIS_H + 22}
                textAnchor="middle"
                className="font-data"
                style={{ fill: "var(--ink-soft)", fontSize: 10 }}
              >
                M{m}
              </text>
            </g>
          ))}

          {rows.map((r, i) => {
            const y = PAD_T + i * ROW_H;
            const barY = y + 8;
            const barH = ROW_H - 18;
            const cliffX0 = xForM(0);
            const cliffX1 = xForM(r.cliffMonths);
            const vestX1 = xForM(r.cliffMonths + r.linearMonths);
            return (
              <g key={r.key}>
                <text
                  x={0}
                  y={y + ROW_H / 2 + 1}
                  className="font-data"
                  style={{ fill: "var(--ink)", fontSize: 12 }}
                >
                  {r.label}
                </text>
                {/* cliff = 락업(불투명도 낮음) */}
                {r.cliffMonths > 0 && (
                  <rect x={cliffX0} y={barY} width={cliffX1 - cliffX0} height={barH} fill={r.color} fillOpacity={0.26} />
                )}
                {/* linear = 선형 언락(솔리드) */}
                <rect x={cliffX1} y={barY} width={Math.max(2, vestX1 - cliffX1)} height={barH} fill={r.color} />
                {/* TGE 마커 */}
                {r.tgePct > 0 && (
                  <circle cx={cliffX0} cy={barY + barH / 2} r={3.5} fill={r.color} stroke="var(--paper)" strokeWidth={1.5} />
                )}
              </g>
            );
          })}
        </svg>
      </figure>

      {/* 범례 */}
      <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 font-data text-[11px] uppercase tracking-[0.1em] text-ink-soft">
        <span className="inline-flex items-center gap-2">
          <span aria-hidden="true" className="inline-block h-2.5 w-4" style={{ background: roleColor(tok, "data-1"), opacity: 0.26 }} />
          {t("tokenomics.vestCliff")}
        </span>
        <span className="inline-flex items-center gap-2">
          <span aria-hidden="true" className="inline-block h-2.5 w-4" style={{ background: roleColor(tok, "data-1") }} />
          {t("tokenomics.vestLinear")}
        </span>
        <span className="inline-flex items-center gap-2">
          <span aria-hidden="true" className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: roleColor(tok, "data-1") }} />
          {t("tokenomics.vestTge")}
        </span>
      </div>

      {/* a11y 데이터 테이블 */}
      <HairlineTable
        srOnly
        caption="Vesting schedule by category"
        headers={[t("tokenomics.tableCategory"), "TGE", "Cliff", "Linear"]}
        aligns={["left", "right", "right", "right"]}
        rows={rows.map((r) => ({
          key: r.key,
          cells: [r.label, `${r.tgePct}%`, `${r.cliffMonths}m`, `${r.linearMonths}m`],
        }))}
      />
    </div>
  );
}
