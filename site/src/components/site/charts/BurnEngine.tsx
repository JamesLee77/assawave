import { useTranslation } from "react-i18next";
import { useChartTheme } from "../../../lib/useChartTheme";
import { roleColor, BURN } from "../../../lib/tokenomics";
import HairlineTable from "./HairlineTable";

// 누적 소각 곡선(예시 모델) — 인덱서 연결 시 BMEBurner.Burned 실집계로 교체.
const POINTS: [number, number][] = [
  [0, 0], [1, 8], [2, 22], [3, 40], [4, 62], [5, 82], [6, 100],
];
const W = 640, H = 220, PAD_L = 40, PAD_R = 20, PAD_T = 16, PAD_B = 28;

export default function BurnEngine() {
  const { t } = useTranslation("home");
  const tok = useChartTheme();
  const coral = roleColor(tok, "coral");

  const innerW = W - PAD_L - PAD_R;
  const innerH = H - PAD_T - PAD_B;
  const x = (i: number) => PAD_L + (i / (POINTS.length - 1)) * innerW;
  const y = (v: number) => PAD_T + (1 - v / 100) * innerH;
  const line = POINTS.map(([i, v], k) => `${k === 0 ? "M" : "L"}${x(i)} ${y(v)}`).join(" ");
  const area = `${line} L${x(POINTS.length - 1)} ${PAD_T + innerH} L${x(0)} ${PAD_T + innerH} Z`;

  const stats = [
    { v: `${BURN.consumptionBurnPct}%`, k: "burnConsumption" },
    { v: `${BURN.bmeB2cPct}%`, k: "burnB2c" },
    { v: BURN.bmeB2bRange, k: "burnB2b" },
  ];

  return (
    <>
    <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-8 items-center">
      <figure className="m-0" role="img" aria-label={t("tokenomics.burnAria")}>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
          {[0, 50, 100].map((g) => (
            <line key={g} x1={PAD_L} y1={y(g)} x2={W - PAD_R} y2={y(g)} style={{ stroke: "var(--rule)" }} strokeDasharray={g === 0 ? undefined : "3 4"} />
          ))}
          <path d={area} fill={coral} fillOpacity={0.12} />
          <path d={line} fill="none" stroke={coral} strokeWidth={2} />
          {POINTS.map(([i, v]) => (
            <circle key={i} cx={x(i)} cy={y(v)} r={3} fill="var(--paper)" stroke={coral} strokeWidth={1.5} />
          ))}
        </svg>
        <figcaption className="mt-2 font-data text-[11px] uppercase tracking-[0.1em] text-ink-soft">
          {t("tokenomics.burnCaption")}
        </figcaption>
      </figure>

      <div className="grid grid-cols-3 lg:grid-cols-1 gap-px bg-rule border border-rule">
        {stats.map((s) => (
          <div key={s.k} className="bg-paper-deep p-4 lg:p-5">
            <div className="font-display tabular-nums text-2xl" style={{ color: coral }}>{s.v}</div>
            <div className="font-data text-[11px] uppercase tracking-[0.12em] text-ink-soft mt-1">{t(`tokenomics.${s.k}`)}</div>
          </div>
        ))}
      </div>
    </div>
    <HairlineTable
      srOnly
      caption={t("tokenomics.burnAria")}
      headers={["Phase", "Cumulative %"]}
      aligns={["left", "right"]}
      rows={POINTS.map(([i, v]) => ({ key: `p${i}`, cells: [`P${i}`, `${v}%`] }))}
    />
    </>
  );
}
