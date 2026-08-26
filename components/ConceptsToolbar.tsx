"use client";

import { useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { track } from "@/lib/analytics";
import {
  CONCEPTS, NO_FILTERS,
  ORIGIN_LABEL, BASIS_LABEL, THEME_LABEL, AUDIENCE_LABEL,
  type Filters, type Origin, type Basis, type Theme, type Audience,
} from "@/lib/concepts";

/**
 * The concept list's controls (Sean, 2026-08-26). Replaces ConceptsNav.
 *
 * What was wrong: three axes rendered as sixteen chips in a bar that was
 * sticky, so a wall of controls followed the reader down the page and sat
 * between the summary and the list.
 *
 * Two jobs, deliberately split, because they are not the same thing:
 *
 *   SEARCH  free text over title, body, evidence and questions. Always
 *           visible, one input. The fast path when you know what you want.
 *   FILTER  the four axes. Behind a panel, because sixteen chips is not a
 *           toolbar. The path when you do not know what you want.
 *
 * Not sticky, ever. It sits once, under the section heading, above the list it
 * controls. Active filters read back as removable pills so the panel never has
 * to be reopened to see what is on. The Sheet matches the Journal's existing
 * "Search & filter" panel — one idiom on the site, not two.
 */

const GROUPS: {
  key: "origin" | "basis" | "theme" | "audience";
  label: string;
  hint: string;
  options: { v: string; l: string }[];
}[] = [
  {
    key: "theme", label: "What it is about", hint: "Subject. Carries no evidential weight.",
    options: (["record","procurement","surveillance","neurotech","coercion","health","experience"] as Theme[])
      .map((v) => ({ v, l: THEME_LABEL[v] })),
  },
  {
    key: "basis", label: "What it rests on", hint: "Reject every testimony entry and every documented one still stands.",
    options: (["documented","structural","testimony","pattern"] as Basis[])
      .map((v) => ({ v, l: BASIS_LABEL[v] })),
  },
  {
    key: "origin", label: "Who formed it", hint: "AI analysis, or the author's own observation.",
    options: (["ai","author"] as Origin[]).map((v) => ({ v, l: ORIGIN_LABEL[v] })),
  },
  {
    key: "audience", label: "Who it is for", hint: "A concept can serve more than one reader.",
    options: (["household","investigators","policy","clinicians","press"] as Audience[])
      .map((v) => ({ v, l: AUDIENCE_LABEL[v] })),
  },
];

const LABEL_OF: Record<string, Record<string, string>> = {
  origin: ORIGIN_LABEL, basis: BASIS_LABEL, theme: THEME_LABEL, audience: AUDIENCE_LABEL,
};

export default function ConceptsToolbar({
  filters, setFilters, shown,
}: {
  filters: Filters;
  setFilters: (f: Filters) => void;
  shown: number;
}) {
  const [open, setOpen] = useState(false);

  const set = (patch: Partial<Filters>) => {
    const next = { ...filters, ...patch };
    setFilters(next);
    track("concepts_filtered", { ...next, q: next.q ? "set" : "" });
  };

  const active = GROUPS
    .map((g) => ({ key: g.key, value: filters[g.key] }))
    .filter((a) => a.value !== "all");
  const count = active.length + (filters.q ? 1 : 0);

  return (
    <div className="mb-10">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[15rem]">
          <Search size={16} aria-hidden className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <Input
            type="search"
            value={filters.q}
            onChange={(e) => set({ q: e.target.value })}
            placeholder={`Search ${CONCEPTS.length} concepts — title, argument, evidence`}
            aria-label="Search concepts"
            className="pl-9"
          />
        </div>

        <button
          type="button"
          onClick={() => { setOpen(true); track("concepts_filter_opened"); }}
          aria-expanded={open}
          className="inline-flex items-center gap-2 px-4 h-10 border border-edge text-[15px] text-foreground hover:border-foreground transition-colors"
        >
          <SlidersHorizontal size={16} aria-hidden />
          Filter
          {count > 0 && (
            <span className="ml-1 px-1.5 text-[13px] font-semibold bg-foreground text-background tabular-nums">
              {count}
            </span>
          )}
        </button>

        <span className="text-[15px] text-muted tabular-nums whitespace-nowrap">
          {shown} of {CONCEPTS.length}
        </span>
      </div>

      {count > 0 && (
        <div className="flex flex-wrap items-center gap-2 mt-3">
          {filters.q && (
            <button type="button" onClick={() => set({ q: "" })}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[13px] border border-edge text-foreground hover:border-foreground">
              &ldquo;{filters.q}&rdquo; <X size={13} aria-hidden />
              <span className="sr-only">Clear search</span>
            </button>
          )}
          {active.map((a) => (
            <button key={a.key} type="button" onClick={() => set({ [a.key]: "all" } as Partial<Filters>)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[13px] border border-edge text-foreground hover:border-foreground">
              {LABEL_OF[a.key][a.value as string]} <X size={13} aria-hidden />
              <span className="sr-only">Remove filter</span>
            </button>
          ))}
          <button type="button" onClick={() => setFilters(NO_FILTERS)}
            className="text-[13px] uppercase tracking-[0.08em] font-semibold text-muted hover:text-foreground ml-1">
            Clear all
          </button>
        </div>
      )}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full max-w-sm p-5">
          <SheetHeader className="mb-5">
            <SheetTitle className="text-[20px]">Filter concepts</SheetTitle>
          </SheetHeader>

          <div className="space-y-7">
            {GROUPS.map((g) => (
              <fieldset key={g.key} className="border-0 p-0 m-0">
                <legend className="text-[13px] uppercase tracking-[0.08em] font-semibold text-foreground mb-1 p-0">
                  {g.label}
                </legend>
                <p className="text-[14px] text-muted m-0 mb-3">{g.hint}</p>
                <div className="flex flex-wrap gap-1.5">
                  {[{ v: "all", l: "All" }, ...g.options].map((o) => {
                    const on = filters[g.key] === o.v;
                    return (
                      <button key={o.v} type="button"
                        onClick={() => set({ [g.key]: o.v } as Partial<Filters>)}
                        aria-pressed={on}
                        className={`px-2.5 py-1.5 text-[14px] border transition-colors ${
                          on ? "bg-foreground text-background border-foreground"
                             : "border-edge text-muted hover:text-foreground hover:border-foreground"
                        }`}>
                        {o.l}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            ))}
          </div>

          <div className="flex items-center gap-3 mt-8 pt-5 border-t border-edge">
            <button type="button" onClick={() => setOpen(false)}
              className="px-4 h-10 bg-foreground text-background text-[15px] font-semibold">
              Show {shown}
            </button>
            <button type="button" onClick={() => setFilters(NO_FILTERS)}
              className="text-[14px] text-muted hover:text-foreground">
              Clear all
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
