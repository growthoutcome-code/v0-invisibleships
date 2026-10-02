"use client";

/**
 * The News page (Sean, 2 Oct 2026; plan: project/features/news.md).
 *
 * Top to bottom: the intro line, the Filter (it drives everything below it),
 * a row of figures, one full-width chart panel with tabs (Over time first, as
 * lines; then Where from, Category, Source type, Industry, Country), and the
 * list, 25 to a page. An item opens a dialog with our summary, a button to the
 * original in a new tab, the archived copy, and Share. Its address, /news/<slug>,
 * opens the same dialog over the list, so a shared item lands on the summary.
 *
 * The index arrives from the server with the page, so there is nothing to wait
 * for; only a summary is fetched, when its item is opened.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Download, ExternalLink } from "lucide-react";
import { track } from "@/lib/analytics";
import {
  EVENTS, EVENT_GROUPS, INDUSTRIES, SOURCE_TYPES, newsDate, newsHref, type NewsItem,
} from "@/lib/news";
import { DISCLAIMER_STANDING, DISCLAIMER_TITLE } from "@/lib/disclaimer";
import { ActiveLine, FilterButton, FilterPanel, MobileBar, SortSelect, type Pill } from "@/components/ListControls";
import type { FilterGroup } from "@/components/FilterGroups";
import Pager from "@/components/Pager";
import PageIntro from "@/components/PageIntro";
import CardShare from "@/components/CardShare";
import ShareMenu from "@/components/ShareMenu";
import Processing from "@/components/Processing";
import { useNarrow } from "@/components/DataPrimitives";
import ExportModal from "@/components/ExportModal";
import {
  Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

const PAGE = 25;
const ORIGIN = "https://www.invisibleships.com";

type Dim = "event" | "industry" | "sourceType" | "publisher" | "country" | "year";
type Sel = Record<Dim, string[]>;
const NONE: Sel = { event: [], industry: [], sourceType: [], publisher: [], country: [], year: [] };

const DIM_LABEL: Record<Dim, string> = {
  event: "Category", industry: "Industry", sourceType: "Source type",
  publisher: "Publisher", country: "Country", year: "Year",
};

function valuesOf(it: NewsItem, d: Dim): string[] {
  if (d === "industry") return it.industry;
  if (d === "year") return it.date ? [it.date.slice(0, 4)] : [];
  const v = it[d] as string;
  return v ? [v] : [];
}

function passes(it: NewsItem, sel: Sel, q: string, skip?: Dim) {
  if (q && !(`${it.title} ${it.publisher}`.toLowerCase().includes(q))) return false;
  for (const d of Object.keys(sel) as Dim[]) {
    if (d === skip || !sel[d].length) continue;
    const have = valuesOf(it, d);
    if (!sel[d].some((v) => have.includes(v))) return false;
  }
  return true;
}

function counts(items: NewsItem[], d: Dim): [string, number][] {
  const m = new Map<string, number>();
  items.forEach((it) => valuesOf(it, d).forEach((v) => m.set(v, (m.get(v) || 0) + 1)));
  return [...m].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

const TABS: { key: "time" | Dim; label: string }[] = [
  { key: "time", label: "Over time" },
  { key: "publisher", label: "Where from" },
  { key: "event", label: "Category" },
  { key: "sourceType", label: "Source type" },
  { key: "industry", label: "Industry" },
  { key: "country", label: "Country" },
];

export default function NewsView({ items, initialSlug }: { items: NewsItem[]; initialSlug?: string }) {
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<Sel>(NONE);
  const [sort, setSort] = useState<"new" | "old">("new");
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("time");
  const [page, setPage] = useState(1);
  const [panel, setPanel] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [corpusOpen, setCorpusOpen] = useState(false);
  const [openSlug, setOpenSlug] = useState<string | null>(initialSlug ?? null);
  const listRef = useRef<HTMLDivElement>(null);

  const ql = q.trim().toLowerCase();
  const shown = useMemo(() => {
    const list = items.filter((it) => passes(it, sel, ql));
    return sort === "old" ? [...list].reverse() : list;
  }, [items, sel, ql, sort]);
  useEffect(() => { setPage(1); }, [sel, ql, sort]);

  const totalPages = Math.max(1, Math.ceil(shown.length / PAGE));
  const pageItems = shown.slice((page - 1) * PAGE, page * PAGE);

  const toggle = (d: Dim, v: string) =>
    setSel((s) => ({ ...s, [d]: s[d].includes(v) ? s[d].filter((x) => x !== v) : [...s[d], v] }));
  const clearAll = () => { setSel(NONE); setQ(""); };
  const pick = (d: Dim, v: string) => {
    toggle(d, v);
    track("news_chart_filter", { dim: d, value: v });
  };

  // Every value the panel offers, in the agreed order where there is one.
  const ordered = (d: Dim): string[] => {
    const present = new Set(items.flatMap((it) => valuesOf(it, d)));
    const order: readonly string[] | null = d === "event" ? EVENTS : d === "industry" ? INDUSTRIES : d === "sourceType" ? SOURCE_TYPES : null;
    if (order) return order.filter((v) => present.has(v));
    if (d === "year") return [...present].sort().reverse();
    return counts(items, d).map(([v]) => v);
  };
  const groups: FilterGroup[] = (["event", "industry", "sourceType", "country", "year", "publisher"] as Dim[]).map((d) => ({
    key: d, label: DIM_LABEL[d],
    options: ordered(d).map((v) => ({ v, l: v })),
    values: sel[d],
    toggle: (v: string) => toggle(d, v),
    clear: () => setSel((s) => ({ ...s, [d]: [] })),
  }));
  const pills: Pill[] = (Object.keys(sel) as Dim[]).flatMap((d) =>
    sel[d].map((v) => ({ key: `${d}:${v}`, label: v, clear: () => toggle(d, v) })));
  const filterCount = pills.length + (ql ? 1 : 0);

  // The share address: /news/<slug> while an item is open, /news otherwise.
  const open = openSlug ? items.find((i) => i.slug === openSlug) ?? null : null;
  const openItem = (it: NewsItem) => {
    setOpenSlug(it.slug);
    window.history.replaceState(null, "", newsHref(it.slug));
    track("news_item_opened", { slug: it.slug });
  };
  const closeItem = () => {
    setOpenSlug(null);
    window.history.replaceState(null, "", "/news");
  };

  const years = shown.map((i) => i.date.slice(0, 4)).filter(Boolean).sort();
  const official = shown.filter((i) => i.sourceType === "Official").length;

  const controls = (
    <>
      <SortSelect label="Sort news" value={sort} options={[{ v: "new", l: "Newest first" }, { v: "old", l: "Oldest first" }]}
        onChange={(v) => setSort(v as "new" | "old")} />
      <FilterButton count={filterCount} open={panel} onOpen={() => { setPanel(true); track("filter_opened", { section: "news" }); }} />
    </>
  );

  return (
    <div className="w-full">
      <PageIntro from="news">
        Official releases and outside reporting on the industries this archive follows, each
        summarised and linked to the original. Charges are allegations unless an item says a
        person pleaded guilty, was convicted or was sentenced.
      </PageIntro>

      <MobileBar sort={{ value: sort, options: [{ v: "new", l: "Newest first" }, { v: "old", l: "Oldest first" }], label: "Sort news", onChange: (v) => setSort(v as "new" | "old") }}
        onFilter={() => setPanel(true)} filterOpen={panel} />
      <ActiveLine shown={shown.length} of={items.length} noun="items" q={q} clearQ={() => setQ("")}
        pills={pills} onClearAll={clearAll} countOnPhone controls={controls} />
      <FilterPanel open={panel} setOpen={setPanel} title="Search & filter the news"
        q={q} setQ={setQ} placeholder={`Search ${items.length} headlines and publishers`} searchLabel="Search the news"
        groups={groups} shown={shown.length} onClearAll={clearAll} />

      {/* FIGURES, then the chart under them (Sean, 2 Oct 2026). */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Tile n={shown.length} label="Items" />
        <Tile n={official} label="From official sources" />
        <Tile n={new Set(shown.map((i) => i.publisher)).size} label="Publishers" />
        <Tile n={years.length ? (years[0] === years[years.length - 1] ? years[0] : `${years[0]}–${years[years.length - 1]}`) : "—"} label="Years covered" />
      </div>

      <section className="mt-8 border border-edge" aria-label="News charts">
        <div role="tablist" aria-label="Chart" className="flex flex-wrap gap-1 border-b border-edge px-3 pt-2">
          {TABS.map((t) => {
            const active = t.key === tab;
            return (
              <button key={t.key} type="button" role="tab" aria-selected={active}
                onClick={() => { setTab(t.key); track("news_tab", { tab: t.key }); }}
                className={`font-display border-b-2 px-3 py-2 text-[12px] font-medium uppercase tracking-[0.14em] transition-colors ${
                  active ? "border-foreground text-foreground" : "border-transparent text-muted hover:text-foreground"}`}>
                {t.label}
              </button>
            );
          })}
        </div>
        <div className="p-4 sm:p-6" role="tabpanel">
          {tab === "time" ? (
            <TimeChart items={shown} onPickGroup={(events) => {
              setSel((s) => ({ ...s, event: events }));
              track("news_chart_filter", { dim: "group", value: events.join("|") });
            }} />
          ) : (
            // The tab for a filtered dimension still lists every value, counted over
            // the items that pass all the OTHER filters, with the chosen ones marked.
            <Bars rows={counts(items.filter((it) => passes(it, sel, ql, tab)), tab)}
              selected={sel[tab]} onPick={(v) => pick(tab, v)}
              note={tab === "industry" ? "An item can sit in two industries. Releases about espionage often name none." :
                tab === "country" ? "The foreign state an official release itself names." :
                tab === "publisher" ? "Who published the item. Select one to filter the page." : "Select one to filter the page."} />
          )}
        </div>
      </section>

      {/* THE LIST */}
      <div ref={listRef} className="mt-10 scroll-mt-28">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
          <h2 className="font-display m-0 text-[22px] font-semibold text-foreground">
            {shown.length === items.length ? "Every item" : `${shown.length} of ${items.length} items`}
          </h2>
          <p className="m-0 text-[14px] text-muted">
            Every item is in the corpus with its summary and links.{" "}
            <button type="button" onClick={() => { setExportOpen(true); track("news_export_opened"); }}
              className="inline-flex items-center gap-1 text-foreground underline underline-offset-4">
              <Download size={13} aria-hidden /> Export
            </button>
          </p>
        </div>

        <ol className="m-0 list-none divide-y divide-edge border-y border-edge p-0">
          {pageItems.map((it) => (
            <li key={it.slug} className="relative py-5 pr-12">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] uppercase tracking-[0.08em] text-muted">
                <span className="tabular-nums">{newsDate(it)}</span>
                <span className="font-semibold text-foreground">{it.sourceType}</span>
                <span className="normal-case tracking-normal text-[13px]">{it.publisher}</span>
              </div>
              <a href={newsHref(it.slug)} onClick={(e) => { e.preventDefault(); openItem(it); }}
                className="mt-1.5 block font-display text-[18px] font-semibold leading-snug text-foreground hover:underline underline-offset-4">
                {it.title}
              </a>
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[12px] uppercase tracking-[0.06em] text-muted">
                <span>{it.event}</span>
                {it.industry.map((x) => <span key={x}>{x}</span>)}
                {it.country && <span>{it.country}</span>}
                {it.stage && <span className="normal-case tracking-normal italic">{it.stage}</span>}
              </div>
              <CardShare title={it.title} path={newsHref(it.slug)} className="absolute right-0 top-5" />
            </li>
          ))}
        </ol>
        {!shown.length && (
          <p className="body-copy text-muted my-10">
            Nothing matches that.{" "}
            <button type="button" onClick={clearAll} className="text-foreground underline underline-offset-4">Clear all</button>
          </p>
        )}
        {totalPages > 1 && (
          <Pager page={page} totalPages={totalPages} setPage={setPage}
            onGo={() => listRef.current?.scrollIntoView({ block: "start" })} />
        )}
      </div>

      <ItemDialog item={open} onClose={closeItem} />

      <ExportDialog open={exportOpen} setOpen={setExportOpen} items={shown} filtered={shown.length !== items.length}
        onCorpus={() => { setExportOpen(false); setCorpusOpen(true); }} />
      <ExportModal open={corpusOpen} onOpenChange={setCorpusOpen} />
    </div>
  );
}

