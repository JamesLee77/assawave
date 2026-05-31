import { Link } from "react-router-dom";

type Props = { title: string };

type Section = { h: string; body: string[] };
type Doc = { updated: string; intro: string; sections: Section[] };

const UPDATED = "May 31, 2026";

const LEGAL: Record<string, Doc> = {
  "terms of service": {
    updated: UPDATED,
    intro:
      "These Terms of Service govern your access to and use of the ASSA WAVE websites, the investor portal, and the $ASSA utility-token smart contracts (collectively, the “Services”). By accessing the Services or connecting a wallet, you agree to these Terms. If you do not agree, do not use the Services.",
    sections: [
      {
        h: "1. Eligibility & jurisdiction",
        body: [
          "You must be of legal age in your jurisdiction and have full capacity to enter into these Terms.",
          "The Services are not offered to, and may not be used by, persons or entities in the United States, China, or any jurisdiction subject to comprehensive sanctions, nor by any person on a sanctions or watchlist (including OFAC). Where the token sale applies, participation requires successful identity verification (KYC) and on-chain allowlisting; we may refuse or revoke access at our discretion to meet legal obligations.",
        ],
      },
      {
        h: "2. Nature of $ASSA",
        body: [
          "$ASSA is a utility token used within the ASSA WAVE ecosystem. It does not represent equity, shares, debt, a deposit, or any right to profit, dividend, or distribution, and it is not a security or a regulated financial instrument.",
          "Locking $ASSA (veASSA) is strictly interest-free: it grants governance weight and tier eligibility only. It pays no yield, reward, emission, or return of any kind. The protocol contracts contain no reward-distribution path.",
        ],
      },
      {
        h: "3. Non-custodial use",
        body: [
          "The Services are non-custodial. You are solely responsible for your wallet, private keys, and seed phrases. We never take custody of your assets and cannot recover lost keys, reverse on-chain transactions, or freeze funds in your wallet.",
          "All on-chain transactions are final. You are responsible for verifying contract addresses against the official addresses published at assawave.io before transacting.",
        ],
      },
      {
        h: "4. Risks",
        body: [
          "Digital assets are volatile and may lose all value. Smart contracts may contain vulnerabilities despite audits. Regulatory treatment of digital assets is uncertain and may change. You accept these and other risks and use the Services at your own risk.",
        ],
      },
      {
        h: "5. Prohibited conduct",
        body: [
          "You may not use the Services to break any law, evade sanctions or geographic restrictions, launder funds, manipulate markets, infringe rights, or interfere with the integrity or security of the protocol.",
        ],
      },
      {
        h: "6. No warranty; limitation of liability",
        body: [
          "The Services are provided “as is” and “as available” without warranties of any kind. To the maximum extent permitted by law, the ASSA WAVE entities are not liable for any indirect, incidental, special, or consequential damages, or for any loss of tokens, profits, or data arising from your use of the Services.",
        ],
      },
      {
        h: "7. Changes & governing law",
        body: [
          "We may update these Terms; material changes will be posted here with a revised date. Continued use constitutes acceptance. These Terms are governed by the laws of the governing entity’s jurisdiction, without regard to conflict-of-law rules.",
        ],
      },
      {
        h: "8. Contact",
        body: ["Questions about these Terms: legal@assawave.io."],
      },
    ],
  },
  "privacy policy": {
    updated: UPDATED,
    intro:
      "This Privacy Policy explains what information ASSA WAVE collects, how it is used, and your choices. It applies to the ASSA WAVE websites and investor portal. On-chain activity is public by design and is not controlled by us.",
    sections: [
      {
        h: "1. Information we collect",
        body: [
          "Wallet data: your public wallet address and on-chain transactions when you connect to the portal.",
          "Identity (KYC): where the token sale applies, identity documents and verification results are processed by a third-party KYC/AML provider; we receive a pass/fail status and the minimum data needed for compliance, not your raw documents.",
          "Account data: optional email address for notifications and your interface preferences.",
          "Usage data: standard logs and privacy-preserving analytics (device, pages viewed). We do not place personal data in URLs.",
        ],
      },
      {
        h: "2. How we use information",
        body: [
          "To operate the Services, verify eligibility (KYC/AML, sanctions and geographic screening), send notifications you request, secure the platform, and meet legal obligations.",
          "We do not sell your personal data.",
        ],
      },
      {
        h: "3. On-chain data",
        body: [
          "Transactions involving $ASSA, the sale, vesting, and veASSA locking are recorded on a public blockchain. This data is permanent, public, and outside our control. Your wallet address may be linkable to your activity.",
        ],
      },
      {
        h: "4. Sharing",
        body: [
          "We share data only with service providers that help us run the Services (KYC/AML provider, infrastructure, email, analytics) under appropriate safeguards, and where required by law or to enforce our Terms.",
        ],
      },
      {
        h: "5. Cookies",
        body: [
          "We use only essential cookies and privacy-preserving analytics. We do not use non-essential tracking cookies without consent where required.",
        ],
      },
      {
        h: "6. Retention & security",
        body: [
          "We retain personal data only as long as needed for the purposes above or as required by law (KYC records may be retained for regulatory periods). We apply reasonable technical and organizational measures to protect data, though no method is perfectly secure.",
        ],
      },
      {
        h: "7. Your rights",
        body: [
          "Subject to applicable law, you may request access, correction, deletion, or restriction of your personal data, and may object to certain processing. On-chain data cannot be altered or erased. Contact privacy@assawave.io to exercise your rights.",
        ],
      },
      {
        h: "8. International transfers & changes",
        body: [
          "Your data may be processed in jurisdictions other than your own under appropriate safeguards. We may update this Policy; the revised date will be shown above.",
        ],
      },
    ],
  },
  disclaimer: {
    updated: UPDATED,
    intro:
      "This Disclaimer applies to all ASSA WAVE materials, including the website, whitepaper, and investor portal. Please read it carefully.",
    sections: [
      {
        h: "1. Not investment, legal, or tax advice",
        body: [
          "Nothing on the Services constitutes investment, financial, legal, accounting, or tax advice, or a recommendation to buy, sell, or hold any asset. We are not your advisor and owe you no fiduciary duty. Consult your own licensed professionals before making any decision.",
        ],
      },
      {
        h: "2. Utility token, no yield, no profit right",
        body: [
          "$ASSA is a utility token. It is not a security and confers no equity, ownership, dividend, interest, or profit-sharing right. veASSA locking is interest-free and pays no yield. Any reference to ecosystem mechanics (burning, tiers, governance) describes utility, not financial return.",
        ],
      },
      {
        h: "3. No guarantee of value",
        body: [
          "The price and liquidity of digital assets are volatile and can fall to zero. We make no representation that $ASSA will have or retain any value, or that any market or listing will exist.",
        ],
      },
      {
        h: "4. Forward-looking statements",
        body: [
          "Roadmaps, tokenomics, simulations, and projections are forward-looking and subject to change, risk, and uncertainty. Actual outcomes may differ materially. Nothing is a promise or guarantee of future performance or delivery.",
        ],
      },
      {
        h: "5. Regulatory status",
        body: [
          "The regulatory treatment of digital assets is evolving and varies by jurisdiction. The Services, the token sale, and the token are offered subject to applicable law and may be unavailable in certain jurisdictions (including the United States and China) and to sanctioned persons. Token sale and issuance remain subject to regulatory review, including South Korea’s VAUPA and applicable securities laws.",
        ],
      },
      {
        h: "6. Third parties & official channels",
        body: [
          "Third-party links and integrations are provided for convenience; we are not responsible for their content or conduct. Always verify you are on assawave.io and using the official contract addresses. Beware of impersonation, phishing, and fraudulent token offerings.",
        ],
      },
    ],
  },
};

