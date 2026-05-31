import { useAccount, useChainId } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { CONTRACTS } from "../lib/contracts";
import { IS_MAINNET } from "../lib/env";
import AddTokenToWallet from "../components/AddTokenToWallet";

export default function Settings() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  return (
    <div className="space-y-12">
      <div className="atmospheric-glow" />

      <header className="flex flex-col gap-2">
        <span className="eyebrow text-brand-accent">Configurations</span>
        <h1 className="text-4xl md:text-5xl font-display font-extrabold tracking-tight text-ink">
          System Settings
        </h1>
        <p className="text-ink-soft max-w-xl text-[14px]">
          Configure your portal settings, verify contract deployments, and manage active network configurations.
        </p>
      </header>

      {!isConnected ? (
        <div className="glass-card chamfer p-10 text-center space-y-6">
          <p className="text-ink-soft font-display max-w-md mx-auto">
            Please connect your wallet to access system configurations and contract deployment variables.
          </p>
          <div className="flex justify-center">
            <ConnectButton />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Web3 Connections and Network */}
          <div className="glass-card chamfer p-6 md:p-8 space-y-6">
            <h3 className="font-display text-lg font-bold text-ink">Web3 Connection</h3>

            <div className="space-y-4 text-xs font-display">
              <div className="space-y-1.5">
                <span className="text-ink-soft block uppercase tracking-wider">Connected Wallet</span>
                <div className="flex items-center justify-between bg-surface-2/40 px-4 py-3 rounded-lg border border-rule">
                  <span className="text-ink font-mono">{address}</span>
                  <button 
                    onClick={() => address && handleCopy(address)}
                    className="text-brand hover:underline font-semibold ml-2 cursor-pointer"
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-ink-soft block uppercase tracking-wider">Active Network ID</span>
                <div className="bg-surface-2/40 px-4 py-3 rounded-lg border border-rule text-ink font-semibold">
                  {IS_MAINNET ? "Base Mainnet" : "Base Sepolia Testnet"} (ID: {chainId})
                </div>
              </div>

              <div className="pt-1">
                <AddTokenToWallet />
              </div>
            </div>

            {!IS_MAINNET && (
              <div className="border-t border-rule pt-4">
                <span className="text-[11px] font-display uppercase tracking-wider text-ink-soft block mb-2">
                  Need Testnet Funds?
                </span>
                <p className="text-xs text-ink-soft leading-relaxed">
                  The testnet portal runs on Base Sepolia. To request test ether for transactions, visit the official{" "}
                  <a
                    href="https://faucets.chain.link/base-sepolia"
                    target="_blank"
                    rel="noreferrer"
                    className="text-brand hover:underline font-semibold"
                  >
                    Chainlink Base Sepolia Faucet
                  </a>.
                </p>
              </div>
            )}
          </div>

          {/* Ecosystem Smart Contracts */}
          <div className="glass-card chamfer p-6 md:p-8 space-y-6">
            <h3 className="font-display text-lg font-bold text-ink">Ecosystem Smart Contracts</h3>

            <div className="space-y-4 font-display text-xs">
              {/* ASSA Token */}
              <div className="space-y-1">
                <span className="text-ink-soft block uppercase tracking-wider">ASSA WAVE Token ($ASSA)</span>
                <div className="flex items-center justify-between bg-surface-2/40 px-4 py-2.5 rounded-lg border border-rule">
                  <span className="text-ink font-mono text-[11px]">{CONTRACTS.assaToken}</span>
                  <button 
                    onClick={() => handleCopy(CONTRACTS.assaToken)}
                    className="text-brand hover:underline ml-2 cursor-pointer font-semibold"
                  >
                    Copy
                  </button>
                </div>
              </div>

              {/* veASSA StakingLock */}
              <div className="space-y-1">
                <span className="text-ink-soft block uppercase tracking-wider">veASSA Lockup (StakingLock)</span>
                <div className="flex items-center justify-between bg-surface-2/40 px-4 py-2.5 rounded-lg border border-rule">
                  <span className="text-ink font-mono text-[11px]">{CONTRACTS.stakingLock}</span>
                  <button 
                    onClick={() => handleCopy(CONTRACTS.stakingLock)}
                    className="text-brand hover:underline ml-2 cursor-pointer font-semibold"
                  >
                    Copy
                  </button>
                </div>
              </div>

              {/* BME Burner */}
              <div className="space-y-1">
                <span className="text-ink-soft block uppercase tracking-wider">BME Burner (BMEBurner)</span>
                <div className="flex items-center justify-between bg-surface-2/40 px-4 py-2.5 rounded-lg border border-rule">
                  <span className="text-ink font-mono text-[11px]">{CONTRACTS.bmeBurner}</span>
                  <button 
                    onClick={() => handleCopy(CONTRACTS.bmeBurner)}
                    className="text-brand hover:underline ml-2 cursor-pointer font-semibold"
                  >
                    Copy
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
