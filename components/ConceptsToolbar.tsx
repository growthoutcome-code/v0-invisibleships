"use client";

import { useState } from "react";
import { track } from "@/lib/analytics";
import { SortSelect, FilterButton, FilterPanel, type Pill } from "@/components/ListControls";
import {
  CONCEPTS, NO_FILTERS, CONCEPT_SORTS, filterConcepts, type ConceptSort,
  ORIGIN_LABEL, BASIS_LABEL, THEME_LABEL, AUDIENCE_LABEL,
  type Filters, type Origin, type Basis, type Theme, type Audience,
} from "@/lib/concepts";
import { THEMES } from "@/lib/themes";
import { type FilterGroup } from "@/components/FilterGroups";

/**
 * The concept list's controls (Sean, 2026-08-26; reshaped 30 Sep 2026).
 *
 * Beside the "Concepts" title: Sort and Filter, as on the Journal. Search and
 * the five filter groups are inside the panel (components/ListControls.tsx has
 * the reasoning and the reversal of 26 Aug). What is on reads back as one line
 * above the tiles, rendered by ConceptsView from conceptPills().
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

const MATCHABLE = new Set(["audience", "topic"]);

/** One removable pill per chosen value. */
export function conceptPills(filters: Filters, setFilters: (f: Filters) => void): Pill[] {
  return GROUPS.flatMap((g) => (filters[g.key] as string[]).map((v) => ({
    key: `${g.key}:${v}`,
    label: LABEL_OF[g.key][v],
    clear: () => setFilters({ ...filters, [g.key]: (filters[g.key] as string[]).filter((x) => x !== v) } as Filters),
  })));
}

export default function ConceptsControls({
  filters, setFilters, sort, setSort,
}: {
  filters: Filters;
  setFilters: (f: Filters) => void;
  sort: ConceptSort;
  setSort: (s: ConceptSort) => void;
}) {
  const [open, setOpen] = useState(false);

  const set = (patch: Partial<Filters>) => {
    const next = { ...filters, ...patch };
    setFilters(next);
    track("concepts_filtered", { ...next, q: next.q ? "set" : "" });
  };

  const count = GROUPS.reduce((n, g) => n + (filters[g.key] as string[]).length, 0) + (filters.q.trim() ? 1 : 0);
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
    <>
      <SortSelect label="Sort concepts" value={sort} options={CONCEPT_SORTS}
        onChange={(v) => { setSort(v); track("concepts_sorted", { sort: v }); }} />
      <FilterButton count={count} open={open} onOpen={() => { setOpen(true); track("concepts_filter_opened"); }} />
      <FilterPanel open={open} setOpen={setOpen} title="Search & filter concepts"
        q={filters.q} setQ={(v) => set({ q: v })}
        placeholder={`Search ${CONCEPTS.length} concepts — title, argument, evidence`} searchLabel="Search concepts"
        groups={groups} shown={filterConcepts(filters).length} onClearAll={() => setFilters(NO_FILTERS)} />
    </>
  );
}
