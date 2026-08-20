"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { loadDataset, getBody } from "@/lib/data";
import type { Dataset, Doc } from "@/lib/types";
import { track } from "@/lib/analytics";
import Header, { type Tab } from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext, PaginationEllipsis } from "@/components/ui/pagination";
import { ChevronLeft, ChevronRight, Volume2, List } from "lucide-react";
import CopyrightTerms from "@/components/CopyrightTerms";
import ShareMenu from "@/components/ShareMenu";
import { Transcript } from "@/components/Transcript";
import { cleanTerm, cleanDef, splitDef } from "@/lib/glossary-format";
import GlossaryBody from "@/components/GlossaryBody";
import GlossaryIllustration from "@/components/GlossaryIllustration";
import { DOCUMENTS, AUTHOR, EXTRA_GLOSSARY } from "@/lib/site-content";
import PageActions, { SortMenu, type SortDir } from "@/components/PageActions";
import DataView from "@/components/DataView";
import ConceptsView from "@/components/ConceptsView";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

const journalHref = (id: string) => `/journal/${id.toLowerCase()}`;
const glossaryHref = (slug: string) => `/glossary/${slug.toLowerCase()}`;

// Intercept a normal left-click so in-app links update SPA state instead of
// doing a full navigation to the standalone route (which sits behind the gate
// and bounces the visitor back to the splash). Modifier/middle clicks fall
// through so "open in new tab" and hover previews on the real URL still work.
const spaClick = (fn: () => void) => (e: any) => {
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button === 1) return;
  e.preventDefault();
  fn();
  if (typeof window !== "undefined") window.scrollTo({ top: 0 });
};

const PAGE_SIZE = 10;
const SITE = "Invisible Ships";
const TABS: Tab[] = ["journal", "glossary", "documents", "author", "disclaimer"];
const cap = (s?: string | null) => (s ? s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, " ") : "");
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
// Format an ISO date (YYYY-MM-DD) as "Feb 27, 2025" without Date() (avoids TZ shifts).
function formatDay(iso: string): string {
  const [y, m, d] = (iso || "").split("-").map(Number);
  return y && m && d ? `${MONTHS[m - 1]} ${d}, ${y}` : iso;
}

function excerpt(md: string): string {
  const lines = (md || "").split("\n").map((l) => l.trim()).filter(Boolean)
    .filter((l) => !l.startsWith("#") && !l.startsWith("**Audio") && !/^File duration/i.test(l));
  const text = lines.join(" ")
    .replace(/\[[0-9:]+\]/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\*\*/g, "").replace(/\s+/g, " ").trim();
  return text.length > 240 ? text.slice(0, 240) + "…" : text;
}

// First N sentences of a string (falls back to the whole text if it has no
// sentence punctuation). Used to cap the glossary peek at 2 sentences.
function firstSentences(text: string, n = 2): string {
  // Strip any leading dictionary-style ":" and collapse whitespace.
  const clean = (text || "").replace(/^[\s:]+/, "").trim();
  const matches = clean.match(/[^.!?]+[.!?]+(\s|$)/g);
  const out = (matches ? matches.slice(0, n).join(" ").replace(/\s+/g, " ").trim() : clean) || clean;
  // Hard char cap so definitions with no early period (colon-delimited entries)
  // can't overflow the card.
  return out.length > 220 ? out.slice(0, 220).trim() + "…" : out;
}

