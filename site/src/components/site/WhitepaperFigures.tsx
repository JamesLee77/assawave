import type { ReactNode } from "react";

/**
 * Inline SVG diagrams for the public litepaper (/whitepaper).
 * Theme-aware: the <svg> inherits `currentColor` from a Tailwind text class, soft
 * elements use opacity, and the only hard color is the brand red (#EF2525) which
 * reads on both light and dark. No yield/APY is implied anywhere — the staking
 * figure is veASSA (governance + tier privileges) only, matching the contracts.
 */

const BRAND = "#EF2525";

function Figure({ caption, children }: { caption: string; children: ReactNode }) {
  return (
    <figure className="my-9 rounded-2xl border border-rule bg-paper-deep/40 p-5 md:p-7">
      <div className="w-full overflow-x-auto flex justify-center">{children}</div>
      <figcaption className="mt-4 text-[12px] font-data uppercase tracking-wide text-ink-dim text-center">
        {caption}
      </figcaption>
    </figure>
  );
}

/* ── 1. BME Burn-Mint flywheel ───────────────────────────────────────────── */
export function BMEFlywheel() {
  const nodes = [
    { x: 230, y: 45, t: "Revenue", s: "subscriptions · AI" },
    { x: 344, y: 128, t: "Buy $ASSA", s: "on the market" },
    { x: 300, y: 262, t: "Burn", s: "supply ↓" },
    { x: 160, y: 262, t: "Scarcity", s: "value ↑" },
    { x: 116, y: 128, t: "Growth", s: "more nodes/users" },
  ];
  // clockwise arcs between adjacent nodes (inset from vertices)
  const arcs = [
    "M259,49 A120,120 0 0 1 332,101",
    "M350,157 A120,120 0 0 1 322,242",
    "M275,276 A120,120 0 0 1 185,276",
    "M138,242 A120,120 0 0 1 110,157",
    "M128,101 A120,120 0 0 1 201,49",
  ];
  return (
    <Figure caption="BME — Burn-Mint Equilibrium flywheel">
      <svg viewBox="0 0 460 320" className="text-ink w-full max-w-[460px]" role="img" aria-label="Burn-Mint Equilibrium flywheel: revenue buys ASSA, which is burned, raising scarcity and value, driving growth and more revenue.">
        <defs>
          <marker id="bme-ah" markerWidth="9" markerHeight="9" refX="6" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill={BRAND} />
          </marker>
        </defs>
        <circle cx="230" cy="165" r="120" fill="none" stroke="currentColor" strokeOpacity="0.12" />
        {arcs.map((d, i) => (
          <path key={i} d={d} fill="none" stroke={BRAND} strokeWidth="1.6" markerEnd="url(#bme-ah)" />
        ))}
        <circle cx="230" cy="165" r="36" fill="none" stroke={BRAND} strokeOpacity="0.5" />
        <text x="230" y="161" textAnchor="middle" fontSize="15" fontWeight="700" fill="currentColor">BME</text>
        <text x="230" y="177" textAnchor="middle" fontSize="8" fill="currentColor" fillOpacity="0.55">burn-mint</text>
        {nodes.map((n, i) => (
          <g key={i}>
            <rect x={n.x - 47} y={n.y - 22} width="94" height="44" rx="11" fill="var(--paper)" stroke="currentColor" strokeOpacity="0.18" />
            <text x={n.x} y={n.y - 2} textAnchor="middle" fontSize="12.5" fontWeight="700" fill="currentColor">{n.t}</text>
            <text x={n.x} y={n.y + 12} textAnchor="middle" fontSize="8.5" fill="currentColor" fillOpacity="0.6">{n.s}</text>
          </g>
        ))}
      </svg>
    </Figure>
  );
}

