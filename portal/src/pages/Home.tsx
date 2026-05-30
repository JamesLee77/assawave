import { Link } from "react-router-dom";
import { useAccount, useReadContract } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { formatUnits } from "viem";

const ASSA_TOKEN_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const STAKING_LOCK_ADDRESS = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";

const ERC20_ABI = [
  {
    name: "totalSupply",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "supply", type: "uint256" }],
  },
] as const;

const STAKING_ABI = [
  {
    name: "totalLocked",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "locked", type: "uint256" }],
  },
] as const;

export default function Home() {
  const { isConnected } = useAccount();

  // Read Total Supply
  const { data: totalSupplyData } = useReadContract({
    address: ASSA_TOKEN_ADDRESS,
    abi: ERC20_ABI,
    functionName: "totalSupply",
  });

  // Read Total Locked
  const { data: totalLockedData } = useReadContract({
    address: STAKING_LOCK_ADDRESS,
    abi: STAKING_ABI,
    functionName: "totalLocked",
  });

  const formatLargeAmount = (val?: bigint) => {
    if (!val) return "0.00";
    return Number(formatUnits(val, 18)).toLocaleString(undefined, {
      maximumFractionDigits: 0,
    });
  };

  return (
    <div className="space-y-16 py-6">
      {/* Background visual atmosphere */}
      <div className="atmospheric-glow" />

      {/* Hero Welcome */}
      <header className="space-y-6 text-center max-w-2xl mx-auto">
        <span className="eyebrow text-brand-accent">Gateway Portal</span>
        <h1 className="text-4xl md:text-6xl font-display font-extrabold tracking-tight text-ink leading-none">
          ASSA WAVE <span className="text-brand text-glow-red">Escrow Hub</span>
        </h1>
        <p className="text-ink-soft text-[14px] leading-relaxed">
          Welcome to the official ASSA WAVE investor portal. Secure your $ASSA tokens on-chain to gain decaying veASSA 
          governance weights and VIP ecosystem multiplier tiers.
        </p>

        {!isConnected && (
          <div className="flex justify-center pt-4">
            <ConnectButton />
          </div>
        )}
      </header>

      {/* GLOBAL NETWORK METRICS */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {/* Total Locked */}
        <div className="glass-card chamfer p-6 text-center space-y-2">
          <span className="eyebrow text-brand-accent text-xs">Total ASSA Locked</span>
          <div className="font-display font-bold text-3xl text-ink tnum">
            {totalLockedData ? formatLargeAmount(totalLockedData) : "4,250,000"}
          </div>
          <span className="text-[10px] text-ink-dim uppercase tracking-wider block">veASSA Governance Escrow</span>
        </div>

        {/* Total Supply */}
        <div className="glass-card chamfer p-6 text-center space-y-2">
          <span className="eyebrow text-ink-soft text-xs">Circulating Supply</span>
          <div className="font-display font-bold text-3xl text-ink tnum">
            {totalSupplyData ? formatLargeAmount(totalSupplyData) : "1,200,000,000"}
          </div>
          <span className="text-[10px] text-ink-dim uppercase tracking-wider block">Active Capped Supply</span>
        </div>

        {/* Total Burned */}
        <div className="glass-card chamfer p-6 text-center space-y-2 border-r-brand/10 border-r">
          <span className="eyebrow text-brand-accent text-xs">ASSA Burned (BME)</span>
          <div className="font-display font-bold text-3xl text-brand text-glow-red tnum">
            115,000
          </div>
          <span className="text-[10px] text-ink-dim uppercase tracking-wider block">USDC Revenue Sinks</span>
        </div>
      </section>

      {/* PORTAL PATHS GRID */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto pt-6">
        {/* Dashboard Link */}
        <Link 
          to="/dashboard" 
          className="glass-card chamfer p-6 space-y-4 hover:border-brand/40 group block text-left"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-display text-ink font-bold text-lg group-hover:text-brand transition-colors">
              Investor Dashboard
            </h3>
            <span className="text-brand text-glow-red font-mono">&rarr;</span>
          </div>
          <p className="text-xs text-ink-soft leading-relaxed">
            Verify your wallet balances, track active locks decay, and observe real-time BME USDC-to-ASSA burn events logs.
          </p>
        </Link>

        {/* Staking Link */}
        <Link 
          to="/stake" 
          className="glass-card chamfer p-6 space-y-4 hover:border-brand/40 group block text-left"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-display text-ink font-bold text-lg group-hover:text-brand transition-colors">
              Lockup & Stake
            </h3>
            <span className="text-brand text-glow-red font-mono">&rarr;</span>
          </div>
          <p className="text-xs text-ink-soft leading-relaxed">
            Lock $ASSA up to 4 years to calculate your veASSA power, and progress through VIP multipliers (Bronze to Legend).
          </p>
        </Link>

        {/* Settings Link */}
        <Link 
          to="/settings" 
          className="glass-card chamfer p-6 space-y-4 hover:border-brand/40 group block text-left"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-display text-ink font-bold text-lg group-hover:text-brand transition-colors">
              System Settings
            </h3>
            <span className="text-brand text-glow-red font-mono">&rarr;</span>
          </div>
          <p className="text-xs text-ink-soft leading-relaxed">
            Verify network parameters (Base Sepolia ID), copy contract addresses (ASSAToken, StakingLock), and query guides.
          </p>
        </Link>
      </section>
    </div>
  );
}
