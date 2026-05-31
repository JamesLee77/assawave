import { useEffect, useState } from "react";
import { Link, Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import WalletButton from "./WalletButton";
import WaveMark from "../brand/WaveMark";
import ThemeToggle from "./ThemeToggle";

const APP_URL = import.meta.env.VITE_APP_URL || "https://app.assawave.io";

/**
 * 마케팅 site 셸 — 단일 네비(2단 적층 제거: 기존 헤더nav + AnchorNav 중복을 한 줄로 통합).
 * 슬림 반피싱 고지 + 헤더(WaveMark + 섹션 링크 + Open App + ThemeToggle) + Outlet + Footer.
 */
export default function Layout() {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);

  // 단일 네비 — 실제 섹션 앵커로 직접 연결(섹션 nav 별도 바 불필요).
  const NAV = [
    { id: "solution", label: t("home:anchors.solution") },
    { id: "tokenomics", label: t("home:anchors.tokenomics") },
    { id: "market", label: t("home:anchors.market") },
    { id: "roadmap", label: t("home:anchors.roadmap") },
  ];

  // Mobile drawer: lock body scroll while open + close on Escape (parity with portal PortalNav).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <div className="min-h-screen bg-paper text-ink flex flex-col relative">
      <div className="atmospheric-glow" aria-hidden="true" />
      {/* 슬림 반피싱 고지 — 차분한 단일 스트립 */}
      <div role="note" className="border-b border-rule" style={{ background: "linear-gradient(90deg, rgba(239,37,37,0.10), transparent 62%)" }}>
        <div className="mx-auto max-w-7xl px-5 md:px-10 h-9 flex items-center gap-2.5 text-[12px] text-ink-soft">
          <span aria-hidden="true" className="h-1.5 w-1.5 flex-none rounded-full" style={{ background: "var(--brand)" }} />
          <span className="truncate">{t("common:official")}</span>
        </div>
      </div>

      <header className="sticky top-0 z-30 backdrop-blur border-b border-rule" style={{ background: "var(--nav-bg)" }}>
        <div className="mx-auto max-w-7xl px-5 md:px-10 h-16 flex items-center justify-between gap-6">
          <Link to="/" aria-label="ASSA WAVE — home" className="text-ink hover:text-brand transition-colors">
            <WaveMark height={26} />
          </Link>
          <nav className="hidden md:flex items-center gap-8" aria-label="Primary">
            {NAV.map((n) => (
              <a key={n.id} href={`/#${n.id}`} className="nav-link">
                {n.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            {/* Desktop CTAs grouped in a PLAIN wrapper so the `hidden` utility applies
                — it would be silently overridden if placed on the .btn-primary itself
                (unlayered CSS beats Tailwind v4's utilities layer). On mobile these
                move into the drawer below, keeping the header to logo + toggle + menu. */}
            <div className="hidden md:flex items-center gap-3">
              <WalletButton className="whitespace-nowrap" />
              <a
                href={APP_URL}
                className="btn-primary inline-flex px-5 text-[13px] font-semibold tracking-wide"
              >
                {t("nav:app")}
              </a>
            </div>
            <ThemeToggle />
            {/* Mobile hamburger — parity with the portal's PortalNav drawer. */}
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              className="md:hidden inline-flex items-center justify-center rounded-full border border-rule text-ink hover:border-ink transition-colors"
              style={{ width: 40, height: 40 }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                {menuOpen ? (
                  <>
                    <line x1="6" y1="6" x2="18" y2="18" />
                    <line x1="18" y1="6" x2="6" y2="18" />
                  </>
                ) : (
                  <>
                    <line x1="4" y1="7" x2="20" y2="7" />
                    <line x1="4" y1="12" x2="20" y2="12" />
                    <line x1="4" y1="17" x2="20" y2="17" />
                  </>
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile drawer — section anchors + CTAs, closes on selection. */}
        {menuOpen ? (
          <div id="mobile-menu" className="md:hidden border-t border-rule" style={{ background: "var(--paper)" }}>
            <nav className="mx-auto max-w-7xl px-5 py-3 flex flex-col" aria-label="Mobile">
              {NAV.map((n) => (
                <a
                  key={n.id}
                  href={`/#${n.id}`}
                  onClick={() => setMenuOpen(false)}
                  className="nav-link block py-3.5 border-b border-rule"
                >
                  {n.label}
                </a>
              ))}
              <div className="flex flex-col gap-3 pt-4 pb-1">
                <a
                  href={APP_URL}
                  onClick={() => setMenuOpen(false)}
                  className="btn-primary inline-flex w-full justify-center px-5 py-3 text-[14px] font-semibold tracking-wide"
                >
                  {t("nav:app")}
                </a>
                <WalletButton className="w-full justify-center whitespace-nowrap" />
              </div>
            </nav>
          </div>
        ) : null}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-rule">
        <div className="mx-auto max-w-7xl px-5 md:px-10 py-12 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <WaveMark height={22} className="text-ink-soft" />
          <nav className="flex items-center gap-6 text-[13px] text-ink-soft" aria-label="Legal">
            <Link to="/terms" className="hover:text-ink transition-colors">{t("footer:terms")}</Link>
            <Link to="/privacy" className="hover:text-ink transition-colors">{t("footer:privacy")}</Link>
            <Link to="/disclaimer" className="hover:text-ink transition-colors">{t("footer:disclaimer")}</Link>
          </nav>
          <span className="text-ink-dim text-[13px]">{t("footer:copyright")}</span>
        </div>
      </footer>
    </div>
  );
}
