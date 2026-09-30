"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import FilterGroups, { type FilterGroup } from "@/components/FilterGroups";

/**
 * The list controls shared by the Journal and Concepts (Sean, 30 Sep 2026).
 *
 * Beside the page title: a Sort menu and a Filter button, nothing else. Search,
 * every filter group and "Clear all" live in the Filter panel, which is wider
 * than before so the search box and chips have room.
 *
 * This reverses 26 Aug, when search was kept always visible as the fast path.
 * What makes it safe to hide is ActiveLine: whenever a search or filter is on,
 * one line above the list names it, with each part removable. A reader who
 * closed the panel, or arrived on a filtered link, always sees why the list is
 * shorter. With nothing on, the line is not rendered and the page stays quiet.
 * Decision record: project/decisions/0005-search-inside-the-filter-panel.md.
 */

export type Pill = { key: string; label: string; clear: () => void };

export function SortSelect<T extends string>({ value, options, onChange, label }: {
  value: T; options: { v: T; l: string }[]; onChange: (v: T) => void; label: string;
}) {
  return (
    <Select value={value} onValueChange={(v: string) => onChange(v as T)}>
      <SelectTrigger className="w-[150px] sm:w-[168px] h-10 text-sm" aria-label={label}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => <SelectItem key={o.v} value={o.v}>{o.l}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

export function FilterButton({ count, open, onOpen }: { count: number; open: boolean; onOpen: () => void }) {
  return (
    <button type="button" onClick={onOpen} aria-expanded={open}
      className="inline-flex items-center gap-2 px-4 h-10 border border-edge text-[15px] text-foreground hover:border-foreground transition-colors">
      <SlidersHorizontal size={16} aria-hidden />
      Filter
      {count > 0 && <span className="ml-1 px-1.5 text-[13px] font-semibold bg-foreground text-background tabular-nums">{count}</span>}
    </button>
  );
}

export function FilterPanel({ open, setOpen, title, q, setQ, placeholder, searchLabel, groups, shown, searching, onClearAll }: {
  open: boolean; setOpen: (o: boolean) => void; title: string;
  q: string; setQ: (v: string) => void; placeholder: string; searchLabel: string;
  groups: FilterGroup[]; shown: number; searching?: boolean; onClearAll: () => void;
}) {
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="right" className="w-full sm:max-w-[30rem] p-0 flex flex-col">
        <SheetHeader className="px-6 pt-6 pb-4">
          <SheetTitle className="text-[20px]">{title}</SheetTitle>
        </SheetHeader>
        {/* pt-1: room for the search box's border and focus ring, which the
            scroll container clipped at its top edge (Sean, 30 Sep 2026). */}
        <div className="flex-1 overflow-y-auto px-6 pt-1 pb-6">
          <div className="relative mb-8">
            <Search size={16} aria-hidden className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <Input type="search" value={q} onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); setOpen(false); } }}
              placeholder={placeholder} aria-label={searchLabel} className="pl-9" />
          </div>
          <FilterGroups groups={groups} />
        </div>
        {/* Pinned, so the result count is in view while choosing. */}
        <div className="flex items-center gap-3 px-6 py-4 border-t border-edge bg-background">
          <button type="button" onClick={() => setOpen(false)}
            className="px-4 h-10 bg-foreground text-background text-[15px] font-semibold tabular-nums">
            {searching ? "Searching…" : `Show ${shown}`}
          </button>
          <button type="button" onClick={onClearAll} className="text-[14px] text-muted hover:text-foreground">Clear all</button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/** Only rendered while a search or filter is on. */
export function ActiveLine({ shown, of, noun, q, clearQ, pills, onClearAll, searching }: {
  shown: number; of: number; noun: string; q: string; clearQ: () => void;
  pills: Pill[]; onClearAll: () => void; searching?: boolean;
}) {
  if (!q.trim() && !pills.length) return null;
  const chip = "inline-flex items-center gap-1.5 px-2.5 py-1 text-[13px] border border-edge text-foreground hover:border-foreground";
  return (
    <div className="flex flex-wrap items-center gap-2 mb-8">
      <span className="text-[15px] text-muted tabular-nums whitespace-nowrap mr-1" aria-live="polite">
        {searching ? "Searching…" : `${shown} of ${of} ${noun}`}
      </span>
      {q.trim() && (
        <button type="button" onClick={clearQ} className={chip}>
          &ldquo;{q.trim()}&rdquo; <X size={13} aria-hidden /><span className="sr-only">Clear search</span>
        </button>
      )}
      {pills.map((p) => (
        <button key={p.key} type="button" onClick={p.clear} className={chip}>
          {p.label} <X size={13} aria-hidden /><span className="sr-only">Remove filter</span>
        </button>
      ))}
      <button type="button" onClick={onClearAll}
        className="text-[13px] uppercase tracking-[0.08em] font-semibold text-muted hover:text-foreground ml-1">
        Clear all
      </button>
    </div>
  );
}
