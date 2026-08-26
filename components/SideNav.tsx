"use client";

import { useEffect, useState } from "react";
import { track } from "@/lib/analytics";

/**
 * The site's ONE side navigation (Sean, 2026-08-21).
 *
 * Glossary, Journal and Data/Crime each had their own; this replaces all three.
 * Two modes, because they are genuinely different navigations and pretending
 * otherwise would break one of them:
 *
 *   "index"    picking an entry REPLACES the content — glossary terms, journal
 *              days. Active item is whatever is open.
 *   "outline"  entries are anchors WITHIN one long page — the Crime section.
 *              Active item is whatever the reader is looking at, tracked with
 *              IntersectionObserver rather than scroll maths so it survives the
 *              charts' variable heights.
 *
 * Shared in both: left side, 13rem, inside the page grid (never floated — a
 * float is ignored by block-level siblings, which is what made the Crime rail
 * overlap its own content); and on narrow screens the site's Sheet, opened from
 * a labelled trigger. Outline mode puts the CURRENT SECTION in that trigger,
 * which a plain Sheet label cannot show and is the one thing worth keeping from
 * the sticky-bar version this replaces.
 *
 * Outline sections are discovered from the DOM and rescanned as async content
 * mounts, so adding a section to a page adds it to the nav with no second edit.
 */

export type NavSection = { id: string; label: string };

export function useSectionNav(
  rootId: string,
  opts?: { selector?: string; heading?: string },
) {
  const selector = opts?.selector ?? "section";
  const headingSel = opts?.heading ?? "h2";
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
    const seen = new Set<string>();
    // A selector like "section, h2" matches a wrapper AND the heading inside
    // it, which would list every hero section twice. querySelectorAll returns
    // document order, so the wrapper is seen first and wins.
    const claimed = new Set<Element>();
    root.querySelectorAll<HTMLElement>(selector).forEach((el, i) => {
      // The selector may BE the heading. The Government Cloud report is
      // generated HTML whose <h2>s are bare siblings inside a tab div, with no
      // wrapper element to match on.
      const h = el.matches(headingSel) ? el : el.querySelector(headingSel);
      const label = h?.textContent?.trim();
      if (!h || !label) return;                 // sections without a heading are layout, not content
      // Skip anything not currently rendered. That report keeps five of its six
      // tab panels in `display:none` and swaps them, so listing every heading
      // would offer the reader jumps that land on nothing.
      if (!el.offsetParent && el.offsetHeight === 0) return;
      if (claimed.has(h)) return;
      claimed.add(h);
      // An id the PAGE set itself always wins. Concepts carry stable ids that
      // other pages deep-link to (/concepts#us-rose-against-the-trend, four of
      // them in HealthSignals); deriving a fresh one from the label here would
      // silently break every inbound link.
      let id = el.id;
      if (!id) {
        // Deterministic from the LABEL, never the index: React recreates these
        // elements on re-render, dropping an imperatively-set id, and an
        // index-derived id would then change — leaving `active` pointing at an
        // id that no longer exists and no entry marked current.
        const slug = `sec-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 44)}`;
        id = seen.has(slug) ? `${slug}-${i}` : slug;
        el.id = id;
      }
      seen.add(id);
      el.style.scrollMarginTop = "96px";        // clear the sticky header on jump
      found.push({ id, label });
    });
      setSections((prev) =>
        prev.length === found.length && prev.every((x, i) => x.id === found[i].id) ? prev : found);
      // drop a stale active id rather than leaving nothing marked current
      setActive((a) => (a && found.some((f) => f.id === a) ? a : found[0]?.id ?? null));

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
    // attributes too: the Government Cloud report switches panels by toggling a
    // `hidden` class, which childList/subtree alone never sees, so the outline
    // would keep describing the panel the reader just left.
    mo.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });

    return () => {
      mo.disconnect();
      obs?.disconnect();
      if (t) clearTimeout(t);
    };
  }, [rootId, selector, headingSel]);

  return { sections, active };
}

export type NavMode = "index" | "outline";

export default function SideNav({
  sections, active, label, mode = "outline", onPick,
}: {
  sections: NavSection[];
  active: string | null;
  label?: string;
  mode?: NavMode;
  /** index mode only: picking an entry replaces the content. */
  onPick?: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const heading = label ?? (mode === "outline" ? "On this page" : "Index");

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!sections.length) return null;

  const go = (id: string) => {
    setOpen(false);
    if (mode === "index") {
      onPick?.(id);
      window.scrollTo({ top: 0 });
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    track("side_nav_used", { id, mode });
  };

  // Outline mode names where the reader is; index mode names the list.
  const triggerLabel = mode === "outline"
    ? (sections.find((s) => s.id === active)?.label ?? heading)
    : heading;

  return (
    <>
      {/* ---- narrow: sticky bar + sheet ---- */}
      <div className="lg:hidden sticky top-[56px] z-30 -mx-4 sm:-mx-6 px-4 sm:px-6 py-2 bg-background/95 backdrop-blur border-b border-edge">
        <button type="button" onClick={() => setOpen((v) => !v)}
          aria-expanded={open} aria-controls="section-nav-sheet"
          className="flex items-center gap-2 w-full text-left text-[15px] text-foreground/85 py-1">
          <span className="text-muted text-[13px] uppercase tracking-wide shrink-0">{heading}</span>
          <span className="font-display font-semibold truncate">{triggerLabel}</span>
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
      {/* Wide: a grid column, NOT a float. The parent page supplies the grid. */}
      <nav aria-label={heading}
        className="hidden lg:block self-start sticky top-[96px] max-h-[calc(100vh-8rem)] overflow-y-auto scroll-thin pr-2">
        <p className="text-muted text-[12px] uppercase tracking-wide mb-2">{heading}</p>
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
