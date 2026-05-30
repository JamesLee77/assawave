import { useTranslation } from "react-i18next";
import { useReducedMotion } from "../../../lib/useReducedMotion";

const APP_URL = import.meta.env.VITE_APP_URL || "https://app.assawave.io";

// 이퀄라이저 바 — [x, y, height, gradientId, delay]. 데이터 팔레트(레드 중앙 우세).
const EQ_BARS: [number, number, number, string, number][] = [
  [6, 120, 80, "gTeal", 0], [30, 84, 116, "gIndigo", 0.18], [54, 142, 58, "gAmber", 0.34],
  [78, 62, 138, "gTeal", 0.5], [102, 104, 96, "gGreen", 0.12], [126, 40, 160, "gRed", 0.62],
  [150, 92, 108, "gIndigo", 0.28], [174, 26, 174, "gRed", 0.7], [198, 70, 130, "gTeal", 0.4],
  [222, 48, 152, "gAmber", 0.55], [246, 16, 184, "gRed", 0.22], [270, 58, 142, "gRed", 0.66],
  [294, 34, 166, "gIndigo", 0.3], [318, 80, 120, "gGreen", 0.48], [342, 50, 150, "gRed", 0.6],
  [366, 98, 102, "gTeal", 0.16], [390, 66, 134, "gAmber", 0.52], [414, 110, 90, "gIndigo", 0.26],
  [438, 88, 112, "gTeal", 0.44], [462, 130, 70, "gGreen", 0.1], [486, 100, 100, "gIndigo", 0.36],
];

const GRADS: [string, string, string][] = [
  ["gRed", "#b8141a", "#ef2525"], ["gTeal", "#0a8f8f", "#14e2e2"], ["gAmber", "#b87f10", "#ffba20"],
  ["gIndigo", "#5b50c0", "#8b80f0"], ["gGreen", "#2e7a4f", "#4fb477"],
];

function Equalizer() {
  const reduced = useReducedMotion();
  return (
    <svg viewBox="0 0 520 230" preserveAspectRatio="none" className="block h-[230px] w-full" aria-hidden="true">
      <defs>
        {GRADS.map(([id, a, b]) => (
          <linearGradient key={id} id={id} x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stopColor={a} />
            <stop offset="1" stopColor={b} />
          </linearGradient>
        ))}
        <linearGradient id="eqWave" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#14e2e2" stopOpacity="0" />
          <stop offset="0.25" stopColor="#14e2e2" />
          <stop offset="0.5" stopColor="#ef2525" />
          <stop offset="0.75" stopColor="#8b80f0" />
          <stop offset="1" stopColor="#8b80f0" stopOpacity="0" />
        </linearGradient>
      </defs>
      <line x1="0" y1="200" x2="520" y2="200" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
      {EQ_BARS.map(([x, y, h, grad, delay]) => (
        <rect
          key={x}
          x={x}
          y={y}
          width={14}
          height={h}
          rx={7}
          fill={`url(#${grad})`}
          className={reduced ? undefined : "eqbar"}
          style={reduced ? undefined : { animationDelay: `${delay}s` }}
        />
      ))}
      <path d="M0 168 C 70 130, 130 200, 200 160 S 330 120, 400 162 S 480 200, 520 160" fill="none" stroke="url(#eqWave)" strokeWidth="2.5" opacity="0.85" />
      <path d="M0 184 C 80 156, 140 210, 210 178 S 340 150, 410 184 S 490 208, 520 182" fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="1.5" />
    </svg>
  );
}

const MUTED_LABEL = "font-data text-[11px] uppercase tracking-[0.16em] text-ink-soft";

