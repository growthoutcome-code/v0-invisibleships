"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
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
 * Sticky sub-navigation for the Concepts page.
 *
 * Filtering by origin and basis turns the labelling scheme from a disclosure into
 * something the reader can act on: a skeptical reader can read only Documented
 * claims, which quietly demonstrates that the sourced material stands without the
 * subjective material.
 *
 * The jump index is collapsed by default — with eleven long entries an always-open
 * list would push the first concept below the fold.
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
  const [openIndex, setOpenIndex] = useState(false);

  const set = (patch: Partial<Filters>) => {
    const next = { ...filters, ...patch };
    setFilters(next);
    track("concepts_filtered", next);
  };

  return (
    <nav
      aria-label="Concept filters and index"
      className="sticky top-[72px] md:top-[88px] lg:top-[100px] z-20 bg-background/95 backdrop-blur py-3 mb-10"
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
          <button
            onClick={() => setOpenIndex((v) => !v)}
            aria-expanded={openIndex}
            className="text-[13px] uppercase tracking-[0.08em] font-semibold text-foreground inline-flex items-center gap-1.5"
          >
            Index
            <ChevronDown size={15} className={openIndex ? "rotate-180 transition-transform" : "transition-transform"} />
          </button>
        </div>
      </div>

      {openIndex && (
        <ol className="list-none p-0 mt-4 mb-1 grid gap-x-10 gap-y-1 md:grid-cols-2">
          {CONCEPTS.map((c, i) => (
            <li key={c.id} className="flex items-baseline gap-3 py-1">
              <span className="text-[13px] text-muted tabular-nums">{String(i + 1).padStart(2, "0")}</span>
              <a
                href={`#${c.id}`}
                onClick={() => { setOpenIndex(false); track("concept_jumped", { concept: c.id }); }}
                className="text-[16px] text-foreground hover:text-accent underline underline-offset-4 decoration-transparent hover:decoration-current"
              >
                {c.title}
              </a>
            </li>
          ))}
        </ol>
      )}
    </nav>
  );
}
