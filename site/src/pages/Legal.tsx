import { Link } from "react-router-dom";

type Props = { title: string };

export default function Legal({ title }: Props) {
  const isWhitepaper = title.toLowerCase() === "whitepaper";

  return (
    <section className="mx-auto max-w-4xl px-5 md:px-10 py-16 md:py-24 flex flex-col items-center">
      {/* Background Visual Atmosphere */}
      <div className="atmospheric-glow" aria-hidden="true" />

      <div className="w-full text-center max-w-2xl mx-auto mb-12">
        <span className="eyebrow text-brand-accent mb-4 block">Legal &amp; Compliance</span>
        <h1 className="text-4xl md:text-6xl font-display font-extrabold tracking-tight text-ink leading-none mb-6">
          {title}
        </h1>
        <p className="text-ink-soft text-[15px] leading-relaxed">
          {isWhitepaper 
            ? "ASSA WAVE operates under rigorous global compliance. Our technical and economic specifications are finalized, and the official legal publication is undergoing regulatory alignment."
            : `The official ${title} agreement is currently being finalized in accordance with global Web3 regulations and frameworks.`}
        </p>
      </div>

      {/* Cinematic Glassmorphism Card */}
      <div className="glass-card chamfer w-full p-8 md:p-12 relative overflow-hidden border border-rule transition-all duration-300">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div className="space-y-4 max-w-lg">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-brand/10 border border-brand/20 text-brand">
              <span className="h-1.5 w-1.5 rounded-full bg-brand animate-pulse" />
              Coming Soon &middot; Under Review
            </div>
            
            <h2 className="text-2xl md:text-3xl font-display font-bold text-ink leading-tight">
              {isWhitepaper ? "Whitepaper Publication" : `${title} Launch`}
            </h2>
            
            <p className="text-[13px] text-ink-soft leading-relaxed">
              We are working closely with premier legal authorities and advisory panels across multiple jurisdictions including 
              <strong> South Korea (VAUPA)</strong>, <strong>Singapore (MAS)</strong>, and <strong>UAE (ADGM)</strong> to guarantee absolute regulatory compliance.
            </p>

            <div className="pt-4 grid grid-cols-2 gap-4">
              <div className="border border-rule rounded-xl p-4 bg-paper-deep/50">
                <div className="text-[10px] uppercase tracking-wider text-ink-soft font-mono">Audits Standard</div>
                <div className="text-sm font-bold text-ink mt-1 font-display">CertiK &amp; Halborn</div>
              </div>
              <div className="border border-rule rounded-xl p-4 bg-paper-deep/50">
                <div className="text-[10px] uppercase tracking-wider text-ink-soft font-mono">Target Date</div>
                <div className="text-sm font-bold text-brand mt-1 font-display">Q3 2026</div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 w-full md:w-auto flex-shrink-0">
            <a 
              href="https://app.assawave.io"
              className="btn-primary w-full md:w-auto text-center justify-center text-[13px] font-semibold px-6"
            >
              Open Investor Portal &rarr;
            </a>
            <Link 
              to="/" 
              className="btn-ghost w-full md:w-auto text-center justify-center text-[13px] font-semibold px-6"
            >
              Back to Home
            </Link>
          </div>
        </div>

        {/* Dynamic Background Glow Effect */}
        <div className="absolute right-0 bottom-0 w-80 h-80 -mr-20 -mb-20 rounded-full blur-3xl pointer-events-none opacity-20" style={{ background: "var(--brand)" }} />
      </div>

      {/* FOOTNOTE DISCLAIMER */}
      <p className="text-[11px] text-ink-dim leading-relaxed text-center max-w-xl mt-8">
        Disclaimer: ASSA WAVE utility tokens ($ASSA) do not represent equity, shares, or direct profit-sharing rights. 
        Participation in the ecosystem is subject to local regional restrictions and KYC qualification requirements.
      </p>
    </section>
  );
}
