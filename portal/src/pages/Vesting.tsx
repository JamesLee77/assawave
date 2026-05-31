import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAccount, usePublicClient, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { CONTRACTS, TokenVestingAbi } from "../lib/contracts";
import { fmtASSA } from "../lib/format";
import { Card, CTA, H1, H3, Lede, SectionLabel } from "../components/site/primitives";

const vest = CONTRACTS.tokenVesting;

interface ScheduleData {
  id: bigint;
  beneficiary: string;
  total: bigint;
  start: bigint;
  cliff: bigint;
  duration: bigint;
  claimed: bigint;
  revocable: boolean;
  revoked: boolean;
  releasable: bigint;
}

export default function Vesting() {
  const { t } = useTranslation(["vesting", "common"]);
  const { address, isConnected } = useAccount();
  const client = usePublicClient();
  const [schedules, setSchedules] = useState<ScheduleData[]>([]);
  const [loading, setLoading] = useState(false);
  const [reloadTick, setReloadTick] = useState(0);

  const { writeContract, data: txHash, isPending, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash: txHash });

  useEffect(() => {
    if (isConfirmed) setReloadTick((t) => t + 1);
  }, [isConfirmed]);

  useEffect(() => {
    if (!isConnected || !address || !client) return;
    setLoading(true);
    (async () => {
      try {
        // scheduleIdsOf now returns the whole id array in one call.
        const ids = (await client.readContract({
          address: vest, abi: TokenVestingAbi, functionName: "scheduleIdsOf", args: [address],
        })) as readonly bigint[];

        const out: ScheduleData[] = [];
        for (const id of ids) {
          // schedules(id) => [beneficiary, total, claimed, start, cliff, duration, tgeBps, category, revocable, revoked]
          const s = (await client.readContract({
            address: vest, abi: TokenVestingAbi, functionName: "schedules", args: [id],
          })) as readonly [string, bigint, bigint, bigint, bigint, bigint, number, number, boolean, boolean];
          const r = (await client.readContract({
            address: vest, abi: TokenVestingAbi, functionName: "releasable", args: [id],
          })) as bigint;
          out.push({
            id, beneficiary: s[0], total: s[1], claimed: s[2], start: s[3],
            cliff: s[4], duration: s[5], revocable: s[8], revoked: s[9], releasable: r,
          });
        }
        setSchedules(out);
      } finally { setLoading(false); }
    })();
  }, [address, client, isConnected, reloadTick]);

  if (!isConnected) {
    return (
      <Card className="text-center">
        <p style={{ color: "var(--ink-soft)" }}>Connect your wallet to see your vesting schedules.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-10">
      <header>
        <SectionLabel className="mb-3">Vesting</SectionLabel>
        <H1>{t("vesting:title")}</H1>
        <Lede className="mt-5">{t("vesting:subtitle")}</Lede>
      </header>

      {loading && (
        <p className="font-mono text-sm" style={{ color: "var(--ink-soft)" }}>Loading…</p>
      )}
      {!loading && schedules.length === 0 && (
        <Card className="text-center">
          <p style={{ color: "var(--ink-soft)" }}>{t("vesting:noSchedules")}</p>
        </Card>
      )}

      <div className="space-y-4">
        {schedules.map((s) => {
          const start = new Date(Number(s.start) * 1000);
          const cliffEnd = new Date(Number(s.start + s.cliff) * 1000);
          // Fully vested = start + cliff + duration (duration is the post-cliff linear window).
          const end = new Date(Number(s.start + s.cliff + s.duration) * 1000);
          const pct = s.total > 0n ? Number((s.claimed * 10000n) / s.total) / 100 : 0;
          const canRelease = s.releasable > 0n && !s.revoked;

          return (
            <Card key={s.id.toString()}>
              <div className="flex items-center justify-between mb-4">
                <H3>Schedule #{s.id.toString()}</H3>
                <div className="flex gap-2">
                  {s.revocable && (
                    <Tag color="warning">revocable</Tag>
                  )}
                  {s.revoked && (
                    <Tag color="red">revoked</Tag>
                  )}
                </div>
              </div>

              <div className="mb-5">
                <div className="h-1.5 w-full" style={{ background: "var(--rule)" }}>
                  <div
                    className="h-1.5"
                    style={{ width: `${pct.toFixed(1)}%`, background: "var(--brand)" }}
                    aria-label="vest progress"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3 mb-5">
                <Field label={t("vesting:fields.total")} value={`${fmtASSA(s.total)} ASSA`} />
                <Field label={t("vesting:fields.released")} value={`${fmtASSA(s.claimed)} ASSA (${pct.toFixed(1)}%)`} />
                <Field label={t("vesting:fields.releasable")} value={`${fmtASSA(s.releasable)} ASSA`} accent />
                <Field label={t("vesting:fields.start")} value={start.toLocaleString()} />
                <Field label={t("vesting:fields.cliffEnds")} value={cliffEnd.toLocaleString()} />
                <Field label={t("vesting:fields.fullyVested")} value={end.toLocaleString()} />
              </div>

              <CTA
                label={
                  isPending
                    ? t("vesting:awaitingWallet")
                    : isConfirming
                      ? t("vesting:confirming")
                      : t("vesting:release", { amount: fmtASSA(s.releasable) })
                }
                disabled={!canRelease || isPending || isConfirming}
                onClick={() =>
                  writeContract({
                    address: vest,
                    abi: TokenVestingAbi,
                    functionName: "release",
                    args: [s.id],
                  })
                }
              />
            </Card>
          );
        })}
      </div>

      {writeError && (
        <div
          className="border p-4 font-mono text-[12px]"
          style={{ background: "rgba(239,68,68,0.08)", borderColor: "#ef4444", color: "#ef4444" }}
        >
          {writeError.message}
        </div>
      )}
      {isConfirmed && (
        <div
          className="border p-4 font-mono text-[12px]"
          style={{ background: "color-mix(in srgb, var(--positive) 8%, transparent)", borderColor: "var(--positive)", color: "var(--positive)" }}
        >
          {t("vesting:released")}
        </div>
      )}
    </div>
  );
}

function Field({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <div
        className="font-mono text-[10px] tracking-[0.14em] uppercase"
        style={{ color: "var(--ink-soft)" }}
      >
        {label}
      </div>
      <div
        className="font-mono mt-1"
        style={{
          fontSize: 13,
          color: accent ? "var(--positive)" : "var(--ink)",
          fontWeight: accent ? 600 : 400,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function Tag({ color, children }: { color: "warning" | "red"; children: React.ReactNode }) {
  const styles = color === "warning"
    ? { bg: "color-mix(in srgb, var(--warning) 8%, transparent)", fg: "var(--warning)", border: "var(--warning)" }
    : { bg: "rgba(239,68,68,0.08)", fg: "#ef4444", border: "#ef4444" };
  return (
    <span
      className="font-mono text-[10px] tracking-[0.14em] uppercase px-2 py-1 border"
      style={{ background: styles.bg, color: styles.fg, borderColor: styles.border }}
    >
      {children}
    </span>
  );
}
