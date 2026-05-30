import { useTranslation } from "react-i18next";
import Section from "../components/site/Section";
import SectionLabel from "../components/site/SectionLabel";
import Hero from "../components/site/sections/Hero";
import ManifestoProblem from "../components/site/sections/ManifestoProblem";
import SolutionTrinity from "../components/site/sections/SolutionTrinity";
import Tokenomics from "../components/site/sections/Tokenomics";
import MarketScenarios from "../components/site/sections/MarketScenarios";
import NodeNetwork from "../components/site/sections/NodeNetwork";

// 미구현 앵커 스텁 — 헤더 nav(roadmap) 링크가 죽지 않게 타깃 유지. 증분3에서 교체.
function ComingSection({ id, label }: { id: string; label: string }) {
  return (
    <Section id={id}>
      <SectionLabel>{label}</SectionLabel>
      <p className="mt-6 text-ink-soft">Coming soon.</p>
    </Section>
  );
}

export default function Home() {
  const { t } = useTranslation("home");

  return (
    <>
      <Hero />
      <ManifestoProblem />
      <SolutionTrinity />
      <Tokenomics />
      <MarketScenarios />
      <NodeNetwork />
      {/* 증분3 자리 — 앵커 타깃 유지 */}
      <ComingSection id="roadmap" label={t("anchors.roadmap")} />
      <ComingSection id="faq" label="FAQ" />
    </>
  );
}
