"use client";

import { useEffect, useState } from "react";
import { track } from "@/lib/analytics";
import { ChevronDown } from "lucide-react";

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

/** count / disabled: index mode only. The journal keeps every month listed while
 *  filtered, with the number of matching entries, and greys out months with none
 *  (Sean, 30 Sep 2026: "keep the sidebar on the screen all the time"). */
export type NavSection = {
  id: string; label: string; count?: number; disabled?: boolean;
  /** A heading inside the list, not a link (a concept's series, when it is in several). */
  group?: boolean;
  /** Marked as current even when `active` names another entry (the same concept listed under two series). */
  current?: boolean;
};

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
  sections, active, label, mode = "outline", onPick, phoneHandledElsewhere = false, large = false,
}: {
  /** Larger type for a rail that is the page's main index (the Glossary; Sean,
   *  1 Oct 2026: "increase the font size by 15 to 20%"). 14px → 16.5px. */
  large?: boolean;
  sections: NavSection[];
  active: string | null;
  label?: string;
  mode?: NavMode;
  /** index mode only: picking an entry replaces the content. */
  onPick?: (id: string) => void;
  /** Phones get this list from another control (the Journal's MobileBar), so the
   *  collapsible shows only from 640px to 1024px. */
  phoneHandledElsewhere?: boolean;
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
    if (sections.find((x) => x.id === id)?.disabled) return;
    setOpen(false);
    if (mode === "index") {
      onPick?.(id);
      window.scrollTo({ top: 0 });
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    track("side_nav_used", { id, mode });
  };

  // Both modes name where the reader is (the current month, or section); the
  // small label before it names the list.
  const triggerLabel = sections.find((s) => s.id === active || s.current)?.label ?? heading;

  return (
    <>
      {/* ---- narrow (< 1024px): a collapsible, like an accordion ----
          Sean, 30 Sep 2026: no rule line across the page, a clear sign it opens,
          and the same height as the Sort and Filter buttons below it. A button
          with a turning chevron that expands the list in place; the list keeps
          the counts and greyed-out entries of the wide rail. */}
      <div className={`${phoneHandledElsewhere ? "hidden sm:block" : ""} lg:hidden sticky top-[72px] z-30 -mx-4 sm:-mx-6 px-4 sm:px-6 pt-2 pb-2 mb-4 bg-background`}>
        <button type="button" onClick={() => setOpen((v) => !v)}
          aria-expanded={open} aria-controls="section-nav-sheet"
          className="flex items-center gap-3 w-full h-10 px-3 border border-edge text-left hover:border-foreground transition-colors">
          <span className="text-muted text-[12px] uppercase tracking-wide shrink-0">{heading}</span>
          <span className="font-display font-semibold text-[15px] text-foreground truncate">{triggerLabel}</span>
          <ChevronDown size={18} aria-hidden="true"
            className={`ml-auto shrink-0 text-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        </button>
        {open && (
          <ul id="section-nav-sheet"
            className="list-none p-0 m-0 mt-2 max-h-[55vh] overflow-y-auto scroll-thin border border-edge bg-background">
            {sections.map((s) => s.group ? (
              <li key={s.id} className="px-3 pt-3 pb-1 text-[12px] uppercase tracking-wide text-muted border-b border-edge/50">{s.label}</li>
            ) : (
              <li key={s.id}>
                <button type="button" onClick={() => go(s.id)} disabled={s.disabled}
                  aria-current={active === s.id || s.current ? "true" : undefined}
                  className={`flex w-full items-baseline gap-2 text-left px-3 py-2.5 text-[16px] border-b border-edge/50 last:border-b-0 ${
                    s.disabled ? "text-muted/50 cursor-default"
                      : active === s.id || s.current ? "text-foreground font-semibold bg-panel" : "text-foreground/75 hover:bg-panel"
                  }`}>
                  <span>{s.label}</span>
                  {s.count !== undefined && <span className="ml-auto text-[13px] tabular-nums">{s.count}</span>}
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
        <p className={`text-muted ${large ? "text-[14px]" : "text-[12px]"} uppercase tracking-wide mb-2`}>{heading}</p>
        <ul className="list-none p-0 m-0 border-l border-edge">
          {sections.map((s) => s.group ? (
            <li key={s.id} className={`pl-3 pt-4 first:pt-1 pb-1 text-muted uppercase tracking-wide ${large ? "text-[13px]" : "text-[11px]"}`}>{s.label}</li>
          ) : (
            <li key={s.id}>
              <button type="button" onClick={() => go(s.id)} disabled={s.disabled}
                aria-current={active === s.id || s.current ? "true" : undefined}
                className={`flex w-full items-baseline gap-2 text-left pl-3 ${large ? "py-2 text-[16.5px]" : "py-1.5 text-[14px]"} leading-snug border-l-2 -ml-px transition-colors ${
                  s.disabled
                    ? "border-transparent text-muted/40 cursor-default"
                    : active === s.id || s.current
                    ? "border-foreground text-foreground font-semibold"
                    : "border-transparent text-muted hover:text-foreground"
                }`}>
                <span>{s.label}</span>
                {s.count !== undefined && <span className="ml-auto text-[12px] tabular-nums font-normal">{s.count}</span>}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
