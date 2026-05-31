import { ConnectButton } from "@rainbow-me/rainbowkit";

/**
 * Portal wallet trigger via RainbowKit's Custom API. Styled with `.btn-wallet`
 * (brand-outlined pill) — identical to the marketing site so Connect Wallet looks
 * the same across assawave.io and app.assawave.io. Wrong network demands attention
 * as a filled pill. `className` controls sizing per placement (nav vs hero).
 */
export default function WalletButton({ className = "px-5" }: { className?: string }) {
  return (
    <ConnectButton.Custom>
      {({ account, chain, openAccountModal, openChainModal, openConnectModal, authenticationStatus, mounted }) => {
        const ready = mounted && authenticationStatus !== "loading";
        const base = `btn-wallet inline-flex text-[13px] font-semibold tracking-wide ${className}`;

        if (!ready) {
          return <div aria-hidden="true" style={{ opacity: 0, pointerEvents: "none", userSelect: "none" }} />;
        }
        if (!account || !chain || (authenticationStatus && authenticationStatus !== "authenticated")) {
          return (
            <button type="button" onClick={openConnectModal} className={base}>
              Connect Wallet
            </button>
          );
        }
        if (chain.unsupported) {
          return (
            <button
              type="button"
              onClick={openChainModal}
              className={`btn-wallet btn-wallet--warn inline-flex text-[13px] font-semibold tracking-wide ${className}`}
            >
              Wrong network
            </button>
          );
        }
        return (
          <button type="button" onClick={openAccountModal} className={base}>
            {account.displayName}
          </button>
        );
      }}
    </ConnectButton.Custom>
  );
}
