"use client";
import { entryTypeLabel, withoutEntryType, ENTRY_TYPES } from "@/lib/entry-type";
import { THEMES, isOrg } from "@/lib/themes";
import FilterGroups, { passes, type FilterGroup } from "@/components/FilterGroups";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { loadDataset, getBody, getEntryBody, searchJournalText } from "@/lib/data";
import type { Dataset, Doc } from "@/lib/types";
import { track } from "@/lib/analytics";
import Header, { type Tab } from "@/components/Header";
import Footer from "@/components/Footer";
import { pathForSub } from "@/lib/routes";
import SideNav from "@/components/SideNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogBody, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext, PaginationEllipsis } from "@/components/ui/pagination";
import { ChevronLeft, ChevronRight, Volume2, List, SlidersHorizontal, Search, X } from "lucide-react";
import CopyrightTerms from "@/components/CopyrightTerms";
import ShareMenu from "@/components/ShareMenu";
import { Transcript } from "@/components/Transcript";
import { cleanTerm, cleanDef, splitDef, firstSentences } from "@/lib/glossary-format";
import GlossaryBody from "@/components/GlossaryBody";
import GlossaryIllustration from "@/components/GlossaryIllustration";
import { DOCUMENTS, AUTHOR, EXTRA_GLOSSARY, type AuthorItem } from "@/lib/site-content";
import { CORPUS_SUMMARY } from "@/lib/corpus-summary";
import PageActions, { SortMenu, type SortDir } from "@/components/PageActions";
import DataView, { type SubTab } from "@/components/DataView";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import Processing, { useHeldLoading } from "@/components/Processing";
import { DISCLAIMER_TITLE } from "@/lib/disclaimer";

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
  const lines = (md || "").split("\n").map((l) => l.trim().replace(/^>\s?/, "")).filter(Boolean)
    .filter((l) => !l.startsWith("#") && !l.startsWith("**Audio") && !/^File duration/i.test(l));
  const text = lines.join(" ")
    .replace(/\[[0-9:]+\]/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\*\*/g, "").replace(/\s+/g, " ").trim();
  return text.length > 240 ? text.slice(0, 240) + "…" : text;
}

