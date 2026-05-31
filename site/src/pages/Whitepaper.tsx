import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import {
  BMEFlywheel,
  ArchitectureLayers,
  NodeTierPyramid,
  HybridXP,
  VeASSAStaking,
} from "../components/site/WhitepaperFigures";

/**
 * Public lite-paper for assawave.io/whitepaper.
 * Derived from ASSA WAVE Whitepaper v2.0 — PUBLIC scope only.
 * Intentionally omits private-sale terms, price targets, multi-year financial
 * projections, insider allocation/vesting, and market-making detail. Major-label
 * partners are described as "in discussion" (not confirmed). The full confidential
 * paper is shared with qualified investors via the investor portal under NDA.
 */

const APP_URL = "https://app.assawave.io";

const NAV = [
  { id: "overview", label: "Overview" },
  { id: "vision", label: "Vision" },
  { id: "problem", label: "Problem" },
  { id: "solution", label: "Solution" },
  { id: "technology", label: "Technology" },
  { id: "product", label: "Product" },
  { id: "tokenomics", label: "Tokenomics" },
  { id: "market", label: "Market" },
  { id: "roadmap", label: "Roadmap" },
  { id: "compliance", label: "Compliance & Risk" },
  { id: "glossary", label: "Glossary" },
];

function WPSection({ id, index, eyebrow, title, children }: {
  id: string; index: string; eyebrow: string; title: string; children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-28 border-t border-rule py-14 md:py-20">
      <div className="eyebrow text-brand-accent mb-3">
        <span className="text-ink-soft">{index} · </span>{eyebrow}
      </div>
      <h2 className="font-display font-extrabold tracking-tight text-ink text-[clamp(28px,4vw,46px)] leading-[1.05] mb-6">
        {title}
      </h2>
      <div className="space-y-5 text-[15px] leading-relaxed text-ink-soft max-w-3xl">
        {children}
      </div>
    </section>
  );
}

function Lead({ children }: { children: ReactNode }) {
  return <p className="text-ink text-[17px] md:text-[19px] leading-relaxed font-medium">{children}</p>;
}

function H3({ children }: { children: ReactNode }) {
  return <h3 className="font-display font-bold text-ink text-xl md:text-2xl mt-8 mb-1">{children}</h3>;
}

/** Compact responsive key/value list (label → value rows). */
function Rows({ items }: { items: [string, string][] }) {
  return (
    <div className="border border-rule rounded-2xl overflow-hidden divide-y divide-rule bg-paper-deep/40">
      {items.map(([k, v]) => (
        <div key={k} className="grid grid-cols-1 sm:grid-cols-[minmax(0,7rem)_1fr] gap-1 sm:gap-4 px-4 py-3">
          <div className="text-[12px] font-data uppercase tracking-wide text-brand-accent">{k}</div>
          <div className="text-[14px] text-ink-soft">{v}</div>
        </div>
      ))}
    </div>
  );
}

function Bullets({ items }: { items: ReactNode[] }) {
  return (
    <ul className="space-y-2.5">
      {items.map((it, i) => (
        <li key={i} className="flex gap-3">
          <span className="mt-2 h-1.5 w-1.5 rounded-full bg-brand flex-shrink-0" aria-hidden="true" />
          <span>{it}</span>
        </li>
      ))}
    </ul>
  );
}