export default function JournalBrowser({ initialTab = "journal" }: { initialTab?: Tab } = {}) {
  const [ds, setDs] = useState<Dataset | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>(initialTab);

  const [q, setQ] = useState(""); const [dFrom, setDFrom] = useState(""); const [dTo, setDTo] = useState("");
  const [part, setPart] = useState(""); const [loc, setLoc] = useState("");
  const [cat, setCat] = useState(""); const [stype, setSType] = useState(""); const [audioOnly, setAudioOnly] = useState(false);
  const [gcat, setGcat] = useState("");

  const [page, setPage] = useState(1);
  // Feed order. Default matches the entries themselves, which read latest-first.
  const [sort, setSort] = useState<SortDir>("newest");
  const [sel, setSel] = useState<string | null>(null);
  const [gsel, setGsel] = useState<string | null>(null);
  const [body, setBody] = useState(""); const [bodyLoading, setBodyLoading] = useState(false);
  const [excerpts, setExcerpts] = useState<Record<string, string>>({});
  const [panelOpen, setPanelOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [deepLinked, setDeepLinked] = useState(false);

  useEffect(() => { loadDataset().then((d) => { setDs(d); setLoading(false); }).catch(() => setLoading(false)); }, []);

  // Back-compat IN: the current section comes from the route (initialTab), but
  // still honor any LEGACY query params (?entry= / ?term= / ?view=) on already
  // shared links so they reopen the right content. The OUT effect below then
  // rewrites the address bar to a clean path.
  useEffect(() => {
    if (!ds || deepLinked) return;
    try {
      const sp = new URLSearchParams(window.location.search);
      const entry = sp.get("entry");
      const term = sp.get("term");
      const view = sp.get("view") as Tab | null;
      if (entry && ds.docs.some((d) => d.id === entry)) { setTab("journal"); setSel(entry); }
      else if (term && glossaryTerms.some((t: any) => t.slug === term)) { setTab("glossary"); setGsel(term); }
      else if (view && TABS.includes(view)) { setTab(view); }
      // Landing straight through the gate shows the FEED — the list of entries.
      // Do NOT auto-open an entry here: it drops a first-time visitor into the
      // middle of the archive with no overview and no sort control.
    } catch { /* ignore */ }
    setDeepLinked(true);
  }, [ds, deepLinked]);

  // Deep-link OUT: keep the address bar in sync with the current view as a CLEAN
  // path (no query strings). Uses replaceState so switching sections/terms never
  // triggers a navigation or re-shows the gate. These paths match the real
  // routes, so refreshing/sharing them resolves correctly.
  useEffect(() => {
    if (!deepLinked) return;
    try {
      // The journal feed has its own path now, so every section is addressable:
      // /journal, /glossary, /documents, /data, /author, /disclaimer. "/" still
      // resolves (it renders the journal) and gets rewritten to /journal here.
      let path = "/journal";
      if (sel) path = `/journal/${sel.toLowerCase()}`;
      else if (tab === "glossary") path = gsel ? `/glossary/${gsel.toLowerCase()}` : "/glossary";
      else if (tab === "documents") path = "/documents";
      else if (tab === "data") path = "/data";
      else if (tab === "concepts") path = "/concepts";
      else if (tab === "author") path = "/author";
      else if (tab === "disclaimer") path = "/disclaimer";
      window.history.replaceState(null, "", path + window.location.hash);
    } catch { /* ignore */ }
  }, [tab, sel, gsel, deepLinked]);

  // Section-level analytics: replaceState alone doesn't emit a pageview, so record
  // in-app section switches explicitly for tracking.
  useEffect(() => { if (deepLinked) track("section_viewed", { section: tab }); }, [tab, deepLinked]);

  // Track + scroll to top when a glossary term opens.
  useEffect(() => {
    if (gsel) { track("term_opened", { slug: gsel }); window.scrollTo({ top: 0 }); }
  }, [gsel]);

  const journal = useMemo(() => (ds?.docs || []).filter((d) => d.collection === "journal"), [ds]);
  // Full glossary, sorted — used for deep-link validation and prev/next term navigation.
  // Supabase already holds all terms (incl. the former EXTRA_GLOSSARY set), so use it alone.
  // Only the bundled-JSON fallback still needs EXTRA_GLOSSARY merged in.
  const glossaryTerms = useMemo(
    () => {
      const base =
        ds?.source === "supabase"
          ? (ds?.glossary || [])
          : [...(ds?.glossary || []), ...EXTRA_GLOSSARY];
      return [...base].sort((a: any, b: any) => a.term.localeCompare(b.term));
    },
    [ds]
  );
  const parts = useMemo(() => Array.from(new Set(journal.map((d) => d.part).filter((p): p is number => p != null))).sort(), [journal]);
  const locs = useMemo(() => Array.from(new Set(journal.map((d) => d.location).filter((l): l is string => !!l))).sort(), [journal]);
  const topics = useMemo(() => (ds?.categories || []).filter((c) => c.kind === "category").map((c) => c.slug).sort(), [ds]);
  const stypes = useMemo(() => (ds?.categories || []).filter((c) => c.kind === "statement_type").map((c) => c.slug).sort(), [ds]);

  const filtered = useMemo(() => {
    const dc = ds?.docCats || {};
    let r = journal.slice();
    if (q.trim()) { const s = q.toLowerCase(); r = r.filter((d) => (d.title || "").toLowerCase().includes(s) || d.id.toLowerCase().includes(s) || (d.location || "").toLowerCase().includes(s)); }
    if (dFrom) r = r.filter((d) => (d.entry_date || "") >= dFrom);
    if (dTo) r = r.filter((d) => (d.entry_date || "") <= dTo);
    if (part) r = r.filter((d) => String(d.part) === part);
    if (loc) r = r.filter((d) => d.location === loc);
    if (audioOnly) r = r.filter((d) => !!d.audio_url);
    if (cat) r = r.filter((d) => (dc[d.id] || []).includes(cat));
    if (stype) r = r.filter((d) => (dc[d.id] || []).includes(stype));
    const dir = sort === "newest" ? -1 : 1;
    r.sort((a, b) => dir * ((a.entry_date || "").localeCompare(b.entry_date || "") || (a.recording_index || 0) - (b.recording_index || 0)));
    return r;
  }, [journal, ds, q, dFrom, dTo, part, loc, audioOnly, cat, stype, sort]);

  useEffect(() => { setPage(1); }, [q, dFrom, dTo, part, loc, cat, stype, audioOnly, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = useMemo(() => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filtered, page]);

  useEffect(() => {
    if (!ds) return; let alive = true;
    Promise.all(pageItems.filter((d) => excerpts[d.id] === undefined).map(async (d) => [d.id, excerpt(await getBody(d.id, ds.source))] as const))
      .then((pairs) => { if (alive && pairs.length) setExcerpts((prev) => ({ ...prev, ...Object.fromEntries(pairs) })); });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageItems, ds]);

  useEffect(() => {
    if (!sel || !ds) return;
    setBodyLoading(true); setBody(""); track("entry_opened", { id: sel });
    getBody(sel, ds.source).then((b) => { setBody(b); setBodyLoading(false); });
  }, [sel, ds]);

  const selDoc = ds?.docs.find((d) => d.id === sel) || null;
  const selIdx = selDoc ? filtered.findIndex((d) => d.id === selDoc.id) : -1;

  const resetFilters = () => { setQ(""); setDFrom(""); setDTo(""); setPart(""); setLoc(""); setCat(""); setSType(""); setAudioOnly(false); };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header
        tab={tab}
        onTab={(t) => { setTab(t); setSel(null); setGsel(null); }}
        onSearch={() => { setPanelOpen(true); track("search_opened"); }}
        onExport={() => { setExportOpen(true); track("export_opened"); }}
        onHome={() => { setTab("journal"); setSel(null); setGsel(null); setPage(1); }}
      />

      <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 sm:px-6 py-6">
        {!loading && (
          <TitleBand
            title={TAB_TITLE[tab]}
            actions={
              tab === "journal" && !selDoc ? (
                <PageActions>
                  <SortMenu
                    value={sort}
                    onChange={(v) => { setSort(v); track("sort_changed", { sort: v }); }}
                  />
                </PageActions>
              ) : undefined
            }
          />
        )}
        {loading ? (
          <div className="text-muted text-center py-20">Loading corpus…</div>
        ) : tab === "glossary" ? (
          <GlossarySection terms={glossaryTerms} gcat={gcat} setGcat={setGcat} gsel={gsel} setGsel={setGsel} />
        ) : tab === "documents" ? (
          <DocumentsView />
        ) : tab === "data" ? (
          <DataView />
        ) : tab === "concepts" ? (
          <ConceptsView />
        ) : tab === "author" ? (
          <AuthorView />
        ) : tab === "disclaimer" ? (
          <DisclaimerView />
        ) : (
          <div>
            <div className="min-w-0">
              {selDoc ? (
                <Reader
                  doc={selDoc} body={body} bodyLoading={bodyLoading} cats={ds?.docCats[selDoc.id] || []} gloss={ds?.docGloss[selDoc.id] || []}
                  onBack={() => setSel(null)}
                  onPrev={selIdx > 0 ? () => setSel(filtered[selIdx - 1].id) : undefined}
                  onNext={selIdx >= 0 && selIdx < filtered.length - 1 ? () => setSel(filtered[selIdx + 1].id) : undefined}
                />
              ) : (
                <Feed items={pageItems} excerpts={excerpts} docCats={ds?.docCats || {}} total={filtered.length}
                  page={page} totalPages={totalPages} setPage={setPage} onOpen={setSel} onSearch={() => setPanelOpen(true)} />
              )}
            </div>
          </div>
        )}
        {!loading && tab === "journal" && !selDoc && (
          <GlossaryPeek terms={glossaryTerms} onView={() => { setTab("glossary"); setSel(null); setGsel(null); }} onOpen={(slug: string) => { setTab("glossary"); setSel(null); setGsel(slug); }} />
        )}
        {!loading && tab === "glossary" && !gsel && (
          <JournalPeek items={journal} source={ds?.source} onView={() => { setTab("journal"); setSel(null); setGsel(null); }} onOpen={(id: string) => { setTab("journal"); setGsel(null); setSel(id); }} />
        )}
      </main>

      <Footer onNav={(t) => { setTab(t); setSel(null); setGsel(null); }} />

      <FilterPanel
        open={panelOpen} onOpenChange={setPanelOpen} resultCount={filtered.length}
        q={q} setQ={setQ} dFrom={dFrom} setDFrom={setDFrom} dTo={dTo} setDTo={setDTo}
        part={part} setPart={setPart} loc={loc} setLoc={setLoc} cat={cat} setCat={setCat}
        stype={stype} setSType={setSType} audioOnly={audioOnly} setAudioOnly={setAudioOnly}
        parts={parts} locs={locs} topics={topics} stypes={stypes} onReset={resetFilters}
      />
      <ExportModal open={exportOpen} onOpenChange={setExportOpen} />
    </div>
  );
}

const TAB_TITLE: Record<Tab, string> = { journal: "Journal", glossary: "Glossary", documents: "Documents", data: "Data", concepts: "Concepts", author: "Author", disclaimer: "Disclaimer" };

// ~200px page-title band under the nav; its h1 is the current section name,
// left-aligned and larger than any other heading. 80% width via its parent <main>.
function TitleBand({ title, actions }: { title: string; actions?: React.ReactNode }) {
  return (
    <section className="w-full min-h-[160px] flex items-end justify-between gap-6 mb-8 pb-6">
      <h1 className="font-display font-bold tracking-tight text-foreground text-[25px] md:text-[34px] lg:text-[42px] leading-none">{title}</h1>
      {actions}
    </section>
  );
}

/* ---------- Feed ---------- */
function Feed({ items, excerpts, docCats, total, page, totalPages, setPage, onOpen, onSearch }: any) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <span />
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted">{total} entries · page {page} of {totalPages}</span>
          <ShareMenu title={`${SITE} — Journal`} align="right" />
        </div>
      </div>
      <div className="space-y-10">
        {items.map((d: Doc) => (
          <Link key={d.id} href={journalHref(d.id)} onClick={spaClick(() => onOpen(d.id))} className="group block w-full text-left">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-muted">
              <span>{d.doc_type}</span>
              {d.audio_url && <span className="text-accent inline-flex items-center gap-1"><Volume2 size={12} /> audio</span>}
              {d.part != null && <span className="ml-auto">Part {d.part}</span>}
            </div>
            <div className="mt-1.5 font-display text-[19px] font-semibold text-foreground group-hover:text-accent transition-colors">{d.title || d.id}</div>
            <div className="text-[12px] text-muted mt-0.5">{d.entry_date}{d.weekday ? ` · ${d.weekday}` : ""}{d.recording_time ? ` · ${d.recording_time}` : ""}</div>
            <p className="mt-2.5 body-copy text-foreground/80 line-clamp-3">{excerpts[d.id] ?? "…"}</p>
            <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[11px] uppercase tracking-wide text-muted">
              {(docCats[d.id] || []).slice(0, 4).map((c: string) => <span key={c}>{cap(c)}</span>)}
            </div>
            <div className="mt-3 text-accent text-sm">Read →</div>
          </Link>
        ))}
        {items.length === 0 && <div className="text-muted text-sm py-10 text-center">No entries match. <button onClick={onSearch} className="text-accent underline">Adjust filters</button></div>}
      </div>
      {totalPages > 1 && <Pager page={page} totalPages={totalPages} setPage={setPage} />}
    </div>
  );
}
function Pager({ page, totalPages, setPage }: any) {
  const nums: number[] = [];
  const start = Math.max(1, page - 2), end = Math.min(totalPages, start + 4);
  for (let i = Math.max(1, end - 4); i <= end; i++) nums.push(i);
  const go = (p: number) => { setPage(Math.min(totalPages, Math.max(1, p))); window.scrollTo({ top: 0 }); };
  return (
    <Pagination className="mt-8">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious onClick={() => go(page - 1)} disabled={page === 1} className="disabled:opacity-40" />
        </PaginationItem>
        {nums[0] > 1 && <PaginationItem><PaginationLink onClick={() => go(1)}>1</PaginationLink></PaginationItem>}
        {nums[0] > 2 && <PaginationItem><PaginationEllipsis /></PaginationItem>}
        {nums.map((n) => (
          <PaginationItem key={n}>
            <PaginationLink isActive={n === page} onClick={() => go(n)}>{n}</PaginationLink>
          </PaginationItem>
        ))}
        {nums[nums.length - 1] < totalPages - 1 && <PaginationItem><PaginationEllipsis /></PaginationItem>}
        {nums[nums.length - 1] < totalPages && <PaginationItem><PaginationLink onClick={() => go(totalPages)}>{totalPages}</PaginationLink></PaginationItem>}
        <PaginationItem>
          <PaginationNext onClick={() => go(page + 1)} disabled={page === totalPages} className="disabled:opacity-40" />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

/* ---------- Reader ---------- */
function Reader({ doc, body, bodyLoading, cats, gloss, onBack, onPrev, onNext }: any) {
  return (
    <article className="w-full mx-auto">
      <div className="flex items-center justify-between mb-4">
        <button onClick={onBack} className="text-sm text-accent inline-flex items-center gap-1"><ChevronLeft size={15} /> Back to journal</button>
        <ShareMenu title={`${doc.title || doc.id} — ${SITE}`} align="right" />
      </div>
      <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted mb-2">
        <span className="font-mono">{doc.id}</span>
        {cats.map((c: string) => <span key={c} className="uppercase tracking-wide">{cap(c)}</span>)}
      </div>
      <h1 className="font-display text-[21px] font-semibold text-foreground mb-1 leading-tight">{doc.title || doc.id}</h1>
      <div className="text-sm text-muted mb-5">
        {doc.entry_date}{doc.weekday ? ` · ${doc.weekday}` : ""}{doc.audio_duration ? ` · ${doc.audio_duration}` : ""}
        {doc.audio_url && <> · <a className="text-accent underline" href={doc.audio_url} target="_blank" rel="noreferrer">audio ↗</a></>}
        {doc.source_url && <> · <a className="text-accent underline" href={doc.source_url} target="_blank" rel="noreferrer">source ↗</a></>}
      </div>
      {gloss.length > 0 && <div className="text-xs text-muted mb-5">Glossary: {gloss.map(cap).join(", ")}</div>}
      {bodyLoading ? <div className="text-muted text-sm">Loading…</div> : <Transcript md={body} />}
      <div className="flex gap-3 mt-12 pt-6">
        {onPrev ? <button onClick={onPrev} className="text-accent text-sm inline-flex items-center gap-1"><ChevronLeft size={15} /> Previous</button> : <span />}
        {onNext && <button onClick={onNext} className="text-accent text-sm ml-auto inline-flex items-center gap-1">Next <ChevronRight size={15} /></button>}
      </div>
    </article>
  );
}

/* ---------- Glossary ---------- */
function GlossarySection({ terms, gcat, setGcat, gsel, setGsel }: any) {
  let content;
  const gi = gsel ? terms.findIndex((t: any) => t.slug === gsel) : -1;
  // In-app handler for internal links inside a definition (e.g. "Related terms").
  // Resolves a /glossary/<slug> href to a term and swaps the content in place;
  // anything it can't resolve falls back to a real navigation.
  const openInternal = (href: string) => {
    const mm = href.match(/^\/glossary\/([^/?#]+)/i);
    if (mm) {
      const slug = decodeURIComponent(mm[1]).toLowerCase();
      const found = terms.find((t: any) => (t.slug || "").toLowerCase() === slug);
      if (found) { setGsel(found.slug); return; }
    }
    if (typeof window !== "undefined") window.location.assign(href);
  };
  if (gsel && gi >= 0) {
    content = (
      <GlossaryTermReader
        term={terms[gi]}
        onOpenTerm={openInternal}
        onBack={() => setGsel(null)}
        onPrev={gi > 0 ? () => setGsel(terms[gi - 1].slug) : undefined}
        onNext={gi < terms.length - 1 ? () => setGsel(terms[gi + 1].slug) : undefined}
      />
    );
  } else {
    content = <GlossaryList terms={terms} gcat={gcat} setGcat={setGcat} onOpen={setGsel} />;
  }
  return (
    <div className="lg:grid lg:grid-cols-[13rem_65%_1fr] lg:gap-x-8 lg:items-start">
      <GlossarySidebar terms={terms} activeSlug={gsel} onOpen={setGsel} />
      <div className="min-w-0">
        <IndexDrawer
          triggerLabel="Terms"
          title="Terms"
          itemClassName="term-title"
          items={terms.map((t: any) => ({ key: t.slug, label: cleanTerm(t.term), active: gsel === t.slug, onOpen: () => setGsel(t.slug) }))}
        />
        {content}
      </div>
    </div>
  );
}

// Dated day index for the journal — desktop only, mirrors the glossary sidebar.
// One link per calendar day; clicking opens that day's first entry in-app.
function GlossarySidebar({ terms, activeSlug, onOpen }: any) {
  return (
    <aside className="hidden lg:block w-52 self-start pr-2">
      <div className="text-[11px] uppercase tracking-wide text-muted mb-3">Terms</div>
      <ul className="space-y-1.5">
        {terms.map((t: any) => (
          <li key={t.slug}>
            <Link
              href={glossaryHref(t.slug)}
              onClick={spaClick(() => onOpen(t.slug))}
              className={`block text-sm term-title leading-[1.6] transition-colors ${activeSlug === t.slug ? "text-accent" : "text-muted hover:text-foreground"}`}
            >
              {cleanTerm(t.term)}
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}

function GlossaryList({ terms, gcat, setGcat, onOpen }: any) {
  const shown = terms.filter((t: any) => !gcat || t.term.toLowerCase().includes(gcat.toLowerCase()) || (t.definition || "").toLowerCase().includes(gcat.toLowerCase()));
  // Paginate the term list, matching the journal feed (same PAGE_SIZE + Pager).
  const [gpage, setGpage] = useState(1);
  useEffect(() => { setGpage(1); }, [gcat]);
  const totalPages = Math.max(1, Math.ceil(shown.length / PAGE_SIZE));
  const page = Math.min(gpage, totalPages);
  const pageItems = shown.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  return (
    <div className="w-full mx-auto">
      <div className="flex items-center justify-between mb-5">
        <span className="text-xs text-muted">{shown.length} terms · page {page} of {totalPages}</span>
        <div className="flex items-center gap-2">
          <Input value={gcat} onChange={(e) => setGcat(e.target.value)} placeholder="Filter terms…" className="w-44" />
          <ShareMenu title={`${SITE} — Glossary`} align="right" />
        </div>
      </div>
      <div className="space-y-8">
        {pageItems.map((t: any) => {
          const { pron, body } = splitDef(t.definition);
          return (
            <Link key={t.slug} href={glossaryHref(t.slug)} onClick={spaClick(() => onOpen(t.slug))} className="group block w-full text-left">
              <h2 className="font-display text-xl font-semibold text-foreground group-hover:text-accent transition-colors term-title">{cleanTerm(t.term)}</h2>
              {pron && <div className="text-xs text-muted italic mt-1">{pron}</div>}
              <p className="body-copy text-foreground/85 mt-2 whitespace-pre-wrap line-clamp-3">{cleanDef(body)}</p>
              <div className="mt-2 text-accent text-sm">Read →</div>
            </Link>
          );
        })}
        {shown.length === 0 && <div className="text-muted text-sm py-10 text-center">No terms match “{gcat}”.</div>}
      </div>
      {totalPages > 1 && <Pager page={page} totalPages={totalPages} setPage={setGpage} />}
    </div>
  );
}

function GlossaryTermReader({ term, onBack, onPrev, onNext, onOpenTerm }: any) {
  const { pron, body } = splitDef(term.definition);
  return (
    <article className="w-full mx-auto">
      <div className="flex items-center justify-between mb-4">
        <button onClick={onBack} className="text-sm text-accent inline-flex items-center gap-1"><ChevronLeft size={15} /> Back to glossary</button>
        <ShareMenu title={`${cleanTerm(term.term)} — ${SITE}`} align="right" />
      </div>
      <p className="text-xs uppercase tracking-[0.14em] text-muted mb-2">Glossary</p>
      <h1 className="font-display text-[21px] font-semibold text-foreground mb-1 leading-tight term-title">{cleanTerm(term.term)}</h1>
      {pron && <div className="text-sm text-muted italic mb-5">{pron}</div>}
      <GlossaryIllustration slug={term.slug} />
      <GlossaryBody text={body} onInternalNav={onOpenTerm} />
      <div className="flex gap-3 mt-12 pt-6">
        {onPrev ? <button onClick={onPrev} className="text-accent text-sm inline-flex items-center gap-1"><ChevronLeft size={15} /> Previous</button> : <span />}
        {onNext && <button onClick={onNext} className="text-accent text-sm ml-auto inline-flex items-center gap-1">Next <ChevronRight size={15} /></button>}
      </div>
    </article>
  );
}

// Mobile-only index drawer (shadcn Sheet) mirroring the desktop sidebars.
// A List-icon trigger opens a left sheet with the same links; hidden on lg+.
function IndexDrawer({ triggerLabel, title, items, itemClassName }: { triggerLabel: string; title: string; items: { key: string; label: string; active: boolean; onOpen: () => void }[]; itemClassName?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="lg:hidden mb-6">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <button className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground">
            <List size={16} /> {triggerLabel}
          </button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72">
          <SheetHeader className="mb-4">
            <SheetTitle className="text-[11px] uppercase tracking-wide text-muted">{title}</SheetTitle>
          </SheetHeader>
          <ul className="space-y-1.5">
            {items.map((it) => (
              <li key={it.key}>
                <button
                  onClick={() => { it.onOpen(); setOpen(false); if (typeof window !== "undefined") window.scrollTo({ top: 0 }); }}
                  className={`block w-full text-left text-sm leading-[1.6] transition-colors ${itemClassName || ""} ${it.active ? "text-accent" : "text-muted hover:text-foreground"}`}
                >
                  {it.label}
                </button>
              </li>
            ))}
          </ul>
        </SheetContent>
      </Sheet>
    </div>
  );
}

/* ---------- Peek carousels (auto-rotating cross-links) ---------- */
function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function PeekCarousel({ title, cta, onCta, slides, bottomCta }: { title: string; cta: string; onCta: () => void; slides: JSX.Element[]; bottomCta?: boolean }) {
  const autoplay = useRef(Autoplay({ delay: 6000, stopOnInteraction: false, stopOnMouseEnter: true }));
  return (
    <section className="mt-16 pt-8 min-h-[460px]">
      <div className="w-full">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display text-lg font-semibold text-foreground">{title}</h2>
        <button onClick={onCta} className="text-sm text-accent hover:underline inline-flex items-center gap-1">{cta} <ChevronRight size={15} /></button>
      </div>
      {/* Carousel fills the full main container width, matching TitleBand above it,
          so the bottom section lines up with the page on both journal and glossary.
          (It was previously inset to the old 13rem-sidebar + 65% column layout.) */}
      <Carousel opts={{ loop: true, align: "start" }} plugins={[autoplay.current]} className="w-full">
        <CarouselContent>
          {slides.map((s, i) => (
            <CarouselItem key={i}>{s}</CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="-left-12" />
        <CarouselNext className="-right-12" />
      </Carousel>
      {bottomCta && (
        <div className="mt-6 flex justify-center">
          <Button size="lg" onClick={onCta} className="inline-flex items-center gap-1.5">{cta} <ChevronRight size={16} /></Button>
        </div>
      )}
      </div>
    </section>
  );
}

function GlossaryPeek({ terms, onView, onOpen }: any) {
  const sample = useMemo(() => shuffle(terms).slice(0, 9), [terms]);
  const slides = sample.map((t: any) => (
    <Link key={t.slug} href={glossaryHref(t.slug)} onClick={spaClick(() => onOpen(t.slug))} className="group flex h-[340px] md:h-[360px] flex-col justify-center pr-8">
      <div className="text-[11px] uppercase tracking-wide text-muted mb-2">Glossary</div>
      <div className="font-display text-3xl font-semibold text-foreground group-hover:text-accent term-title">{cleanTerm(t.term)}</div>
      <p className="mt-4 body-copy text-foreground/85 line-clamp-3 overflow-hidden">{firstSentences(cleanDef(splitDef(t.definition).body), 2)}</p>
      <div className="mt-5 text-accent text-base">Read →</div>
    </Link>
  ));
  return <PeekCarousel title="From the glossary" cta="Go to Glossary" onCta={onView} slides={slides} bottomCta />;
}

function JournalPeek({ items, source, onView, onOpen }: any) {
  const sample = useMemo(() => shuffle(items).slice(0, 9), [items]);
  // Load a truncated excerpt of each sampled journal entry so the card shows
  // real body text, not just the title.
  const [ex, setEx] = useState<Record<string, string>>({});
  useEffect(() => {
    let alive = true;
    Promise.all(
      sample.map(async (d: any) => {
        try { return [d.id, excerpt(await getBody(d.id, source))] as const; }
        catch { return [d.id, ""] as const; }
      })
    ).then((pairs) => { if (alive) setEx(Object.fromEntries(pairs)); });
    return () => { alive = false; };
  }, [sample, source]);
  const slides = sample.map((d: any) => (
    <Link key={d.id} href={journalHref(d.id)} onClick={spaClick(() => onOpen(d.id))} className="group flex h-[380px] md:h-[400px] flex-col justify-center pr-8">
      <div className="text-[11px] uppercase tracking-wide text-muted">Journal · {d.entry_date}{d.part != null ? ` · Part ${d.part}` : ""}</div>
      <div className="mt-2 font-display text-2xl font-semibold text-foreground group-hover:text-accent line-clamp-2">{d.title || d.id}</div>
      <p className="mt-4 flex-1 body-copy text-foreground/80 line-clamp-[7] overflow-hidden">{ex[d.id] ?? "…"}</p>
      <div className="mt-4 text-accent text-sm">Read →</div>
    </Link>
  ));
  return <PeekCarousel title="From the journal" cta="View Journal" onCta={onView} slides={slides} />;
}

/* ---------- Filter panel (slide-over) ---------- */
const ALL_VALUE = "__all__";
function Sel({ label, value, onChange, options, all }: any) {
  return (
    <label className="block text-xs text-muted">{label}
      <Select value={value ? value : ALL_VALUE} onValueChange={(v) => onChange(v === ALL_VALUE ? "" : v)}>
        <SelectTrigger className="mt-1 w-full">
          <SelectValue placeholder={all} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_VALUE}>{all}</SelectItem>
          {options.map((o: any) => <SelectItem key={o.v} value={o.v}>{o.l}</SelectItem>)}
        </SelectContent>
      </Select>
    </label>
  );
}
function FilterPanel(p: any) {
  return (
    <Sheet open={p.open} onOpenChange={p.onOpenChange}>
      <SheetContent side="right" className="w-full max-w-sm p-5">
        <SheetHeader className="mb-4">
          <SheetTitle>Search &amp; filter</SheetTitle>
        </SheetHeader>
        <div className="space-y-3">
          <Input autoFocus value={p.q} onChange={(e: any) => p.setQ(e.target.value)} placeholder="Search title, id, location" />
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs text-muted">From<Input type="date" value={p.dFrom} onChange={(e: any) => p.setDFrom(e.target.value)} className="mt-1" /></label>
            <label className="text-xs text-muted">To<Input type="date" value={p.dTo} onChange={(e: any) => p.setDTo(e.target.value)} className="mt-1" /></label>
          </div>
          <Sel label="Part" value={p.part} onChange={p.setPart} options={p.parts.map((x: number) => ({ v: String(x), l: `Part ${x}` }))} all="All parts" />
          <Sel label="Location" value={p.loc} onChange={p.setLoc} options={p.locs.map((x: string) => ({ v: x, l: x }))} all="All locations" />
          <Sel label="Topic" value={p.cat} onChange={p.setCat} options={p.topics.map((x: string) => ({ v: x, l: cap(x) }))} all="All topics" />
          <Sel label="Statement type" value={p.stype} onChange={p.setSType} options={p.stypes.map((x: string) => ({ v: x, l: cap(x) }))} all="Any statement type" />
          <label className="flex items-center gap-2 text-sm text-muted pt-1"><input type="checkbox" checked={p.audioOnly} onChange={(e: any) => p.setAudioOnly(e.target.checked)} /> Has audio only</label>
        </div>
        <div className="flex items-center gap-3 mt-6">
          <button onClick={p.onReset} className="text-xs text-accent hover:underline">Reset</button>
          <Button className="ml-auto" onClick={() => p.onOpenChange(false)}>Show {p.resultCount} results</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* ---------- Export modal ---------- */
function ExportModal({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Export the corpus</DialogTitle>
        </DialogHeader>
        <p className="body-copy text-foreground/80">
          You&rsquo;re about to download the <strong>Invisible Ships corpus</strong> as a <strong>.zip of Markdown files</strong> — the journal, transcripts, references, and glossary, plus the site-produced Government Cloud and Public Health Signals research tables — structured for use with AI tools.
        </p>
        <p className="text-xs text-muted">
          The files carry the author&rsquo;s copyright and Critical Disclaimer. Please use them in their complete, original form.
        </p>
        <div className="flex items-center gap-3 mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <a className="ml-auto" href="/api/corpus?from=export_dialog" download onClick={() => track("export_downloaded")}>
            <Button>Download .zip</Button>
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- Documents ---------- */
function DocumentsView() {
  return (
    // Full main-container width, matching the journal feed and glossary page.
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        <span />
        <ShareMenu title={`${SITE} — Documents`} align="right" />
      </div>
      <p className="text-sm text-muted mb-5">Additional documents beyond the four-part journal series.</p>
      <div className="space-y-10">
        {DOCUMENTS.map((d) => (
          <a key={d.title} href={d.url} target="_blank" rel="noreferrer" className="group block">
            <div className="font-display text-[18px] font-semibold text-foreground group-hover:text-accent transition-colors">{d.title}</div>
            <div className="text-[13px] text-accent mt-0.5">{d.subline}</div>
            <p className="mt-2 body-copy text-foreground/80">{d.description}</p>
            <div className="mt-3 text-accent text-sm">Open document ↗</div>
          </a>
        ))}
      </div>
    </div>
  );
}

/* ---------- Author ---------- */
function AuthorView() {
  return (
    <div className="w-full lg:w-[65%] lg:mx-auto">
      <h2 className="font-display text-3xl font-semibold text-foreground mb-5">About the Author</h2>
      <div className="flex flex-col sm:flex-row gap-6">
        <div className="relative w-40 h-40 bg-panel shrink-0 overflow-hidden">
          <span className="absolute inset-0 grid place-items-center text-muted text-xs">Photo</span>
          <img src={AUTHOR.photo} alt="Sean C. Harris" className="relative w-full h-full object-cover"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = "0"; }} />
        </div>
        <div>
          <p className="body-copy text-foreground/85">{AUTHOR.summary}</p>
          <p className="body-copy text-foreground/85 mt-4">{AUTHOR.bio}</p>
          <p className="text-sm text-muted mt-5">{AUTHOR.contact}</p>
        </div>
      </div>
    </div>
  );
}

/* ---------- Disclaimer ---------- */
function DisclaimerView() {
  return (
    <div className="w-full lg:w-[65%] lg:mx-auto">
      <h2 className="font-display text-3xl font-semibold text-foreground mb-5">Disclaimer, Copyright &amp; Terms of Use</h2>
      <CopyrightTerms />
    </div>
  );
}
