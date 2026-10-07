"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { track } from "@/lib/analytics";
import ConceptsControls, { conceptPills } from "@/components/ConceptsToolbar";
import { ActiveLine, MobileBar } from "@/components/ListControls";
import Pager from "@/components/Pager";
import ConceptTile from "@/components/ConceptTile";
import {
  CONCEPTS, NO_FILTERS, BASIS_LABEL, ORIGIN_LABEL, SERIES_LIST, SHOW_SERIES_SORT, seriesOf, isNewConcept,
  filterConcepts, sortConcepts, plainText, CONCEPT_SORTS, type Concept, type Filters, type ConceptSort,
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
 *
 * BY SERIES, the default sort (Sean, 6 Oct 2026: "by default, we can sort by
 * series"): one section per series (public/data/concepts/series.json), in page
 * order, each with its concepts in reading order, so a reader who never opens
 * the filter still sees how the concepts fit together. A concept in two series
 * appears in both, saying where else it is. Filters and search still apply; a
 * series with nothing matching is left out. No page numbers in this sort.
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
  // "New" depends on today's date, so it is decided after the page loads.
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => { setNow(Date.now()); }, []);
  const tileFor = (c: Concept, extra: { part?: string; alsoIn?: string[] } = {}) => {
    const topics = [...c.topics].sort((a, b) => Number(lead.includes(b)) - Number(lead.includes(a))).slice(0, 3);
    return {
      id: c.id, n: CONCEPTS.indexOf(c) + 1, origin: ORIGIN_LABEL[c.origin], basis: BASIS_LABEL[c.basis],
      title: c.title, body: plainText(c.body), topics: topics.map((t) => THEMES[t]),
      isNew: now !== null && isNewConcept(c.id, now), ...extra,
    };
  };
  const bySeries = SHOW_SERIES_SORT && sort === "series";
  const sections = useMemo(() => {
    if (!bySeries) return [];
    const ok = new Set(visible.map((c) => c.id));
    const out = SERIES_LIST.map((s) => ({
      key: s.key, title: s.title, blurb: s.blurb, total: s.ids.length,
      items: s.ids.flatMap((id, k) => {
        const c = CONCEPTS.find((x) => x.id === id);
        return c && ok.has(id) ? [{ c, k }] : [];
      }),
    })).filter((s) => s.items.length);
    const loose = visible.filter((c) => !seriesOf(c.id).length);
    if (loose.length) out.push({ key: "not-in-a-series", title: "Not in a series", blurb: "", total: loose.length,
      items: loose.map((c, k) => ({ c, k })) });
    return out;
  }, [bySeries, visible]);

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

        {bySeries ? (
          <>
            {/* Jump list: every series shown, so a reader can go straight to one. */}
            {/* On a phone, ten links would fill the first screen, so the jump
                list is one menu there; from tablet up, the links. */}
            {sections.length > 1 && (
              <label className="md:hidden block mb-8">
                <span className="sr-only">Jump to a series</span>
                <select defaultValue="" className="w-full h-10 px-3 border border-edge bg-background text-[15px] text-foreground"
                  onChange={(e) => {
                    const key = e.target.value; if (!key) return;
                    document.getElementById(`series-${key}`)?.scrollIntoView({ block: "start" });
                    track("concepts_series_jump", { series: key }); e.target.value = "";
                  }}>
                  <option value="">Jump to a series ({sections.length})</option>
                  {sections.map((s) => <option key={s.key} value={s.key}>{s.title}</option>)}
                </select>
              </label>
            )}
            {sections.length > 1 && (
              <nav aria-label="Series" className="hidden md:block mb-10">
                <p className="text-[12px] uppercase tracking-[0.08em] font-semibold text-muted m-0 mb-2">Series</p>
                <ul className="list-none p-0 m-0 flex flex-wrap gap-x-5 gap-y-2">
                  {sections.map((s) => (
                    <li key={s.key}>
                      <a href={`#series-${s.key}`} className="text-[15px] text-foreground underline underline-offset-4 decoration-edge hover:decoration-foreground"
                        onClick={() => track("concepts_series_jump", { series: s.key })}>{s.title}</a>
                    </li>
                  ))}
                </ul>
              </nav>
            )}
            {sections.map((s, i) => (
              <section key={s.key} id={`series-${s.key}`} aria-labelledby={`series-h-${s.key}`}
                className={`scroll-mt-28 ${i ? "mt-14 pt-10 border-t border-edge" : ""}`}>
                <h2 id={`series-h-${s.key}`} className="font-display font-semibold text-foreground text-[24px] md:text-[28px] leading-tight m-0 mb-2">
                  {s.title}
                </h2>
                {s.blurb && <p className="body-copy text-foreground/85 measure m-0 mb-1">{s.blurb}</p>}
                <p className="text-[14px] text-muted m-0 mb-6">
                  {s.key === "not-in-a-series" ? `${s.items.length} ${s.items.length === 1 ? "concept" : "concepts"}`
                    : s.items.length === s.total ? `${s.total} concepts, read in order`
                    : `${s.items.length} of ${s.total} concepts match`}
                </p>
                <ol className="list-none p-0 m-0 grid grid-cols-1 md:grid-cols-2 gap-5">
                  {s.items.map(({ c, k }) => (
                    <li key={c.id} className="flex">
                      <ConceptTile from={`series:${s.key}`} c={tileFor(c, s.key === "not-in-a-series" ? {} : {
                        part: `Part ${k + 1} of ${s.total}`,
                        alsoIn: seriesOf(c.id).filter((x) => x.key !== s.key).map((x) => x.title),
                      })} />
                    </li>
                  ))}
                </ol>
              </section>
            ))}
          </>
        ) : (
        <ol className="list-none p-0 m-0 grid grid-cols-1 md:grid-cols-2 gap-5">
          {shown.map((c) => (
            <li key={c.id} className="flex">
              <ConceptTile from="tile" c={tileFor(c)} />
            </li>
          ))}
        </ol>
        )}

        {!visible.length && (
          <p className="body-copy text-muted measure my-10">
            Nothing matches that. Clear a filter or the search to see the rest.
          </p>
        )}

        {!bySeries && totalPages > 1 && (
          <Pager page={page} totalPages={totalPages} setPage={setPage}
            onGo={() => listRef.current?.scrollIntoView({ block: "start" })} />
        )}
      </div>

    </div>
  );
}
