import { useTranslation } from "react-i18next";
import Section from "../Section";
import SectionLabel from "../SectionLabel";

type Item = { n: string; h: string; s: string; b: string };

// 3축 = data 팔레트(brand red 아님, moss audit §2 DATA 분류).
const AXIS = ["var(--data-1)", "var(--data-2)", "var(--data-3)"] as const;

/** 허브-스포크 다이어그램 — $ASSA 중심에 3축 노드, 공급↔수요 균형. 색은 테마 인지 CSS 변수. */
function FanNetwork({ labels, balance }: { labels: string[]; balance: string }) {
  const hub = { x: 380, y: 158 };
  const nodes = [
    { x: 380, y: 52, c: AXIS[0], t: labels[0] },
    { x: 168, y: 250, c: AXIS[1], t: labels[1] },
    { x: 592, y: 250, c: AXIS[2], t: labels[2] },
  ];
  return (
    <svg
      viewBox="0 0 760 320"
      className="w-full h-auto"
      role="img"
      aria-label={`$ASSA at the center of three axes — ${labels.join(", ")}. ${balance}`}
    >
      {/* 스포크 */}
      {nodes.map((n, i) => (
        <line
          key={`l${i}`}
          x1={hub.x}
          y1={hub.y}
          x2={n.x}
          y2={n.y}
          style={{ stroke: "var(--rule)", strokeWidth: 1.5 }}
        />
      ))}
      {/* 순환 화살표(노드 간 곡선) */}
      <path
        d="M380 72 Q 540 150 580 232"
        fill="none"
        style={{ stroke: "var(--data-3)", strokeWidth: 1.5 }}
        strokeOpacity={0.5}
        strokeDasharray="4 5"
      />
      <path
        d="M560 250 Q 380 300 200 250"
        fill="none"
        style={{ stroke: "var(--data-2)", strokeWidth: 1.5 }}
        strokeOpacity={0.5}
        strokeDasharray="4 5"
      />
      <path
        d="M180 232 Q 220 150 380 72"
        fill="none"
        style={{ stroke: "var(--data-1)", strokeWidth: 1.5 }}
        strokeOpacity={0.5}
        strokeDasharray="4 5"
      />
      {/* 노드 */}
      {nodes.map((n, i) => (
        <g key={`n${i}`}>
          <circle cx={n.x} cy={n.y} r={30} style={{ fill: "var(--paper-deep)", stroke: n.c, strokeWidth: 2 }} />
          <circle cx={n.x} cy={n.y} r={5} style={{ fill: n.c }} />
          <text
            x={n.x}
            y={n.y + (i === 0 ? -44 : 50)}
            textAnchor="middle"
            className="font-data"
            style={{ fill: "var(--ink-soft)", fontSize: 11, letterSpacing: "0.12em" }}
          >
            {n.t}
          </text>
        </g>
      ))}
      {/* 허브 */}
      <circle cx={hub.x} cy={hub.y} r={46} style={{ fill: "var(--paper-deep)", stroke: "var(--brand)", strokeWidth: 2 }} />
      <text
        x={hub.x}
        y={hub.y + 6}
        textAnchor="middle"
        className="font-display"
        style={{ fill: "var(--ink)", fontSize: 20 }}
      >
        $ASSA
      </text>
      {/* 균형 캡션 */}
      <text
        x={380}
        y={308}
        textAnchor="middle"
        className="font-data"
        style={{ fill: "var(--ink-soft)", fontSize: 12, letterSpacing: "0.16em" }}
      >
        {balance}
      </text>
    </svg>
  );
}

export default function SolutionTrinity() {
  const { t } = useTranslation("home");
  const items = t("trinity.items", { returnObjects: true }) as Item[];
  const emA = t("trinity.h1EmA");
  const emB = t("trinity.h1EmB");
  const emC = t("trinity.h1EmC");

  return (
    <Section id="solution">
      <SectionLabel>{t("trinity.label")}</SectionLabel>

      <h2 className="font-display text-[clamp(34px,5vw,60px)] leading-[1.05] tracking-[-0.02em] mt-8 mb-6 max-w-[920px]">
        {t("trinity.h1Pre")}
        <br />
        <em className="italic-brand">{emA}</em> · <em className="italic-brand">{emB}</em> ·{" "}
        <em className="italic-brand">{emC}</em>.
      </h2>

      <p className="text-ink-soft text-lg leading-relaxed max-w-[680px] mb-12">
        {t("trinity.lead")}
      </p>

      <div className="mb-14 max-w-[760px]">
        <FanNetwork labels={[emA, emB, emC]} balance={t("trinity.balance")} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {items.map((c, i) => (
          <div
            key={c.n}
            className="border border-rule bg-paper-deep p-8 md:p-9 min-h-[300px] transition-transform hover:-translate-y-1"
            style={{ borderTop: `2px solid ${AXIS[i]}` }}
          >
            <div
              className="font-data text-[11px] uppercase tracking-[0.12em]"
              style={{ color: AXIS[i] }}
            >
              {c.n}
            </div>
            <div className="font-display text-ink text-[30px] mt-4 leading-tight">{c.h}</div>
            <div className="italic text-[15px] mt-1 mb-5" style={{ color: AXIS[i] }}>
              {c.s}
            </div>
            <p className="text-ink-soft text-[16px] leading-relaxed">{c.b}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}