/* ── 2. Four-layer system architecture ───────────────────────────────────── */
export function ArchitectureLayers() {
  const layers = [
    { t: "User Device", s: "Music app (karaoke · scoring) · Wallet app ($ASSA · NFT · DAO)" },
    { t: "Network", s: "P2P validation · IPFS cache · 5G mesh" },
    { t: "Smart Contract", s: "Base L2 → custom L3", hot: true },
    { t: "B2B / Marketing", s: "APIs · label & rights partners" },
  ];
  return (
    <Figure caption="Four-layer system architecture">
      <svg viewBox="0 0 460 300" className="text-ink w-full max-w-[460px]" role="img" aria-label="Four layers: User Device, Network, Smart Contract, and B2B/Marketing, stacked top to bottom.">
        <defs>
          <marker id="arch-ah" markerWidth="9" markerHeight="9" refX="3" refY="6" orient="auto">
            <path d="M0,0 L6,0 L3,6 Z" fill="currentColor" fillOpacity="0.4" />
          </marker>
        </defs>
        {layers.map((l, i) => {
          const y = 18 + i * 70;
          return (
            <g key={i}>
              <rect x="40" y={y} width="380" height="50" rx="12" fill="var(--paper)" stroke={l.hot ? BRAND : "currentColor"} strokeOpacity={l.hot ? 0.7 : 0.2} />
              <rect x="40" y={y} width="4" height="50" rx="2" fill={BRAND} fillOpacity={l.hot ? 0.9 : 0.45} />
              <text x="62" y={y + 21} fontSize="14" fontWeight="700" fill="currentColor">{l.t}</text>
              <text x="62" y={y + 38} fontSize="10.5" fill="currentColor" fillOpacity="0.6">{l.s}</text>
              {i < layers.length - 1 && (
                <line x1="230" y1={y + 50} x2="230" y2={y + 68} stroke="currentColor" strokeOpacity="0.4" markerEnd="url(#arch-ah)" />
              )}
            </g>
          );
        })}
      </svg>
    </Figure>
  );
}

/* ── 3. Node-tier pyramid ─────────────────────────────────────────────────── */
export function NodeTierPyramid() {
  const tiers = [
    { w: 130, t: "Ω · Edge PC", s: "60+ TOPS · 24/7", hot: true },
    { w: 188, t: "S · Flagship", s: "45+ TOPS", hot: true },
    { w: 246, t: "A · Premium", s: "~38 TOPS · inference" },
    { w: 304, t: "B · Standard", s: "~15 TOPS" },
    { w: 362, t: "C · Entry", s: "~5 TOPS" },
  ];
  return (
    <Figure caption="Edge-node tiers by device capability">
      <svg viewBox="0 0 460 300" className="text-ink w-full max-w-[460px]" role="img" aria-label="Five node tiers from Omega (Edge PC) at the top to C (entry devices) at the base, widening downward.">
        {tiers.map((t, i) => {
          const y = 16 + i * 54;
          const x = 230 - t.w / 2;
          return (
            <g key={i}>
              <rect x={x} y={y} width={t.w} height="44" rx="9" fill={t.hot ? BRAND : "var(--paper)"} fillOpacity={t.hot ? 0.12 : 1} stroke={t.hot ? BRAND : "currentColor"} strokeOpacity={t.hot ? 0.6 : 0.2} />
              <text x="230" y={y + 19} textAnchor="middle" fontSize="12.5" fontWeight="700" fill="currentColor">{t.t}</text>
              <text x="230" y={y + 33} textAnchor="middle" fontSize="9.5" fill="currentColor" fillOpacity="0.62">{t.s}</text>
            </g>
          );
        })}
      </svg>
    </Figure>
  );
}