export default function Hero() {
  const { t } = useTranslation("home");
  const facts = t("hero.facts", { returnObjects: true }) as [string, string][];
  const chips = t("hero.chips", { returnObjects: true }) as [string, string][];

  return (
    <section id="hero" className="relative overflow-hidden border-b border-rule">
      {/* glow 분위기 레이어 */}
      <span className="glow glow-red" style={{ width: 760, height: 760, left: -160, top: -140 }} />
      <span className="glow glow-teal" style={{ width: 680, height: 680, right: -120, top: 60 }} />
      <span className="glow glow-indigo" style={{ width: 540, height: 540, left: "38%", bottom: -220 }} />
      <div className="bg-grid absolute inset-0 opacity-60" aria-hidden="true" />

      <div className="relative z-10 mx-auto max-w-7xl px-5 md:px-10 pt-16 md:pt-24 pb-20 md:pb-28">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 lg:items-center">
          {/* LEFT */}
          <div>
            <span className="chip chamfer-sm mb-7">
              <span className="sw" style={{ background: "var(--data-1)", boxShadow: "0 0 8px 1px rgba(20,226,226,0.9)" }} />
              {t("hero.eyebrow")}
            </span>

            <h1 className="font-display text-[clamp(40px,6.4vw,68px)] leading-[1.05] tracking-[-0.02em] mb-6 max-w-[640px]">
              {t("hero.h1Pre")} <span className="italic-brand whitespace-nowrap">{t("hero.h1Em")}</span>
            </h1>

            <p className="text-[17px] leading-relaxed text-ink-soft max-w-[560px] mb-9">{t("hero.lead")}</p>

            <div className="flex flex-wrap items-center gap-4 mb-7">
              <a href="/whitepaper" className="btn-primary inline-flex items-center gap-2.5 px-7 font-semibold tracking-wide">
                <span className="tri" aria-hidden="true" />
                {t("hero.ctaPaper")}
              </a>
              <a href={APP_URL} className="btn-ghost inline-flex items-center gap-2 px-7 font-semibold">
                {t("hero.ctaApp")}
                <span aria-hidden="true">↗</span>
              </a>
            </div>

            <p className={`${MUTED_LABEL} tracking-[0.2em] flex items-center gap-3.5`}>
              <span aria-hidden="true" className="inline-block h-px w-8" style={{ background: "linear-gradient(90deg,var(--brand),transparent)" }} />
              {t("hero.micro")}
            </p>

            <div className="flex flex-wrap gap-2.5 mt-8">
              {chips.map(([label, role]) => (
                <span key={label} className="chip">
                  <span className="sw" style={{ background: `var(--${role})` }} />
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* RIGHT — equalizer viz + facts */}
          <div className="relative">
            <div
              className="chamfer-lg rim relative overflow-hidden p-6 md:p-7"
              style={{ background: "radial-gradient(120% 90% at 50% 0%, rgba(239,37,37,0.10), transparent 60%), linear-gradient(160deg, var(--surface-2), var(--paper-deep))" }}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="font-data text-[11px] uppercase tracking-[0.18em] text-ink-soft">{t("hero.vizLabel")}</span>
                <span className="font-data text-[13px] font-bold tracking-[0.04em] inline-flex items-center gap-2 text-brand-accent">
                  <span className="inline-block h-[7px] w-[7px]" style={{ background: "var(--brand)", boxShadow: "0 0 10px rgba(239,37,37,0.9)" }} />
                  $ASSA
                </span>
              </div>
              <Equalizer />
              <div className="flex items-center justify-between mt-2 font-data text-[10.5px] uppercase tracking-[0.14em] text-ink-dim">
                <span>{t("hero.vizFoot")}</span>
                <span>{t("hero.vizChannels")}</span>
              </div>
            </div>

            <div
              className="chamfer rim mt-4 px-6 pt-5 pb-2"
              style={{ background: "linear-gradient(160deg, var(--surface-3), var(--paper-deep))" }}
            >
              <div className="flex items-center justify-between pb-3.5 mb-1 border-b border-rule">
                <span className="font-display text-[14px] font-semibold tracking-[0.02em] text-ink">{t("hero.factsLabel")}</span>
                <span className="font-data text-[10px] font-semibold uppercase tracking-[0.16em] px-2.5 py-1.5" style={{ color: "var(--data-1)", boxShadow: "inset 0 0 0 1px color-mix(in srgb, var(--data-1) 28%, transparent)" }}>
                  {t("hero.factsBadge")}
                </span>
              </div>
              {facts.map(([label, value], i) => (
                <div key={label} className={`flex items-center justify-between py-3 ${i < facts.length - 1 ? "border-b border-rule" : ""}`}>
                  <span className="text-[13px] font-medium text-ink-soft">{label}</span>
                  <span className={`font-data tabular-nums text-[14.5px] font-semibold ${i === 0 ? "text-brand-accent" : "text-ink"}`}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
