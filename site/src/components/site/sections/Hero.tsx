import { useTranslation } from "react-i18next";
import Heading from "../Heading";
import WaveLines from "../WaveLines";

const APP_URL = import.meta.env.VITE_APP_URL || "https://app.assawave.io";

// 음소거 mono 라벨 — `.eyebrow`(비레이어 brand색)는 Tailwind 유틸로 덮이지 않으므로 직접 조합.
const MUTED_LABEL = "font-data text-[11px] uppercase tracking-[0.16em] text-ink-soft";

export default function Hero() {
  const { t } = useTranslation("home");
  const facts = t("hero.facts", { returnObjects: true }) as [string, string][];

  return (
    <section id="hero" className="relative overflow-hidden border-b border-rule">
      <WaveLines className="pointer-events-none absolute inset-0 h-full w-full" />

      <div className="relative mx-auto max-w-7xl px-5 md:px-10 pt-16 md:pt-24 pb-20 md:pb-28">
        <p className="eyebrow mb-6">{t("hero.eyebrow")}</p>

        <div className="grid grid-cols-1 gap-12 md:grid-cols-[1.4fr_1fr] md:gap-16 md:items-end">
          {/* 좌: 헤드라인 · 리드 · CTA */}
          <div>
            <Heading as="h1" pre={t("hero.h1Pre")} em={t("hero.h1Em")} maxWidth={640} />
            <p className="mt-8 max-w-xl text-ink-soft text-lg leading-relaxed">
              {t("hero.lead")}
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <a
                href="/whitepaper"
                className="btn-primary inline-flex items-center px-6 font-medium tracking-wide"
              >
                {t("hero.ctaPaper")}
              </a>
              <a
                href={APP_URL}
                className="hit-44 inline-flex items-center px-6 border border-rule text-ink hover:text-brand hover:border-brand transition-colors"
              >
                {t("hero.ctaApp")}
                <span aria-hidden="true" className="ml-1.5">↗</span>
              </a>
            </div>
            <p className={`mt-8 ${MUTED_LABEL} tracking-[0.2em]`}>{t("hero.micro")}</p>
          </div>

          {/* 우: 핵심 정보 카드 (세일 비권유 — 토큰 팩트) */}
          <div className="border border-rule bg-paper-deep p-7 md:p-8">
            <div className="eyebrow mb-5">{t("hero.factsLabel")}</div>
            <dl className="divide-y divide-rule">
              {facts.map(([k, v]) => (
                <div key={k} className="flex items-baseline justify-between py-3 first:pt-0 last:pb-0">
                  <dt className={MUTED_LABEL}>{k}</dt>
                  <dd className="font-display tabular-nums text-ink text-xl">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}