// First N sentences of a string (falls back to the whole text if it has no
// sentence punctuation). Used to cap the glossary peek at 2 sentences.
export default function JournalBrowser({
  initialTab = "journal",
  initialSub,
}: { initialTab?: Tab; initialSub?: SubTab } = {}) {
  const [ds, setDs] = useState<Dataset | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>(initialTab);
  // Which vertical of the merged Research section is showing. `concepts` is the
  // fifth; it is addressable at /concepts, which is why the sub-tab lives up
  // here with the URL effect rather than inside DataView.
  // initialSub arrives from /data/[section]: a reader who was linked straight to
  // Crime lands on Crime, not on the Timeline with their vertical thrown away.
  const [dataSub, setDataSub] = useState<SubTab>(
    initialSub ?? (initialTab === "concepts" ? "concepts" : "timeline")
  );

  // Journal search + filter (Sean, 30 Sep): the Concepts pattern — the list
  // follows the search box as you type; the Filter panel holds entry type, part,
  // year, topic, statement type and audio.
  const [q, setQ] = useState(""); const [dFrom, setDFrom] = useState(""); const [dTo, setDTo] = useState("");
  // Chosen values per filter group (multi-select, Sean 30 Sep), and Any/All for the
  // groups where an entry can carry several values. Topic defaults to All: the tags
  // are broad, so two topics usually mean "entries about both".
  const [fsel, setFsel] = useState<Record<string, string[]>>({});
  const [fmatch, setFmatch] = useState<Record<string, "any" | "all">>({ theme: "all", org: "any", gterm: "any", stype: "any" });
  const toggleF = (k: string, v: string) => setFsel((s) => ({ ...s, [k]: (s[k] || []).includes(v) ? (s[k] || []).filter((x) => x !== v) : [...(s[k] || []), v] }));
  const clearF = (k: string) => setFsel((s) => ({ ...s, [k]: [] }));
  // ids whose TEXT matches `q` (lib/data.ts searchJournalText). The previous hits
  // stay until new ones arrive, so the list does not flash empty while typing.
  const [textHits, setTextHits] = useState<Set<string>>(new Set());
  const [searching, setSearching] = useState(false);
  const [gcat, setGcat] = useState("");

  // The feed is a window of PAGE_SIZE entries starting at `start` (an index into
  // `filtered`), not a fixed grid of pages. A month link starts the window at
  // that month's first entry, so the month opens at the top of the list (Sean,
  // 30 Sep: with a fixed grid, 14 of 16 months opened below the previous month's
  // entries, and two months sharing a page made one link do nothing).
  const [start, setStart] = useState(0);
  // Sticky mount for the Data tab — see the note by its render below.
  const [dataMounted, setDataMounted] = useState(false);
  // Feed order. Default matches the entries themselves, which read latest-first.
  const [sort, setSort] = useState<SortDir>("newest");
  const [sel, setSel] = useState<string | null>(null);
  const [gsel, setGsel] = useState<string | null>(null);
  const [body, setBody] = useState(""); const [bodyLoading, setBodyLoading] = useState(false);
  const [excerpts, setExcerpts] = useState<Record<string, string>>({});
  const [panelOpen, setPanelOpen] = useState(false);
  const [deepLinked, setDeepLinked] = useState(false);

  useEffect(() => { loadDataset().then((d) => { setDs(d); setLoading(false); }).catch(() => setLoading(false)); }, []);

  /* FOUR SECONDS, FLOOR NOT CEILING (Sean, 15 September: "one Mississippi, two
     Mississippi, three Mississippi would be ideal. Regardless of
     how long it takes to load").

     `loading` tracks the fetch; `showLoader` tracks what the reader sees. On a
     warm connection the shards resolve in under 200ms and the processing state
     was a flicker - present in the code, absent from the experience. The floor
     makes it a state rather than a stutter.

     The third argument makes it unconditional: "it doesn't matter if it's
     already loaded. We need to run the animation and load in the background."
     A warm cache resolves in milliseconds and would otherwise skip the state
     entirely; now it runs its full four seconds either way (raised from three on 15 September).

     It never delays the work. The fetch runs behind the loader throughout, and
     a fetch slower than three seconds adds nothing at all. */
  const showLoader = useHeldLoading(loading, 4000, true);

  /* The transcript body is a different case: it opens inside a page the reader
     is already on, so a three-second gate would make the site feel slow. 400ms
     is only enough to stop a sub-frame flicker. Same drawing either way - the
     pick is shared across every instance. */
  const showBodyLoader = useHeldLoading(bodyLoading, 400);

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
      else if (tab === "data") path = pathForSub(dataSub);
      else if (tab === "concepts") path = "/concepts";
      else if (tab === "author") path = "/author";
      else if (tab === "disclaimer") path = "/disclaimer";
      window.history.replaceState(null, "", path + window.location.hash);
    } catch { /* ignore */ }
  }, [tab, sel, gsel, dataSub, deepLinked]);

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
  const dateSpan = useMemo(() => {
    const ds_ = journal.map((d) => d.entry_date || "").filter(Boolean).sort();
    return { min: ds_[0] || "", max: ds_[ds_.length - 1] || "" };
  }, [journal]);
  // Themes and organizations named (Sean, 30 Sep): tags assigned by reading each
  // document — project/theme-tags.md. Counts decide the order; organizations
  // named in fewer than 5 documents are left out of the chips (the search finds them).
  const tagCount = useMemo(() => {
    const n: Record<string, number> = {};
    for (const d of journal) for (const c of ds?.docCats[d.id] || []) n[c] = (n[c] || 0) + 1;
    return n;
  }, [journal, ds]);
  const themeOpts = useMemo(() => Object.keys(THEMES).filter((t) => tagCount[t]).sort((a, b) => tagCount[b] - tagCount[a]).map((t) => ({ v: t, l: THEMES[t] })), [tagCount]);
  const orgOpts = useMemo(() => (ds?.categories || []).filter((c: any) => isOrg(c.slug) && (tagCount[c.slug] || 0) >= 5)
    .sort((a: any, b: any) => tagCount[b.slug] - tagCount[a.slug]).map((c: any) => ({ v: c.slug, l: c.label })), [ds, tagCount]);
  // Entry type replaces the old Topic list, whose options were every category in
  // the archive: 9 of its 16 (legal, analysis, glossary…) matched no journal page.
  const etypes = useMemo(() => Object.keys(ENTRY_TYPES).filter((t) => journal.some((d) => (ds?.docCats[d.id] || []).includes(t))), [journal, ds]);
  // Topic = glossary terms the journal mentions, most-mentioned first. Terms on
  // fewer than 10 pages (three, on 30 Sep) are left out: a chip that finds one
  // or two entries is noise; the search box finds those.
  const gterms = useMemo(() => {
    const n: Record<string, number> = {};
    for (const d of journal) for (const g of ds?.docGloss[d.id] || []) n[g] = (n[g] || 0) + 1;
    return (ds?.glossary || []).filter((t: any) => (n[t.slug] || 0) >= 10)
      .sort((a: any, b: any) => n[b.slug] - n[a.slug]).map((t: any) => ({ v: t.slug, l: cap(t.term) }));
  }, [journal, ds]);
  const stypes = useMemo(() => (ds?.categories || []).filter((c) => c.kind === "statement_type").map((c) => c.slug).sort(), [ds]);

  useEffect(() => {
    if (!ds || !q.trim()) { setTextHits(new Set()); setSearching(false); return; }
    let alive = true; setSearching(true);
    const t = setTimeout(() => {
      searchJournalText(q, ds.source)
        .then((h) => { if (alive) { setTextHits(h); setSearching(false); } })
        .catch(() => { if (alive) { setTextHits(new Set()); setSearching(false); } });
      track("journal_search", { length: q.trim().length });
    }, 300);
    return () => { alive = false; clearTimeout(t); };
  }, [q, ds]);

  const filtered = useMemo(() => {
    const dc = ds?.docCats || {};
    let r = journal.slice();
    if (q.trim()) { const s = q.trim().toLowerCase(); r = r.filter((d) => (d.title || "").toLowerCase().includes(s) || d.id.toLowerCase().includes(s) || (d.location || "").toLowerCase().includes(s) || !!textHits?.has(d.id)); }
    if (dFrom) r = r.filter((d) => (d.entry_date || "") >= dFrom);
    if (dTo) r = r.filter((d) => !!d.entry_date && d.entry_date <= dTo);
    const valuesOf = (d: Doc, k: string): string[] =>
      k === "gterm" ? ds?.docGloss[d.id] || []
      : k === "part" ? (d.part != null ? [String(d.part)] : [])
      : k === "audio" ? (d.audio_url ? ["1"] : [])
      : dc[d.id] || [];
    for (const [k, want] of Object.entries(fsel)) if (want.length) r = r.filter((d) => passes(valuesOf(d, k), want, fmatch[k] || "any"));
    const dir = sort === "newest" ? -1 : 1;
    r.sort((a, b) => dir * ((a.entry_date || "").localeCompare(b.entry_date || "") || (a.recording_index || 0) - (b.recording_index || 0)));
    return r;
  }, [journal, ds, q, textHits, dFrom, dTo, fsel, fmatch, sort]);

  useEffect(() => { setStart(0); }, [q, dFrom, dTo, fsel, fmatch, sort]);
  useEffect(() => { if (tab === "data" || tab === "concepts") setDataMounted(true); }, [tab]);

  // Pages are counted from the window: the entries above it make ceil(start/10)
  // pages, the window is one, and whatever follows makes the rest. Page 1 is
  // always the top of the list.
  const page = Math.ceil(start / PAGE_SIZE) + 1;
  const totalPages = Math.max(1, page + Math.ceil(Math.max(0, filtered.length - start - PAGE_SIZE) / PAGE_SIZE));
  const setPage = (n: number) =>
    setStart(n <= 1 ? 0 : Math.min(Math.max(0, start + (n - page) * PAGE_SIZE), Math.max(0, filtered.length - 1)));

  // Journal month index for the shared SideNav (Sean, 2026-08-21). One entry
  // per calendar month rather than per document: 435 entries is not a
  // navigable list, and a dated journal is browsed by period. Derived from the
  // FILTERED set, so the index always describes what is actually on screen.
  const months = useMemo(() => {
    const seen = new Map<string, number>();          // "2025-03" -> first index
    filtered.forEach((d: Doc, i: number) => {
      const m = (d.entry_date || "").slice(0, 7);
      if (m && !seen.has(m)) seen.set(m, i);
    });
    const MONTH = ["January","February","March","April","May","June",
                   "July","August","September","October","November","December"];
    return [...seen.entries()].map(([m, i]) => ({
      id: m,
      label: `${MONTH[+m.slice(5, 7) - 1]} ${m.slice(0, 4)}`,
      first: i,
    }));
  }, [filtered]);

  const pageItems = useMemo(() => filtered.slice(start, start + PAGE_SIZE), [filtered, start]);
  // the month the list currently opens on
  const activeMonth = useMemo(
    () => (pageItems[0]?.entry_date || "").slice(0, 7) || null,
    [pageItems],
  );

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
    getEntryBody(sel, ds).then((b) => { setBody(b); setBodyLoading(false); });
  }, [sel, ds]);

  const selDoc = ds?.docs.find((d) => d.id === sel) || null;
  const selIdx = selDoc ? filtered.findIndex((d) => d.id === selDoc.id) : -1;

  const resetFilters = () => { setQ(""); setDFrom(""); setDTo(""); setFsel({}); };
  const grp = (key: string, label: string, options: { v: string; l: string }[], extra: Partial<FilterGroup> = {}): FilterGroup => ({
    key, label, options, values: fsel[key] || [], toggle: (v) => toggleF(key, v), clear: () => clearF(key),
    match: fmatch[key], setMatch: (m) => setFmatch((s) => ({ ...s, [key]: m })), ...extra,
  });
  // The panel's groups. Topic is the same vocabulary as the Concepts panel's Topic.
  const filterGroups: FilterGroup[] = [
    grp("theme", "Topic", themeOpts, { matchable: true, hint: "What an entry contains, assigned by reading it. It says what was recorded, not that it is true." }),
    grp("cat", "Entry type", etypes.map((t) => ({ v: t, l: ENTRY_TYPES[t] }))),
    grp("dates", "Dates", [], { dates: { from: dFrom, to: dTo, setFrom: setDFrom, setTo: setDTo, min: dateSpan.min, max: dateSpan.max } }),
    grp("part", "Part", parts.map((x) => ({ v: String(x), l: `Part ${x}` })), { hint: "The four Google Docs. Discovery notes are in none of them." }),
    grp("org", "Organizations named in statements", orgOpts, { matchable: true, hint: "Named in the text. A name here is not a claim against the organization — see the disclaimer." }),
    grp("gterm", "Glossary term", gterms, { matchable: true, hint: "Entries that mention a glossary term." }),
    grp("stype", "Statement type", stypes.map((x) => ({ v: x, l: cap(x) })), { matchable: true }),
    grp("audio", "Audio", [{ v: "1", l: "Has audio" }]),
  ];
  const pills = [
    ...filterGroups.flatMap((g) => g.values.map((v) => ({
      key: `${g.key}:${v}`, label: g.options.find((o) => o.v === v)?.l || v, clear: () => toggleF(g.key, v),
    }))),
    ...(dFrom ? [{ key: "dFrom", label: `From ${dFrom}`, clear: () => setDFrom("") }] : []),
    ...(dTo ? [{ key: "dTo", label: `To ${dTo}`, clear: () => setDTo("") }] : []),
  ];
  const activeFilters = pills.length + (q.trim() ? 1 : 0);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header
        tab={tab}
        onTab={(t) => {
          setTab(t);
          // Both nav entries open the same section, so the vertical has to be
          // set from the entry that was clicked. Without this, Research after a
          // visit to Concepts would reopen Concepts, because dataSub remembers.
          if (t === "concepts") setDataSub("concepts");
          else if (t === "data") setDataSub("timeline");
          setSel(null); setGsel(null);
        }}
        // The wordmark is a link home, and "/" is the home page now — it used
        // to be the gate, which is why this reset to the journal feed instead
        // of navigating. Same bug shape as the nav redirect: correct until the
        // front door moved, then quietly wrong. A real navigation, because the
        // home page is a different route and not a tab of this app.
        onHome={() => { if (typeof window !== "undefined") window.location.assign("/"); }}
      />

      <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 sm:px-6 py-6">
        {/* A STAGE OF ITS OWN, AND A CROSS-FADE OUT OF IT (Sean, 15 September:
            "we need some kind of fade in or transition between the loader, the
            processor, and the content").

            The loader is no longer one branch of the content's ternary, where
            anything mounting nearby could move it. It is its own block holding a
            fixed share of the viewport, centred, for the whole three seconds.

            The page below is present but display:none until the loader stands
            down, then fades in. `hidden` rather than unmounting on purpose: the
            Data section is script-drawn once per page load and cannot redraw
            after an unmount, which is the same reason dataMounted exists. */}
        {showLoader && (
          <div className="grid min-h-[52vh] place-items-center px-4 animate-fade-in sm:min-h-[58vh]">
            <Processing label="Loading the corpus" />
          </div>
        )}
        <div className={showLoader ? "hidden" : "animate-fade-in"}>

        {/* ONE FLAG FOR THE WHOLE SCREEN (Sean, 15 September: "once the rest of
            the page came in, it was pushed down, and so the loading state was
            interrupted").

            This read `!loading` while the loader below read `showLoader`. Two
            flags, and they disagree for most of the wait: the fetch resolves in
            about 200ms, `loading` flips, the title band mounts ABOVE the loader
            and shoves it down mid-animation. The processing state was being
            interrupted by the page it was standing in for.

            Nothing renders above the loader until the loader is finished. */}
        {!showLoader && (
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
        {tab === "glossary" ? (
          <GlossarySection terms={glossaryTerms} gcat={gcat} setGcat={setGcat} gsel={gsel} setGsel={setGsel} />
        ) : tab === "documents" ? (
          <DocumentsView />
        ) : tab === "data" || tab === "concepts" ? (
          null   // rendered below the switch so it can stay mounted
        ) : tab === "author" ? (
          <AuthorView />
        ) : tab === "disclaimer" ? (
          <DisclaimerView />
        ) : (
          <div className={selDoc || months.length < 2 ? "" : "lg:grid lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-x-8 lg:items-start"}>
            {!selDoc && months.length > 1 && (
              <SideNav
                mode="index"
                label="Months"
                sections={months.map((m) => ({ id: m.id, label: m.label }))}
                active={activeMonth}
                onPick={(id: string) => {
                  const m = months.find((x) => x.id === id);
                  if (m) setStart(m.first);
                }}
              />
            )}
            <div className="min-w-0">
              {selDoc ? (
                <Reader
                  doc={selDoc} body={body} bodyLoading={showBodyLoader} cats={ds?.docCats[selDoc.id] || []} gloss={ds?.docGloss[selDoc.id] || []}
                  onBack={() => setSel(null)}
                  onPrev={selIdx > 0 ? () => setSel(filtered[selIdx - 1].id) : undefined}
                  onNext={selIdx >= 0 && selIdx < filtered.length - 1 ? () => setSel(filtered[selIdx + 1].id) : undefined}
                />
              ) : (<>
                <JournalToolbar
                  q={q} setQ={setQ} groups={filterGroups} pills={pills} count={activeFilters}
                  open={panelOpen} setOpen={(o: boolean) => { setPanelOpen(o); if (o) track("filter_opened", {}); }}
                  onClearAll={resetFilters} shown={filtered.length} of={journal.length} searching={searching}
                />
                <Feed items={pageItems} excerpts={excerpts} docCats={ds?.docCats || {}} total={filtered.length} from={start + 1}
                  filteredOf={activeFilters ? journal.length : 0} searching={false} onClear={resetFilters}
                  page={page} totalPages={totalPages} setPage={setPage} onOpen={setSel} onSearch={() => setPanelOpen(true)} />
              </>)}
            </div>
          </div>
        )}
        {/* Data stays mounted once opened. The GovCloud report is script-drawn
            once per page load and cannot redraw after an unmount — the useMemo
            guard inside DataView only protected sub-tab switches, so leaving
            the section entirely (Data -> Concepts -> Data) left the timeline
            blank. Hiding beats re-rendering; nothing mounts until the reader
            first opens Data. */}
        {!showLoader && dataMounted && (
          <div className={tab === "data" || tab === "concepts" ? "" : "hidden"}
               aria-hidden={!(tab === "data" || tab === "concepts")}>
            <DataView
              sub={tab === "concepts" ? "concepts" : dataSub}
              onSub={(s) => {
                // The vertical decides the address: concepts keeps /concepts,
                // everything else is /data. Both were indexed before the merge
                // and both still resolve after it.
                setDataSub(s);
                setTab(s === "concepts" ? "concepts" : "data");
              }}
            />
          </div>
        )}

        {!showLoader && tab === "journal" && !selDoc && (
          <GlossaryPeek terms={glossaryTerms} onView={() => { setTab("glossary"); setSel(null); setGsel(null); }} onOpen={(slug: string) => { setTab("glossary"); setSel(null); setGsel(slug); }} />
        )}
        {!showLoader && tab === "glossary" && !gsel && (
          <JournalPeek items={journal} source={ds?.source} onView={() => { setTab("journal"); setSel(null); setGsel(null); }} onOpen={(id: string) => { setTab("journal"); setGsel(null); setSel(id); }} />
        )}
        </div>
      </main>

      <Footer onNav={(t) => { setTab(t); setSel(null); setGsel(null); }} />

    </div>
  );
}

