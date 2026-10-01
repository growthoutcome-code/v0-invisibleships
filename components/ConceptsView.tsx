"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { track } from "@/lib/analytics";
import ConceptsControls, { conceptPills } from "@/components/ConceptsToolbar";
import { ActiveLine, MobileBar } from "@/components/ListControls";
import Pager from "@/components/Pager";
import CardShare from "@/components/CardShare";
import {
  CONCEPTS, NO_FILTERS, BASIS_LABEL, ORIGIN_LABEL,
  filterConcepts, sortConcepts, CONCEPT_SORTS, type Filters, type ConceptSort,
} from "@/lib/concepts";
import { THEMES } from "@/lib/themes";

/**
 * Core concepts as tiles, two across, twelve to a page (Sean, 30 Sep 2026:
 * "Concepts need to be truncated and the page itself needs pagination").
 *
 * Each tile carries what decides whether to read on: the number, who formed it
 * and what it rests on (origin first, so a reader knows who is speaking before
 * weighing the basis), the title, the opening of the argument, and its topics.
 * The whole concept is on its own page, /concepts/<id>, so it can be linked,
 * cited and shared (ConceptArticle.tsx).
 *
 * The side rail is gone: with tiles, search, filters and page numbers, a list
 * of forty titles down the side had nothing left to do.
 */
const PAGE = 12;

export default function ConceptsView({
  filters, setFilters, sort, setSort,
}: {
  /** Controlled by JournalBrowser (title-band controls) and the Research hero. */
  filters: Filters;
  setFilters: (f: Filters) => void;
  sort: ConceptSort;
  setSort: (s: ConceptSort) => void;
}) {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [panelOpen, setPanelOpen] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => { track("concepts_viewed"); }, []);

  // Old addresses were anchors on one long page (/concepts#can-you-record-it);
  // other pages and outside links still use them. Forward to the concept's page.
  useEffect(() => {
    if (typeof window === "undefined" || !window.location.hash) return;
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (CONCEPTS.some((c) => c.id === id)) router.replace(`/concepts/${id}`);
    else setFilters(NO_FILTERS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visible = useMemo(() => sortConcepts(filterConcepts(filters), sort), [filters, sort]);
  useEffect(() => { setPage(1); }, [filters, sort]);
  const totalPages = Math.max(1, Math.ceil(visible.length / PAGE));
  const shown = visible.slice((page - 1) * PAGE, page * PAGE);
  const lead = filters.topic;

  return (
    <div className="w-full">
      {/* The sentence under the title is rendered by JournalBrowser with the title
          (PageIntro). The dismissible "About these concepts" panel was removed
          (Sean, 30 Sep 2026: "just going with the one sentence"). */}
      <div ref={listRef} className="scroll-mt-28">
        <MobileBar sort={{ value: sort, options: CONCEPT_SORTS, label: "Sort concepts", onChange: (v) => { setSort(v); track("concepts_sorted", { sort: v }); } }}
          onFilter={() => { setPanelOpen(true); track("concepts_filter_opened"); }} filterOpen={panelOpen} />
        <ActiveLine countOnPhone shown={visible.length} of={CONCEPTS.length} noun="concepts" q={filters.q}
          clearQ={() => setFilters({ ...filters, q: "" })} pills={conceptPills(filters, setFilters)}
          onClearAll={() => setFilters(NO_FILTERS)}
          controls={<ConceptsControls filters={filters} setFilters={setFilters} sort={sort} setSort={setSort} open={panelOpen} setOpen={setPanelOpen} />} />

        <ol className="list-none p-0 m-0 grid grid-cols-1 md:grid-cols-2 gap-5">
          {shown.map((c) => {
            const n = CONCEPTS.indexOf(c) + 1;
            const topics = [...c.topics].sort((a, b) => Number(lead.includes(b)) - Number(lead.includes(a))).slice(0, 3);
            return (
              <li key={c.id} className="relative flex">
                <Link href={`/concepts/${c.id}`} onClick={() => track("concept_opened", { id: c.id, from: "tile" })}
                  className="group flex flex-col w-full border border-edge p-6 pr-14 hover:border-foreground transition-colors">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-2 mb-4">
                    <span className="text-[13px] uppercase tracking-[0.08em] font-semibold text-muted tabular-nums">
                      {String(n).padStart(2, "0")}
                    </span>
                    <span className="text-[12px] uppercase tracking-[0.08em] font-semibold text-background bg-foreground px-2 py-0.5">
                      {ORIGIN_LABEL[c.origin]}
                    </span>
                    <span className="text-[12px] uppercase tracking-[0.08em] font-semibold text-foreground">
                      {BASIS_LABEL[c.basis]}
                    </span>
                  </div>
                  <h3 className="font-display font-semibold text-foreground text-[22px] md:text-[24px] leading-tight mb-3 group-hover:underline underline-offset-4">
                    {c.title}
                  </h3>
                  <p className="text-[17px] leading-[1.55] text-foreground/80 line-clamp-3 m-0 mb-5">{c.body}</p>
                  <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] uppercase tracking-[0.06em] text-muted">
                    {topics.map((t) => <span key={t}>{THEMES[t]}</span>)}
                    <span className="ml-auto normal-case tracking-normal text-[14px] text-foreground">Read &rarr;</span>
                  </div>
                </Link>
                <CardShare title={c.title} path={`/concepts/${c.id}`} className="absolute top-3 right-3" />
              </li>
            );
          })}
        </ol>

        {!visible.length && (
          <p className="body-copy text-muted measure my-10">
            Nothing matches that. Clear a filter or the search to see the rest.
          </p>
        )}

        {totalPages > 1 && (
          <Pager page={page} totalPages={totalPages} setPage={setPage}
            onGo={() => listRef.current?.scrollIntoView({ block: "start" })} />
        )}
      </div>

    </div>
  );
}
