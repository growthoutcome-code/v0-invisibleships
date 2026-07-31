"use client";
import { useEffect, useMemo, useState } from "react";
import { loadDataset, getBody } from "@/lib/data";
import type { Dataset, Doc } from "@/lib/types";
import { track } from "@/lib/analytics";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight, Volume2 } from "lucide-react";

const PAGE_SIZE = 10;
const cap = (s?: string | null) => (s ? s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, " ") : "");

function renderInline(text: string, key: number) {
  const nodes: React.ReactNode[] = [];
  const re = /\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*/g;
  let last = 0, m: RegExpExecArray | null, i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    if (m[1]) nodes.push(<a key={`${key}-${i}`} href={m[2]} target="_blank" rel="noreferrer" className="text-accent underline">{m[1]}</a>);
    else nodes.push(<strong key={`${key}-${i}`}>{m[3]}</strong>);
    last = re.lastIndex; i++;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}
function Transcript({ md }: { md: string }) {
  return (
    <div className="text-[15px] text-slate-200">
      {md.split("\n").map((ln, i) => {
        const t = ln.trim();
        if (!t) return null;
        if (t.startsWith("## ")) return <h3 key={i} className="text-lg font-semibold mt-4 mb-2 text-white">{t.slice(3)}</h3>;
        if (t.startsWith("# ")) return <h2 key={i} className="text-xl font-semibold mt-2 mb-3 text-white">{t.slice(2)}</h2>;
        return <p key={i} className="my-2 leading-relaxed">{renderInline(t, i)}</p>;
      })}
    </div>
  );
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

export default function JournalBrowser() {
  const [ds, setDs] = useState<Dataset | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"journal" | "glossary">("journal");

  const [q, setQ] = useState(""); const [dFrom, setDFrom] = useState(""); const [dTo, setDTo] = useState("");
  const [part, setPart] = useState(""); const [loc, setLoc] = useState("");
  const [cat, setCat] = useState(""); const [stype, setSType] = useState(""); const [audioOnly, setAudioOnly] = useState(false);
  const [gcat, setGcat] = useState("");

  const [page, setPage] = useState(1);
  const [sel, setSel] = useState<string | null>(null);
  const [body, setBody] = useState(""); const [bodyLoading, setBodyLoading] = useState(false);
  const [excerpts, setExcerpts] = useState<Record<string, string>>({});
  const [panelOpen, setPanelOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  useEffect(() => { loadDataset().then((d) => { setDs(d); setLoading(false); }).catch(() => setLoading(false)); }, []);

  const journal = useMemo(() => (ds?.docs || []).filter((d) => d.collection === "journal"), [ds]);
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
        onTab={(t) => { setTab(t); setSel(null); }}
        onSearch={() => { setPanelOpen(true); track("search_opened"); }}
        onExport={() => { setExportOpen(true); track("export_opened"); }}
        onHome={() => { setTab("journal"); setSel(null); setPage(1); }}
      />

      <main className="flex-1 w-full mx-auto max-w-4xl px-4 py-6">
        {loading ? (
          <div className="text-muted text-center py-20">Loading corpus…</div>
        ) : tab === "glossary" ? (
          <Glossary ds={ds} gcat={gcat} setGcat={setGcat} />
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
      </main>

      <Footer />

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

/* ---------- Feed ---------- */
function Feed({ items, excerpts, docCats, total, page, totalPages, setPage, onOpen, onSearch }: any) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold text-white">Journal</h1>
        <div className="text-xs text-muted">{total} entries · page {page} of {totalPages}</div>
      </div>
      <div className="space-y-4">
        {items.map((d: Doc) => (
          <button key={d.id} onClick={() => onOpen(d.id)} className="block w-full text-left rounded-xl border border-edge bg-card hover:border-accent/50 transition-colors p-5">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-muted">
              <span>{d.doc_type}</span>
              {d.audio_url && <span className="text-accent inline-flex items-center gap-1"><Volume2 size={12} /> audio</span>}
              {d.part != null && <span className="ml-auto">Part {d.part}</span>}
            </div>
            <div className="mt-1 text-white font-medium text-[17px]">{d.title || d.id}</div>
            <div className="text-[12px] text-muted mt-0.5">{d.entry_date}{d.weekday ? ` · ${d.weekday}` : ""}{d.recording_time ? ` · ${d.recording_time}` : ""}</div>
            <p className="mt-2 text-sm text-slate-300 line-clamp-3">{excerpts[d.id] ?? "…"}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {(docCats[d.id] || []).slice(0, 4).map((c: string) => <span key={c} className="text-[11px] px-2 py-0.5 rounded-full bg-edge text-muted">{cap(c)}</span>)}
            </div>
            <div className="mt-3 text-accent text-sm">Read →</div>
          </button>
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
      <button onClick={() => go(page - 1)} disabled={page === 1} className="px-2.5 py-1.5 rounded-md text-sm text-muted hover:text-white disabled:opacity-40 inline-flex items-center"><ChevronLeft size={16} /></button>
      {nums[0] > 1 && <button onClick={() => go(1)} className="px-3 py-1.5 rounded-md text-sm text-muted hover:text-white">1</button>}
      {nums[0] > 2 && <span className="text-muted px-1">…</span>}
      {nums.map((n) => (
        <button key={n} onClick={() => go(n)} className={`px-3 py-1.5 rounded-md text-sm ${n === page ? "bg-accent text-primary-foreground" : "text-muted hover:text-white"}`}>{n}</button>
      ))}
      {nums[nums.length - 1] < totalPages - 1 && <span className="text-muted px-1">…</span>}
      {nums[nums.length - 1] < totalPages && <button onClick={() => go(totalPages)} className="px-3 py-1.5 rounded-md text-sm text-muted hover:text-white">{totalPages}</button>}
      <button onClick={() => go(page + 1)} disabled={page === totalPages} className="px-2.5 py-1.5 rounded-md text-sm text-muted hover:text-white disabled:opacity-40 inline-flex items-center"><ChevronRight size={16} /></button>
    </div>
  );
}

/* ---------- Reader ---------- */
function Reader({ doc, body, bodyLoading, cats, gloss, onBack, onPrev, onNext }: any) {
  return (
    <article className="max-w-3xl mx-auto">
      <button onClick={onBack} className="text-sm text-accent mb-4 inline-flex items-center gap-1"><ChevronLeft size={15} /> Back to journal</button>
      <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted mb-2">
        <span className="font-mono">{doc.id}</span>
        {cats.map((c: string) => <span key={c} className="px-2 py-0.5 bg-edge rounded-full">{cap(c)}</span>)}
      </div>
      <h1 className="text-2xl font-semibold text-white mb-1">{doc.title || doc.id}</h1>
      <div className="text-sm text-muted mb-4">
        {doc.entry_date}{doc.weekday ? ` · ${doc.weekday}` : ""}{doc.audio_duration ? ` · ${doc.audio_duration}` : ""}
        {doc.audio_url && <> · <a className="text-accent underline" href={doc.audio_url} target="_blank" rel="noreferrer">audio ↗</a></>}
        {doc.source_url && <> · <a className="text-accent underline" href={doc.source_url} target="_blank" rel="noreferrer">source ↗</a></>}
      </div>
      {gloss.length > 0 && <div className="text-xs text-muted mb-4">Glossary: {gloss.map(cap).join(", ")}</div>}
      {bodyLoading ? <div className="text-muted text-sm">Loading…</div> : <Transcript md={body} />}
      <div className="flex gap-3 mt-10 pt-6 border-t border-edge">
        {onPrev ? <button onClick={onPrev} className="text-accent text-sm inline-flex items-center gap-1"><ChevronLeft size={15} /> Previous</button> : <span />}
        {onNext && <button onClick={onNext} className="text-accent text-sm ml-auto inline-flex items-center gap-1">Next <ChevronRight size={15} /></button>}
      </div>
    </article>
  );
}

/* ---------- Glossary ---------- */
function Glossary({ ds, gcat, setGcat }: any) {
  const terms = (ds?.glossary || []).slice().sort((a: any, b: any) => a.term.localeCompare(b.term))
    .filter((t: any) => !gcat || t.term.toLowerCase().includes(gcat.toLowerCase()) || (t.definition || "").toLowerCase().includes(gcat.toLowerCase()));
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold text-white">Glossary</h1>
        <input value={gcat} onChange={(e) => setGcat(e.target.value)} placeholder="Filter terms…"
          className="bg-ink border border-edge rounded-md px-3 py-1.5 text-sm outline-none focus:border-accent w-48" />
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        {terms.map((t: any) => (
          <div key={t.slug} className="rounded-lg border border-edge bg-card p-4">
            <div className="font-semibold text-white">{t.term}</div>
            <p className="text-sm text-slate-300 mt-1 whitespace-pre-wrap">{(t.definition || "").replace(/^#.*\n/, "").trim().slice(0, 600)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Filter panel (slide-over) ---------- */
function Sel({ label, value, onChange, options, all }: any) {
  return (
    <label className="block text-xs text-muted">{label}
      <select value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full bg-ink border border-edge rounded-md px-2 py-2 text-sm text-white">
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
      <div className="absolute right-0 top-0 h-full w-full max-w-sm bg-panel border-l border-edge p-5 overflow-y-auto animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-white">Search &amp; filter</h2>
          <button onClick={p.onClose} className="text-muted hover:text-white"><X size={20} /></button>
        </div>
        <div className="space-y-3">
          <input autoFocus value={p.q} onChange={(e: any) => p.setQ(e.target.value)} placeholder="Search title, id, location"
            className="w-full bg-ink border border-edge rounded-md px-3 py-2 text-sm outline-none focus:border-accent" />
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs text-muted">From<input type="date" value={p.dFrom} onChange={(e: any) => p.setDFrom(e.target.value)} className="mt-1 w-full bg-ink border border-edge rounded-md px-2 py-1.5 text-sm" /></label>
            <label className="text-xs text-muted">To<input type="date" value={p.dTo} onChange={(e: any) => p.setDTo(e.target.value)} className="mt-1 w-full bg-ink border border-edge rounded-md px-2 py-1.5 text-sm" /></label>
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
      <div className="relative w-full max-w-md rounded-xl border border-edge bg-panel p-6 animate-fade-in">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-white">Export the corpus</h2>
          <button onClick={onClose} className="text-muted hover:text-white"><X size={20} /></button>
        </div>
        <p className="text-sm text-slate-300">
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