export default function Whitepaper() {
  return (
    <section className="relative mx-auto max-w-7xl px-5 md:px-10 py-14 md:py-20">
      <div className="atmospheric-glow" aria-hidden="true" />

      {/* Hero */}
      <header className="max-w-3xl mb-10">
        <span className="eyebrow text-brand-accent mb-4 block">Litepaper · v2.0</span>
        <h1 className="font-display font-extrabold tracking-tight text-ink text-[clamp(40px,7vw,84px)] leading-[0.98] mb-6">
          Whitepaper
        </h1>
        <Lead>
          K-pop's ~250M global fans pour an estimated $1.2B of voluntary cheering, prediction, and
          debut-support effort into the ecosystem every year — for free. ASSA WAVE channels that effort
          into Web3 infrastructure and returns the rewards to fans.
        </Lead>
        <p className="mt-4 text-[14px] text-ink-soft leading-relaxed">
          A global K-pop singing super-app powered by <strong className="text-ink">DePIN · AI · Web3</strong>.
          “ASSA, sing together!” — the name comes from a Korean cheer of pure joy.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a href={APP_URL} className="btn-primary text-[13px] font-semibold px-6">Open Investor Portal →</a>
          <Link to="/" className="btn-ghost text-[13px] font-semibold px-6">Back to Home</Link>
        </div>
        <p className="mt-5 text-[12px] text-ink-dim leading-relaxed max-w-2xl">
          This is the <strong className="text-ink-soft">public summary</strong>. Detailed token
          economics, financial models, and partnership terms are reserved for qualified investors via
          the investor portal under NDA.
        </p>
      </header>

      <div className="lg:grid lg:grid-cols-[200px_1fr] lg:gap-12">
        {/* Sticky section nav (desktop) */}
        <nav className="hidden lg:block" aria-label="On this page">
          <div className="sticky top-28">
            <div className="eyebrow text-ink-soft mb-3">On this page</div>
            <ul className="space-y-2 text-[13px]">
              {NAV.map((n) => (
                <li key={n.id}>
                  <a href={`#${n.id}`} className="text-ink-soft hover:text-brand transition-colors">
                    {n.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        {/* Content */}
        <div>
          <WPSection id="overview" index="§ 01" eyebrow="Foundation" title="Overview">
            <p>
              ASSA WAVE turns singing into something fans own. Join with a single phone and you instantly
              become your own Node Master — invite five friends, sing each new K-pop comeback together,
              and expand into neighborhood, home, and online Nodes. Every smartphone acts as a Node.
            </p>
            <H3>Seven core innovations</H3>
            <Bullets items={[
              <><strong className="text-ink">Phone Node</strong> — every phone is a Personal Node + Master from sign-up, no purchase or setup.</>,
              <><strong className="text-ink">Edge Compute Mining</strong> — capable phones run background AI inference to help validate the network.</>,
              <><strong className="text-ink">Korea-origin strategy</strong> — Korea as the K-pop content origin + a regional edge; global edge is distributed per region.</>,
              <><strong className="text-ink">ASSA Together Challenge</strong> — every K-pop comeback auto-triggers a viral group sing-along.</>,
              <><strong className="text-ink">Hybrid XP tiers</strong> — Skill 40% · AI 30% · Social 20% · Stake 10%.</>,
              <><strong className="text-ink">BME (Burn-Mint Equilibrium)</strong> — the model proven by Helium, Render, and io.net.</>,
              <><strong className="text-ink">4-Way Flywheel</strong> — User, Node, Platform, and Token all win.</>,
            ]} />
          </WPSection>

          <WPSection id="vision" index="§ 02" eyebrow="Foundation" title="Vision — where singing becomes an asset">
            <Lead>
              A place for people who just want to sing. Sing well and you're recognized; put in effort and
              you progress; bring friends and it's fun; build trust and you're rewarded.
            </Lead>
            <H3>Five principles</H3>
            <Bullets items={[
              <><strong className="text-ink">Singing at the center</strong> — every feature starts from singing.</>,
              <><strong className="text-ink">Skill is the asset</strong> — VPU score is 40% of evaluation (anti pay-to-win).</>,
              <><strong className="text-ink">Together with friends</strong> — four Node types (📱 Phone · 🏪 Local · 🏠 Home · 🌐 Online).</>,
              <><strong className="text-ink">Real rewards</strong> — avoiding the Audius/Royal failure modes.</>,
              <><strong className="text-ink">Light entry</strong> — “fan & friends” lightness, not “citizen & sovereignty” heaviness.</>,
            ]} />
          </WPSection>

          <WPSection id="problem" index="§ 03" eyebrow="Foundation" title="The K-pop fandom paradox">
            <p>K-pop fandom is enormous and devoted, yet four paradoxes go unsolved:</p>
            <Bullets items={[
              <><strong className="text-ink">Cheer without reward</strong> — fans work daily to build charts, but cheering infrastructure is scattered across social apps.</>,
              <><strong className="text-ink">Skill without recognition</strong> — singing talent has no mechanism to become an asset.</>,
              <><strong className="text-ink">Invest without control</strong> — fans buy goods and albums but have no say in how artists are run.</>,
              <><strong className="text-ink">Global but fragmented</strong> — 250M fans split across countries, languages, and channels.</>,
            ]} />
            <H3>Limits of existing solutions</H3>
            <Rows items={[
              ["Smule", "Expensive VIP paywall, weak game-like retention, no AI differentiation"],
              ["StarMaker", "Bot-ridden, weak Korean licensing, thin K-pop catalog"],
              ["Audius", "No licensed catalog, token collapse, artist payout meaningless"],
              ["Royal.io", "NFT revenue-share failed, sunset in 2024"],
              ["STEPN / Axie", "P2E death spiral, dependent on new users"],
              ["Chiliz / Socios", "Sports-only, never entered K-pop"],
            ]} />
          </WPSection>

          <WPSection id="solution" index="§ 04" eyebrow="Foundation" title="Solution overview">
            <Rows items={[
              ["Cheer", "All-Kill Pool — voluntary cheering becomes a transparent market"],
              ["Skill", "Tier System — six tiers, VPU score weighted 40%"],
              ["Invest", "veASSA DAO + Fan Tokens — governance and setlist voting"],
              ["Fragmented", "Four Node types — Phone / Local / Home / Online communities"],
              ["Differentiation", "Phone Node + 5G + Voice Biometric"],
            ]} />
            <p className="pt-2">
              <strong className="text-ink">In one line:</strong> K-pop fan instincts (cheer · predict · support debuts)
              × Phone Node infrastructure × Hybrid-XP tiers × BME tokenomics = ASSA WAVE.
            </p>
          </WPSection>

          <WPSection id="technology" index="§ 05" eyebrow="Technology" title="Technology">
            <H3>System architecture</H3>
            <p>
              A dual-app split (a <strong className="text-ink">Music app</strong> for karaoke, scoring, and
              recording; a <strong className="text-ink">Wallet app</strong> for $ASSA, NFTs, mining, and DAO)
              keeps store-policy and regulatory concerns cleanly separated, over four layers:
              User Device → Network (P2P validation, IPFS cache, 5G mesh) → Smart Contract (Base L2 → custom L3)
              → B2B / Marketing.
            </p>
            <ArchitectureLayers />
            <p>
              The split matters in practice: app-store policy treats fiat purchases and token/NFT
              custody very differently, so isolating wallet, mining, and DAO surfaces in a separate
              app keeps the music experience reviewable while the on-chain layer evolves
              independently. Each layer can scale and be audited on its own.
            </p>
            <H3>Edge Compute Mining (DePIN)</H3>
            <p>
              Singing is universal, but AI compute is scarce — that is where real value sits. Mining has two
              axes: <strong className="text-ink">Singer Mining</strong> (universal) and
              <strong className="text-ink"> Edge Compute Mining</strong> (capable devices providing inference and
              validation). Nodes span a five-tier structure by device capability:
            </p>
            <Rows items={[
              ["Tier-Ω", "Edge PC (60+ TOPS, 24/7) — mega edge node"],
              ["Tier-S", "Latest flagship phones (45+ TOPS)"],
              ["Tier-A", "Premium phones (~38 TOPS) — inference/validation tier"],
              ["Tier-B", "Standard phones (~15 TOPS)"],
              ["Tier-C", "Entry devices (~5 TOPS)"],
            ]} />
            <NodeTierPyramid />
            <p>
              Korea plays two roles — <strong className="text-ink">K-pop content origin</strong> and a
              <strong className="text-ink"> Korea-market edge</strong> — while the global edge is distributed
              per region (the definition of edge is “near the user”).
            </p>
            <H3>AI stack</H3>
            <p>
              Phone Nodes provide six AI areas: personal AI (VPU scoring, voice analysis, AI coach), network
              inference, generative AI (AI cover, duet, MV), multi-modal (lip-sync, visuals), network services
              (cache, P2P relay, edge CDN), and federated learning. Core models run as local inference
              (Whisper.cpp, TinyLlama, Llama 3.2, CREPE, RVC Mobile).
            </p>
            <H3>Data storage — 5-layer hybrid</H3>
            <Bullets items={[
              <><strong className="text-ink">Hot</strong> — popular MR + recent performances (Edge PC + IPFS)</>,
              <><strong className="text-ink">Warm</strong> — user performance audio (Storj)</>,
              <><strong className="text-ink">Cold</strong> — AI voice-clone models (Filecoin)</>,
              <><strong className="text-ink">Permanent</strong> — NFT metadata (Arweave)</>,
              <><strong className="text-ink">IP</strong> — originals, derivatives, voice-clone consent (Story Protocol)</>,
            ]} />
            <H3>Smart contract design</H3>
            <p>
              Core modules include ASSAToken (ERC-20), SINGNFT (ERC-1155), VoiceDNANFT, veASSA, AllKillPool,
              PredictionMarket, DebutFundingDAO, EdgeNodeRegistry, BMEBurner, TierManager, and a SettlementOracle
              integrating chart APIs.
            </p>
          </WPSection>

          <WPSection id="product" index="§ 06" eyebrow="Product" title="Product">
            <H3>Four Node types</H3>
            <Rows items={[
              ["📱 Phone", "Auto on sign-up · up to 5 closest friends"],
              ["🏪 Local", "Karaoke visit · up to 50 regulars"],
              ["🏠 Home", "Edge PC · up to 10 family/friends"],
              ["🌐 Online", "Topic-based · 100–1,000 global fans"],
            ]} />
            <H3>ASSA Together Challenge</H3>
            <p>
              Every K-pop comeback auto-activates a 24-hour synchronized sing-along, extended over seven days,
              with a Top-100 NFT. Seven categories (solo, duet, group, language, instrument, dance+sing, AI cover)
              and viral hooks (auto-clip, auto-MV, one-tap share, “For You” feed, fandom-vs-fandom, artist reacts).
            </p>
            <H3>Eight activities × seven places</H3>
            <p>
              Sing, Challenge, Cheer, Guess, Nurture, Judge, Collect, and Decide — surfaced across seven places:
              Studio, Arena, Plaza, Academy, Network, Senate, and Marketplace.
            </p>
            <H3>Tier system + Hybrid XP</H3>
            <p>
              Six tiers from Rookie to Legend, with voting power that scales by tier. XP combines four drivers so
              no single lever dominates:
            </p>
            <Rows items={[
              ["Skill 40%", "Average VPU score — keeps it a skill-first app"],
              ["AI 30%", "AI service usage"],
              ["Social 20%", "Nodes, friends, challenges"],
              ["Stake 10%", "veASSA / NFT holdings"],
            ]} />
            <HybridXP />
          </WPSection>

          <WPSection id="tokenomics" index="§ 07" eyebrow="Tokenomics" title="Tokenomics (mechanics)">
            <Rows items={[
              ["Token", "$ASSA — utility token"],
              ["Network", "Base (L2, ERC-20) → future custom L3"],
              ["Supply", "10,000,000,000 (10B) hard cap"],
              ["NFT", "ERC-1155 (ASSA-NFT, Voice DNA, Concert Pass)"],
              ["Burn", "BME — Burn-Mint Equilibrium"],
              ["Utility", "Voice Right — payments, governance, battles, gifting"],
            ]} />
            <p className="text-[13px] text-ink-dim">
              Distribution percentages, emission schedule, sale terms, and price scenarios are detailed in the
              full investor paper (NDA).
            </p>
            <H3>$ASSA utilities &amp; burn</H3>
            <Bullets items={[
              <>Premium subscription &amp; AI services (cover, MV, vocal coach) — partial burn on spend</>,
              <>NFT marketplace and battle fees — higher burn share</>,
              <>B2B API payment option</>,
              <>DAO voting (requires veASSA lock — non-burning)</>,
              <>Cheer Pools &amp; debut funding participation</>,
            ]} />
            <H3>BME — Burn-Mint Equilibrium</H3>
            <p>
              External revenue (e.g. a Premium subscription) → the platform buys $ASSA on-market with a share of
              that revenue → the bought tokens are sent to a burn address (permanent) → circulating supply falls
              while demand rises → reward value to providers and singers is preserved → more nodes and users →
              more revenue → repeat. This is the model validated by Helium, Render, and io.net.
            </p>
            <BMEFlywheel />
            <p>
              The key property is that rewards are funded by <strong className="text-ink">real external
              revenue</strong>, not by inflating supply against the 10B hard cap. When usage rises, more revenue
              is routed into buy-and-burn, so growth tightens supply rather than diluting it — the opposite of a
              P2E emission spiral.
            </p>
            <H3>veASSA — staking for governance, not yield</H3>
            <p>
              $ASSA can be time-locked into <strong className="text-ink">veASSA</strong> to earn a say in the
              ecosystem — never interest. This stake is <strong className="text-ink">zero-yield by design</strong>:
              no APY, no emission, no reward path. What you get instead is <em className="italic-brand">fandom
              differentiation</em> — governance weight and tier privileges that spending alone cannot buy.
            </p>
            <VeASSAStaking />
            <p>
              Voting Power = veASSA held × Tier Multiplier. A whale with no activity holds zero power, and a rookie
              with no stake holds zero — activity <em className="italic-brand">and</em> stake are both required
              (skin in the game on both sides). Locked power decays linearly to zero at unlock, so influence
              tracks ongoing commitment rather than a one-time deposit.
            </p>
            <H3>What a veASSA lock unlocks</H3>
            <Bullets items={[
              <>Governance scope that widens by tier — from feature polls up to treasury and partnership topics</>,
              <>Setlist / A&amp;R voting — fans help decide what gets made</>,
              <>A once-per-season veto reserved for the top tier</>,
              <>Tier perks across the app (the 10% “Stake” weight in Hybrid-XP)</>,
              <>Cheer-pool and debut-funding participation rights</>,
            ]} />
            <p className="text-[13px] text-ink-dim">
              On-chain, veASSA is a strict zero-yield lock — the staking contract exposes no
              reward / emission / interest function (an invariant the test suite enforces). $ASSA is a utility
              token; see §10.
            </p>
          </WPSection>

          <WPSection id="market" index="§ 08" eyebrow="Market" title="Market">
            <H3>Korea's $1.2B fandom TAM</H3>
            <p>Today, Korean K-pop fandom performs an estimated $1.2B/yr of free labor:</p>
            <Rows items={[
              ["Chart activity", "~$500M — global prediction"],
              ["Music buying", "~$200M — collective prediction market"],
              ["Fan events / lottery", "~$300M — micro-betting"],
              ["Concert lightsticks", "~$100M — visibility boost"],
              ["Debut support", "~$80M — collective A&R"],
              ["Pre-record cheering", "~$50M — collective cheering"],
            ]} />
            <H3>Global fandom scale (~250M)</H3>
            <p>
              ARMY (BTS) 100M+, BLINK (BLACKPINK) 70M+, NCTZEN 30M+, plus STAY, ONCE, CARAT, MOA, and BUNNIES at
              tens of millions each — roughly 250M global K-pop fans (de-duplicated).
            </p>
          </WPSection>

          <WPSection id="roadmap" index="§ 09" eyebrow="Execution" title="Roadmap">
            <H3>Near-term milestones</H3>
            <Bullets items={[
              <><strong className="text-ink">Q3 2026</strong> — Wallet App + Phone Node auto-activation; AI Coach, Daily Quest, Tier MVP; first Korean K-pop licenses + Concert Pass NFT</>,
              <><strong className="text-ink">Q4 2026</strong> — ASSA Together Challenge beta; Edge PC beta in Korea; K-Music Committee founding-partner application</>,
              <><strong className="text-ink">Q1–Q2 2027</strong> — AI Cover Studio + Voice DNA NFT; PvP sing-off, duet/battle, live & gift; major-label pilots</>,
              <><strong className="text-ink">Q3–Q4 2027</strong> — MCP server (assistant integrations); first Fan Tokens; karaoke rollout</>,
            ]} />
            <H3>Five-year stages</H3>
            <Rows items={[
              ["2026 · Foundation", "Korea launch, first All-Kill Pool, Voice DNA NFT"],
              ["2027 · Expansion", "Asia rollout, Fan Token era, major-label partnerships"],
              ["2028 · Sovereignty", "Global scale, DAO at full strength, B2B"],
              ["2029 · Independence", "K-pop infrastructure standardization"],
              ["2030 · Republic", "Global K-pop infrastructure at 150M MAU scale"],
            ]} />
          </WPSection>

          <WPSection id="compliance" index="§ 10" eyebrow="Execution" title="Compliance & risk">
            <p>
              $ASSA is classified as a <strong className="text-ink">utility token</strong> and is not registered
              as a security in any jurisdiction. ASSA WAVE works toward compliance with South Korea (VAUPA),
              Japan (PSA), Singapore (MAS DTSP), and UAE (ADGM); service may be restricted in some jurisdictions
              including the US and China.
            </p>
            <Rows items={[
              ["Audits", "CertiK & Halborn"],
              ["Token type", "Utility (not equity / not security)"],
              ["Partnerships", "In active discussions with major Korean labels, rights bodies (KOMCA), and the K-Music Mutual Growth Committee"],
            ]} />
            <H3>Key risk mitigations</H3>
            <Bullets items={[
              <>Token death-spiral → BME auto-burn + fiat-revenue priority + stablecoin payment options</>,
              <>Bots / Sybil → Voice DNA + distributed validation + slashing</>,
              <>Voice-clone disputes → on-chain consent via Story Protocol</>,
              <>Regional dependency → multi-region distribution + server fallback</>,
            ]} />
          </WPSection>

          <WPSection id="glossary" index="§ 11" eyebrow="Appendix" title="Glossary">
            <Rows items={[
              ["$ASSA", "ASSA WAVE utility token (ERC-20, 10B hard cap)"],
              ["BME", "Burn-Mint Equilibrium — auto-burn of a share of revenue"],
              ["veASSA", "Time-locked $ASSA — governance weight + tier privileges (zero yield)"],
              ["Voice DNA NFT", "User voice-fingerprint NFT (Story Protocol)"],
              ["Phone Node", "Smartphone as a Node — the most accessible type"],
              ["VPU", "Verified Performance Unit — Pitch, Tempo, Tone, Power, Completion"],
              ["PAK", "Perfect All-Kill — simultaneous #1 across Korean music charts"],
              ["DePIN", "Decentralized Physical Infrastructure Network"],
            ]} />
          </WPSection>

          {/* Footer disclaimer */}
          <p className="border-t border-rule pt-8 mt-4 text-[11px] text-ink-dim leading-relaxed max-w-3xl">
            Disclaimer: This document is a public summary for information purposes only and is not a security,
            an offer or solicitation to invest, or any form of legal commitment. ASSA WAVE utility tokens ($ASSA)
            do not represent equity, shares, or direct profit-sharing rights. Forward-looking statements are based
            on assumptions at the time of writing and actual results may differ. Participation is subject to
            regional restrictions and KYC requirements. The latest version is published on official channels —
            beware of imposter sites. Official domain: assawave.io.
          </p>
        </div>
      </div>
    </section>
  );
}
