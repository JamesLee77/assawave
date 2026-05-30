import { Link, Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import WaveMark from "../brand/WaveMark";
import ThemeToggle from "./ThemeToggle";

const APP_URL = import.meta.env.VITE_APP_URL || "https://app.assawave.io";

// 앵커드 단일 스크롤 랜딩의 인페이지 내비 (ccm SiteNav 패턴 — 후속 AnchorNav 분리)
const NAV = [
  { id: "tokenomics", key: "tokenomics" },
  { id: "roadmap", key: "roadmap" },
  { id: "faq", key: "faq" },
] as const;

/**
 * 마케팅 site 셸. 상단 SiteNav(WaveMark + 앵커 + 앱 CTA + ThemeToggle) +
 * 공식 도메인 고지 배너(반피싱) + Outlet + Footer.
 * ⚠️ 스캐폴드 최소판 — SiteNav/AnchorNav/SiteFooter 분리는 후속.
 */
export default function Layout() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-paper text-ink flex flex-col">
      {/* 공식 도메인 고지 (반피싱) — 그래디언트 + 펄스 닷 + 스캔 라인 */}
      <div
        role="note"
        className="relative overflow-hidden border-b border-rule"
        style={{ background: "linear-gradient(90deg, rgba(239,37,37,0.12), rgba(239,37,37,0.04) 60%, transparent)" }}
      >
        <span className="notice-scan" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl px-5 md:px-10 h-[38px] flex items-center gap-3 font-data text-[12px] uppercase tracking-[0.14em] text-ink-soft">
          <span aria-hidden="true" className="h-1.5 w-1.5" style={{ background: "var(--brand)", boxShadow: "0 0 10px 1px rgba(239,37,37,0.9)", animation: "assa-pulse 2.4s ease-in-out infinite" }} />
          <span>{t("common:official")}</span>
        </div>
      </div>

      <header className="sticky top-0 z-30 backdrop-blur border-b border-rule" style={{ background: "var(--nav-bg)" }}>
        <div className="mx-auto max-w-7xl px-5 md:px-10 h-16 flex items-center justify-between">
          <Link to="/" aria-label="ASSA WAVE — home" className="text-ink hover:text-brand transition-colors">
            <WaveMark height={26} />
          </Link>
          <nav className="hidden md:flex items-center gap-7" aria-label="Primary">
            {NAV.map((n) => (
              <a key={n.id} href={`/#${n.id}`} className="nav-link">
                {t(`nav:${n.key}`)}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <a
              href={APP_URL}
              className="btn-primary hidden sm:inline-flex items-center px-4 text-[13px] font-medium tracking-wide"
            >
              {t("nav:app")}
            </a>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-rule">
        <div className="mx-auto max-w-7xl px-5 md:px-10 py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-ink-soft text-[13px]">
          <WaveMark height={22} className="text-ink-soft" />
          <nav className="flex items-center gap-5" aria-label="Legal">
            <Link to="/terms" className="hover:text-ink transition-colors">{t("footer:terms")}</Link>
            <Link to="/privacy" className="hover:text-ink transition-colors">{t("footer:privacy")}</Link>
            <Link to="/disclaimer" className="hover:text-ink transition-colors">{t("footer:disclaimer")}</Link>
          </nav>
          <span>{t("footer:copyright")}</span>
        </div>
      </footer>
    </div>
  );
}
