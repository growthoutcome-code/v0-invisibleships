"use client";

import { useState } from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Search, Filter, X, ArrowUpDown, CalendarDays, type LucideIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import FilterGroups, { type FilterGroup } from "@/components/FilterGroups";

/**
 * The list controls shared by the Journal and Concepts (Sean, 30 Sep 2026).
 *
 * A Sort menu and a Filter button, on the bar right above the list (moved there
 * from beside the page title, 30 Sep 2026). Search, every filter group and
 * "Clear all" live in the Filter panel.
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
      <Filter size={16} aria-hidden />
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

/**
 * The bar directly above the list (Sean, 30 Sep 2026: the filter "should rest to
 * the right of where the tags show up ... in that same line above the content").
 * Left: what is on, as removable chips, only while a search or filter is on.
 * Right: Sort and Filter, always. On the Journal it sits in the content column,
 * beside the Months sidebar.
 */
export function ActiveLine({ shown, of, noun, q, clearQ, pills, onClearAll, searching, controls, countOnPhone = false }: {
  shown: number; of: number; noun: string; q: string; clearQ: () => void;
  pills: Pill[]; onClearAll: () => void; searching?: boolean;
  /** Sort + Filter, right-aligned on the same line (640px and up; phones use MobileBar) */
  controls?: React.ReactNode;
  /** Show the count on phones too. Off on the Journal, whose "1–10 of N" line says it. */
  countOnPhone?: boolean;
}) {
  const active = !!q.trim() || pills.length > 0;
  if (!active && !controls) return null;
  // On phones a chip is the same height as the buttons above it (h-10); from 640px up it is compact.
  const chip = "inline-flex items-center gap-1.5 h-10 px-3 sm:h-auto sm:px-2.5 sm:py-1 text-[13px] border border-edge text-foreground hover:border-foreground";
  return (
    // Phones (< 640px): the controls are in MobileBar above this line, so it holds
    // only the chips (and, on Concepts, the count). From 640px (tablets up): count
    // and chips left, labelled Sort and Filter right; many chips wrap and the
    // controls keep right. (Sean, 30 Sep 2026.)
    <div className={`flex flex-wrap items-center gap-x-4 gap-y-4 mb-8 ${!active && !countOnPhone ? "max-sm:hidden" : ""}`}>
      <div className="flex flex-wrap items-center gap-2 min-w-0 w-full sm:w-auto sm:flex-1">
        {/* The count always shows, so the bar is balanced: count left, controls
            right (Sean, 30 Sep 2026: "display in all on the left"). */}
        <span className={`text-[15px] text-muted tabular-nums whitespace-nowrap mr-1 ${countOnPhone ? "" : "hidden sm:inline"}`} aria-live="polite">
          {searching ? "Searching…" : active ? `${shown} of ${of} ${noun}` : `Showing all ${of} ${noun}`}
        </span>
        {active && (
          <>
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
          </>
        )}
      </div>
      {controls && (
        <div className="hidden sm:flex items-center gap-3 sm:ml-auto sm:justify-end shrink-0">
          {controls}
        </div>
      )}
    </div>
  );
}

/**
 * Phones only (< 640px). One bar of icon buttons across the full width, in equal
 * parts: Months (Journal only), Sort, Filter (Sean, 30 Sep 2026: "three icons
 * in a row ... that spans the width of the mobile device"). Each has a hidden
 * label for screen readers. Months opens the month list directly beneath the
 * bar. Pinned under the site header while scrolling. From 640px up the labelled
 * controls on the bar above the list take over (ActiveLine `controls`).
 */
export type MonthItem = { id: string; label: string; count?: number; disabled?: boolean };

export function MobileBar<T extends string>({
  months, sort, onFilter, filterOpen,
}: {
  /** The index list: Months on the Journal, Terms on the Glossary (icon + label override). */
  months?: { items: MonthItem[]; active: string | null; onPick: (id: string) => void; label?: string; icon?: LucideIcon };
  sort: { value: T; options: { v: T; l: string }[]; onChange: (v: T) => void; label: string };
  onFilter: () => void;
  filterOpen: boolean;
}) {
  const [open, setOpen] = useState(false);
  const idxLabel = months?.label || "Months";
  const IdxIcon = months?.icon || CalendarDays;
  const btn = "flex items-center justify-center h-10 w-full border border-edge text-foreground hover:border-foreground transition-colors";
  return (
    <div className="sm:hidden sticky top-[72px] z-30 -mx-4 px-4 pt-2 pb-2 mb-5 bg-background">
      <div className={`grid gap-2 ${months ? "grid-cols-3" : "grid-cols-2"}`}>
        {months && (
          <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open}
            aria-controls="mobile-months" aria-label={idxLabel} title={idxLabel}
            className={`${btn} ${open ? "border-foreground" : ""}`}>
            <IdxIcon size={18} aria-hidden />
          </button>
        )}
        <SelectPrimitive.Root value={sort.value} onValueChange={(v) => sort.onChange(v as T)}>
          <SelectPrimitive.Trigger aria-label={sort.label} title={sort.label} className={btn}>
            <ArrowUpDown size={18} aria-hidden />
          </SelectPrimitive.Trigger>
          <SelectContent>
            {sort.options.map((o) => <SelectItem key={o.v} value={o.v}>{o.l}</SelectItem>)}
          </SelectContent>
        </SelectPrimitive.Root>
        <button type="button" onClick={onFilter} aria-expanded={filterOpen} aria-label="Filter" title="Filter" className={btn}>
          <Filter size={18} aria-hidden />
        </button>
      </div>
      {months && open && (
        <ul id="mobile-months" aria-label={idxLabel}
          className="list-none p-0 m-0 mt-2 max-h-[55vh] overflow-y-auto scroll-thin border border-edge bg-background">
          {months.items.map((m) => (
            <li key={m.id}>
              <button type="button" disabled={m.disabled}
                onClick={() => { if (m.disabled) return; setOpen(false); months.onPick(m.id); window.scrollTo({ top: 0 }); }}
                aria-current={months.active === m.id ? "true" : undefined}
                className={`flex w-full items-baseline gap-2 text-left px-3 py-2.5 text-[16px] border-b border-edge/50 last:border-b-0 ${
                  m.disabled ? "text-muted/50 cursor-default"
                    : months.active === m.id ? "text-foreground font-semibold bg-panel" : "text-foreground/75 hover:bg-panel"
                }`}>
                <span>{m.label}</span>
                {m.count !== undefined && <span className="ml-auto text-[13px] tabular-nums">{m.count}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
