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
import { THEMES } from "@/lib/themes";
import FilterGroups, { type FilterGroup } from "@/components/FilterGroups";

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

// Topic = the journal's themes (lib/themes.ts), offered where at least one
// concept carries it, so a subject can be followed from the journal to here.
const TOPIC_OPTIONS = Object.keys(THEMES)
  .filter((t) => CONCEPTS.some((c) => c.topics.includes(t)))
  .sort((a, b) => CONCEPTS.filter((c) => c.topics.includes(b)).length - CONCEPTS.filter((c) => c.topics.includes(a)).length)
  .map((v) => ({ v, l: THEMES[v] }));

const GROUPS: {
  key: "origin" | "basis" | "theme" | "audience" | "topic";
  label: string;
  hint: string;
  options: { v: string; l: string }[];
}[] = [
  {
    key: "topic", label: "Topic", hint: "The journal's themes — the same filter there shows the entries.",
    options: TOPIC_OPTIONS,
  },
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
  origin: ORIGIN_LABEL, basis: BASIS_LABEL, theme: THEME_LABEL, audience: AUDIENCE_LABEL, topic: THEMES,
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

  // One pill per chosen value; groups are multi-select (Sean, 30 Sep 2026).
  const active = GROUPS.flatMap((g) => (filters[g.key] as string[]).map((v) => ({ key: g.key, value: v })));
  const count = active.length + (filters.q ? 1 : 0);
  const MATCHABLE = new Set(["audience", "topic"]);
  const groups: FilterGroup[] = GROUPS.map((g) => {
    const values = filters[g.key] as string[];
    const m = MATCHABLE.has(g.key) ? (g.key as "audience" | "topic") : null;
    return {
      key: g.key, label: g.label, hint: g.hint, options: g.options, values,
      toggle: (v: string) => set({ [g.key]: values.includes(v) ? values.filter((x) => x !== v) : [...values, v] } as Partial<Filters>),
      clear: () => set({ [g.key]: [] } as Partial<Filters>),
      matchable: !!m,
      match: m ? filters.match[m] : undefined,
      setMatch: m ? (mm: "any" | "all") => set({ match: { ...filters.match, [m]: mm } }) : undefined,
    };
  });

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
            <button key={`${a.key}:${a.value}`} type="button" onClick={() => set({ [a.key]: (filters[a.key] as string[]).filter((x) => x !== a.value) } as Partial<Filters>)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[13px] border border-edge text-foreground hover:border-foreground">
              {LABEL_OF[a.key][a.value]} <X size={13} aria-hidden />
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
        <SheetContent side="right" className="w-full max-w-sm p-5 overflow-y-auto">
          <SheetHeader className="mb-5">
            <SheetTitle className="text-[20px]">Filter concepts</SheetTitle>
          </SheetHeader>

          <FilterGroups groups={groups} />

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