function Tile({ n, label }: { n: number | string; label: string }) {
  return (
    <div className="border border-edge p-4">
      <div className="font-display text-[28px] font-semibold leading-none text-foreground tabular-nums sm:text-[32px]">{n}</div>
      <div className="font-display mt-2 text-[11px] uppercase tracking-[0.14em] text-muted">{label}</div>
    </div>
  );
}

/* ---------- Over time: one line per group of events, by year ---------- */
function TimeChart({ items, onPickGroup }: { items: NewsItem[]; onPickGroup: (events: string[]) => void }) {
  const [hover, setHover] = useState<number | null>(null);
  // A phone gets a narrower drawing, not a scrolled one: the SVG scales to the
  // column, so the canvas is sized for it and the type stays readable.
  const narrow = useNarrow(640);
  const dated = items.filter((i) => i.date);
  if (!dated.length) return <p className="m-0 text-muted">No dated items match.</p>;
  const ys = dated.map((i) => +i.date.slice(0, 4));
  const y0 = Math.min(...ys), y1 = Math.max(...ys, y0 + 1);
  const years = Array.from({ length: y1 - y0 + 1 }, (_, i) => y0 + i);
  const series = EVENT_GROUPS.map((g) => ({
    ...g,
    vals: years.map((y) => dated.filter((i) => +i.date.slice(0, 4) === y && g.events.includes(i.event)).length),
  })).filter((s) => s.vals.some(Boolean));
  const max = Math.max(1, ...series.flatMap((s) => s.vals));
  const step = max <= 5 ? 1 : max <= 12 ? 2 : max <= 30 ? 5 : 10;
  const top = Math.ceil(max / step) * step;
  const W = narrow ? 420 : 900, H = narrow ? 260 : 320, pl = 30, pr = 12, pt = 14, pb = 30;
  const X = (y: number) => pl + ((y - y0) / Math.max(1, y1 - y0)) * (W - pl - pr);
  const Y = (v: number) => pt + (1 - v / top) * (H - pt - pb);
  const tickEvery = narrow ? (years.length > 8 ? 4 : 2) : years.length > 12 ? 2 : 1;
  const hy = hover ?? years[years.length - 1];
  return (
    <div>
      <p className="m-0 mb-3 text-[14px] text-muted">
        Items per year by kind of event. {years[years.length - 1] === new Date().getFullYear() ? `${years[years.length - 1]} is the year so far.` : ""}
      </p>
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img"
          aria-label="News items per year by kind of event" onMouseLeave={() => setHover(null)}>
          {Array.from({ length: top / step + 1 }, (_, i) => i * step).map((t) => (
            <g key={t}>
              <line x1={pl} x2={W - pr} y1={Y(t)} y2={Y(t)} stroke="rgb(var(--edge))" />
              <text x={pl - 8} y={Y(t) + 4} fontSize="11" textAnchor="end" fill="rgb(var(--muted))">{t}</text>
            </g>
          ))}
          {years.map((y, i) => (i % tickEvery === 0 || (y === y1 && (y1 - y0) % tickEvery > tickEvery / 2)) && (
            <text key={y} x={X(y)} y={H - 8} fontSize="11" textAnchor="middle" fill="rgb(var(--muted))">{y}</text>
          ))}
          {hover !== null && <line x1={X(hover)} x2={X(hover)} y1={pt} y2={H - pb} stroke="rgb(var(--muted))" strokeDasharray="3 3" />}
          {series.map((s) => (
            <polyline key={s.label} fill="none" stroke="rgb(var(--foreground))" strokeOpacity={s.opacity}
              strokeWidth={s.weight} strokeDasharray={s.dash} strokeLinejoin="round"
              points={s.vals.map((v, i) => `${X(years[i])},${Y(v)}`).join(" ")} />
          ))}
          {years.map((y) => (
            <rect key={y} x={X(y) - (W - pl - pr) / years.length / 2} y={pt} width={(W - pl - pr) / years.length}
              height={H - pt - pb} fill="transparent" onMouseEnter={() => setHover(y)} />
          ))}
        </svg>
      </div>
      {/* The legend doubles as the reading for the year under the cursor (or the
          latest year), and each entry filters the page to that group. */}
      <ul className="m-0 mt-4 grid list-none gap-x-8 gap-y-2 p-0 sm:grid-cols-2 lg:grid-cols-3">
        {series.map((s) => (
          <li key={s.label}>
            <button type="button" onClick={() => onPickGroup(s.events)}
              className="flex w-full items-center gap-3 text-left text-[14px] text-foreground hover:underline underline-offset-4">
              <svg width="34" height="10" aria-hidden className="shrink-0">
                <line x1="1" x2="33" y1="5" y2="5" stroke="rgb(var(--foreground))" strokeOpacity={s.opacity}
                  strokeWidth={s.weight} strokeDasharray={s.dash} />
              </svg>
              <span className="min-w-0 flex-1">{s.label}</span>
              <span className="tabular-nums text-muted">{s.vals[years.indexOf(hy)]}</span>
            </button>
          </li>
        ))}
      </ul>
      <p className="m-0 mt-3 text-[13px] text-muted">Counts for {hy}. Hover the chart for another year; select a line&rsquo;s name to filter to it.</p>
    </div>
  );
}

