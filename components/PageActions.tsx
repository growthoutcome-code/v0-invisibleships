"use client";

export type SortDir = "newest" | "oldest";

/**
 * Right-aligned actions row that sits beside a page title (see TitleBand).
 * Holds the Sort and Filter controls (components/ListControls.tsx) on the
 * Journal and Concepts.
 */
export default function PageActions({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap items-center gap-3 pb-1">{children}</div>;
}
