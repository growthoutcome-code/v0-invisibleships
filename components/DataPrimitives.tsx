"use client";

import { useEffect, useRef, useState } from "react";
import { SkeletonRows } from "@/components/Skeleton";
import { track } from "@/lib/analytics";

/**
 * Shared building blocks for the Data section's research sub-tabs.
 *
 * Extracted when the Crime section was added, so the two research tabs cannot
 * drift apart in how they render a tier, a source link or a paginated register.
 * HealthSignals still carries its own private copies and should migrate here —
 * that move is deliberately NOT bundled with the Crime build, because
 * HealthSignals is live and well covered by tests, and a refactor of a working
 * page is a separate change with a separate risk.
 */

export type SourceRec = {
  source_id: string; url: string; publisher?: string; title?: string;
  evidence_tier?: string; accessed?: string; archived_url?: string | null;
};

/** Loads a JSON table, null while in flight, [] on failure. */
export function useTable<T>(path: string): T[] | null {
  const [rows, setRows] = useState<T[] | null>(null);
  useEffect(() => {
    let alive = true;
    fetch(path)
      .then((r) => r.json())
      .then((d: T[]) => { if (alive) setRows(d); })
      .catch(() => { if (alive) setRows([]); });
    return () => { alive = false; };
  }, [path]);
  return rows;
}

/** Loads a single JSON object (verdict, chart), null while in flight. */
export function useDoc<T>(path: string): T | null {
  const [doc, setDoc] = useState<T | null>(null);
  useEffect(() => {
    let alive = true;
    fetch(path)
      .then((r) => r.json())
      .then((d: T) => { if (alive) setDoc(d); })
      .catch(() => { if (alive) setDoc(null); });
    return () => { alive = false; };
  }, [path]);
  return doc;
}

export function TierChip({ t }: { t?: string }) {
  return (
    <span
      className={`shrink-0 text-[12px] uppercase tracking-wide border border-edge rounded-full px-2 py-[1px] ${
        t === "C" ? "border-dashed text-muted" : "text-foreground/70"
      }`}
      title={t === "A" ? "Documented" : t === "B" ? "Corroborated" : "Claimed"}
    >
      {t}
    </span>
  );
}

export function SourceLink({
  id, sources, event = "crime_source_opened",
}: { id?: string | null; sources: SourceRec[]; event?: string }) {
  const s = id ? sources.find((x) => x.source_id === id) : undefined;
  if (!s) return null;
  return (
    <a
      href={s.url}
      target="_blank"
      rel="noreferrer noopener"
      onClick={() => track(event, { id: s.source_id })}
      className="text-foreground/70 underline underline-offset-4 hover:text-accent text-[14px]"
    >
      source
    </a>
  );
}

export function SectionSkeleton({ title }: { title: string }) {
  return (
    <section className="mb-16" aria-busy="true">
      <h2 className="font-display font-semibold text-foreground text-[21px] mb-2">{title}</h2>
      <SkeletonRows n={5} />
    </section>
  );
}

/** Journal-style pagination state for a register list. */
export function usePager<T>(items: T[] | null | undefined, size: number) {
  const [page, setPage] = useState(1);
  const ref = useRef<HTMLElement | null>(null);
  const list = items || [];
  const totalPages = Math.max(1, Math.ceil(list.length / size));
  const safePage = Math.min(page, totalPages);
  return {
    page: safePage, setPage, totalPages,
    slice: list.slice((safePage - 1) * size, safePage * size),
    ref,
    scrollTo: () => ref.current?.scrollIntoView({ block: "start" }),
  };
}

/**
 * True on phone-width screens.
 *
 * Charts are drawn in a fixed-width viewBox and scaled to fit, so on a 390px
 * screen an 11px label paints at about 5.4px. Every chart in the Data section
 * uses this to scale type, marks and gutters back up. This bug shipped twice
 * before the guard was made shared; the test suite now asserts a 9px floor.
 */
export function useNarrow(maxWidth = 700) {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${maxWidth}px)`);
    const on = () => setNarrow(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [maxWidth]);
  return narrow;
}
