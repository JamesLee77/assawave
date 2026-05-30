import Wordmark from "../brand/Wordmark";

export default function PortalFooter() {
  return (
    <footer
      className="border-t border-rule mt-20"
      style={{ background: "var(--paper-deep)", padding: "48px 24px 32px" }}
    >
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Wordmark size={24} />
          <span
            className="font-display text-[10px] tracking-[0.16em] uppercase pl-3 border-l border-rule"
            style={{ color: "var(--ink-soft)", lineHeight: 1.4 }}
          >
            Investor
            <br />
            Portal
          </span>
        </div>

        <div
          className="font-display text-[11px] tracking-[0.04em] grid gap-2"
          style={{ color: "var(--ink-soft)", lineHeight: 1.6 }}
        >
          <div>ASSA WAVE Foundation · Base Testnet (Chain ID 84532)</div>
          <div>
            Lockup and BME mechanisms are fully governed on-chain. For sandbox tests, use Base Sepolia testnet assets. 
            For the official site, visit{" "}
            <a
              href="https://assawave.io"
              target="_blank"
              rel="noreferrer"
              className="text-brand hover:underline"
            >
              assawave.io
            </a>
            .
          </div>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
            <a href="https://assawave.io/terms" target="_blank" rel="noreferrer" className="hover:text-brand transition-colors">Terms</a>
            <span style={{ color: "var(--rule)" }}>·</span>
            <a href="https://assawave.io/privacy" target="_blank" rel="noreferrer" className="hover:text-brand transition-colors">Privacy</a>
            <span style={{ color: "var(--rule)" }}>·</span>
            <a href="https://assawave.io/disclaimer" target="_blank" rel="noreferrer" className="hover:text-brand transition-colors">Risk disclosure</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
