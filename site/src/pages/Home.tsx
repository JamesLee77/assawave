import { useTranslation } from "react-i18next";
import WaveMark from "../components/brand/WaveMark";

const APP_URL = import.meta.env.VITE_APP_URL || "https://app.assawave.io";

// 토큰 데모 스와치 — 스캐폴드가 디자인 토큰을 실제 렌더하는지 확인용.
// ⚠️ 후속: Earth.tsx → Home.tsx fork로 실제 11섹션(Hero/Tokenomics/Roadmap/FAQ…) 교체.
const SWATCHES: { label: string; cls: string }[] = [
  { label: "brand", cls: "bg-brand" },
  { label: "brand-pressed", cls: "bg-brand-pressed" },
  { label: "gold", cls: "bg-gold" },
  { label: "positive", cls: "bg-positive" },
  { label: "data-1", cls: "bg-data-1" },
  { label: "data-2", cls: "bg-data-2" },
  { label: "data-3", cls: "bg-data-3" },
  { label: "destructive", cls: "bg-destructive" },
];

export default function Home() {
  const { t } = useTranslation("home");

  return (
    <>
      {/* Hero (스캐폴드) */}
      <section className="mx-auto max-w-7xl px-5 md:px-10 pt-20 pb-24">
        <p className="eyebrow mb-6">{t("eyebrow", "K-POP · WEB3 · WAVE")}</p>
        <WaveMark height={64} className="text-brand mb-8" />
        <h1 className="text-4xl md:text-6xl font-display leading-tight max-w-3xl">
          팬덤의 열광을 <span className="italic-brand">온체인</span>으로.
        </h1>
        <p className="mt-6 max-w-xl text-ink-soft text-lg">
          {t(
            "sub",
            "ASSA WAVE — 음악·팬덤·Web3가 만나는 곳. 토큰 세일, 무이자 스테이킹, 소비 경쟁.",
          )}
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-4">
          <a href={APP_URL} className="btn-primary inline-flex items-center px-6 font-medium tracking-wide">
            세일 참여
          </a>
          <a
            href="/whitepaper"
            className="hit-44 inline-flex items-center px-6 border border-rule text-ink hover:text-brand transition-colors"
          >
            백서 보기
          </a>
        </div>
      </section>

      {/* 토큰 데모 — 디자인 토큰이 빌드에 실제 반영되는지 검증 */}
      <section id="tokenomics" className="mx-auto max-w-7xl px-5 md:px-10 py-16 border-t border-rule">
        <p className="eyebrow mb-6">디자인 토큰 (스캐폴드 검증)</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {SWATCHES.map((s) => (
            <div key={s.label} className="border border-rule">
              <div className={`h-16 ${s.cls}`} aria-hidden="true" />
              <div className="px-3 py-2 text-[12px] tnum text-ink-soft">{s.label}</div>
            </div>
          ))}
        </div>
        <p className="mt-6 text-ink-soft text-sm">
          ※ data-* 는 차트 전용 중립색(레드 아님). 후속: Earth→Home fork로 실제 섹션 교체.
        </p>
      </section>

      <section id="roadmap" className="mx-auto max-w-7xl px-5 md:px-10 py-16 border-t border-rule">
        <p className="eyebrow mb-3">로드맵</p>
        <p className="text-ink-soft">M1~M5 — 후속 단계에서 작성.</p>
      </section>

      <section id="faq" className="mx-auto max-w-7xl px-5 md:px-10 py-16 border-t border-rule">
        <p className="eyebrow mb-3">FAQ</p>
        <p className="text-ink-soft">후속 단계에서 작성.</p>
      </section>
    </>
  );
}