/* ---------- Bars: one dimension, every value ---------- */
function Bars({ rows, selected, onPick, note }: { rows: [string, number][]; selected: string[]; onPick: (v: string) => void; note: string }) {
  const [all, setAll] = useState(false);
  const max = rows[0]?.[1] || 1;
  const LIMIT = 15;
  const list = all ? rows : rows.slice(0, LIMIT);
  if (!rows.length) return <p className="m-0 text-muted">Nothing to count for the items shown.</p>;
  return (
    <div>
      <p className="m-0 mb-4 text-[14px] text-muted">{note}</p>
      <ul className="m-0 grid list-none gap-2 p-0">
        {list.map(([v, n]) => {
          const on = selected.includes(v);
          return (
            <li key={v}>
              <button type="button" onClick={() => onPick(v)} aria-pressed={on}
                className="grid w-full grid-cols-[minmax(8rem,34%)_1fr_3rem] items-center gap-3 text-left text-[14px] group">
                <span className={`truncate ${on ? "font-semibold text-foreground" : "text-foreground/85 group-hover:underline underline-offset-4"}`}>{v}</span>
                <span className="h-3 bg-edge/60">
                  <span className="block h-full bg-foreground" style={{ width: `${(n / max) * 100}%`, opacity: on || !selected.length ? 1 : 0.35 }} />
                </span>
                <span className="text-right tabular-nums text-muted">{n}</span>
              </button>
            </li>
          );
        })}
      </ul>
      {rows.length > LIMIT && (
        <button type="button" onClick={() => setAll((a) => !a)} className="mt-4 text-[14px] text-foreground underline underline-offset-4">
          {all ? "Show the top 15" : `Show all ${rows.length}`}
        </button>
      )}
    </div>
  );
}

