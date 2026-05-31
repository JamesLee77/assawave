import { ConnectButton } from "@rainbow-me/rainbowkit";

/**
 * Wallet connect trigger rendered via RainbowKit's Custom API so it matches the
 * site's pill button system. Styled with `.btn-wallet` (brand-outlined pill) to
 * stay visually distinct from the filled `.btn-primary` CTA while sharing the
 * same fully-round shape. Handles connect / connected / wrong-network states.
 */
export default function WalletButton({ className = "" }: { className?: string }) {
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
            <button type="button" onClick={openConnectModal} className={`${base} px-5`}>
              Connect Wallet
            </button>
          );
        }
        if (chain.unsupported) {
          return (
            <button
              type="button"
              onClick={openChainModal}
              className="btn-wallet btn-wallet--warn inline-flex px-5 text-[13px] font-semibold"
            >
              Wrong network
            </button>
          );
        }
        return (
          <button type="button" onClick={openAccountModal} className={`${base} px-4`}>
            {account.displayName}
          </button>
        );
      }}
    </ConnectButton.Custom>
  );
}
