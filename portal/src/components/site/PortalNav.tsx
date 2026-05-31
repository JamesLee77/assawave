import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import Wordmark from "../brand/Wordmark";
import WalletButton from "./WalletButton";
import ThemeToggle from "./ThemeToggle";

type NavItem = { id: string; label: string; to: string };

const NAV_ITEMS: NavItem[] = [
  { id: "dashboard", label: "Dashboard", to: "/dashboard" },
  { id: "stake", label: "Lockup & Stake", to: "/stake" },
  { id: "sale", label: "SAFT Sale", to: "/sale" },
  { id: "vesting", label: "Vesting Claims", to: "/vesting" },
  { id: "migrate", label: "Migration", to: "/migrate" },
  { id: "settings", label: "Settings", to: "/settings" },
];

const linkBase =
  "font-display text-[12px] tracking-[0.1em] uppercase pb-1 border-b-2 transition-all duration-250";

export default function PortalNav() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className="sticky top-0 z-50 backdrop-blur-md border-b border-rule"
      style={{ background: "var(--nav-bg)" }}
    >
      <div className="px-6 md:px-14 py-4 flex items-center justify-between">
        <Link
          to="/dashboard"
          className="flex items-center gap-4 text-ink"
          aria-label="ASSA WAVE — investor portal"
        >
          <Wordmark size={28} />
          <span
            className="font-display text-[10px] tracking-[0.16em] uppercase hidden md:block pl-4 border-l border-rule"
            style={{
              lineHeight: 1.4,
              color: "var(--ink-soft)"
            }}
          >
            Portal
            <br />
            TESTNET
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex gap-8">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.id}
              to={item.to}
              className={({ isActive }) =>
                `${linkBase} ${
                  isActive
                    ? "text-brand border-brand text-glow-red"
                    : "text-ink-soft border-transparent hover:text-ink hover:border-ink-dim"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <div className="hidden md:block">
            <WalletButton />
          </div>

          <ThemeToggle />

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="md:hidden flex items-center justify-center border border-rule transition-colors hover:border-ink"
            style={{ width: 36, height: 36, background: "transparent", cursor: "pointer", borderRadius: "999px" }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              {open ? (
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

      {/* Mobile drawer */}
      {open ? (
        <div className="md:hidden border-t border-rule" style={{ background: "var(--paper)" }}>
          <nav className="flex flex-col py-4">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.id}
                to={item.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `font-display text-[14px] tracking-[0.12em] uppercase px-6 py-4 border-l-4 ${
                    isActive
                      ? "text-brand border-brand bg-brand/5"
                      : "text-ink-soft border-transparent hover:text-ink hover:bg-surface-2/20"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
            <div className="px-6 pt-4 border-t border-rule mt-2">
              <WalletButton className="w-full justify-center px-5" />
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
