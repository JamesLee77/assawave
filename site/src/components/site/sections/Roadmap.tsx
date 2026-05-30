import Section from "../Section";
import SectionLabel from "../SectionLabel";

type Milestone = {
  phase: string;
  title: string;
  date: string;
  status: "completed" | "active" | "planned";
  items: string[];
};

export default function Roadmap() {
  const milestones: Milestone[] = [
    {
      phase: "Phase 1",
      title: "GENESIS (Core Infrastructure)",
      date: "Q3 2026",
      status: "completed",
      items: [
        "Design System & Brand Renewal Complete",
        "Base Chain Smart Contract Design",
        "Wallet Connection & SIWE Integration Testing",
        "Global KYC Verification Integration",
      ],
    },
    {
      phase: "Phase 2",
      title: "MINTING & DEBUT",
      date: "Q4 2026",
      status: "active",
      items: [
        "Public Token Sale (USDC Settlement)",
        "TGE Vesting & Claim Contract Deployment",
        "Off-chain Voice Indexer Syncing",
        "DEX Liquidity Pool Provision",
      ],
    },
    {
      phase: "Phase 3",
      title: "WAVE HARMONY",
      date: "Q1 2027",
      status: "planned",
      items: [
        "veASSA Zero-Yield Lockup Service Launch",
        "VIP Governance Rank & Tier Activation",
        "Real-time Spend-and-Burn (BME) Dashboard",
        "Multi-language (EN/KO/JA) Localization Setup",
      ],
    },
    {
      phase: "Phase 4",
      title: "STAR COMPETE (Sing & Burn)",
      date: "Q2-Q3 2027",
      status: "planned",
      items: [
        "MagicSing Mobile App Vocal Integration (VPU)",
        "Vocal Battle & Star Ranking Service",
        "Edge-AI K-Node Network Mining",
        "Voice DNA NFT Marketplace",
      ],
    },
  ];

  return (
    <Section id="roadmap" className="border-t border-rule relative overflow-hidden">
      {/* Dynamic ambient backdrop */}
      <div className="absolute top-1/2 left-10 w-[500px] h-[200px] bg-brand/5 blur-[120px] rounded-full pointer-events-none" />

      <SectionLabel>Milestones & Roadmap</SectionLabel>

      <div className="mt-12 space-y-6">
        <div className="space-y-3 mb-10">
          <h2 className="font-display text-[clamp(28px,4vw,44px)] font-bold text-ink tracking-tight leading-tight">
            ASSA WAVE <span className="text-glow-red text-brand-on-dark italic">Evolution Map</span>
          </h2>
          <p className="text-ink-soft text-[16px] leading-relaxed max-w-xl">
            Step-by-step evolution map of the K-pop Web3 platform combining vocal performance with strategic tokenomics.
          </p>
        </div>

        {/* Timeline Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
          {/* Horizontal Line on Desktop */}
          <div className="hidden md:block absolute top-[28px] left-[5%] right-[5%] h-0.5 bg-gradient-to-r from-emerald-500 via-brand-hover to-white/10 -z-10" />

          {milestones.map((m, idx) => (
            <article 
              key={idx}
              className={`glass-card rounded-[24px] p-6 relative overflow-hidden group border transition-all duration-300 ${
                m.status === "active" 
                  ? "border-brand/40 bg-brand/5 shadow-[0_10px_30px_rgba(239,37,37,0.15)]" 
                  : m.status === "completed"
                  ? "border-emerald-500/30 bg-emerald-500/[0.01]"
                  : "border-rule hover:border-rule-strong"
              }`}
            >
              {/* Dynamic Status Pulsar */}
              <div className="flex justify-between items-center mb-6">
                <span className="font-data text-[12px] text-ink-soft tracking-wider font-semibold">
                  {m.phase}
                </span>
                
                {m.status === "completed" && (
                  <span className="text-[10px] font-data font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 border border-emerald-500/20">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    DONE
                  </span>
                )}
                {m.status === "active" && (
                  <span className="text-[10px] font-data font-bold text-brand-on-dark bg-brand/10 px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 border border-brand/20 animate-pulse">
                    <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                    ACTIVE
                  </span>
                )}
                {m.status === "planned" && (
                  <span className="text-[10px] font-data font-bold text-ink-soft bg-ink/5 px-2.5 py-1 rounded-full uppercase tracking-wider border border-rule">
                    PLANNED
                  </span>
                )}
              </div>

              {/* Title & Date */}
              <div className="space-y-1 mb-6">
                <h3 className="font-display text-[18px] font-bold text-ink tracking-tight">
                  {m.title}
                </h3>
                <p className="text-[13px] text-brand font-data uppercase tracking-wider font-semibold">
                  {m.date}
                </p>
              </div>

              {/* Items List */}
              <ul className="space-y-3 font-body text-ink-soft text-[14px]">
                {m.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5 leading-relaxed">
                    <span className={`h-1.5 w-1.5 rounded-full flex-none mt-2 ${
                      m.status === "completed" 
                        ? "bg-emerald-400" 
                        : m.status === "active"
                        ? "bg-brand"
                        : "bg-ink-dim/20"
                    }`} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </Section>
  );
}
