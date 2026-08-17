"use client";

import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

export type SortDir = "newest" | "oldest";

/**
 * Right-aligned actions row that sits beside a page title (see TitleBand).
 * Kept generic so later actions (filter, export, view toggle) drop in beside
 * the sort menu without touching TitleBand again.
 */
export default function PageActions({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center gap-3 pb-1">{children}</div>;
}

export function SortMenu({ value, onChange }: { value: SortDir; onChange: (v: SortDir) => void }) {
  return (
    <Select value={value} onValueChange={(v: string) => onChange(v as SortDir)}>
      <SelectTrigger className="w-[168px] text-sm" aria-label="Sort entries">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="newest">Newest first</SelectItem>
        <SelectItem value="oldest">Oldest first</SelectItem>
      </SelectContent>
    </Select>
  );
}
