import { useTranslation } from "react-i18next";
import Section from "../Section";
import SectionLabel from "../SectionLabel";
import Heading from "../Heading";
import { useReducedMotion } from "../../../lib/useReducedMotion";

const SUBLABEL = "text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-soft";

function hexPoints(cx: number, cy: number, r: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 180) * (60 * i - 30);
    pts.push(`${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`);
  }
  return pts.join(" ");
}

/** 원본 엣지-AI 노드 디바이스 일러스트(전면도) — hairline, 육각 통풍구, 포트, 상태 LED. */
function NodeDevice({ statusLabel }: { statusLabel: string }) {
  const { t } = useTranslation("home");
  const reduced = useReducedMotion();
  // 통풍구 육각 클러스터
  const hexes: [number, number][] = [];
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      hexes.push([250 + col * 26 + (row % 2) * 13, 92 + row * 22]);
    }
  }
  return (
    <svg viewBox="0 0 360 240" className="w-full h-auto" role="img" aria-label={`${t("node.deviceName")} — ${t("node.deviceSub")}`}>
      {/* 본체 */}
      <rect x={24} y={28} width={312} height={184} fill="var(--paper-deep)" stroke="var(--rule)" strokeWidth={1.5} />
      <line x1={24} y1={64} x2={336} y2={64} stroke="var(--rule)" strokeWidth={1} />
      {/* 헤더 라벨 + 상태 LED */}
      <text x={40} y={51} className="font-data" style={{ fill: "var(--ink-soft)", fontSize: 11, letterSpacing: "0.16em" }}>ASSA · NODE</text>
      <circle cx={306} cy={46} r={4} fill="var(--positive)" style={{ animation: reduced ? undefined : "assa-pulse 1.8s ease-in-out infinite" }} />
      <text x={318} y={50} className="font-data" style={{ fill: "var(--positive)", fontSize: 9, letterSpacing: "0.12em" }} textAnchor="end" dx={-18}>{statusLabel}</text>
      {/* 통풍구 육각 */}
      {hexes.map(([x, y], i) => (
        <polygon key={i} points={hexPoints(x, y, 9)} fill="none" stroke="var(--data-1)" strokeWidth={1} strokeOpacity={0.5} />
      ))}
      {/* 중앙 칩 라벨 */}
      <text x={48} y={120} className="font-display" style={{ fill: "var(--ink)", fontSize: 30 }}>RISC-V</text>
      <text x={49} y={140} className="font-data" style={{ fill: "var(--data-1)", fontSize: 13, letterSpacing: "0.1em" }}>60 TOPS · OCTA-CORE</text>
      {/* 포트 행 */}
      <g>
        {/* RJ45 x2 */}
        {[44, 80].map((x) => (
          <g key={x}>
            <rect x={x} y={176} width={28} height={20} fill="none" stroke="var(--ink-soft)" strokeWidth={1.2} />
            <rect x={x + 9} y={172} width={10} height={4} fill="var(--ink-soft)" />
          </g>
        ))}
        {/* USB-A x2 */}
        {[126, 152].map((x) => (
          <rect key={x} x={x} y={180} width={18} height={12} fill="none" stroke="var(--ink-soft)" strokeWidth={1.2} />
        ))}
        {/* HDMI */}
        <rect x={188} y={181} width={30} height={11} fill="none" stroke="var(--ink-soft)" strokeWidth={1.2} />
        {/* Power barrel */}
        <circle cx={244} cy={186} r={8} fill="none" stroke="var(--ink-soft)" strokeWidth={1.2} />
        <circle cx={244} cy={186} r={2.5} fill="var(--ink-soft)" />
        {/* port labels */}
        <text x={72} y={208} textAnchor="middle" className="font-data" style={{ fill: "var(--ink-soft)", fontSize: 8, letterSpacing: "0.08em" }}>2.5GbE ×2</text>
        <text x={154} y={208} textAnchor="middle" className="font-data" style={{ fill: "var(--ink-soft)", fontSize: 8, letterSpacing: "0.08em" }}>USB · HDMI</text>
        <text x={244} y={208} textAnchor="middle" className="font-data" style={{ fill: "var(--ink-soft)", fontSize: 8, letterSpacing: "0.08em" }}>DC-IN</text>
      </g>
    </svg>
  );
}

export default function NodeNetwork() {
  const { t } = useTranslation("home");
  const specs = t("node.specs", { returnObjects: true }) as [string, string][];

  return (
    <Section id="node">
      <div className="flex items-center gap-3 mb-2">
        <SectionLabel>{t("node.label")}</SectionLabel>
        <span className="font-data text-[10px] uppercase tracking-[0.12em] px-2 py-1 border" style={{ borderColor: "var(--gold)", color: "var(--ink)" }}>
          {t("node.phase")}
        </span>
      </div>
      <Heading pre={t("node.h1Pre")} em={t("node.h1Em")} maxWidth={920} className="mt-6 mb-6" />
      <p className="text-ink-soft text-lg leading-relaxed max-w-[680px] mb-12">{t("node.lede")}</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
        {/* 디바이스 일러스트 (원본 — 증분3에서 시네마틱 사진 백드롭 적용 예정) */}
        <div className="card p-6 md:p-8">
          <NodeDevice statusLabel={t("node.status")} />
          <div className="mt-4 flex items-baseline justify-between border-t border-rule pt-4">
            <span className="font-display text-ink text-xl">{t("node.deviceName")}</span>
            <span className={SUBLABEL}>{t("node.deviceSub")}</span>
          </div>
        </div>

        {/* 스펙 그리드 */}
        <div>
          <p className={`${SUBLABEL} mb-4`}>{t("node.specsLabel")}</p>
          <div className="grid grid-cols-2 gap-px bg-rule rounded-[20px] overflow-hidden rim">
            {specs.map(([label, value]) => (
              <div key={label} className="bg-paper-deep p-4 md:p-5">
                <div className="font-display text-ink text-lg leading-tight">{value}</div>
                <div className={`${SUBLABEL} mt-1`}>{label}</div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-ink-soft text-[12px] leading-relaxed">{t("node.note")}</p>
          <a href="/whitepaper" className="btn-ghost mt-6 gap-1.5 px-6 text-[14px] font-semibold">
            {t("node.ctaPaper")}<span aria-hidden="true">→</span>
          </a>
        </div>
      </div>
    </Section>
  );
}
