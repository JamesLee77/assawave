import React, { useState, useEffect } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { formatUnits, parseUnits } from "viem";

// LOCAL CONTRACT ADDRESSES (Base Sepolia Defaults)
const ASSA_TOKEN_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const STAKING_LOCK_ADDRESS = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";

const ERC20_ABI = [
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "balance", type: "uint256" }],
  },
  {
    name: "allowance",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "remaining", type: "uint256" }],
  },
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "value", type: "uint256" },
    ],
    outputs: [{ name: "success", type: "bool" }],
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
    name: "lock",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "amount", type: "uint256" },
      { name: "duration", type: "uint256" },
    ],
    outputs: [],
  },
  {
    name: "increaseAmount",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "amount", type: "uint256" }],
    outputs: [],
  },
  {
    name: "increaseUnlockTime",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "duration", type: "uint256" }],
    outputs: [],
  },
  {
    name: "withdraw",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },
] as const;

// Durations in seconds
const DURATIONS = [
  { label: "1 Week", value: 7 * 24 * 60 * 60 },
  { label: "1 Month", value: 30 * 24 * 60 * 60 },
  { label: "6 Months", value: 182 * 24 * 60 * 60 },
  { label: "1 Year", value: 365 * 24 * 60 * 60 },
  { label: "4 Years", value: 4 * 365 * 24 * 60 * 60 },
];

