"use client";

import { Input } from "@/components/ui/input";

/**
 * The chip groups inside the Journal and Concepts filter panels — one component
 * so the two panels look and behave the same (Sean, 30 Sep 2026: multiple topics).
 *
 * Every group is multi-select. "All" (on when nothing is chosen) clears the group.
 * Groups whose items can carry several values at once (topics, organizations,
 * glossary terms, statement types, audiences) are `matchable`: once two or more
 * values are chosen, an Any / All switch decides whether an item needs one of
 * them or every one of them. Groups where an item has one value (entry type,
 * part, basis) always mean "any of these".
 */
export type FilterGroup = {
  key: string;
  label: string;
  hint?: string;
  options: { v: string; l: string }[];
  values: string[];
  toggle: (v: string) => void;
  clear: () => void;
  matchable?: boolean;
  match?: "any" | "all";
  setMatch?: (m: "any" | "all") => void;
  /** A From–To date range instead of chips. */
  dates?: { from: string; to: string; setFrom: (v: string) => void; setTo: (v: string) => void; min: string; max: string };
};

export default function FilterGroups({ groups }: { groups: FilterGroup[] }) {
  const chip = (on: boolean) => `px-2.5 py-1.5 text-[14px] border transition-colors ${
    on ? "bg-foreground text-background border-foreground"
       : "border-edge text-muted hover:text-foreground hover:border-foreground"}`;
  return (
    <div className="space-y-7">
      {groups.map((g) => (
        <fieldset key={g.key} className="border-0 p-0 m-0">
          <div className="flex items-center justify-between gap-3 mb-1">
            <legend className="text-[13px] uppercase tracking-[0.08em] font-semibold text-foreground p-0">{g.label}</legend>
            {g.matchable && g.values.length > 1 && g.setMatch && (
              <div role="group" aria-label={`Match ${g.label}`} className="inline-flex border border-edge text-[12px]">
                {(["any", "all"] as const).map((m) => (
                  <button key={m} type="button" onClick={() => g.setMatch!(m)} aria-pressed={g.match === m}
                    title={m === "any" ? "Items with at least one of these" : "Items with every one of these"}
                    className={`px-2 py-0.5 ${g.match === m ? "bg-foreground text-background" : "text-muted hover:text-foreground"}`}>
                    {m === "any" ? "Any" : "All"}
                  </button>
                ))}
              </div>
            )}
          </div>
          {g.hint && <p className="text-[14px] text-muted m-0 mb-3">{g.hint}</p>}
          {g.dates ? (
            <div className="grid grid-cols-2 gap-2 mt-2">
              <label className="text-[13px] text-muted">From
                <Input type="date" value={g.dates.from} min={g.dates.min} max={g.dates.to || g.dates.max}
                  onChange={(e) => g.dates!.setFrom(e.target.value)} className="mt-1" aria-label="From date" />
              </label>
              <label className="text-[13px] text-muted">To
                <Input type="date" value={g.dates.to} min={g.dates.from || g.dates.min} max={g.dates.max}
                  onChange={(e) => g.dates!.setTo(e.target.value)} className="mt-1" aria-label="To date" />
              </label>
            </div>
          ) : (
            <div className={`flex flex-wrap gap-1.5 ${g.hint ? "" : "mt-2"}`}>
              <button type="button" onClick={g.clear} aria-pressed={g.values.length === 0} className={chip(g.values.length === 0)}>All</button>
              {g.options.map((o) => {
                const on = g.values.includes(o.v);
                return (
                  <button key={o.v} type="button" onClick={() => g.toggle(o.v)} aria-pressed={on} className={chip(on)}>
                    {o.l}
                  </button>
                );
              })}
            </div>
          )}
        </fieldset>
      ))}
    </div>
  );
}

/** Does an item with `have` pass a group with `want` chosen? */
export function passes(have: string[], want: string[], match: "any" | "all" = "any") {
  if (!want.length) return true;
  return match === "all" ? want.every((v) => have.includes(v)) : want.some((v) => have.includes(v));
}