const TAB_TITLE: Record<Tab, string> = { journal: "Journal", glossary: "Glossary", documents: "Documents", data: "Research", concepts: "Concepts", author: "About the author", disclaimer: "Disclaimer" };

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
function Feed({ items, excerpts, docCats, total, from, filteredOf, searching, onClear, page, totalPages, setPage, onOpen, onSearch }: any) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <span />
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted">
            {items.length ? `${from}–${from + items.length - 1} of ${total}` : ""}
          </span>
          <ShareMenu title={`${SITE} — Journal`} align="right" />
        </div>
      </div>
      <div className="space-y-10">
        {items.map((d: Doc) => (
          <Link key={d.id} href={journalHref(d.id)} onClick={spaClick(() => onOpen(d.id))} className="group block w-full text-left">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-muted">
              <span>{entryTypeLabel(docCats[d.id], d.doc_type)}</span>
              {d.audio_url && <span className="text-accent inline-flex items-center gap-1"><Volume2 size={12} /> audio</span>}
              {d.part != null && <span className="ml-auto">Part {d.part}</span>}
            </div>
            <div className="mt-1.5 font-display text-[19px] font-semibold text-foreground group-hover:text-accent transition-colors">{d.title || d.id}</div>
            <div className="text-[12px] text-muted mt-0.5">{d.entry_date}{d.weekday ? ` · ${d.weekday}` : ""}{d.recording_time ? ` · ${d.recording_time}` : ""}</div>
            <p className="mt-2.5 body-copy text-foreground/80 line-clamp-3">{excerpts[d.id] ?? "…"}</p>
            <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[11px] uppercase tracking-wide text-muted">
              {(docCats[d.id] || []).filter((c: string) => c in THEMES).slice(0, 4).map((c: string) => <span key={c}>{THEMES[c]}</span>)}
            </div>
            <div className="mt-3 text-accent text-sm">Read →</div>
          </Link>
        ))}
        {items.length === 0 && !searching && <div className="text-muted text-sm py-10 text-center">No entries match. <button onClick={onSearch} className="text-accent underline">Adjust filters</button></div>}
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
        {cats.filter((c: string) => !isOrg(c)).map((c: string) => <span key={c} className="uppercase tracking-wide">{THEMES[c] || ENTRY_TYPES[c] || cap(c)}</span>)}
      </div>
      <h1 className="font-display text-[21px] font-semibold text-foreground mb-1 leading-tight">{doc.title || doc.id}</h1>
      <div className="text-sm text-muted mb-5">
        {doc.entry_date}{doc.weekday ? ` · ${doc.weekday}` : ""}{doc.audio_duration ? ` · ${doc.audio_duration}` : ""}
        {doc.audio_url && <> · <a className="text-accent underline" href={doc.audio_url} target="_blank" rel="noreferrer">audio ↗</a></>}
        {doc.source_url && <> · <a className="text-accent underline" href={doc.source_url} target="_blank" rel="noreferrer">source ↗</a></>}
      </div>
      {gloss.length > 0 && <div className="text-xs text-muted mb-5">Glossary: {gloss.map(cap).join(", ")}</div>}
      {bodyLoading ? <Processing label="Opening the transcript" variant="inline" /> : <Transcript md={body} />}
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
    // One SideNav across the site (Sean, 2026-08-21). Index mode: picking a
    // term replaces the content, so there is no scroll-spy — the active entry
    // is whatever is open.
    <div className="lg:grid lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-x-8 lg:items-start">
      <SideNav
        mode="index"
        label="Terms"
        sections={terms.map((t: any) => ({ id: t.slug, label: cleanTerm(t.term) }))}
        active={gsel}
        onPick={(slug: string) => setGsel(slug)}
      />
      <div className="min-w-0">
        {content}
      </div>
    </div>
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
/* ---------- Journal search + filter toolbar ----------
 * The Concepts pattern (components/ConceptsToolbar.tsx), so the site has one
 * idiom (Sean, 30 Sep: "Let's just use the concepts filter"). Search narrows
 * the list as you type; Filter opens a panel of chip groups; active choices
 * read back as removable pills; "N of 417" says how much is shown. Not sticky.
 */
