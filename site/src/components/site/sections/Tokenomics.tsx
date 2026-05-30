import { useTranslation } from "react-i18next";
import Section from "../Section";
import SectionLabel from "../SectionLabel";
import Heading from "../Heading";
import AllocationRing from "../charts/AllocationRing";
import BurnEngine from "../charts/BurnEngine";
import VestingTimeline from "../charts/VestingTimeline";

const APP_URL = import.meta.env.VITE_APP_URL || "https://app.assawave.io";
const SUBLABEL = "text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-soft";

export default function Tokenomics() {
  const { t } = useTranslation("home");
  return (
    <Section id="tokenomics">
      <SectionLabel>{t("tokenomics.label")}</SectionLabel>
      <Heading pre={t("tokenomics.h1Pre")} em={t("tokenomics.h1Em")} maxWidth={920} className="mt-8 mb-6" />
      <p className="text-ink-soft text-lg leading-relaxed max-w-[680px] mb-14">{t("tokenomics.lede")}</p>

      {/* 배분 도넛 */}
      <p className={`${SUBLABEL} mb-6`}>{t("tokenomics.allocLabel")}</p>
      <AllocationRing />

      {/* 누적 소각 엔진 */}
      <p className={`${SUBLABEL} mb-6 mt-20`}>{t("tokenomics.burnLabel")}</p>
      <BurnEngine />

      {/* 수요 흡수 2-카드: 무이자 락업 / 소비 소각 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-16">
        <div className="card p-7 md:p-8">
          <div className="flex items-center justify-between">
            <div className={SUBLABEL}>{t("tokenomics.lockTitle")}</div>
            <span className="font-data text-[10px] uppercase tracking-[0.12em] px-2 py-1 border" style={{ borderColor: "var(--gold)", color: "var(--ink)" }}>
              {t("tokenomics.lockChip")}
            </span>
          </div>
          <div className="font-display text-ink text-[26px] mt-4 leading-tight">{t("tokenomics.lockHead")}</div>
          <p className="text-ink-soft text-[15px] leading-relaxed mt-3">{t("tokenomics.lockBody")}</p>
        </div>

        <div className="card p-7 md:p-8">
          <span className="mb-4 inline-block h-1 w-9 rounded-full" style={{ background: "var(--coral)" }} />
          <div className={SUBLABEL}>{t("tokenomics.sinkTitle")}</div>
          <div className="font-display text-ink text-[26px] mt-4 leading-tight">{t("tokenomics.sinkHead")}</div>
          <p className="text-ink-soft text-[15px] leading-relaxed mt-3">{t("tokenomics.sinkBody")}</p>
        </div>
      </div>

      {/* 베스팅 타임라인 */}
      <p className={`${SUBLABEL} mb-6 mt-20`}>{t("tokenomics.vestLabel")}</p>
      <VestingTimeline />

      {/* CTA */}
      <div className="mt-12 flex flex-wrap items-center gap-4">
        <a href="/whitepaper" className="btn-primary inline-flex items-center px-6 font-medium tracking-wide">
          {t("tokenomics.ctaPaper")}
        </a>
        <a href={APP_URL} className="btn-ghost gap-1.5 px-6 text-[14px] font-semibold">
          {t("tokenomics.ctaApp")}<span aria-hidden="true">↗</span>
        </a>
      </div>
    </Section>
  );
}