export default function Stake() {
  const { address, isConnected } = useAccount();

  // Inputs
  const [lockAmountInput, setLockAmountInput] = useState<string>("1000");
  const [durationInput, setDurationInput] = useState<number>(365 * 24 * 60 * 60); // default 1 Year
  const [addAmountInput, setAddAmountInput] = useState<string>("500");
  const [extendDurationInput, setExtendDurationInput] = useState<number>(30 * 24 * 60 * 60); // default 1 Month

  // Transaction state
  const { writeContract, data: txHash } = useWriteContract();
  const { isLoading: isTxConfirming, isSuccess: isTxSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  // Read $ASSA balance
  const { data: balanceData, refetch: refetchBalance } = useReadContract({
    address: ASSA_TOKEN_ADDRESS,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  // Read Allowance
  const { data: allowanceData, refetch: refetchAllowance } = useReadContract({
    address: ASSA_TOKEN_ADDRESS,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: address ? [address, STAKING_LOCK_ADDRESS] : undefined,
    query: { enabled: !!address },
  });

  // Read Lock state
  const { data: lockData, refetch: refetchLock } = useReadContract({
    address: STAKING_LOCK_ADDRESS,
    abi: STAKING_LOCK_ABI,
    functionName: "locks",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  useEffect(() => {
    if (isTxSuccess) {
      refetchBalance();
      refetchAllowance();
      refetchLock();
    }
  }, [isTxSuccess, refetchBalance, refetchAllowance, refetchLock]);

  const activeLockedAmount = lockData ? lockData[0] : 0n;
  const activeLockEnd = lockData ? Number(lockData[2]) : 0;
  const now = Math.floor(Date.now() / 1000);
  const isLockExpired = activeLockedAmount > 0n && now >= activeLockEnd;

  // Calculators
  const calcEstimatedVp = (amount: string, durationSecs: number) => {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) return 0;
    const maxDuration = 4 * 365 * 24 * 60 * 60; // 4 Years
    return amt * (durationSecs / maxDuration);
  };

  const getEstimatedTier = (amount: string) => {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt < 1000) return "NONE";
    if (amt < 10000) return "BRONZE";
    if (amt < 100000) return "SILVER";
    if (amt < 1000000) return "GOLD";
    return "LEGEND";
  };

  const getEstimatedTierColor = (tier: string) => {
    switch (tier) {
      case "BRONZE": return "text-[#CD7F32]";
      case "SILVER": return "text-[#C0C0C0]";
      case "GOLD": return "text-[#FFD700]";
      case "LEGEND": return "text-[#EF2525] text-glow-red font-bold";
      default: return "text-ink-dim";
    }
  };

  const formatBalance = (val?: bigint) => {
    if (!val) return "0.00";
    return Number(formatUnits(val, 18)).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const isAllowanceSufficient = (inputAmount: string) => {
    if (!allowanceData) return false;
    try {
      const needed = parseUnits(inputAmount, 18);
      return allowanceData >= needed;
    } catch {
      return false;
    }
  };

  // Transaction Triggers
  const handleApprove = (inputAmount: string) => {
    try {
      const needed = parseUnits(inputAmount, 18);
      writeContract({
        address: ASSA_TOKEN_ADDRESS,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [STAKING_LOCK_ADDRESS, needed],
      });
    } catch (err) {
      console.error("Approval error", err);
    }
  };

  const handleLock = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const amount = parseUnits(lockAmountInput, 18);
      writeContract({
        address: STAKING_LOCK_ADDRESS,
        abi: STAKING_LOCK_ABI,
        functionName: "lock",
        args: [amount, BigInt(durationInput)],
      });
    } catch (err) {
      console.error("Lock error", err);
    }
  };

  const handleIncreaseAmount = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const amount = parseUnits(addAmountInput, 18);
      writeContract({
        address: STAKING_LOCK_ADDRESS,
        abi: STAKING_LOCK_ABI,
        functionName: "increaseAmount",
        args: [amount],
      });
    } catch (err) {
      console.error("Increase amount error", err);
    }
  };

  const handleIncreaseUnlockTime = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      writeContract({
        address: STAKING_LOCK_ADDRESS,
        abi: STAKING_LOCK_ABI,
        functionName: "increaseUnlockTime",
        args: [BigInt(extendDurationInput)],
      });
    } catch (err) {
      console.error("Increase unlock time error", err);
    }
  };

  const handleWithdraw = () => {
    try {
      writeContract({
        address: STAKING_LOCK_ADDRESS,
        abi: STAKING_LOCK_ABI,
        functionName: "withdraw",
      });
    } catch (err) {
      console.error("Withdraw error", err);
    }
  };

  return (
    <div className="space-y-12">
      <div className="atmospheric-glow" />

      <header className="flex flex-col gap-2">
        <span className="eyebrow text-brand-accent">veASSA Escrow</span>
        <h1 className="text-4xl md:text-5xl font-display font-extrabold tracking-tight text-ink">
          Governance Staking
        </h1>
        <p className="text-ink-soft max-w-xl text-[14px]">
          Lock your $ASSA tokens to acquire decaying voting escrow weight (veASSA) and premium VIP tier levels.
        </p>
      </header>

      {/* STRICT NO-APY INFORMATION BANNER */}
      <div className="border border-brand/20 bg-brand/5 chamfer p-5 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="space-y-1">
          <h4 className="font-display font-bold text-ink text-sm">Strict Zero-Yield (Zero-Interest) Escrow</h4>
          <p className="text-xs text-ink-soft max-w-2xl">
            Staking in the ASSA WAVE ecosystem strictly distributes **zero interest or yield emissions**. Locked capital 
            is held securely and represents a pure commitment, granting governance voting weights and tier multiplier keys.
          </p>
        </div>
        <span className="chip bg-brand/10 border-brand/30 text-brand text-glow-red scale-90">
          No APY / Zero rewards
        </span>
      </div>

      {!isConnected ? (
        <div className="glass-card chamfer p-10 text-center space-y-6">
          <p className="text-ink-soft font-display max-w-md mx-auto">
            Please connect your wallet to view your balances and initiate token locking commitments.
          </p>
          <div className="flex justify-center">
            <ConnectButton />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* PRIMARY LOCK FORM & CALCULATOR */}
          <div className="lg:col-span-2 space-y-6">
            {activeLockedAmount === 0n ? (
              <div className="glass-card chamfer p-6 md:p-8 space-y-6">
                <h3 className="font-display text-lg font-bold text-ink">Create New Lockup</h3>

                <form onSubmit={handleLock} className="space-y-6">
                  {/* Lock Amount input */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-display">
                      <label className="uppercase tracking-wider text-ink-soft">ASSA Amount to Lock</label>
                      <span className="text-ink-dim">
                        Wallet: {formatBalance(balanceData as bigint | undefined)} ASSA
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        value={lockAmountInput}
                        onChange={(e) => setLockAmountInput(e.target.value)}
                        className="w-full bg-surface-2 border border-rule px-4 py-3 text-ink text-sm font-display focus:outline-none focus:border-brand transition-colors"
                        placeholder="Amount to Lock"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-display text-ink-soft">
                        ASSA
                      </span>
                    </div>
                  </div>

                  {/* Lock Duration Selector */}
                  <div className="space-y-2">
                    <label className="text-xs font-display uppercase tracking-wider text-ink-soft block">
                      Lockup Duration
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                      {DURATIONS.map((dur) => (
                        <button
                          key={dur.value}
                          type="button"
                          onClick={() => setDurationInput(dur.value)}
                          className={`py-3 text-xs font-display border transition-all ${
                            durationInput === dur.value
                              ? "bg-brand border-brand text-white font-bold"
                              : "bg-surface-2 border-rule text-ink hover:border-ink-dim"
                          }`}
                          style={{ borderRadius: "8px" }}
                        >
                          {dur.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Approve / Submit button pipeline */}
                  {!isAllowanceSufficient(lockAmountInput) ? (
                    <button
                      type="button"
                      onClick={() => handleApprove(lockAmountInput)}
                      disabled={isTxConfirming}
                      className="w-full btn-primary text-sm h-12"
                    >
                      {isTxConfirming ? "Processing Transaction..." : "Approve ASSA Spend"}
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={isTxConfirming}
                      className="w-full btn-primary text-sm h-12"
                    >
                      {isTxConfirming ? "Processing Transaction..." : "Lock & Secure ASSA"}
                    </button>
                  )}
                </form>
              </div>
            ) : (
              /* EXISTING LOCK UPGRADE/EXTEND CONTROLS */
              <div className="space-y-6">
                {/* Increase locked amount */}
                <div className="glass-card chamfer p-6 space-y-4">
                  <h3 className="font-display text-base font-bold text-ink">Increase Locked Amount</h3>
                  <p className="text-xs text-ink-soft">
                    Lock additional ASSA into your active escrow position. Does not modify expiration date.
                  </p>

                  <form onSubmit={handleIncreaseAmount} className="flex gap-4 items-end">
                    <div className="flex-1 space-y-2">
                      <input
                        type="number"
                        min="1"
                        value={addAmountInput}
                        onChange={(e) => setAddAmountInput(e.target.value)}
                        className="w-full bg-surface-2 border border-rule px-4 py-2.5 text-ink text-xs font-display focus:outline-none focus:border-brand"
                        placeholder="Add ASSA"
                      />
                    </div>
                    {!isAllowanceSufficient(addAmountInput) ? (
                      <button
                        type="button"
                        onClick={() => handleApprove(addAmountInput)}
                        disabled={isTxConfirming}
                        className="btn-primary text-xs h-10 min-h-[40px] px-6"
                      >
                        {isTxConfirming ? "..." : "Approve"}
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={isTxConfirming}
                        className="btn-primary text-xs h-10 min-h-[40px] px-6"
                      >
                        {isTxConfirming ? "..." : "Add Amount"}
                      </button>
                    )}
                  </form>
                </div>

                {/* Extend Unlock Time */}
                <div className="glass-card chamfer p-6 space-y-4">
                  <h3 className="font-display text-base font-bold text-ink">Extend Lock Duration</h3>
                  <p className="text-xs text-ink-soft">
                    Extend your unlock date to restore or multiply your veASSA voting weight.
                  </p>

                  <form onSubmit={handleIncreaseUnlockTime} className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {DURATIONS.map((dur) => (
                        <button
                          key={dur.value}
                          type="button"
                          onClick={() => setExtendDurationInput(dur.value)}
                          className={`py-2 text-xs font-display border transition-all ${
                            extendDurationInput === dur.value
                              ? "bg-brand border-brand text-white font-bold"
                              : "bg-surface-2 border-rule text-ink hover:border-ink-dim"
                          }`}
                          style={{ borderRadius: "8px" }}
                        >
                          {dur.label}
                        </button>
                      ))}
                    </div>
                    <button
                      type="submit"
                      disabled={isTxConfirming}
                      className="w-full btn-primary text-xs h-10 min-h-[40px]"
                    >
                      {isTxConfirming ? "Confirming..." : "Extend Unlock Time"}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>

          {/* CALCULATOR SIDEBAR */}
          <div className="space-y-6">
            <div className="glass-card chamfer p-6 space-y-6">
              <h3 className="font-display text-base font-bold text-ink border-b border-rule pb-3">
                Locked Estimator
              </h3>

              <div className="space-y-4 text-xs font-display">
                {/* Simulated Power */}
                <div className="flex items-center justify-between">
                  <span className="text-ink-soft">Est. veASSA Weight:</span>
                  <strong className="text-ink text-base tnum">
                    {activeLockedAmount === 0n 
                      ? calcEstimatedVp(lockAmountInput, durationInput).toLocaleString(undefined, { maximumFractionDigits: 2 })
                      : "Active Lock Engaged"
                    }
                  </strong>
                </div>

                {/* Simulated VIP Tier */}
                <div className="flex items-center justify-between">
                  <span className="text-ink-soft">Projected VIP Tier:</span>
                  <strong className={getEstimatedTierColor(getEstimatedTier(lockAmountInput))}>
                    {activeLockedAmount === 0n ? getEstimatedTier(lockAmountInput) : "Active Lock Engaged"}
                  </strong>
                </div>
              </div>

              {/* Explanatory Tiers */}
              <div className="border-t border-rule pt-4 space-y-3">
                <span className="text-[10px] font-display uppercase tracking-wider text-ink-soft block">
                  ASSA VIP Thresholds
                </span>
                <div className="space-y-2 text-xs font-display">
                  <div className="flex items-center justify-between text-[#CD7F32]">
                    <span>Bronze Stake</span>
                    <span className="tnum">&gt;= 1,000 ASSA</span>
                  </div>
                  <div className="flex items-center justify-between text-[#C0C0C0]">
                    <span>Silver Stake</span>
                    <span className="tnum">&gt;= 10,000 ASSA</span>
                  </div>
                  <div className="flex items-center justify-between text-[#FFD700]">
                    <span>Gold Stake</span>
                    <span className="tnum">&gt;= 100,000 ASSA</span>
                  </div>
                  <div className="flex items-center justify-between text-[#EF2525] text-glow-red font-semibold">
                    <span>Legend Stake</span>
                    <span className="tnum">&gt;= 1,000,000 ASSA</span>
                  </div>
                </div>
              </div>
            </div>

            {/* WITHDRAW CONTROLS */}
            {activeLockedAmount > 0n && (
              <div className="glass-card chamfer p-6 space-y-4">
                <h3 className="font-display text-base font-bold text-ink">Reclaim Capital</h3>
                <p className="text-xs text-ink-soft">
                  Reclaim your locked capital. Succeeded withdrawals reset your veASSA weight and tier back to none.
                </p>

                <button
                  onClick={handleWithdraw}
                  disabled={!isLockExpired || isTxConfirming}
                  className={`w-full py-3.5 text-xs font-display font-bold uppercase transition-all ${
                    isLockExpired
                      ? "bg-positive text-white cursor-pointer hover:bg-emerald-500 shadow-md"
                      : "bg-surface-3 text-ink-dim cursor-not-allowed border border-rule"
                  }`}
                  style={{ borderRadius: "999px" }}
                >
                  {isLockExpired ? "Withdraw Expired Lock" : "Lock Active (Reclaim Disabled)"}
                </button>

                {!isLockExpired && (
                  <span className="text-[10px] font-display text-ink-dim block text-center">
                    Locked until {new Date(activeLockEnd * 1000).toLocaleDateString()}
                  </span>
                )}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
