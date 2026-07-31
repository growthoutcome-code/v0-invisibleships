"use client";
import { useEffect, useMemo, useState } from "react";
import { loadDataset, getBody } from "@/lib/data";
import type { Dataset, Doc } from "@/lib/types";
import { track } from "@/lib/analytics";

/* ---------- tiny inline markdown (links + bold + timestamps) ---------- */
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
  const lines = md.split("\n");
  return (
    <div className="prose-transcript text-[15px] text-slate-200">
      {lines.map((ln, i) => {
        const t = ln.trim();
        if (!t) return null;
        if (t.startsWith("# ")) return <h2 key={i} className="text-xl font-semibold mt-2 mb-3 text-white">{t.slice(2)}</h2>;
        if (t.startsWith("## ")) return <h3 key={i} className="text-lg font-semibold mt-4 mb-2 text-white">{t.slice(3)}</h3>;
        return <p key={i}>{renderInline(t, i)}</p>;
      })}
    </div>
  );
}

const cap = (s?: string | null) => (s ? s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, " ") : "");

export default function JournalBrowser() {
  const [ds, setDs] = useState<Dataset | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"journal" | "glossary">("journal");

  // filters
  const [q, setQ] = useState("");
  const [dFrom, setDFrom] = useState(""); const [dTo, setDTo] = useState("");
  const [part, setPart] = useState(""); const [loc, setLoc] = useState("");
  const [cat, setCat] = useState(""); const [stype, setSType] = useState("");
  const [audioOnly, setAudioOnly] = useState(false);
  const [gcat, setGcat] = useState("");

  const [sel, setSel] = useState<string | null>(null);
  const [body, setBody] = useState<string>(""); const [bodyLoading, setBodyLoading] = useState(false);

  useEffect(() => {
    loadDataset().then((d) => { setDs(d); setLoading(false); }).catch((e) => { console.error(e); setLoading(false); });
  }, []);

  useEffect(() => {
    if (!sel || !ds) return;
    setBodyLoading(true); setBody("");
    track("entry_opened", { id: sel });
    getBody(sel, ds.source).then((b) => { setBody(b); setBodyLoading(false); });
  }, [sel, ds]);

  const journal = useMemo(() => (ds?.docs || []).filter((d) => d.collection === "journal"), [ds]);
  const parts = useMemo(() => Array.from(new Set(journal.map((d) => d.part).filter((p): p is number => p != null))).sort(), [journal]);
  const locations = useMemo(() => Array.from(new Set(journal.map((d) => d.location).filter((l): l is string => !!l))).sort(), [journal]);
  const topics = useMemo(() => (ds?.categories || []).filter((c) => c.kind === "category").map((c) => c.slug).sort(), [ds]);
  const stypes = useMemo(() => (ds?.categories || []).filter((c) => c.kind === "statement_type").map((c) => c.slug).sort(), [ds]);

  const filtered = useMemo(() => {
    const docCats = ds?.docCats || {};
    let rows = journal.slice();
    if (q.trim()) {
      const s = q.toLowerCase();
      rows = rows.filter((d) => (d.title || "").toLowerCase().includes(s) || d.id.toLowerCase().includes(s) || (d.location || "").toLowerCase().includes(s));
    }
    if (dFrom) rows = rows.filter((d) => (d.entry_date || "") >= dFrom);
    if (dTo) rows = rows.filter((d) => (d.entry_date || "") <= dTo);
    if (part) rows = rows.filter((d) => String(d.part) === part);
    if (loc) rows = rows.filter((d) => d.location === loc);
    if (audioOnly) rows = rows.filter((d) => !!d.audio_url);
    if (cat) rows = rows.filter((d) => (docCats[d.id] || []).includes(cat));
    if (stype) rows = rows.filter((d) => (docCats[d.id] || []).includes(stype));
    rows.sort((a, b) => (a.entry_date || "").localeCompare(b.entry_date || "") || (a.recording_index || 0) - (b.recording_index || 0));
    return rows;
  }, [journal, ds, q, dFrom, dTo, part, loc, audioOnly, cat, stype]);

  const stats = useMemo(() => {
    const dates = journal.map((d) => d.entry_date).filter(Boolean) as string[];
    dates.sort();
    return {
      total: filtered.length,
      withAudio: filtered.filter((d) => d.audio_url).length,
      recordings: filtered.filter((d) => d.doc_type === "recording").length,
      range: dates.length ? `${dates[0]} → ${dates[dates.length - 1]}` : "—",
    };
  }, [filtered, journal]);

  const selDoc = ds?.docs.find((d) => d.id === sel) || null;
  const glossary = ds?.glossary || [];
  const gterms = useMemo(() => {
    const termCat: Record<string, string[]> = ds?.docCats || {};
    let rows = glossary.slice().sort((a, b) => a.term.localeCompare(b.term));
    if (gcat) rows = rows.filter((t) => (termCat[t.document_id || ""] || []).includes(gcat));
    return rows;
  }, [glossary, gcat, ds]);

  return (
    <main className="min-h-screen flex flex-col">
      <header className="border-b border-edge bg-panel/60 backdrop-blur sticky top-0 z-10">
        <div className="px-4 py-3 flex items-center gap-4">
          <h1 className="font-semibold">Invisible Ships</h1>
          <nav className="flex gap-1 text-sm">
            {(["journal", "glossary"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-3 py-1 rounded-md ${tab === t ? "bg-accent/20 text-accent" : "text-muted hover:text-white"}`}>
                {t === "journal" ? "📓 Journal" : "📖 Glossary"}
              </button>
            ))}
          </nav>
          <div className="ml-auto text-xs text-muted">
            {ds ? <span>source: <span className={ds.source === "supabase" ? "text-low" : "text-med"}>{ds.source}</span></span> : null}
          </div>
        </div>
      </header>

      {loading ? (
        <div className="flex-1 grid place-items-center text-muted">Loading corpus…</div>
      ) : tab === "journal" ? (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[300px_360px_1fr] min-h-0">
          {/* filters */}
          <aside className="border-r border-edge p-4 space-y-3 overflow-y-auto scroll-thin">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title / id / location"
              className="w-full bg-ink border border-edge rounded-md px-3 py-2 text-sm outline-none focus:border-accent" />
            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs text-muted">From<input type="date" value={dFrom} onChange={(e) => setDFrom(e.target.value)} className="mt-1 w-full bg-ink border border-edge rounded-md px-2 py-1 text-sm" /></label>
              <label className="text-xs text-muted">To<input type="date" value={dTo} onChange={(e) => setDTo(e.target.value)} className="mt-1 w-full bg-ink border border-edge rounded-md px-2 py-1 text-sm" /></label>
            </div>
            <Select label="Part" value={part} onChange={setPart} options={parts.map((p) => ({ v: String(p), l: `Part ${p}` }))} allLabel="All parts" />
            <Select label="Location" value={loc} onChange={setLoc} options={locations.map((l) => ({ v: l, l }))} allLabel="All locations" />
            <Select label="Topic" value={cat} onChange={setCat} options={topics.map((t) => ({ v: t, l: cap(t) }))} allLabel="All topics" />
            <Select label="Statement type" value={stype} onChange={setSType} options={stypes.map((t) => ({ v: t, l: cap(t) }))} allLabel="Any statement type" />
            <label className="flex items-center gap-2 text-sm text-muted pt-1">
              <input type="checkbox" checked={audioOnly} onChange={(e) => setAudioOnly(e.target.checked)} /> Has audio only
            </label>
            <button onClick={() => { setQ(""); setDFrom(""); setDTo(""); setPart(""); setLoc(""); setCat(""); setSType(""); setAudioOnly(false); }}
              className="text-xs text-accent hover:underline">Reset filters</button>

            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-edge">
              <Stat n={stats.total} l="Entries" />
              <Stat n={stats.withAudio} l="With audio" />
              <Stat n={stats.recordings} l="Recordings" />
              <div className="col-span-2"><div className="text-[11px] text-muted">Date range</div><div className="text-xs">{stats.range}</div></div>
            </div>
          </aside>

          {/* list */}
          <ul className="border-r border-edge overflow-y-auto scroll-thin">
            {filtered.map((d) => (
              <li key={d.id}>
                <button onClick={() => setSel(d.id)}
                  className={`w-full text-left px-4 py-3 border-b border-edge/60 hover:bg-panel ${sel === d.id ? "bg-panel" : ""}`}>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] uppercase tracking-wide text-muted">{d.doc_type}</span>
                    {d.audio_url && <span className="text-[11px] text-accent">♪ audio</span>}
                    {d.part != null && <span className="ml-auto text-[11px] text-muted">Pt {d.part}</span>}
                  </div>
                  <div className="text-sm text-white mt-0.5 line-clamp-2">{d.title || d.id}</div>
                  <div className="text-[11px] text-muted mt-1">{d.entry_date}{d.weekday ? ` · ${d.weekday}` : ""}{d.recording_time ? ` · ${d.recording_time}` : ""}</div>
                </button>
              </li>
            ))}
            {filtered.length === 0 && <li className="p-4 text-sm text-muted">No entries match these filters.</li>}
          </ul>

          {/* detail */}
          <section className="overflow-y-auto scroll-thin p-6">
            {!selDoc ? (
              <div className="text-muted text-sm h-full grid place-items-center">Select an entry to read it.</div>
            ) : (
              <article className="max-w-3xl">
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted mb-2">
                  <span className="font-mono">{selDoc.id}</span>
                  {(ds?.docCats[selDoc.id] || []).map((c) => <span key={c} className="px-2 py-0.5 bg-edge rounded-full">{cap(c)}</span>)}
                </div>
                <h1 className="text-2xl font-semibold text-white mb-1">{selDoc.title || selDoc.id}</h1>
                <div className="text-sm text-muted mb-4">
                  {selDoc.entry_date}{selDoc.weekday ? ` · ${selDoc.weekday}` : ""}{selDoc.audio_duration ? ` · ${selDoc.audio_duration}` : ""}
                  {selDoc.audio_url && <> · <a className="text-accent underline" href={selDoc.audio_url} target="_blank" rel="noreferrer">audio ↗</a></>}
                  {selDoc.source_url && <> · <a className="text-accent underline" href={selDoc.source_url} target="_blank" rel="noreferrer">source ↗</a></>}
                </div>
                {(ds?.docGloss[selDoc.id] || []).length > 0 && (
                  <div className="text-xs text-muted mb-4">Glossary: {(ds?.docGloss[selDoc.id] || []).map(cap).join(", ")}</div>
                )}
                {bodyLoading ? <div className="text-muted text-sm">Loading…</div> : <Transcript md={body} />}
                <div className="flex gap-3 mt-8 text-sm">
                  {selDoc.prev_id && <button onClick={() => setSel(selDoc.prev_id!)} className="text-accent hover:underline">← previous</button>}
                  {selDoc.next_id && <button onClick={() => setSel(selDoc.next_id!)} className="text-accent hover:underline ml-auto">next →</button>}
                </div>
              </article>
            )}
          </section>
        </div>
      ) : (
        /* glossary */
        <div className="flex-1 overflow-y-auto scroll-thin p-6">
          <div className="max-w-3xl mx-auto">
            <div className="mb-4"><input value={gcat} onChange={(e) => setGcat(e.target.value)} placeholder="Filter by category slug (optional)"
              className="w-full bg-ink border border-edge rounded-md px-3 py-2 text-sm outline-none focus:border-accent" /></div>
            <div className="grid sm:grid-cols-2 gap-3">
              {gterms.map((t) => (
                <div key={t.slug} className="bg-panel border border-edge rounded-lg p-4">
                  <div className="font-semibold text-white">{t.term}</div>
                  <p className="text-sm text-slate-300 mt-1 whitespace-pre-wrap">{(t.definition || "").replace(/^#.*\n/, "").trim().slice(0, 600)}</p>
                </div>
              ))}
            </div>
            {gterms.length === 0 && <div className="text-muted text-sm">No glossary terms loaded.</div>}
          </div>
        </div>
      )}
    </main>
  );
}

function Select({ label, value, onChange, options, allLabel }:
  { label: string; value: string; onChange: (v: string) => void; options: { v: string; l: string }[]; allLabel: string }) {
  return (
    <label className="block text-xs text-muted">{label}
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full bg-ink border border-edge rounded-md px-2 py-1.5 text-sm text-white">
        <option value="">{allLabel}</option>
        {options.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </label>
  );
}
function Stat({ n, l }: { n: number; l: string }) {
  return <div className="bg-ink border border-edge rounded-md px-3 py-2"><div className="text-lg font-semibold text-white">{n}</div><div className="text-[11px] text-muted">{l}</div></div>;
}
