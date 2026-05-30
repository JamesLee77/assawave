import { useTranslation } from "react-i18next";
import Section from "../Section";
import SectionLabel from "../SectionLabel";
import Heading from "../Heading";

// 테마 무관 고정 다크 패널 — ink/paper 스왑을 쓰면 다크 테마에서 대비가 역전되므로
// (brand 레드 분기), 문제 섹션은 항상 다크로 둔다(톤=단호, §3.1).
const PANEL_BG = "#0c0c16";
const PANEL_FG = "#f5f5f7";
const PANEL_ACCENT = "#ff6b5e"; // brand-on-dark — 다크 위 AA

export default function ManifestoProblem() {
  const { t } = useTranslation("home");
  const items = t("problem.items", { returnObjects: true }) as [string, string][];

  return (
    <Section id="manifesto">
      <SectionLabel>{t("problem.label")}</SectionLabel>
      <Heading
        pre={t("problem.h1Pre")}
        em={t("problem.h1Em")}
        maxWidth={920}
        className="mt-8 mb-12"
      />

      <div style={{ background: PANEL_BG, color: PANEL_FG }} className="p-6 md:p-10">
        <div
          className="grid grid-cols-1 sm:grid-cols-3"
          style={{ gap: 1, background: "rgba(255,255,255,0.08)" }}
        >
          {items.map(([h, b], i) => (
            <div key={i} style={{ background: PANEL_BG }} className="p-7 md:p-8">
              <div
                className="font-data text-[12px] uppercase tracking-[0.14em] mb-3"
                style={{ color: PANEL_ACCENT }}
              >
                FAIL · {String(i + 1).padStart(2, "0")}
              </div>
              <div
                className="font-display text-2xl md:text-[28px] leading-tight mb-3"
                style={{ color: PANEL_FG }}
              >
                {h}
              </div>
              <p
                className="text-[14px] leading-relaxed"
                style={{ color: "rgba(245,245,247,0.72)" }}
              >
                {b}
              </p>
            </div>
          ))}
        </div>
      </div>

      <a
        href="/whitepaper"
        className="mt-10 inline-flex items-center gap-1.5 hit-44 px-6 border border-rule text-ink hover:text-brand hover:border-brand transition-colors"
      >
        {t("problem.ctaPaper")}
        <span aria-hidden="true">→</span>
      </a>
    </Section>
  );
}
