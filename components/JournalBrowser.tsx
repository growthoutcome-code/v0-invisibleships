"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { loadDataset, getBody } from "@/lib/data";
import type { Dataset, Doc } from "@/lib/types";
import { track } from "@/lib/analytics";
import Header, { type Tab } from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight, Volume2 } from "lucide-react";
import CopyrightTerms from "@/components/CopyrightTerms";
import ShareMenu from "@/components/ShareMenu";
import { Transcript } from "@/components/Transcript";
import { cleanTerm, cleanDef, splitDef } from "@/lib/glossary-format";
import GlossaryBody from "@/components/GlossaryBody";
import { DOCUMENTS, AUTHOR, EXTRA_GLOSSARY } from "@/lib/site-content";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

const journalHref = (id: string) => `/journal/${id.toLowerCase()}`;
const glossaryHref = (slug: string) => `/glossary/${slug.toLowerCase()}`;

const PAGE_SIZE = 10;
const SITE = "Invisible Ships";
const TABS: Tab[] = ["journal", "glossary", "documents", "author", "disclaimer"];
const cap = (s?: string | null) => (s ? s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, " ") : "");

function excerpt(md: string): string {
  const lines = (md || "").split("\n").map((l) => l.trim()).filter(Boolean)
    .filter((l) => !l.startsWith("#") && !l.startsWith("**Audio") && !/^File duration/i.test(l));
  const text = lines.join(" ")
    .replace(/\[[0-9:]+\]/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\*\*/g, "").replace(/\s+/g, " ").trim();
  return text.length > 240 ? text.slice(0, 240) + "…" : text;
}

export default function JournalBrowser() {
  const [ds, setDs] = useState<Dataset | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("journal");

  const [q, setQ] = useState(""); const [dFrom, setDFrom] = useState(""); const [dTo, setDTo] = useState("");
  const [part, setPart] = useState(""); const [loc, setLoc] = useState("");
  const [cat, setCat] = useState(""); const [stype, setSType] = useState(""); const [audioOnly, setAudioOnly] = useState(false);
  const [gcat, setGcat] = useState("");

  const [page, setPage] = useState(1);
  const [sel, setSel] = useState<string | null>(null);
  const [gsel, setGsel] = useState<string | null>(null);
  const [body, setBody] = useState(""); const [bodyLoading, setBodyLoading] = useState(false);
  const [excerpts, setExcerpts] = useState<Record<string, string>>({});
  const [panelOpen, setPanelOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [deepLinked, setDeepLinked] = useState(false);

  useEffect(() => { loadDataset().then((d) => { setDs(d); setLoading(false); }).catch(() => setLoading(false)); }, []);

  // Deep-link IN: once the dataset is available, honor ?entry= / ?view= so a
  // shared link reopens the exact content (after the gate).
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
    } catch { /* ignore */ }
    setDeepLinked(true);
  }, [ds, deepLinked]);

  // Deep-link OUT: keep the URL in sync with the current view so it's shareable.
  useEffect(() => {
    if (!deepLinked) return;
    try {
      const params = new URLSearchParams();
      if (sel) params.set("entry", sel);
      else if (tab === "glossary" && gsel) params.set("term", gsel);
      else if (tab !== "journal") params.set("view", tab);
      const qs = params.toString();
      window.history.replaceState(null, "", window.location.pathname + (qs ? `?${qs}` : "") + window.location.hash);
    } catch { /* ignore */ }
  }, [tab, sel, gsel, deepLinked]);

  // Track + scroll to top when a glossary term opens.
  useEffect(() => {
    if (gsel) { track("term_opened", { slug: gsel }); window.scrollTo({ top: 0 }); }
  }, [gsel]);

  const journal = useMemo(() => (ds?.docs || []).filter((d) => d.collection === "journal"), [ds]);
  // Full glossary, sorted — used for deep-link validation and prev/next term navigation.
  const glossaryTerms = useMemo(
    () => [...(ds?.glossary || []), ...EXTRA_GLOSSARY].sort((a: any, b: any) => a.term.localeCompare(b.term)),
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
    r.sort((a, b) => (a.entry_date || "").localeCompare(b.entry_date || "") || (a.recording_index || 0) - (b.recording_index || 0));
    return r;
  }, [journal, ds, q, dFrom, dTo, part, loc, audioOnly, cat, stype]);

  useEffect(() => { setPage(1); }, [q, dFrom, dTo, part, loc, cat, stype, audioOnly]);

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

      <main className="flex-1 w-[80%] max-w-none mx-auto px-4 py-6">
        {!loading && <TitleBand title={TAB_TITLE[tab]} />}
        {loading ? (
          <div className="text-muted text-center py-20">Loading corpus…</div>
        ) : tab === "glossary" ? (
          <GlossarySection terms={glossaryTerms} gcat={gcat} setGcat={setGcat} gsel={gsel} setGsel={setGsel} />
        ) : tab === "documents" ? (
          <DocumentsView />
        ) : tab === "author" ? (
          <AuthorView />
        ) : tab === "disclaimer" ? (
          <DisclaimerView />
        ) : selDoc ? (
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
        {!loading && tab === "journal" && !selDoc && (
          <GlossaryPeek terms={glossaryTerms} onView={() => { setTab("glossary"); setSel(null); setGsel(null); }} />
        )}
        {!loading && tab === "glossary" && !gsel && (
          <JournalPeek items={journal} onView={() => { setTab("journal"); setSel(null); setGsel(null); }} />
        )}
      </main>

      <Footer onNav={(t) => { setTab(t); setSel(null); setGsel(null); }} />

      {panelOpen && (
        <FilterPanel
          onClose={() => setPanelOpen(false)} resultCount={filtered.length}
          q={q} setQ={setQ} dFrom={dFrom} setDFrom={setDFrom} dTo={dTo} setDTo={setDTo}
          part={part} setPart={setPart} loc={loc} setLoc={setLoc} cat={cat} setCat={setCat}
          stype={stype} setSType={setSType} audioOnly={audioOnly} setAudioOnly={setAudioOnly}
          parts={parts} locs={locs} topics={topics} stypes={stypes} onReset={resetFilters}
        />
      )}
      {exportOpen && <ExportModal onClose={() => setExportOpen(false)} />}
    </div>
  );
}

