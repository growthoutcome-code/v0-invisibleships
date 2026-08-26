"use client";

import { track } from "@/lib/analytics";
import {
  CONCEPTS,
  BASIS_LABEL,
  ORIGIN_LABEL,
  type Basis,
  type Origin,
} from "@/lib/concepts";

export type Filters = { origin: Origin | "all"; basis: Basis | "all" };

const ORIGINS: (Origin | "all")[] = ["all", "ai", "author"];
const BASES: (Basis | "all")[] = ["all", "documented", "structural", "pattern"];

function chipClass(active: boolean) {
  return [
    "text-[13px] uppercase tracking-[0.08em] font-semibold px-3 py-1.5 transition-colors",
    active
      ? "bg-foreground text-background"
      : "text-muted hover:text-foreground",
  ].join(" ");
}

/**
 * Filter bar for the Concepts page.
 *
 * Filtering by origin and basis turns the labelling scheme from a disclosure into
 * something the reader can act on: a skeptical reader can read only Documented
 * claims, which quietly demonstrates that the sourced material stands without the
 * subjective material.
 *
 * The jump index that used to live here is gone: /concepts now uses the site's
 * one SideNav (outline mode), the same rail Crime and Journal use. This is only
 * a filter bar, and it is sticky on wide screens ONLY — on narrow screens
 * SideNav has its own sticky trigger at top-[56px] and two stickies collide.
 */
export default function ConceptsNav({
  filters,
  setFilters,
  shown,
}: {
  filters: Filters;
  setFilters: (f: Filters) => void;
  shown: number;
}) {
  const set = (patch: Partial<Filters>) => {
    const next = { ...filters, ...patch };
    setFilters(next);
    track("concepts_filtered", next);
  };

  return (
    <nav
      aria-label="Concept filters"
      className="lg:sticky lg:top-[100px] z-20 bg-background/95 backdrop-blur py-3 mb-10"
    >
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className="flex flex-wrap items-center gap-1">
          <span className="text-[13px] uppercase tracking-[0.08em] text-muted mr-2">Who</span>
          {ORIGINS.map((o) => (
            <button
              key={o}
              onClick={() => set({ origin: o })}
              aria-pressed={filters.origin === o}
              className={chipClass(filters.origin === o)}
            >
              {o === "all" ? "All" : ORIGIN_LABEL[o]}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-1">
          <span className="text-[13px] uppercase tracking-[0.08em] text-muted mr-2">Rests on</span>
          {BASES.map((b) => (
            <button
              key={b}
              onClick={() => set({ basis: b })}
              aria-pressed={filters.basis === b}
              className={chipClass(filters.basis === b)}
            >
              {b === "all" ? "All" : BASIS_LABEL[b]}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-4">
          <span className="text-[13px] uppercase tracking-[0.08em] text-muted tabular-nums">
            Showing {shown} of {CONCEPTS.length}
          </span>
        </div>
      </div>

    </nav>
  );
}