export default function Legal({ title }: Props) {
  const key = title.toLowerCase();
  const doc = LEGAL[key];

  // Fallback for any unmapped legal route.
  if (!doc) {
    return (
      <section className="mx-auto max-w-3xl px-5 md:px-10 py-16 md:py-24">
        <div className="atmospheric-glow" aria-hidden="true" />
        <span className="eyebrow text-brand-accent mb-4 block">Legal &amp; Compliance</span>
        <h1 className="text-4xl md:text-6xl font-display font-extrabold tracking-tight text-ink leading-none mb-6">
          {title}
        </h1>
        <p className="text-ink-soft text-[15px] leading-relaxed">
          This document is being finalized. In the meantime, see our{" "}
          <Link to="/disclaimer" className="text-brand hover:underline">Disclaimer</Link>.
        </p>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-3xl px-5 md:px-10 py-16 md:py-24">
      {/* Background Visual Atmosphere */}
      <div className="atmospheric-glow" aria-hidden="true" />

      <header className="mb-12">
        <span className="eyebrow text-brand-accent mb-4 block">Legal &amp; Compliance</span>
        <h1 className="text-4xl md:text-6xl font-display font-extrabold tracking-tight text-ink leading-none mb-4">
          {title}
        </h1>
        <p className="text-[11px] font-mono uppercase tracking-wider text-ink-dim mb-6">
          Last updated: {doc.updated}
        </p>
        <p className="text-ink-soft text-[15px] leading-relaxed">{doc.intro}</p>
      </header>

      <div className="space-y-8">
        {doc.sections.map((s) => (
          <div key={s.h} className="border-t border-rule pt-6">
            <h2 className="text-lg md:text-xl font-display font-bold text-ink mb-3">{s.h}</h2>
            <div className="space-y-3">
              {s.body.map((p, i) => (
                <p key={i} className="text-[13.5px] text-ink-soft leading-relaxed">{p}</p>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footnote */}
      <div className="mt-12 border-t border-rule pt-6">
        <p className="text-[11px] text-ink-dim leading-relaxed">
          This document is provided for general information and does not constitute legal advice.
          $ASSA is a utility token: it is not equity, confers no profit-sharing right, and veASSA
          locking pays no yield. Participation is subject to KYC and regional restrictions.
        </p>
        <div className="mt-5 flex gap-4 text-[13px] font-semibold">
          <Link to="/" className="text-ink-soft hover:text-ink transition-colors">&larr; Back to Home</Link>
          <Link to="/terms" className="text-ink-soft hover:text-ink transition-colors">Terms</Link>
          <Link to="/privacy" className="text-ink-soft hover:text-ink transition-colors">Privacy</Link>
          <Link to="/disclaimer" className="text-ink-soft hover:text-ink transition-colors">Disclaimer</Link>
        </div>
      </div>
    </section>
  );
}
