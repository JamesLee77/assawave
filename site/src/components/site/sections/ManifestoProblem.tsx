import { useTranslation } from "react-i18next";

export default function ManifestoProblem() {
  const { t } = useTranslation("home");
  const items = t("problem.items", { returnObjects: true }) as [string, string][];

  return (
    <section id="manifesto" className="border-t border-rule">
      {/* 선언문 — 센터 + 레드 글로우 */}
      <div className="relative overflow-hidden border-b border-rule py-20 md:py-28">
        <span
          className="glow glow-red"
          style={{ width: 900, height: 420, left: "50%", top: "50%", transform: "translate(-50%,-50%)", filter: "blur(0px)" }}
        />
        <div className="relative z-10 mx-auto max-w-7xl px-5 md:px-10 text-center">
          <span className="inline-flex items-center gap-3 font-data text-[12px] uppercase tracking-[0.2em] text-ink-dim mb-6">
            <span aria-hidden="true" className="h-px w-7" style={{ background: "var(--rule-strong)" }} />
            {t("problem.label")}
            <span aria-hidden="true" className="h-px w-7" style={{ background: "var(--rule-strong)" }} />
          </span>
          <h2 className="font-display text-[clamp(28px,4.6vw,46px)] leading-[1.18] tracking-[-0.015em] max-w-[980px] mx-auto">
            {t("problem.h1Pre")} <span className="italic-brand">{t("problem.h1Em")}</span>
          </h2>
        </div>
      </div>

      {/* FAIL 카드 */}
      <div className="mx-auto max-w-7xl px-5 md:px-10 py-20 md:py-24">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {items.map(([h, b], i) => (
            <article
              key={i}
              className="chamfer rim relative overflow-hidden p-7 md:p-8 transition-transform duration-200 hover:-translate-y-1"
              style={{ background: "linear-gradient(165deg, var(--paper-deep), color-mix(in srgb, var(--paper-deep) 80%, #000 20%))" }}
            >
              <span aria-hidden="true" className="absolute top-0 left-0 h-0.5 w-full" style={{ background: "linear-gradient(90deg, var(--brand), transparent 70%)", opacity: 0.6 }} />
              <div className="flex items-start justify-between mb-6">
                <span className="font-data text-[11px] font-bold uppercase tracking-[0.18em] text-brand-accent">
                  FAIL · {String(i + 1).padStart(2, "0")}
                </span>
                <span className="font-display text-[52px] leading-none tracking-tight" style={{ color: "color-mix(in srgb, var(--ink) 8%, transparent)" }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <h3 className="font-display text-[21px] leading-tight mb-3.5">{h}</h3>
              <p className="text-[14.5px] leading-relaxed text-ink-soft">{b}</p>
              <div className="mt-6 h-[3px] w-full" style={{ background: "color-mix(in srgb, var(--ink) 4%, transparent)" }}>
                <div className="h-full" style={{ width: `${[40, 62, 48][i]}%`, background: "linear-gradient(90deg, var(--brand), var(--red-deep))" }} />
              </div>
            </article>
          ))}
        </div>

        <a href="/whitepaper" className="mt-10 btn-ghost inline-flex items-center gap-1.5 px-6 font-semibold">
          {t("problem.ctaPaper")}
          <span aria-hidden="true">→</span>
        </a>
      </div>
    </section>
  );
}
