import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import Section from "../Section";
import SectionLabel from "../SectionLabel";

type Item = { n: string; h: string; s: string; b: string };

const ENGINE_PHOTO = ["/brand/album-artwork.png", "/brand/hero-crowd.jpg", "/edge-device.jpg"];

function Equalizer() {
  const [heights, setHeights] = useState([40, 70, 50, 90, 30, 80]);

  useEffect(() => {
    const interval = setInterval(() => {
      setHeights(prev => prev.map(() => Math.floor(Math.random() * 80) + 20));
    }, 800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="wave-progress-bar">
      {heights.map((h, idx) => (
        <div key={idx} className="wave-bar" style={{ height: `${h}%` }} />
      ))}
      <span className="font-data text-brand text-[13px] tracking-widest ml-4 self-center">LIVE FEED SYNCED</span>
    </div>
  );
}

export default function SolutionTrinity() {
  const { t } = useTranslation("home");
  const items = t("trinity.items", { returnObjects: true }) as Item[];
  const emA = t("trinity.h1EmA");
  const emB = t("trinity.h1EmB");
  const emC = t("trinity.h1EmC");

  return (
    <Section id="solution">
      <SectionLabel>{t("trinity.label")}</SectionLabel>

      <h2 className="font-display text-[clamp(34px,5vw,60px)] leading-[1.05] tracking-[-0.025em] mt-8 mb-6 max-w-[920px]">
        {t("trinity.h1Pre")}
        <br />
        <span className="text-brand-on-dark text-glow-red">{emA}</span> · <span className="text-brand-on-dark text-glow-red">{emB}</span> ·{" "}
        <span className="text-brand-on-dark text-glow-red">{emC}</span>.
      </h2>

      <p className="text-ink-soft text-lg leading-relaxed max-w-[680px] mb-12">
        {t("trinity.lead")}
      </p>

      {/* 3엔진 — Premium Bento-Grid (Streaming = 8cols, Spending = 4cols, Nodes = 12cols) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Streaming Card (8 columns) */}
        {items[0] && (
          <article className="md:col-span-8 card rounded-[20px] p-8 overflow-hidden relative group min-h-[360px] flex flex-col justify-between">
            <div className="absolute inset-0 -z-10" aria-hidden="true">
              <div className="media-cover opacity-[0.04] dark:opacity-[0.15]" style={{ backgroundImage: `url(${ENGINE_PHOTO[0]})`, backgroundSize: "cover", backgroundPosition: "center" }} />
              <div className="hidden dark:block absolute inset-0 scrim-b" />
            </div>

            <div className="relative z-10">
              <span className="text-brand font-data text-[12px] tracking-[0.16em] uppercase mb-3 block">
                {items[0].n}
              </span>
              <h3 className="font-display text-ink text-[32px] font-bold mt-1 leading-tight">{items[0].h}</h3>
              <p className="text-ink-soft italic text-[15px] mt-1 mb-4">{items[0].s}</p>
              <p className="text-ink-soft text-[16px] leading-relaxed max-w-xl">
                {items[0].b}
              </p>
            </div>

            <div className="relative z-10 mt-8">
              <Equalizer />
            </div>
          </article>
        )}

        {/* Spending Card (4 columns) */}
        {items[1] && (
          <article className="md:col-span-4 card rounded-[20px] p-8 overflow-hidden relative group flex flex-col justify-between min-h-[360px]">
            <div className="absolute inset-0 -z-10" aria-hidden="true">
              <div className="media-cover opacity-[0.04] dark:opacity-[0.15]" style={{ backgroundImage: `url(${ENGINE_PHOTO[1]})`, backgroundSize: "cover", backgroundPosition: "center" }} />
              <div className="hidden dark:block absolute inset-0 scrim-b" />
            </div>

            <div className="relative z-10">
              <span className="text-brand font-data text-[12px] tracking-[0.16em] uppercase mb-3 block">
                {items[1].n}
              </span>
              <h3 className="font-display text-ink text-[32px] font-bold mt-1 leading-tight">{items[1].h}</h3>
              <p className="text-ink-soft italic text-[15px] mt-1 mb-4">{items[1].s}</p>
              <p className="text-ink-soft text-[16px] leading-relaxed">
                {items[1].b}
              </p>
            </div>

            <div className="relative z-10 mt-8">
              <div className="text-4xl font-data text-coral leading-none mb-2">1,248,390+</div>
              <div className="text-xs text-ink-soft uppercase tracking-widest">ASSA Tokens Burned</div>
            </div>
          </article>
        )}

        {/* Nodes Card (12 columns) */}
        {items[2] && (
          <article className="md:col-span-12 card rounded-[20px] p-8 md:p-10 flex flex-col md:flex-row items-center gap-12 overflow-hidden relative min-h-[380px]">
            <div className="absolute inset-0 -z-10" aria-hidden="true">
              <div className="media-cover opacity-[0.03] dark:opacity-[0.10]" style={{ backgroundImage: `url(${ENGINE_PHOTO[2]})`, backgroundSize: "cover", backgroundPosition: "center" }} />
              <div className="hidden dark:block absolute inset-0 scrim-b" />
            </div>

            <div className="md:w-1/2 relative z-10">
              <span className="text-brand font-data text-[12px] tracking-[0.16em] uppercase mb-3 block">
                {items[2].n}
              </span>
              <h3 className="font-display text-ink text-[32px] font-bold mt-1 leading-tight">{items[2].h}</h3>
              <p className="text-ink-soft italic text-[15px] mt-1 mb-4">{items[2].s}</p>
              <p className="text-ink-soft text-[16px] leading-relaxed mb-6">
                {items[2].b}
              </p>
              <ul className="space-y-3 font-body text-ink-soft text-[15px]">
                <li className="flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-brand" />
                  Proof of Fan Participation Attestation
                </li>
                <li className="flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-brand" />
                  Exclusive NFT Staking & Rewards Access
                </li>
              </ul>
            </div>

            <div className="md:w-1/2 relative group flex justify-center items-center">
              <div className="absolute -inset-4 bg-brand/20 blur-3xl opacity-0 group-hover:opacity-40 transition-opacity duration-500 rounded-full" />
              <img
                alt="Edge-AI Mining Node"
                className="relative z-10 w-full max-w-sm drop-shadow-2xl transition-transform duration-500 group-hover:scale-105"
                src="/brand/assa-mark.png"
              />
            </div>
          </article>
        )}
      </div>
    </Section>
  );
}
