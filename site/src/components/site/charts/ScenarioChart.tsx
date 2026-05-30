import { useTranslation } from "react-i18next";
import { useChartTheme } from "../../../lib/useChartTheme";
import { SCENARIO, SCENARIO_LABELS, roleColor } from "../../../lib/tokenomics";
import HairlineTable from "./HairlineTable";

const W = 720, H = 300, PAD_L = 44, PAD_R = 76, PAD_T = 20, PAD_B = 40;
const N = SCENARIO.length - 1;

export default function ScenarioChart() {
  const { t } = useTranslation("home");
  const tok = useChartTheme();
  const supplyC = roleColor(tok, "data-2");
  const demandC = roleColor(tok, "data-1");
  const balanceC = roleColor(tok, "data-4");

  const innerW = W - PAD_L - PAD_R;
  const innerH = H - PAD_T - PAD_B;
  const x = (i: number) => PAD_L + (i / N) * innerW;
  const y = (v: number) => PAD_T + (1 - v) * innerH;
  const path = (sel: (p: typeof SCENARIO[number]) => number) =>
    SCENARIO.map((p, i) => `${i === 0 ? "M" : "L"}${x(i)} ${y(sel(p))}`).join(" ");

  // 균형 전환점(수요>공급 시작) — 부호 변하는 구간 선형보간.
  let crossX: number | null = null;
  for (let i = 0; i < N; i++) {
    const d0 = SCENARIO[i].demand - SCENARIO[i].supply;
    const d1 = SCENARIO[i + 1].demand - SCENARIO[i + 1].supply;
    if (d0 < 0 && d1 >= 0) {
      const f = -d0 / (d1 - d0);
      crossX = x(i + f);
      break;
    }
  }

  return (
    <div>
      <figure className="m-0" role="img" aria-label={t("market.scenarioAria")}>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
          {/* 수요 우위 구간 음영 */}
          {crossX !== null && (
            <rect x={crossX} y={PAD_T} width={W - PAD_R - crossX} height={innerH} fill={balanceC} fillOpacity={0.06} />
          )}
          {/* 가로 그리드 */}
          {[0, 0.5, 1].map((g) => (
            <line key={g} x1={PAD_L} y1={y(g)} x2={W - PAD_R} y2={y(g)} style={{ stroke: "var(--rule)" }} strokeDasharray={g === 0 ? undefined : "3 4"} />
          ))}
          {/* x 라벨 */}
          {SCENARIO_LABELS.map((lab, i) => (
            <text key={lab} x={x(i)} y={H - PAD_B + 22} textAnchor="middle" className="font-data" style={{ fill: "var(--ink-soft)", fontSize: 10 }}>{lab}</text>
          ))}
          {/* 균형 전환 마커 */}
          {crossX !== null && (
            <g>
              <line x1={crossX} y1={PAD_T} x2={crossX} y2={PAD_T + innerH} style={{ stroke: "var(--ink-soft)" }} strokeDasharray="3 4" />
              <text x={crossX} y={PAD_T - 6} textAnchor="middle" className="font-data" style={{ fill: "var(--ink-soft)", fontSize: 10, letterSpacing: "0.08em" }}>{t("market.crossover")}</text>
            </g>
          )}
          {/* 공급 / 수요 라인 */}
          <path d={path((p) => p.supply)} fill="none" stroke={supplyC} strokeWidth={2} />
          <path d={path((p) => p.demand)} fill="none" stroke={demandC} strokeWidth={2} />
          {SCENARIO.map((p, i) => (
            <g key={i}>
              <circle cx={x(i)} cy={y(p.supply)} r={2.5} fill="var(--paper)" stroke={supplyC} strokeWidth={1.5} />
              <circle cx={x(i)} cy={y(p.demand)} r={2.5} fill="var(--paper)" stroke={demandC} strokeWidth={1.5} />
            </g>
          ))}
          {/* 끝 라벨 */}
          <text x={W - PAD_R + 8} y={y(SCENARIO[N].supply) + 4} className="font-data" style={{ fill: supplyC, fontSize: 11 }}>{t("market.supply")}</text>
          <text x={W - PAD_R + 8} y={y(SCENARIO[N].demand) + 4} className="font-data" style={{ fill: demandC, fontSize: 11 }}>{t("market.demand")}</text>
        </svg>
      </figure>

      <p className="mt-2 font-data text-[11px] uppercase tracking-[0.1em] text-ink-soft">{t("market.scenarioNote")}</p>

      <HairlineTable
        srOnly
        caption={t("market.scenarioAria")}
        headers={[t("market.phase"), t("market.supply"), t("market.demand")]}
        aligns={["left", "right", "right"]}
        rows={SCENARIO.map((p, i) => ({
          key: SCENARIO_LABELS[i],
          cells: [SCENARIO_LABELS[i], p.supply.toFixed(2), p.demand.toFixed(2)],
        }))}
      />
    </div>
  );
}
