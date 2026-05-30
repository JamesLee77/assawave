import { useTranslation } from "react-i18next";

const APP_URL = import.meta.env.VITE_APP_URL || "https://app.assawave.io";

// AI 무드 사진 슬롯 — 콘서트 군중·응원봉 바다(레드 우세, 인물식별 X). 파일 없으면 stage-fallback 그래디언트가 비침.
const HERO_PHOTO = "/brand/hero-crowd.jpg";

export default function Hero() {
  const { t } = useTranslation("home");
  const chips = t("hero.chips", { returnObjects: true }) as [string, string][];

  return (
    <section id="hero" className="relative isolate overflow-hidden">
      {/* ── 시네마틱 미디어 레이어 ── */}
      <div className="absolute inset-0 -z-10" aria-hidden="true">
        <div className="stage-fallback" />
        {/* 사진 슬롯: CSS 배경이라 파일이 없어도 broken-image 없이 stage가 비침 */}
        <div
          className="media-cover"
          style={{ backgroundImage: `url(${HERO_PHOTO})`, backgroundSize: "cover", backgroundPosition: "center" }}
        />
        <div className="scrim-b" />
        <div className="scrim-l" />
      </div>

      <div className="relative mx-auto flex min-h-[clamp(600px,90vh,940px)] max-w-7xl flex-col px-5 md:px-10">
        {/* 콘텐츠 — 하단 정렬(시네마틱) */}
        <div className="flex flex-1 flex-col justify-end pb-12 pt-32 md:pt-40">
          <span className="chip mb-7 w-fit" style={{ color: "#fff", background: "rgba(255,255,255,0.08)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.22)" }}>
            <span className="sw" style={{ background: "var(--brand)", boxShadow: "0 0 10px 1px rgba(239,37,37,0.9)" }} />
            {t("hero.eyebrow")}
          </span>

          <h1 className="max-w-[15ch] font-display text-[clamp(40px,7vw,76px)] font-bold leading-[1.03] tracking-[-0.025em] text-white">
            {t("hero.h1Pre")}{" "}
            <span style={{ color: "#ff7a6b", textShadow: "0 0 42px rgba(239,37,37,0.5)" }} className="whitespace-nowrap">
              {t("hero.h1Em")}
            </span>
          </h1>

          <p className="mt-7 max-w-[600px] text-[17px] leading-relaxed text-white/75 md:text-[18px]">
            {t("hero.lead")}
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <a href="/whitepaper" className="btn-primary gap-2.5 px-8 text-[15px] font-semibold tracking-wide">
              <span className="tri" aria-hidden="true" />
              {t("hero.ctaPaper")}
            </a>
            <a href={APP_URL} className="btn-ghost btn-on-photo gap-2 px-8 text-[15px] font-semibold">
              {t("hero.ctaApp")}
              <span aria-hidden="true">↗</span>
            </a>
          </div>

          <p className="mt-8 flex items-center gap-3.5 text-[13px] uppercase tracking-[0.2em] text-white/55">
            <span aria-hidden="true" className="inline-block h-px w-8" style={{ background: "linear-gradient(90deg,var(--brand),transparent)" }} />
            {t("hero.micro")}
          </p>
        </div>

        {/* ── 가치 밴드 (Spotify식 하단 컬럼) ── */}
        <div className="grid grid-cols-2 gap-px border-t border-white/15 md:grid-cols-4">
          {chips.map(([label, role], i) => (
            <div key={label} className={`flex items-center gap-3 py-5 md:py-6 ${i > 0 ? "md:pl-7" : ""}`}>
              <span
                aria-hidden="true"
                className="h-2.5 w-2.5 flex-none rounded-full"
                style={{ background: `var(--${role})`, boxShadow: `0 0 10px 1px color-mix(in srgb, var(--${role}) 70%, transparent)` }}
              />
              <span className="font-display text-[15px] font-semibold leading-tight text-white md:text-[17px]">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
