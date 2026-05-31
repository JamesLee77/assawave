import React, { useState } from "react";
import { useAccount, useReadContract } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { formatUnits } from "viem";
import { CONTRACTS } from "../lib/contracts";

// Addresses pinned by build env (mainnet/testnet), filled from
// onchain/deployments/<network>.json after deploy. Zero address until then.
const ASSA_TOKEN_ADDRESS = CONTRACTS.assaToken;
const STAKING_LOCK_ADDRESS = CONTRACTS.stakingLock;

const ASSA_TOKEN_ABI = [
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "balance", type: "uint256" }],
  },
] as const;

const STAKING_LOCK_ABI = [
  {
    name: "locks",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [
      { name: "amount", type: "uint128" },
      { name: "start", type: "uint64" },
      { name: "end", type: "uint64" },
    ],
  },
  {
    name: "votingPower",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ name: "power", type: "uint256" }],
  },
  {
    name: "tierOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ name: "tier", type: "uint8" }],
  },
  {
    name: "tierWeight",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ name: "weight", type: "uint256" }],
  },
] as const;

interface BurnLog {
  txHash: string;
  timestamp: string;
  usdcIn: number;
  assaBurned: number;
}

const INITIAL_BURN_LOGS: BurnLog[] = [
  { txHash: "0x4fb8...a212", timestamp: "2026-05-30 21:05", usdcIn: 2500, assaBurned: 25000 },
  { txHash: "0x9812...614f", timestamp: "2026-05-29 18:40", usdcIn: 1800, assaBurned: 18000 },
  { txHash: "0xc8a1...109e", timestamp: "2026-05-28 11:15", usdcIn: 4200, assaBurned: 42000 },
  { txHash: "0x1102...331b", timestamp: "2026-05-26 14:02", usdcIn: 3000, assaBurned: 30000 },
];