const TAB_TITLE: Record<Tab, string> = { journal: "Journal", glossary: "Glossary", documents: "Documents", author: "Author", disclaimer: "Disclaimer" };

// ~200px page-title band under the nav; its h1 is the current section name,
// left-aligned and larger than any other heading. 80% width via its parent <main>.
function TitleBand({ title }: { title: string }) {
  return (
    <section className="w-full min-h-[140px] md:min-h-[180px] lg:min-h-[200px] flex items-end border-b border-edge mb-8 pb-6">
      <h1 className="font-display font-bold tracking-tight text-foreground text-4xl md:text-5xl lg:text-6xl leading-none">{title}</h1>
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
          <Link key={d.id} href={journalHref(d.id)} className="group block w-full text-left">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-muted">
              <span>{d.doc_type}</span>
              {d.audio_url && <span className="text-accent inline-flex items-center gap-1"><Volume2 size={12} /> audio</span>}
              {d.part != null && <span className="ml-auto">Part {d.part}</span>}
            </div>
            <div className="mt-1.5 font-display text-[19px] font-semibold text-foreground group-hover:text-accent transition-colors">{d.title || d.id}</div>
            <div className="text-[12px] text-muted mt-0.5">{d.entry_date}{d.weekday ? ` · ${d.weekday}` : ""}{d.recording_time ? ` · ${d.recording_time}` : ""}</div>
            <p className="mt-2.5 font-serif text-[20px] text-foreground/80 leading-[1.5] line-clamp-3">{excerpts[d.id] ?? "…"}</p>
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
    <div className="flex items-center justify-center gap-1.5 mt-8">
      <button onClick={() => go(page - 1)} disabled={page === 1} className="px-2.5 py-1.5 text-sm text-muted hover:text-foreground disabled:opacity-40 inline-flex items-center"><ChevronLeft size={16} /></button>
      {nums[0] > 1 && <button onClick={() => go(1)} className="px-3 py-1.5 text-sm text-muted hover:text-foreground">1</button>}
      {nums[0] > 2 && <span className="text-muted px-1">…</span>}
      {nums.map((n) => (
        <button key={n} onClick={() => go(n)} className={`px-3 py-1.5 text-sm ${n === page ? "bg-accent text-primary-foreground" : "text-muted hover:text-foreground"}`}>{n}</button>
      ))}
      {nums[nums.length - 1] < totalPages - 1 && <span className="text-muted px-1">…</span>}
      {nums[nums.length - 1] < totalPages && <button onClick={() => go(totalPages)} className="px-3 py-1.5 text-sm text-muted hover:text-foreground">{totalPages}</button>}
      <button onClick={() => go(page + 1)} disabled={page === totalPages} className="px-2.5 py-1.5 text-sm text-muted hover:text-foreground disabled:opacity-40 inline-flex items-center"><ChevronRight size={16} /></button>
    </div>
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
      <h1 className="font-display text-3xl font-semibold text-foreground mb-1 leading-tight">{doc.title || doc.id}</h1>
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
  if (gsel && gi >= 0) {
    content = (
      <GlossaryTermReader
        term={terms[gi]}
        onBack={() => setGsel(null)}
        onPrev={gi > 0 ? () => setGsel(terms[gi - 1].slug) : undefined}
        onNext={gi < terms.length - 1 ? () => setGsel(terms[gi + 1].slug) : undefined}
      />
    );
  } else {
    content = <GlossaryList terms={terms} gcat={gcat} setGcat={setGcat} onOpen={setGsel} />;
  }
  return (
    <div className="lg:flex lg:gap-8 lg:items-start">
      <GlossarySidebar terms={terms} activeSlug={gsel} />
      <div className="flex-1 min-w-0">{content}</div>
    </div>
  );
}

// Sticky term index — desktop only; on mobile the term list itself is the nav.
function GlossarySidebar({ terms, activeSlug }: any) {
  return (
    <aside className="hidden lg:block w-52 shrink-0 sticky top-6 self-start max-h-[calc(100vh-3rem)] overflow-y-auto no-scrollbar pr-2">
      <div className="text-[11px] uppercase tracking-wide text-muted mb-3">Terms</div>
      <ul className="space-y-1.5">
        {terms.map((t: any) => (
          <li key={t.slug}>
            <Link
              href={glossaryHref(t.slug)}
              className={`block text-sm term-title leading-snug transition-colors ${activeSlug === t.slug ? "text-accent" : "text-muted hover:text-foreground"}`}
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
  return (
    <div className="w-full mx-auto">
      <div className="flex items-center justify-between mb-5">
        <span />
        <div className="flex items-center gap-2">
          <input value={gcat} onChange={(e) => setGcat(e.target.value)} placeholder="Filter terms…"
            className="input-line w-44" />
          <ShareMenu title={`${SITE} — Glossary`} align="right" />
        </div>
      </div>
      <div className="space-y-8">
        {shown.map((t: any) => {
          const { pron, body } = splitDef(t.definition);
          return (
            <Link key={t.slug} href={glossaryHref(t.slug)} className="group block w-full text-left">
              <h2 className="font-display text-xl font-semibold text-foreground group-hover:text-accent transition-colors term-title">{cleanTerm(t.term)}</h2>
              {pron && <div className="text-xs text-muted italic mt-1">{pron}</div>}
              <p className="font-serif text-[21px] text-foreground/85 mt-2 whitespace-pre-wrap leading-[1.6] line-clamp-3">{cleanDef(body)}</p>
              <div className="mt-2 text-accent text-sm">Read →</div>
            </Link>
          );
        })}
        {shown.length === 0 && <div className="text-muted text-sm py-10 text-center">No terms match “{gcat}”.</div>}
      </div>
    </div>
  );
}

function GlossaryTermReader({ term, onBack, onPrev, onNext }: any) {
  const { pron, body } = splitDef(term.definition);
  return (
    <article className="w-full mx-auto">
      <div className="flex items-center justify-between mb-4">
        <button onClick={onBack} className="text-sm text-accent inline-flex items-center gap-1"><ChevronLeft size={15} /> Back to glossary</button>
        <ShareMenu title={`${cleanTerm(term.term)} — ${SITE}`} align="right" />
      </div>
      <p className="text-xs uppercase tracking-[0.14em] text-muted mb-2">Glossary</p>
      <h1 className="font-display text-3xl font-semibold text-foreground mb-1 leading-tight term-title">{cleanTerm(term.term)}</h1>
      {pron && <div className="text-sm text-muted italic mb-5">{pron}</div>}
      <GlossaryBody text={body} />
      <div className="flex gap-3 mt-12 pt-6">
        {onPrev ? <button onClick={onPrev} className="text-accent text-sm inline-flex items-center gap-1"><ChevronLeft size={15} /> Previous</button> : <span />}
        {onNext && <button onClick={onNext} className="text-accent text-sm ml-auto inline-flex items-center gap-1">Next <ChevronRight size={15} /></button>}
      </div>
    </article>
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

function PeekCarousel({ title, cta, onCta, slides }: { title: string; cta: string; onCta: () => void; slides: JSX.Element[] }) {
  const autoplay = useRef(Autoplay({ delay: 4000, stopOnInteraction: false, stopOnMouseEnter: true }));
  return (
    <section className="mt-16 pt-8 border-t border-edge">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg font-semibold text-foreground">{title}</h2>
        <button onClick={onCta} className="text-sm text-accent hover:underline inline-flex items-center gap-1">{cta} <ChevronRight size={15} /></button>
      </div>
      <Carousel opts={{ loop: true, align: "start" }} plugins={[autoplay.current]}>
        <CarouselContent>
          {slides.map((s, i) => (
            <CarouselItem key={i}>{s}</CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </section>
  );
}

function GlossaryPeek({ terms, onView }: any) {
  const sample = useMemo(() => shuffle(terms).slice(0, 9), [terms]);
  const slides = sample.map((t: any) => (
    <Link key={t.slug} href={glossaryHref(t.slug)} className="group flex h-full flex-col border border-edge p-4 hover:border-accent transition-colors">
      <div className="font-display text-base font-semibold text-foreground group-hover:text-accent term-title">{cleanTerm(t.term)}</div>
      <p className="mt-1.5 font-serif text-[15px] text-foreground/75 leading-snug line-clamp-3">{cleanDef(splitDef(t.definition).body)}</p>
    </Link>
  ));
  return <PeekCarousel title="From the glossary" cta="View Glossary" onCta={onView} slides={slides} />;
}

function JournalPeek({ items, onView }: any) {
  const sample = useMemo(() => shuffle(items).slice(0, 9), [items]);
  const slides = sample.map((d: any) => (
    <Link key={d.id} href={journalHref(d.id)} className="group flex h-full flex-col border border-edge p-4 hover:border-accent transition-colors">
      <div className="text-[11px] uppercase tracking-wide text-muted">{d.entry_date}{d.part != null ? ` · Part ${d.part}` : ""}</div>
      <div className="mt-1 font-display text-base font-semibold text-foreground group-hover:text-accent line-clamp-2">{d.title || d.id}</div>
    </Link>
  ));
  return <PeekCarousel title="From the journal" cta="View Journal" onCta={onView} slides={slides} />;
}

/* ---------- Filter panel (slide-over) ---------- */
function Sel({ label, value, onChange, options, all }: any) {
  return (
    <label className="block text-xs text-muted">{label}
      <select value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full bg-background border border-edge px-2 py-2 text-sm text-foreground">
        <option value="">{all}</option>
        {options.map((o: any) => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </label>
  );
}
function FilterPanel(p: any) {
  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-black/60" onClick={p.onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-sm bg-panel p-5 overflow-y-auto animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-semibold text-foreground">Search &amp; filter</h2>
          <button onClick={p.onClose} className="text-muted hover:text-foreground"><X size={20} /></button>
        </div>
        <div className="space-y-3">
          <input autoFocus value={p.q} onChange={(e: any) => p.setQ(e.target.value)} placeholder="Search title, id, location"
            className="input-line w-full" />
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs text-muted">From<input type="date" value={p.dFrom} onChange={(e: any) => p.setDFrom(e.target.value)} className="input-line mt-1 w-full" /></label>
            <label className="text-xs text-muted">To<input type="date" value={p.dTo} onChange={(e: any) => p.setDTo(e.target.value)} className="input-line mt-1 w-full" /></label>
          </div>
          <Sel label="Part" value={p.part} onChange={p.setPart} options={p.parts.map((x: number) => ({ v: String(x), l: `Part ${x}` }))} all="All parts" />
          <Sel label="Location" value={p.loc} onChange={p.setLoc} options={p.locs.map((x: string) => ({ v: x, l: x }))} all="All locations" />
          <Sel label="Topic" value={p.cat} onChange={p.setCat} options={p.topics.map((x: string) => ({ v: x, l: cap(x) }))} all="All topics" />
          <Sel label="Statement type" value={p.stype} onChange={p.setSType} options={p.stypes.map((x: string) => ({ v: x, l: cap(x) }))} all="Any statement type" />
          <label className="flex items-center gap-2 text-sm text-muted pt-1"><input type="checkbox" checked={p.audioOnly} onChange={(e: any) => p.setAudioOnly(e.target.checked)} /> Has audio only</label>
        </div>
        <div className="flex items-center gap-3 mt-6">
          <button onClick={p.onReset} className="text-xs text-accent hover:underline">Reset</button>
          <Button className="ml-auto" onClick={p.onClose}>Show {p.resultCount} results</Button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Export modal ---------- */
function ExportModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-md bg-panel p-6 animate-fade-in">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-lg font-semibold text-foreground">Export the corpus</h2>
          <button onClick={onClose} className="text-muted hover:text-foreground"><X size={20} /></button>
        </div>
        <p className="font-serif text-[16px] text-foreground/80 leading-[1.7]">
          You&rsquo;re about to download the <strong>Invisible Ships corpus</strong> as a <strong>.zip of Markdown files</strong> — the journal, transcripts, references, and glossary — structured for use with AI tools.
        </p>
        <p className="text-xs text-muted mt-3">
          The files carry the author&rsquo;s copyright and Critical Disclaimer. Please use them in their complete, original form.
        </p>
        <div className="flex items-center gap-3 mt-6">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <a className="ml-auto" href="/invisible-ships-corpus.zip" download onClick={() => track("export_downloaded")}>
            <Button>Download .zip</Button>
          </a>
        </div>
      </div>
    </div>
  );
}

/* ---------- Documents ---------- */
function DocumentsView() {
  return (
    <div>
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
            <p className="mt-2 font-serif text-[20px] text-foreground/80 leading-[1.5]">{d.description}</p>
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
    <div className="w-full">
      <h2 className="font-display text-3xl font-semibold text-foreground mb-5">About the Author</h2>
      <div className="flex flex-col sm:flex-row gap-6">
        <div className="relative w-40 h-40 bg-panel shrink-0 overflow-hidden">
          <span className="absolute inset-0 grid place-items-center text-muted text-xs">Photo</span>
          <img src={AUTHOR.photo} alt="Sean C. Harris" className="relative w-full h-full object-cover"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = "0"; }} />
        </div>
        <div>
          <p className="font-serif text-[23px] text-foreground/85 leading-[1.6]">{AUTHOR.summary}</p>
          <p className="font-serif text-[23px] text-foreground/85 leading-[1.6] mt-4">{AUTHOR.bio}</p>
          <p className="text-sm text-muted mt-5">{AUTHOR.contact}</p>
        </div>
      </div>
    </div>
  );
}

/* ---------- Disclaimer ---------- */
function DisclaimerView() {
  return (
    <div className="w-full">
      <h2 className="font-display text-3xl font-semibold text-foreground mb-5">Copyright &amp; Terms of Use</h2>
      <CopyrightTerms />
    </div>
  );
}
