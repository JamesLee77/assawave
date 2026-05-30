import { useTranslation } from "react-i18next";
import Section from "../Section";
import SectionLabel from "../SectionLabel";

type Item = { n: string; h: string; s: string; b: string };

// 3엔진 = data 팔레트(brand red 아님, moss audit §2 DATA 분류). 사진 슬롯 매핑.
const AXIS = ["var(--data-1)", "var(--data-2)", "var(--data-3)"] as const;
const ENGINE_PHOTO = ["/brand/engine-streaming.jpg", "/brand/engine-spending.jpg", "/brand/engine-nodes.jpg"];

export default function SolutionTrinity() {
  const { t } = useTranslation("home");
  const items = t("trinity.items", { returnObjects: true }) as Item[];
  const emA = t("trinity.h1EmA");
  const emB = t("trinity.h1EmB");
  const emC = t("trinity.h1EmC");

  return (
    <Section id="solution">
      <SectionLabel>{t("trinity.label")}</SectionLabel>

      <h2 className="font-display text-[clamp(34px,5vw,60px)] leading-[1.05] tracking-[-0.02em] mt-8 mb-6 max-w-[920px]">
        {t("trinity.h1Pre")}
        <br />
        <em className="italic-brand">{emA}</em> · <em className="italic-brand">{emB}</em> ·{" "}
        <em className="italic-brand">{emC}</em>.
      </h2>

      <p className="text-ink-soft text-lg leading-relaxed max-w-[680px] mb-12">
        {t("trinity.lead")}
      </p>

      {/* 3엔진 — 시네마틱 미디어 카드 (스테이지 백드롭 + 사진 슬롯 + 스크림) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {items.map((c, i) => (
          <article
            key={c.n}
            className="media-frame group relative flex min-h-[360px] flex-col justify-end p-7 md:p-8 transition-transform hover:-translate-y-1"
          >
            <div className="absolute inset-0 -z-10" aria-hidden="true">
              <div
                className="absolute inset-0"
                style={{
                  background: `radial-gradient(125% 80% at 50% 0%, color-mix(in srgb, ${AXIS[i]} 32%, transparent), transparent 62%), linear-gradient(180deg, #0e0e1a, #08080f)`,
                }}
              />
              <div
                className="media-cover"
                style={{ backgroundImage: `url(${ENGINE_PHOTO[i]})`, backgroundSize: "cover", backgroundPosition: "center" }}
              />
              <div className="scrim-b" />
            </div>

            <div className="relative">
              <span
                className="mb-5 inline-block h-1 w-9 rounded-full"
                style={{ background: AXIS[i], boxShadow: `0 0 12px 1px color-mix(in srgb, ${AXIS[i]} 70%, transparent)` }}
              />
              <div className="text-[12px] font-semibold uppercase tracking-[0.08em]" style={{ color: AXIS[i] }}>
                {c.n}
              </div>
              <div className="font-display text-white text-[28px] mt-3 leading-tight">{c.h}</div>
              <div className="italic text-[15px] mt-1 mb-4 text-white/70">{c.s}</div>
              <p className="text-white/75 text-[15.5px] leading-relaxed">{c.b}</p>
            </div>
          </article>
        ))}
      </div>
    </Section>
  );
}