export default function Dashboard() {
  const { address, isConnected } = useAccount();

  // Read $ASSA balance
  const { data: balanceData } = useReadContract({
    address: ASSA_TOKEN_ADDRESS,
    abi: ASSA_TOKEN_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 5000 },
  });

  // Read Lockup state
  const { data: lockData } = useReadContract({
    address: STAKING_LOCK_ADDRESS,
    abi: STAKING_LOCK_ABI,
    functionName: "locks",
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 5000 },
  });

  // Read Voting Power
  const { data: votingPowerData } = useReadContract({
    address: STAKING_LOCK_ADDRESS,
    abi: STAKING_LOCK_ABI,
    functionName: "votingPower",
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 5000 },
  });

  // Read Tier Of
  const { data: tierData } = useReadContract({
    address: STAKING_LOCK_ADDRESS,
    abi: STAKING_LOCK_ABI,
    functionName: "tierOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 5000 },
  });

  // Read Tier Weight
  const { data: tierWeightData } = useReadContract({
    address: STAKING_LOCK_ADDRESS,
    abi: STAKING_LOCK_ABI,
    functionName: "tierWeight",
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 5000 },
  });

  // Local state for BME Simulation
  const [burnLogs, setBurnLogs] = useState<BurnLog[]>(INITIAL_BURN_LOGS);
  const [simUsdc, setSimUsdc] = useState<string>("1000");
  const [simulating, setSimulating] = useState(false);

  const formatBalance = (val?: bigint) => {
    if (!val) return "0.00";
    return Number(formatUnits(val, 18)).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const getTierName = (tier?: number) => {
    switch (tier) {
      case 1: return "BRONZE";
      case 2: return "SILVER";
      case 3: return "GOLD";
      case 4: return "LEGEND";
      default: return "NONE";
    }
  };

  const getTierColor = (tier?: number) => {
    switch (tier) {
      case 1: return "text-[#CD7F32]";
      case 2: return "text-[#C0C0C0]";
      case 3: return "text-[#FFD700]";
      case 4: return "text-[#EF2525] text-glow-red font-extrabold";
      default: return "text-ink-dim";
    }
  };

  const handleSimulateBurn = (e: React.FormEvent) => {
    e.preventDefault();
    const usdc = parseFloat(simUsdc);
    if (isNaN(usdc) || usdc <= 0) return;

    setSimulating(true);
    setTimeout(() => {
      const newLog: BurnLog = {
        txHash: "0x" + Math.random().toString(16).substring(2, 6) + "..." + Math.random().toString(16).substring(2, 6),
        timestamp: new Date().toISOString().replace("T", " ").substring(0, 16),
        usdcIn: usdc,
        assaBurned: usdc * 10, // 1:10 swap rate mock
      };
      setBurnLogs((prev) => [newLog, ...prev]);
      setSimulating(false);
    }, 1200);
  };

  const lockAmount = lockData ? lockData[0] : 0n;
  const lockStart = lockData ? Number(lockData[1]) : 0;
  const lockEnd = lockData ? Number(lockData[2]) : 0;
  const now = Math.floor(Date.now() / 1000);
  const remainingTime = lockEnd > now ? lockEnd - now : 0;
  const totalDuration = lockEnd > lockStart ? lockEnd - lockStart : 1;
  const decayPercent = lockEnd > now ? Math.round((remainingTime / totalDuration) * 100) : 0;

  const totalAssaBurned = burnLogs.reduce((acc, curr) => acc + curr.assaBurned, 0);
  const totalUsdcBurned = burnLogs.reduce((acc, curr) => acc + curr.usdcIn, 0);

  return (
    <div className="space-y-12">
      {/* Dynamic atmospheric layer */}
      <div className="atmospheric-glow" />

      <header className="flex flex-col gap-2">
        <span className="eyebrow text-brand-accent">Live Status</span>
        <h1 className="text-4xl md:text-5xl font-display font-extrabold tracking-tight text-ink">
          Investor Dashboard
        </h1>
        <p className="text-ink-soft max-w-xl text-[14px]">
          Monitor your $ASSA assets, check active lockups and governance weights, and observe real-time BME burn events.
        </p>
      </header>

      {!isConnected ? (
        <div className="glass-card chamfer p-10 text-center space-y-6">
          <p className="text-ink-soft font-display max-w-md mx-auto">
            Please connect your Web3 wallet to access your live portal stats and execute locked governance stakes.
          </p>
          <div className="flex justify-center">
            <ConnectButton />
          </div>
        </div>
      ) : (
        <>
          {/* STATS PANEL */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Balance Card */}
            <div className="glass-card chamfer p-6 relative overflow-hidden flex flex-col justify-between min-h-[160px]">
              <div>
                <span className="eyebrow text-ink-soft">ASSA Balance</span>
                <div className="font-display font-bold text-3xl md:text-4xl text-ink mt-2 tnum">
                  {formatBalance(balanceData as bigint | undefined)}
                </div>
              </div>
              <span className="text-[11px] font-display text-ink-dim tracking-wider uppercase mt-4 block">
                Available Wallet Balance
              </span>
            </div>

            {/* veASSA Voting Power */}
            <div className="glass-card chamfer p-6 relative overflow-hidden flex flex-col justify-between min-h-[160px] border-l-brand/30 border-l-2">
              <div>
                <span className="eyebrow text-brand-accent">veASSA Power</span>
                <div className="font-display font-bold text-3xl md:text-4xl text-ink mt-2 tnum">
                  {formatBalance(votingPowerData as bigint | undefined)}
                </div>
              </div>
              <div className="flex items-center justify-between text-[11px] font-display mt-4">
                <span className="text-ink-dim tracking-wider uppercase">Governance Weight</span>
                <span className="text-brand text-glow-red font-semibold">Decaying Lock</span>
              </div>
            </div>

            {/* VIP Tier Card */}
            <div className="glass-card chamfer p-6 relative overflow-hidden flex flex-col justify-between min-h-[160px]">
              <div>
                <span className="eyebrow text-ink-soft">Ecosystem VIP Tier</span>
                <div className={`font-display font-extrabold text-3xl md:text-4xl mt-2 tracking-wide ${getTierColor(tierData)}`}>
                  {getTierName(tierData)}
                </div>
              </div>
              <div className="flex items-center justify-between text-[11px] font-display mt-4">
                <span className="text-ink-dim tracking-wider uppercase">Weight Multiplier</span>
                <span className="text-ink font-semibold">
                  {tierWeightData ? (Number(tierWeightData) / 100).toFixed(2) : "1.00"}x
                </span>
              </div>
            </div>
          </div>

          {/* ACTIVE LOCK DECAY PANEL */}
          <div className="glass-card chamfer p-6 md:p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="font-display text-lg font-bold text-ink">Active Lock Position</h3>
                <p className="text-xs text-ink-soft">Your linear time-decaying commitment progress.</p>
              </div>
              {lockAmount > 0n && (
                <div className="text-right">
                  <span className="text-xs text-ink-soft uppercase font-semibold">Locked Capital</span>
                  <div className="font-display text-ink font-bold text-lg tnum">{formatBalance(lockAmount)} ASSA</div>
                </div>
              )}
            </div>

            {lockAmount > 0n ? (
              <div className="space-y-4">
                {/* Visual Progress Bar */}
                <div className="h-2 w-full bg-surface-3 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-brand-pressed to-brand transition-all duration-1000" 
                    style={{ width: `${decayPercent}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs font-display">
                  <span className="text-ink-soft">
                    Lock Date: <strong className="text-ink font-normal">{new Date(lockStart * 1000).toLocaleDateString()}</strong>
                  </span>
                  <span className="text-brand font-semibold text-glow-red">{decayPercent}% Lock Time Left</span>
                  <span className="text-ink-soft">
                    Unlock Date: <strong className="text-ink font-normal">{new Date(lockEnd * 1000).toLocaleDateString()}</strong>
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-8 border border-dashed border-rule rounded-xl text-center space-y-4">
                <p className="text-ink-soft text-sm max-w-sm mx-auto">
                  You do not have any active token lockup position. Secure your ASSA tokens and earn governance multiplier powers.
                </p>
                <a 
                  href="/stake" 
                  className="btn-primary inline-flex text-xs h-9 min-h-[36px]"
                >
                  Create veASSA Lockup
                </a>
              </div>
            )}
          </div>

          {/* BME BURN REAL-TIME PANEL */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Simulated Burn Interface */}
            <div className="glass-card chamfer p-6 flex flex-col justify-between">
              <div className="space-y-4">
                <h3 className="font-display text-lg font-bold text-ink">BME Burn Simulation</h3>
                <p className="text-xs text-ink-soft">
                  Simulate external service revenues converting USDC to $ASSA and burning on-chain.
                </p>

                <form onSubmit={handleSimulateBurn} className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <label className="text-[11px] font-display uppercase tracking-wider text-ink-soft block">
                      Revenue (USDC)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        value={simUsdc}
                        onChange={(e) => setSimUsdc(e.target.value)}
                        className="w-full bg-surface-2 border border-rule px-4 py-3 text-ink text-sm font-display focus:outline-none focus:border-brand transition-colors"
                        placeholder="USDC Amount"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-display text-ink-soft">
                        USDC
                      </span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={simulating}
                    className="w-full btn-primary text-xs h-11 transition-all disabled:opacity-55"
                  >
                    {simulating ? "Swapping & Burning..." : "Trigger Revenue Burn"}
                  </button>
                </form>
              </div>

              <div className="border-t border-rule mt-6 pt-4 text-center grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-ink-soft block">Total Simulated USDC</span>
                  <strong className="text-ink font-display text-sm tnum">${totalUsdcBurned.toLocaleString()}</strong>
                </div>
                <div>
                  <span className="text-brand-on-dark block">Total $ASSA Burned</span>
                  <strong className="text-brand text-glow-red font-display text-sm tnum">{totalAssaBurned.toLocaleString()}</strong>
                </div>
              </div>
            </div>

            {/* Burn Logs List */}
            <div className="glass-card chamfer p-6 lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg font-bold text-ink">DEX Burn History</h3>
                <span className="chip text-[9px] scale-90">
                  <span className="sw bg-brand animate-pulse" /> Live Burn Stream
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-display border-collapse">
                  <thead>
                    <tr className="border-b border-rule text-ink-soft">
                      <th className="pb-3 font-normal uppercase tracking-wider">Transaction</th>
                      <th className="pb-3 font-normal uppercase tracking-wider">Timestamp</th>
                      <th className="pb-3 font-normal uppercase tracking-wider text-right">USDC Inflow</th>
                      <th className="pb-3 font-normal uppercase tracking-wider text-right">ASSA Burned</th>
                    </tr>
                  </thead>
                  <tbody>
                    {burnLogs.map((log, index) => (
                      <tr 
                        key={log.txHash + index} 
                        className="border-b border-rule/50 hover:bg-ink/5 transition-colors"
                      >
                        <td className="py-3 text-ink font-mono text-[11px]">{log.txHash}</td>
                        <td className="py-3 text-ink-soft">{log.timestamp}</td>
                        <td className="py-3 text-right text-ink font-semibold tnum">${log.usdcIn.toLocaleString()}</td>
                        <td className="py-3 text-right text-brand font-bold text-glow-red tnum">
                          -{log.assaBurned.toLocaleString()} ASSA
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