/* ---------- The item dialog ---------- */
function summaryOf(md: string): string[] {
  const body = md.replace(/^---\n[\s\S]*?\n---\n/, "").replace(/\n*---\n\n## [\s\S]*$/, "");
  return body.split(/\n{2,}/).slice(2).map((p) => p.trim()).filter((p) => p && p !== "Summary not yet written.");
}

function ItemDialog({ item, onClose }: { item: NewsItem | null; onClose: () => void }) {
  const [paras, setParas] = useState<string[] | null>(null);
  useEffect(() => {
    setParas(null);
    if (!item || !item.hasSummary) return;
    let live = true;
    fetch(`/data/news/md/${item.file}`).then((r) => (r.ok ? r.text() : "")).then((t) => { if (live) setParas(summaryOf(t)); })
      .catch(() => { if (live) setParas([]); });
    return () => { live = false; };
  }, [item]);
  return (
    <Dialog open={!!item} onOpenChange={(o) => !o && onClose()}>
      <DialogContent size="md">
        {item && (
          <>
            <DialogHeader>
              <p className="m-0 text-[12px] uppercase tracking-[0.08em] text-muted">
                {newsDate(item)} · <span className="font-semibold text-foreground">{item.sourceType}</span> · <span className="normal-case tracking-normal">{item.publisher}</span>
              </p>
              <DialogTitle className="font-display text-[22px] leading-snug">{item.title}</DialogTitle>
            </DialogHeader>
            <DialogBody>
              {!item.hasSummary ? (
                <p className="body-copy text-muted m-0">Our summary of this item is being written.</p>
              ) : paras === null ? (
                <Processing variant="inline" label="Loading the summary" />
              ) : (
                paras.map((p, i) => <p key={i} className="body-copy text-foreground/90 m-0 mb-4">{p}</p>)
              )}
              <div className="mt-4 flex flex-wrap gap-x-3 gap-y-1 text-[12px] uppercase tracking-[0.06em] text-muted">
                <span>{item.event}</span>
                {item.industry.map((x) => <span key={x}>{x}</span>)}
                {item.country && <span>{item.country}</span>}
                {item.stage && <span className="normal-case tracking-normal italic">Stage: {item.stage}</span>}
              </div>
              {item.office && <p className="m-0 mt-2 text-[13px] text-muted">Issued by {item.office}.</p>}
              {item.stage && item.sourceType === "Official" && !["convicted", "sentenced", "pleaded guilty", "admitted"].includes(item.stage) && (
                <p className="m-0 mt-3 text-[13px] text-muted">An indictment or complaint is an allegation. Defendants are presumed innocent unless and until proven guilty.</p>
              )}
            </DialogBody>
            <DialogFooter className="flex flex-wrap items-center gap-3">
              <a href={item.url} target="_blank" rel="noopener noreferrer"
                onClick={() => track("news_original_opened", { slug: item.slug })}
                className="inline-flex h-10 items-center gap-2 bg-foreground px-4 text-[15px] font-semibold text-background">
                Read the original <ExternalLink size={15} aria-hidden />
              </a>
              {item.archivedUrl && (
                <a href={item.archivedUrl} target="_blank" rel="noopener noreferrer" className="text-[14px] text-foreground underline underline-offset-4">
                  Archived copy
                </a>
              )}
              <ShareMenu title={`${item.title} — Invisible Ships`} url={ORIGIN + newsHref(item.slug)} align="right" className="sm:ml-auto" />
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ---------- Export: the corpus first, a CSV second ---------- */
function csvOf(items: NewsItem[]): string {
  const cell = (v: string) => `"${(v || "").replace(/"/g, '""')}"`;
  const head = ["date", "headline", "publisher", "source_type", "industry", "category", "country", "stage", "link", "archived_link", "item_page"];
  const lines = items.map((i) => [i.date, i.title, i.publisher, i.sourceType, i.industry.join(" · "), i.event, i.country, i.stage,
    i.url, i.archivedUrl, ORIGIN + newsHref(i.slug)].map(cell).join(","));
  // The standing disclaimer travels with every file the site hands out (CLAUDE.md §1).
  return [cell(`${DISCLAIMER_TITLE}: ${DISCLAIMER_STANDING} Full text: ${ORIGIN}/disclaimer`), head.join(","), ...lines].join("\n") + "\n";
}

function ExportDialog({ open, setOpen, items, filtered, onCorpus }: {
  open: boolean; setOpen: (o: boolean) => void; items: NewsItem[]; filtered: boolean; onCorpus: () => void;
}) {
  const downloadCsv = () => {
    const blob = new Blob([csvOf(items)], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `invisible-ships-news-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    track("news_csv_downloaded", { rows: items.length, filtered });
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent size="sm">
        <DialogHeader><DialogTitle>Export</DialogTitle></DialogHeader>
        <DialogBody>
          <p className="m-0 text-[15px] text-foreground/85">
            <strong>The corpus for AI</strong> holds every News item with its summary and links, beside the
            journal, the research and the concepts. Hand it to an AI assistant to ask questions across all of it.
          </p>
          <button type="button" onClick={onCorpus}
            className="mt-4 inline-flex h-10 items-center gap-2 bg-foreground px-4 text-[15px] font-semibold text-background">
            <Download size={16} aria-hidden /> Download the corpus for AI
          </button>
          <div className="mt-8 border-t border-edge pt-5">
            <p className="m-0 text-[14px] text-muted">
              Or just this list as a spreadsheet: {items.length} {items.length === 1 ? "item" : "items"}
              {filtered ? ", as currently filtered" : ""}, without the summaries.
            </p>
            <button type="button" onClick={downloadCsv} className="mt-3 text-[14px] text-foreground underline underline-offset-4">
              Download CSV
            </button>
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
