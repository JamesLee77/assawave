import { useTranslation } from "react-i18next";
import Section from "../Section";
import SectionLabel from "../SectionLabel";
import Heading from "../Heading";
import ScenarioChart from "../charts/ScenarioChart";
import { MARKET_STATS } from "../../../lib/tokenomics";

const SUBLABEL = "text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-soft";
const CARD_ROLE = ["var(--data-1)", "var(--data-2)", "var(--data-4)"];

export default function MarketScenarios() {
  const { t } = useTranslation("home");
  const cards = ["demand", "supply", "assumption"];

  return (
    <Section id="market">
      <SectionLabel>{t("market.label")}</SectionLabel>
      <Heading pre={t("market.h1Pre")} em={t("market.h1Em")} maxWidth={920} className="mt-8 mb-6" />
      <p className="text-ink-soft text-lg leading-relaxed max-w-[680px] mb-12">{t("market.lede")}</p>

      {/* 지표 스탯 밴드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-rule rounded-[20px] overflow-hidden rim">
        {MARKET_STATS.map((s) => (
          <div key={s.key} className="bg-paper-deep p-5 md:p-6">
            <div className="font-display tabular-nums text-ink text-[clamp(28px,4vw,40px)] leading-none">{s.value}</div>
            <div className={`${SUBLABEL} mt-2`}>{t(`market.stat.${s.key}`)}</div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-ink-soft text-[12px]">{t("market.statsNote")}</p>

      {/* 수요/공급 시나리오 차트 */}
      <p className={`${SUBLABEL} mb-6 mt-16`}>{t("market.scenarioLabel")}</p>
      <ScenarioChart />

      {/* 해설 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-14">
        {cards.map((k, i) => (
          <div key={k} className="card p-7">
            <span className="mb-4 inline-block h-1 w-9 rounded-full" style={{ background: CARD_ROLE[i] }} />
            <div className="font-display text-ink text-[22px] leading-tight">{t(`market.card.${k}.title`)}</div>
            <p className="text-ink-soft text-[15px] leading-relaxed mt-3">{t(`market.card.${k}.body`)}</p>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="mt-12 flex flex-wrap items-center gap-4">
        <a href="/whitepaper" className="btn-ghost px-6 text-[14px] font-semibold">
          {t("market.ctaPaper")}
        </a>
      </div>
    </Section>
  );
}