function JournalToolbar({ q, setQ, groups, pills, count, open, setOpen, onClearAll, shown, of, searching }: any) {
  const chip = "inline-flex items-center gap-1.5 px-2.5 py-1 text-[13px] border border-edge text-foreground hover:border-foreground";
  return (
    <div className="mb-10">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[15rem]">
          <Search size={16} aria-hidden className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <Input type="search" value={q} onChange={(e: any) => setQ(e.target.value)}
            onKeyDown={(e: any) => { if (e.key === "Enter") e.preventDefault(); }}
            placeholder={`Search ${of} entries — words, names, places`} aria-label="Search the journal" className="pl-9" />
        </div>
        <button type="button" onClick={() => setOpen(true)} aria-expanded={open}
          className="inline-flex items-center gap-2 px-4 h-10 border border-edge text-[15px] text-foreground hover:border-foreground transition-colors">
          <SlidersHorizontal size={16} aria-hidden />
          Filter
          {pills.length > 0 && <span className="ml-1 px-1.5 text-[13px] font-semibold bg-foreground text-background tabular-nums">{pills.length}</span>}
        </button>
        <span className="text-[15px] text-muted tabular-nums whitespace-nowrap" aria-live="polite">
          {searching ? "Searching…" : `${shown} of ${of}`}
        </span>
      </div>

      {count > 0 && (
        <div className="flex flex-wrap items-center gap-2 mt-3">
          {q.trim() && (
            <button type="button" onClick={() => setQ("")} className={chip}>
              &ldquo;{q.trim()}&rdquo; <X size={13} aria-hidden /><span className="sr-only">Clear search</span>
            </button>
          )}
          {pills.map((f: any) => (
            <button key={f.key} type="button" onClick={f.clear} className={chip}>
              {f.label} <X size={13} aria-hidden /><span className="sr-only">Remove filter</span>
            </button>
          ))}
          <button type="button" onClick={onClearAll}
            className="text-[13px] uppercase tracking-[0.08em] font-semibold text-muted hover:text-foreground ml-1">
            Clear all
          </button>
        </div>
      )}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full max-w-sm p-5 overflow-y-auto">
          <SheetHeader className="mb-5">
            <SheetTitle className="text-[20px]">Filter the journal</SheetTitle>
          </SheetHeader>
          <FilterGroups groups={groups} />
          <div className="flex items-center gap-3 mt-8 pt-5 border-t border-edge">
            <button type="button" onClick={() => setOpen(false)}
              className="px-4 h-10 bg-foreground text-background text-[15px] font-semibold">
              {searching ? "Searching…" : `Show ${shown}`}
            </button>
            <button type="button" onClick={onClearAll} className="text-[14px] text-muted hover:text-foreground">Clear all</button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

/* ---------- Export modal ----------
 * Every count below comes from lib/corpus-summary.ts, which is generated from
 * the zip this button serves. The previous copy was a hand-written sentence
 * that named Government Cloud and Public Health and never learned about Crime,
 * Concepts, or the research inputs — so it under-described the download for
 * weeks. A sentence about generated content has to be generated too.
 */
/* ---------- Documents ---------- */
function DocumentsView() {
  return (
    // Full main-container width, matching the journal feed and glossary page.
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        <span />
        <ShareMenu title={`${SITE} — Documents`} align="right" />
      </div>
      <p className="text-sm text-muted mb-5 measure">Additional documents beyond the four-part journal series.</p>
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
// Every outside link on this page opens in a new tab, so a reader checking a
// credential does not lose their place in the archive.
function AuthorLink({ item, section }: { item: AuthorItem; section: string }) {
  if (item.links?.length) {
    return (
      <>
        {item.label}{" "}
        {item.links.map((l, i) => (
          <span key={l.url}>
            {i > 0 && (i === item.links!.length - 1 ? " and " : ", ")}
            <AuthorLink item={l} section={section} />
          </span>
        ))}
      </>
    );
  }
  if (!item.url) return <>{item.label}</>;
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-accent underline underline-offset-4 hover:text-foreground"
      onClick={() => track("author_link_opened", { section, href: item.url })}
    >
      {item.label}
      <span aria-hidden="true"> ↗</span>
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

function AuthorList({ items, section }: { items: AuthorItem[]; section: string }) {
  return (
    <ul className="mt-3 space-y-2.5">
      {items.map((item) => (
        <li key={item.label} className="body-copy text-foreground/85 measure">
          <AuthorLink item={item} section={section} />
          {item.detail && <span className="text-muted"> — {item.detail}</span>}
        </li>
      ))}
    </ul>
  );
}

// The reason the sections exist, with the Zersetzung term linked to its
// glossary entry. An internal link, so it stays in the same tab.
function AuthorIntroLine() {
  const { text, term } = AUTHOR.intro;
  const at = text.indexOf(term.label);
  const linked = (
    <a href={glossaryHref(term.slug)} className="text-accent underline underline-offset-4 hover:text-foreground">
      {term.label}
    </a>
  );
  return (
    <p className="body-copy text-foreground/85 mt-4 measure">
      {at < 0 ? text : <>{text.slice(0, at)}{linked}{text.slice(at + term.label.length)}</>}
    </p>
  );
}

function AuthorView() {
  return (
    // Full main-container width, matching Documents, the journal feed and the
    // glossary (Sean, 29 Sep). The page heading is the TitleBand h1, "About the
    // author"; there is no second heading here.
    <div className="w-full">
      <div className="flex flex-col sm:flex-row gap-6 sm:gap-10">
        <div className="flex-1 min-w-0">
          <p className="body-copy text-foreground/85 measure">{AUTHOR.summary}</p>
          <p className="body-copy text-foreground/85 mt-4 measure">{AUTHOR.bio}</p>
          <AuthorIntroLine />
        </div>
        {/* Photo on the right, 30% of the content width (Sean, 29 Sep: at least
            25%). On phones it stacks above the text at half width. */}
        <div className="relative order-first sm:order-last w-1/2 sm:w-[30%] aspect-square bg-panel shrink-0 overflow-hidden">
          <span className="absolute inset-0 grid place-items-center text-muted text-xs">Photo</span>
          <img src={AUTHOR.photo} alt="Sean C. Harris" className="relative w-full h-full object-cover"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = "0"; }} />
        </div>
      </div>
      {AUTHOR.sections.map((sec) => (
        <section key={sec.title} className="mt-10 border-t border-edge pt-6">
          <h3 className="font-display text-xl font-semibold text-foreground">{sec.title}</h3>
          <AuthorList items={sec.items} section={sec.title} />
          {sec.note && <p className="text-sm text-muted mt-3">{sec.note}</p>}
          {sec.links && (
            <div className="mt-5">
              <h4 className="text-sm font-semibold text-foreground">{sec.links.title}</h4>
              <AuthorList items={sec.links.items} section={sec.title} />
            </div>
          )}
        </section>
      ))}
    </div>
  );
}

/* ---------- Disclaimer ---------- */
function DisclaimerView() {
  return (
    <div className="w-full lg:w-[65%] lg:mx-auto">
      <h2 className="font-display text-3xl font-semibold text-foreground mb-1">{DISCLAIMER_TITLE}</h2>
      <p className="font-display text-[13px] uppercase tracking-[0.14em] text-muted mb-5">
        and the copyright and terms of use
      </p>
      <CopyrightTerms />
    </div>
  );
}
