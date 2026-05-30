import { useEffect, useState } from "react";

export type AnchorItem = { id: string; label: string };

/**
 * 인페이지 앵커 내비 — SiteNav(h-16) 아래 sticky. IntersectionObserver로 활성 섹션
 * 추적. ccm AnchorNav fork: active 하이라이트 moss → ASSA brand(테마인지 텍스트
 * + brand 보더, moss audit §2 BRAND 분류).
 */
export default function AnchorNav({ items }: { items: AnchorItem[] }) {
  const [active, setActive] = useState<string>(items[0]?.id ?? "");

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const sections = items
      .map((it) => document.getElementById(it.id))
      .filter((el): el is HTMLElement => !!el);
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-30% 0px -55% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] },
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [items]);

  return (
    <nav
      aria-label="Section navigation"
      className="sticky top-16 z-20 border-y border-rule overflow-x-auto"
      style={{ background: "var(--nav-bg)", backdropFilter: "blur(8px)" }}
    >
      <ul className="mx-auto max-w-7xl flex gap-6 px-5 md:px-10 py-3 font-data text-[11px] tracking-[0.12em] uppercase whitespace-nowrap">
        {items.map((it) => (
          <li key={it.id}>
            <a
              href={`#${it.id}`}
              aria-current={active === it.id ? "true" : undefined}
              className={`pb-0.5 border-b transition-colors ${
                active === it.id
                  ? "text-brand-accent border-brand"
                  : "text-ink-soft border-transparent hover:text-ink"
              }`}
            >
              {it.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
