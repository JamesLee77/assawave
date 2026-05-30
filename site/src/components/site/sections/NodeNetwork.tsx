import { useTranslation } from "react-i18next";
import Section from "../Section";
import SectionLabel from "../SectionLabel";
import Heading from "../Heading";

const SUBLABEL = "text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-soft";

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
        {/* Premium Edge Terminal photo container */}
        <div className="card p-4 md:p-6 overflow-hidden">
          <div className="media-frame aspect-[3/2] w-full rounded-2xl overflow-hidden relative border border-rule-strong">
            <img 
              src="/edge-device.jpg" 
              alt="ASSA WAVE Edge Terminal" 
              className="media-cover w-full h-full object-cover transition-transform duration-500 hover:scale-105" 
            />
            {/* Cinematic bottom scrim */}
            <div className="scrim-b" />
            
            {/* Live active pulsar tag */}
            <span className="absolute top-4 right-4 chip bg-black/60 border border-white/10 text-glow-red scale-90">
              <span className="sw bg-brand animate-pulse" /> {t("node.status")}
            </span>
          </div>
          <div className="mt-4 flex items-baseline justify-between border-t border-rule pt-4 px-2">
            <span className="font-display text-ink text-xl">{t("node.deviceName")}</span>
            <span className={SUBLABEL}>{t("node.deviceSub")}</span>
          </div>
        </div>

        {/* Specs Grid */}
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
