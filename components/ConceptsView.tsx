"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { track } from "@/lib/analytics";
import ConceptsControls, { conceptPills } from "@/components/ConceptsToolbar";
import { ActiveLine, MobileBar } from "@/components/ListControls";
import Pager from "@/components/Pager";
import ConceptTile from "@/components/ConceptTile";
import {
  CONCEPTS, NO_FILTERS, BASIS_LABEL, ORIGIN_LABEL,
  filterConcepts, sortConcepts, plainText, CONCEPT_SORTS, type Filters, type ConceptSort,
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
              <li key={c.id} className="flex">
                <ConceptTile from="tile" c={{
                  id: c.id, n, origin: ORIGIN_LABEL[c.origin], basis: BASIS_LABEL[c.basis],
                  title: c.title, body: plainText(c.body), topics: topics.map((t) => THEMES[t]),
                }} />
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