/* ── 4. Hybrid-XP split ───────────────────────────────────────────────────── */
export function HybridXP() {
  const segs = [
    { label: "Skill", pct: 40, op: 1 },
    { label: "AI", pct: 30, op: 0.62 },
    { label: "Social", pct: 20, op: 0.4 },
    { label: "Stake", pct: 10, op: 0.24 },
  ];
  const X0 = 40, W = 380;
  let cursor = X0;
  return (
    <Figure caption="Hybrid-XP composition — skill-first, anti pay-to-win">
      <svg viewBox="0 0 460 132" className="text-ink w-full max-w-[460px]" role="img" aria-label="Hybrid XP: Skill 40 percent, AI 30 percent, Social 20 percent, Stake 10 percent.">
        {segs.map((s, i) => {
          const w = (s.pct / 100) * W;
          const x = cursor;
          cursor += w;
          return (
            <g key={i}>
              <rect x={x} y="54" width={w - (i < segs.length - 1 ? 3 : 0)} height="46" rx="7" fill={BRAND} fillOpacity={s.op} />
              <text x={x + w / 2} y="44" textAnchor="middle" fontSize="11.5" fontWeight="700" fill="currentColor">{s.label}</text>
              <text x={x + w / 2} y="82" textAnchor="middle" fontSize="13" fontWeight="700" fill={i === 0 ? "#fff" : "currentColor"}>{s.pct}%</text>
            </g>
          );
        })}
        <text x="230" y="120" textAnchor="middle" fontSize="10" fill="currentColor" fillOpacity="0.6">
          Skill (40%) outweighs AI (30%) so the best singers rise fastest — not the biggest spenders.
        </text>
      </svg>
    </Figure>
  );
}

/* ── 5. veASSA staking → voting power (NO yield) ─────────────────────────── */
export function VeASSAStaking() {
  const boxes = [
    { x: 12, w: 92, t: "$ASSA", s: "" },
    { x: 134, w: 116, t: "veASSA", s: "locked · decays" },
    { x: 280, w: 100, t: "Voting Power", s: "" },
    { x: 410, w: 86, t: "Fandom", s: "privileges" },
  ];
  return (
    <Figure caption="veASSA — stake for governance & fandom privileges (zero yield)">
      <svg viewBox="0 0 508 210" className="text-ink w-full max-w-[508px]" role="img" aria-label="ASSA is locked into veASSA which decays; times tier multiplier gives voting power, which unlocks fandom privileges. Zero yield.">
        <defs>
          <marker id="ve-ah" markerWidth="9" markerHeight="9" refX="6" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill="currentColor" fillOpacity="0.5" />
          </marker>
        </defs>
        {/* zero-yield badge */}
        <g>
          <rect x="178" y="14" width="152" height="26" rx="13" fill="none" stroke={BRAND} strokeOpacity="0.7" />
          <text x="254" y="31" textAnchor="middle" fontSize="11" fontWeight="700" fill={BRAND} letterSpacing="1">ZERO YIELD · NO APY</text>
        </g>
        {boxes.map((b, i) => (
          <g key={i}>
            <rect x={b.x} y="92" width={b.w} height="58" rx="12" fill="var(--paper)" stroke="currentColor" strokeOpacity="0.2" />
            <text x={b.x + b.w / 2} y={b.s ? 117 : 126} textAnchor="middle" fontSize="13" fontWeight="700" fill="currentColor">{b.t}</text>
            {b.s && <text x={b.x + b.w / 2} y="132" textAnchor="middle" fontSize="9.5" fill="currentColor" fillOpacity="0.6">{b.s}</text>}
          </g>
        ))}
        {/* arrows + labels */}
        <line x1="104" y1="121" x2="132" y2="121" stroke="currentColor" strokeOpacity="0.5" markerEnd="url(#ve-ah)" />
        <text x="118" y="111" textAnchor="middle" fontSize="8.5" fill="currentColor" fillOpacity="0.6">lock</text>
        <line x1="250" y1="121" x2="278" y2="121" stroke="currentColor" strokeOpacity="0.5" markerEnd="url(#ve-ah)" />
        <text x="264" y="111" textAnchor="middle" fontSize="8.5" fill="currentColor" fillOpacity="0.6">× tier</text>
        <line x1="380" y1="121" x2="408" y2="121" stroke="currentColor" strokeOpacity="0.5" markerEnd="url(#ve-ah)" />
        <text x="254" y="178" textAnchor="middle" fontSize="10.5" fill="currentColor" fillOpacity="0.7">
          Voting Power = veASSA held × Tier Multiplier — activity AND stake both required.
        </text>
      </svg>
    </Figure>
  );
}
