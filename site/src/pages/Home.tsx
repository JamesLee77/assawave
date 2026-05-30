import Hero from "../components/site/sections/Hero";
import ManifestoProblem from "../components/site/sections/ManifestoProblem";
import StageAuditionShowcase from "../components/site/sections/StageAuditionShowcase";
import SolutionTrinity from "../components/site/sections/SolutionTrinity";
import Tokenomics from "../components/site/sections/Tokenomics";
import MarketScenarios from "../components/site/sections/MarketScenarios";
import NodeNetwork from "../components/site/sections/NodeNetwork";
import Roadmap from "../components/site/sections/Roadmap";
import Faq from "../components/site/sections/Faq";

export default function Home() {
  return (
    <>
      <Hero />
      <ManifestoProblem />
      <StageAuditionShowcase />
      <SolutionTrinity />
      <Tokenomics />
      <MarketScenarios />
      <NodeNetwork />
      <Roadmap />
      <Faq />
    </>
  );
}
