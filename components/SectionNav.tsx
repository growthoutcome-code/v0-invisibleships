"use client";

import { useEffect, useState } from "react";
import { track } from "@/lib/analytics";

/**
 * Section navigation for long research pages (Sean, 2026-08-21).
 *
 * The Crime page now runs to a dozen sections and several thousand words; on a
 * phone it is a very long scroll with no way to see what is in it. This gives
 * both shapes from one component:
 *
 *   wide    a sticky rail beside the content, current section marked
 *   narrow  a sticky bar pinned under the header that opens a sheet of links —
 *           a horizontal scroller was rejected because it hides most entries
 *           off-screen, which is the problem it was meant to solve
 *
 * The active section is tracked with IntersectionObserver rather than scroll
 * maths, so it stays correct through the charts' variable heights. Sections are
 * discovered from the DOM at mount, so adding a section to the page adds it to
 * the nav with no second edit — a list that has to be maintained by hand drifts.
 */

export type NavSection = { id: string; label: string };

export function useSectionNav(rootId: string) {
  const [sections, setSections] = useState<NavSection[]>([]);
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const root = document.getElementById(rootId);
    if (!root) return;

    let obs: IntersectionObserver | null = null;

    // Most sections on this page render only once their table has loaded, so a
    // single scan at mount finds a fraction of them (it found 5 of 13). Rescan
    // whenever the subtree changes, debounced, and rewire the observer.
    const scan = () => {
    const found: NavSection[] = [];
    root.querySelectorAll<HTMLElement>("section").forEach((el, i) => {
      const h = el.querySelector("h2");
      const label = h?.textContent?.trim();
      if (!label) return;                       // sections without a heading are layout, not content
      if (!el.id) el.id = `sec-${i}-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40)}`;
      el.style.scrollMarginTop = "96px";        // clear the sticky header on jump
      found.push({ id: el.id, label });
    });
      setSections((prev) =>
        prev.length === found.length && prev.every((x, i) => x.id === found[i].id) ? prev : found);
      setActive((a) => a ?? found[0]?.id ?? null);

      obs?.disconnect();
      obs = new IntersectionObserver(
        (entries) => {
          const visible = entries
            .filter((e) => e.isIntersecting)
            .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
          if (visible[0]) setActive(visible[0].target.id);
        },
        // a band across the upper-middle of the viewport: the section a reader is
        // actually looking at, not whatever happens to touch the top edge
        { rootMargin: "-96px 0px -55% 0px", threshold: 0 },
      );
      found.forEach((sec) => {
        const el = document.getElementById(sec.id);
        if (el) obs!.observe(el);
      });
    };

    scan();
    let t: ReturnType<typeof setTimeout> | null = null;
    const mo = new MutationObserver(() => {
      if (t) clearTimeout(t);
      t = setTimeout(scan, 150);
    });
    mo.observe(root, { childList: true, subtree: true });

    return () => {
      mo.disconnect();
      obs?.disconnect();
      if (t) clearTimeout(t);
    };
  }, [rootId]);

  return { sections, active };
}

export default function SectionNav({
  sections, active, label = "On this page",
}: { sections: NavSection[]; active: string | null; label?: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!sections.length) return null;

  const go = (id: string) => {
    setOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    track("section_nav_used", { id });
  };

  const activeLabel = sections.find((s) => s.id === active)?.label ?? label;

  return (
    <>
      {/* ---- narrow: sticky bar + sheet ---- */}
      <div className="lg:hidden sticky top-[56px] z-30 -mx-4 sm:-mx-6 px-4 sm:px-6 py-2 bg-background/95 backdrop-blur border-b border-edge">
        <button type="button" onClick={() => setOpen((v) => !v)}
          aria-expanded={open} aria-controls="section-nav-sheet"
          className="flex items-center gap-2 w-full text-left text-[15px] text-foreground/85 py-1">
          <span className="text-muted text-[13px] uppercase tracking-wide shrink-0">{label}</span>
          <span className="font-display font-semibold truncate">{activeLabel}</span>
          <span className={`ml-auto shrink-0 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true">▾</span>
        </button>
        {open && (
          <ul id="section-nav-sheet"
            className="list-none p-0 m-0 mt-2 mb-1 max-h-[60vh] overflow-y-auto scroll-thin border-t border-edge">
            {sections.map((s) => (
              <li key={s.id}>
                <button type="button" onClick={() => go(s.id)}
                  aria-current={active === s.id ? "true" : undefined}
                  className={`block w-full text-left py-2.5 text-[16px] border-b border-edge/50 ${
                    active === s.id ? "text-foreground font-semibold" : "text-foreground/70"
                  }`}>
                  {s.label}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ---- wide: sticky rail ---- */}
      <nav aria-label={label}
        className="hidden lg:block float-right w-[236px] ml-10 mb-8 sticky top-[96px]">
        <p className="text-muted text-[12px] uppercase tracking-wide mb-2">{label}</p>
        <ul className="list-none p-0 m-0 border-l border-edge">
          {sections.map((s) => (
            <li key={s.id}>
              <button type="button" onClick={() => go(s.id)}
                aria-current={active === s.id ? "true" : undefined}
                className={`block w-full text-left pl-3 py-1.5 text-[14px] leading-snug border-l-2 -ml-px transition-colors ${
                  active === s.id
                    ? "border-foreground text-foreground font-semibold"
                    : "border-transparent text-muted hover:text-foreground"
                }`}>
                {s.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
