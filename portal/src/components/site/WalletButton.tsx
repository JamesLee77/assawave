import { ConnectButton } from "@rainbow-me/rainbowkit";

/**
 * Portal wallet trigger via RainbowKit's Custom API so it matches the portal's
 * pill button system. Connecting is the portal's PRIMARY action, so the
 * disconnected state is a filled brand pill (.btn-primary); once connected the
 * address shows as a quieter outline pill (.btn-ghost). Wrong network demands
 * attention as a filled pill. `className` controls sizing per placement (nav vs hero).
 */
export default function WalletButton({ className = "px-5" }: { className?: string }) {
  return (
    <ConnectButton.Custom>
      {({ account, chain, openAccountModal, openChainModal, openConnectModal, authenticationStatus, mounted }) => {
        const ready = mounted && authenticationStatus !== "loading";
        const text = `inline-flex text-[13px] font-semibold tracking-wide ${className}`;

        if (!ready) {
          return <div aria-hidden="true" style={{ opacity: 0, pointerEvents: "none", userSelect: "none" }} />;
        }
        if (!account || !chain || (authenticationStatus && authenticationStatus !== "authenticated")) {
          return (
            <button type="button" onClick={openConnectModal} className={`btn-primary ${text}`}>
              Connect Wallet
            </button>
          );
        }
        if (chain.unsupported) {
          return (
            <button type="button" onClick={openChainModal} className={`btn-primary ${text}`}>
              Wrong network
            </button>
          );
        }
        return (
          <button type="button" onClick={openAccountModal} className={`btn-ghost ${text}`}>
            {account.displayName}
          </button>
        );
      }}
    </ConnectButton.Custom>
  );
}
