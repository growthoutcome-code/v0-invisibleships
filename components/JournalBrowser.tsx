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
import { PageMotif, type MotifName } from "@/components/SectionMotif";
import BottomSections, { type BottomBlock } from "@/components/BottomSections";
import { pathForSub, titleForSub, viewsFor } from "@/lib/routes";
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
import { cleanTerm, cleanDef, splitDef } from "@/lib/glossary-format";
import GlossaryBody from "@/components/GlossaryBody";
import GlossaryIllustration from "@/components/GlossaryIllustration";
import { DOCUMENTS, AUTHOR, EXTRA_GLOSSARY, type AuthorItem } from "@/lib/site-content";
import GLOSSARY_TOPICS from "@/lib/glossary-topics.json";
import { CORPUS_SUMMARY } from "@/lib/corpus-summary";
import PageActions, { type SortDir } from "@/components/PageActions";
import Pager from "@/components/Pager";
import PageIntro from "@/components/PageIntro";
import CardShare from "@/components/CardShare";
import { H2_CLASS, SUB_CLASS } from "@/components/SectionHead";
import { SortSelect, FilterButton, FilterPanel, ActiveLine, MobileBar } from "@/components/ListControls";
import { NO_FILTERS, type Filters, type ConceptSort } from "@/lib/concepts";
import DataView, { type SubTab } from "@/components/DataView";
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
  initialView,
}: { initialTab?: Tab; initialSub?: SubTab; initialView?: string } = {}) {
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
  // The view within the section, one at a time (Sean, 30 Sep 2026). A view that
  // does not belong to the current section reads as that section's first view.
  const [dataViewRaw, setDataView] = useState<string | null>(initialView ?? null);
  const dataView = viewsFor(dataSub).some((v) => v.id === dataViewRaw) ? dataViewRaw! : (viewsFor(dataSub)[0]?.id ?? "");

  // Journal search + filter (Sean, 30 Sep): the Concepts pattern — the list
  // follows the search box as you type; the Filter panel holds entry type, part,
  // year, topic, statement type and audio.
  const [q, setQ] = useState(""); const [dFrom, setDFrom] = useState(""); const [dTo, setDTo] = useState("");
  // Chosen values per filter group (multi-select, Sean 30 Sep), and Any/All for the
  // groups where an entry can carry several values. Topic defaults to All: the tags
  // are broad, so two topics usually mean "entries about both".
  const [fsel, setFsel] = useState<Record<string, string[]>>({});
  const [fmatch, setFmatch] = useState<Record<string, "any" | "all">>({ theme: "all", stype: "any" });
  const toggleF = (k: string, v: string) => setFsel((s) => ({ ...s, [k]: (s[k] || []).includes(v) ? (s[k] || []).filter((x) => x !== v) : [...(s[k] || []), v] }));
  const clearF = (k: string) => setFsel((s) => ({ ...s, [k]: [] }));
  // ids whose TEXT matches `q` (lib/data.ts searchJournalText). The previous hits
  // stay until new ones arrive, so the list does not flash empty while typing.
  const [textHits, setTextHits] = useState<Set<string>>(new Set());
  const [searching, setSearching] = useState(false);
  const [gcat, setGcat] = useState("");
  // Glossary controls (Sean, 30 Sep 2026: "it's got to work just like the other
  // filters"). Held here, not in GlossaryList, so they survive opening a term.
  const [gsort, setGsort] = useState<GSort>("az");
  const [gtopics, setGtopics] = useState<string[]>([]);
  const [gmatch, setGmatch] = useState<"any" | "all">("any");
  const [gpanel, setGpanel] = useState(false);

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
  // Concepts' controls sit in this title band, so their state lives here and is
  // handed down to DataView -> ConceptsView (the Research hero still steers it).
  const [conceptFilters, setConceptFilters] = useState<Filters>(NO_FILTERS);
  const [conceptSort, setConceptSort] = useState<ConceptSort>("default");
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
  const pageLoader = useHeldLoading(loading, 4000, true);

  /* EVERY RESEARCH PAGE OPENS WITH THE LOADER (Sean, 30 Sep 2026: "make sure we're
     using our page load animations regardless"). Research sections are separate
     pages with their own addresses, but moving between them from the menu happens
     inside the app, where nothing reloads and the loader above never ran. So the
     same four-second state replays whenever the reader arrives at a Research
     section from elsewhere in the app. The page mounts behind it and fetches in the
     background, exactly as on a fresh load; the Government Cloud report redraws on
     remount (GovCloudReport.tsx). */
  const [sectionPulse, setSectionPulse] = useState(false);
  // Called from the click that opens a Research section, so the loader and the
  // switch land in the same render: nothing of the new page shows, or starts
  // loading, before the loader is up.
  const arriveAtResearch = (next: SubTab) => {
    if (tab === "data" && dataSub === next) return;
    // A new page starts at its top, under the loader.
    window.scrollTo({ top: 0 });
    setSectionPulse(true);
    window.setTimeout(() => setSectionPulse(false), 0);
    setDataView(null); // a section opens on its first view
  };
  const sectionLoader = useHeldLoading(sectionPulse, 4000);
  const showLoader = pageLoader || sectionLoader;

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
      else if (tab === "data") path = pathForSub(dataSub, dataView);
      else if (tab === "concepts") path = "/concepts";
      else if (tab === "author") path = "/author";
      else if (tab === "disclaimer") path = "/disclaimer";
      window.history.replaceState(null, "", path + window.location.hash);
    } catch { /* ignore */ }
  }, [tab, sel, gsel, dataSub, dataView, deepLinked]);

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
  // No organizations filter, and no organization tags anywhere (Sean, 30 Sep 2026:
  // no lists of organizations or names on the site). Search reads the full text.
  // scripts/check_no_name_lists.py keeps it that way.
  // Entry type replaces the old Topic list, whose options were every category in
  // the archive: 9 of its 16 (legal, analysis, glossary…) matched no journal page.
  const etypes = useMemo(() => Object.keys(ENTRY_TYPES).filter((t) => journal.some((d) => (ds?.docCats[d.id] || []).includes(t))), [journal, ds]);
  // "Paraphrasing" is left out of the filter (Sean, 30 Sep 2026); the tag stays in the data.
  // "From the distance" was removed (Sean, 30 Sep 2026): every recording holds
  // statements from the distance AND from the author, so as a filter it returns
  // nearly every recorded entry and says nothing. Pulling those statements out as
  // quotes is a separate job (reading each transcript), not a tag. The tags stay
  // in the data; only the panel option goes.
  const stypes = useMemo(() => (ds?.categories || []).filter((c) => c.kind === "statement_type" && c.slug !== "paraphrasing" && c.slug !== "from-the-distance").map((c) => c.slug).sort(), [ds]);

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
      k === "part" ? (d.part != null ? [String(d.part)] : [])
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
  // navigable list, and a dated journal is browsed by period.
  // 30 Sep 2026 (Sean: "keep the sidebar on the screen all the time"): every
  // month of the WHOLE journal is listed, always, so the page never loses its
  // left column as filters change. Each month shows how many entries match the
  // current filters; a month with none is greyed out and cannot be picked.
  // Picking a month keeps the filters and jumps to that month's first match.
  const months = useMemo(() => {
    const all = new Set<string>();
    journal.forEach((d: Doc) => { const m = (d.entry_date || "").slice(0, 7); if (m) all.add(m); });
    const first = new Map<string, number>(), count = new Map<string, number>();
    filtered.forEach((d: Doc, i: number) => {
      const m = (d.entry_date || "").slice(0, 7);
      if (!m) return;
      if (!first.has(m)) first.set(m, i);
      count.set(m, (count.get(m) || 0) + 1);
    });
    const MONTH = ["January","February","March","April","May","June",
                   "July","August","September","October","November","December"];
    // same order as the feed: follow the filtered list when it has entries
    const order = [...all].sort();
    const desc = filtered.length > 1 && (filtered[0].entry_date || "") > (filtered[filtered.length - 1].entry_date || "");
    if (desc) order.reverse();
    return order.map((m) => ({
      id: m,
      label: `${MONTH[+m.slice(5, 7) - 1]} ${m.slice(0, 4)}`,
      first: first.get(m) ?? -1,
      count: count.get(m) || 0,
    }));
  }, [journal, filtered]);

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
  // The panel's groups, in Sean's order (30 Sep 2026): Dates, then Statement
  // type, then the rest. Glossary term was removed from the panel (its tags stay
  // in the data); organization tags were removed altogether. Topic is the same
  // vocabulary as the Concepts panel's Topic.
  const filterGroups: FilterGroup[] = [
    grp("dates", "Dates", [], { dates: { from: dFrom, to: dTo, setFrom: setDFrom, setTo: setDTo, min: dateSpan.min, max: dateSpan.max } }),
    grp("stype", "Statement type", stypes.map((x) => ({ v: x, l: cap(x) })), { matchable: true }),
    grp("theme", "Topic", themeOpts, { matchable: true, hint: "What an entry contains, assigned by reading it. It says what was recorded, not that it is true." }),
    grp("cat", "Entry type", etypes.map((t) => ({ v: t, l: ENTRY_TYPES[t] }))),
    grp("part", "Part", parts.map((x) => ({ v: String(x), l: `Part ${x}` })), { hint: "The four Google Docs. Discovery notes are in none of them." }),
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
  // Month list for the sidebar and the phone bar (after activeFilters, which it reads).
  const monthItems = months.map((m) => ({
    id: m.id, label: m.label,
    count: activeFilters ? m.count : undefined,
    disabled: m.count === 0,
  }));
  const pickMonth = (id: string) => {
    const m = months.find((x) => x.id === id);
    if (m && m.first >= 0) setStart(m.first);
  };

  return (
    // No background here: <body> paints it. A background on this wrapper would
    // cover the page motif, which sits at a negative z-index so that nothing
    // on the page — header, modals, loader — has to change its own stacking.
    <div className="min-h-screen flex flex-col text-foreground">
      <Header
        tab={tab}
        onTab={(t) => {
          if (t === "data") arriveAtResearch("timeline");
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
        researchSub={dataSub}
        onResearch={(s) => { arriveAtResearch(s); setTab("data"); setDataSub(s); setSel(null); setGsel(null); }}
      />

      {/* One motif behind each main page (Sean, 1 Oct 2026: "The background motif
          animations need to be added to each main page of the website"). Fixed to
          the screen, driven by how far down the page the reader is. The home
          page's assignment is kept for the journal (carry). Lists only:
          not behind a single journal entry or glossary term being read. */}
      {!showLoader && (() => {
        const m: MotifName | null =
          tab === "journal" ? (selDoc ? null : "carry")
          // Concepts and Documents carry none (Sean, 1 Oct 2026: "remove the
          // background from concepts and documents").
          : tab === "glossary" ? (gsel ? null : "recede")
          // No motif on Research (Sean, 1 Oct 2026: "pull the motifs from research
          // due to the presence of charts"); behind a chart, any wash reads as
          // part of it. Glossary took Research's recede.
          : null;
        // keyed by name, so changing page remounts it and its progress restarts
        return m ? <PageMotif key={m} name={m} /> : null;
      })()}

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
        {/* Fixed to the screen below the header, so the loader is dead centre in the
            viewport however far down the page the reader clicked from (Sean, 30 Sep
            2026). It covers the page, which is hidden behind it anyway. */}
        {showLoader && (
          <div className="fixed inset-x-0 bottom-0 top-[72px] lg:top-[88px] z-20 grid place-items-center px-4 bg-background animate-fade-in">
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
            // Research sections carry their own H1 under a small "Research" label
            // (Sean, 30 Sep 2026), e.g. "The government cloud record".
            title={tab === "data" ? titleForSub(dataSub) : TAB_TITLE[tab]}
            eyebrow={tab === "data" ? "Research" : undefined}
          />
        )}
        {/* One sentence under the title, ending with the disclaimer (Sean, 30 Sep
            2026). Placement is fixed: under the H1, above the list, on all three. */}
        {!showLoader && tab === "journal" && !selDoc && (
          <PageIntro from="journal_intro">
            Is the{" "}
            <Link href="/concepts/the-neurotech-bullhorn" className="text-accent underline underline-offset-4">neurotech bullhorn</Link>{" "}
            real? The journal records the group conversation behind that question, including threats,
            accusations and suggestions.
          </PageIntro>
        )}
        {!showLoader && tab === "concepts" && (
          <PageIntro from="concepts_intro">
            Ideas drawn from this archive&rsquo;s research and journal on a range of subjects, each one either the
            author&rsquo;s own speculation or generated by AI, and labelled as such.
          </PageIntro>
        )}
        {!showLoader && tab === "documents" && (
          <PageIntro from="documents_intro">
            The four-part journal series is the primary record, kept as the original documents; the research
            documents that follow are tools a person can use, from the Personal Protection Plan to a framework
            for legal action.
          </PageIntro>
        )}
        {/* Research has no description under the H1 (Sean, 30 Sep 2026); each section's
            H1 says what it is. */}
        {tab === "glossary" ? (
          <GlossarySection terms={glossaryTerms} gsel={gsel} setGsel={setGsel}
            docCats={ds?.docCats || {}}
            ctl={{ q: gcat, setQ: setGcat, sort: gsort, setSort: setGsort, topics: gtopics, setTopics: setGtopics, match: gmatch, setMatch: setGmatch, panel: gpanel, setPanel: setGpanel }} />
        ) : tab === "documents" ? (
          <DocumentsView />
        ) : tab === "data" || tab === "concepts" ? (
          null   // rendered below the switch so it can stay mounted
        ) : tab === "author" ? (
          <AuthorView />
        ) : tab === "disclaimer" ? (
          <DisclaimerView />
        ) : (
          <div className={selDoc ? "" : "lg:grid lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-x-8 lg:items-start"}>
            {!selDoc && (
              <SideNav
                mode="index"
                label="Months"
                sections={monthItems}
                active={activeMonth}
                onPick={pickMonth}
                phoneHandledElsewhere
              />
            )}
            <div className="min-w-0 lg:col-start-2">
              {selDoc ? (
                <Reader
                  doc={selDoc} body={body} bodyLoading={showBodyLoader} cats={ds?.docCats[selDoc.id] || []} gloss={ds?.docGloss[selDoc.id] || []}
                  onBack={() => setSel(null)}
                  onPrev={selIdx > 0 ? () => setSel(filtered[selIdx - 1].id) : undefined}
                  onNext={selIdx >= 0 && selIdx < filtered.length - 1 ? () => setSel(filtered[selIdx + 1].id) : undefined}
                />
              ) : (<>
                <MobileBar months={{ items: monthItems, active: activeMonth, onPick: pickMonth }}
                  sort={{ value: sort, options: JOURNAL_SORTS, label: "Sort entries", onChange: (v) => { setSort(v); track("sort_changed", { sort: v }); } }}
                  onFilter={() => { setPanelOpen(true); track("filter_opened", {}); }} filterOpen={panelOpen} />
                <ActiveLine shown={filtered.length} of={journal.length} noun="entries" q={q} clearQ={() => setQ("")}
                  pills={pills} onClearAll={resetFilters} searching={searching}
                  controls={<>
                    <SortSelect label="Sort entries" value={sort} options={JOURNAL_SORTS}
                      onChange={(v) => { setSort(v); track("sort_changed", { sort: v }); }} />
                    <FilterButton count={activeFilters} open={panelOpen} onOpen={() => { setPanelOpen(true); track("filter_opened", {}); }} />
                    <FilterPanel open={panelOpen} setOpen={setPanelOpen} title="Search & filter the journal"
                      q={q} setQ={setQ} placeholder={`Search ${journal.length} entries — words, names, places`} searchLabel="Search the journal"
                      groups={filterGroups} shown={filtered.length} searching={searching} onClearAll={resetFilters} />
                  </>} />
                <Feed items={pageItems} excerpts={excerpts} docCats={ds?.docCats || {}} lead={fsel.theme || []} total={filtered.length} from={start + 1}
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
              conceptFilters={conceptFilters} setConceptFilters={setConceptFilters} conceptSort={conceptSort} setConceptSort={setConceptSort}
              view={dataView} onView={(v: string) => setDataView(v)}
              sub={tab === "concepts" ? "concepts" : dataSub}
              onSub={(s) => {
                // The vertical decides the address: concepts keeps /concepts,
                // everything else is /data. Both were indexed before the merge
                // and both still resolve after it.
                if (s !== "concepts") arriveAtResearch(s);
                setDataSub(s);
                setTab(s === "concepts" ? "concepts" : "data");
              }}
            />
          </div>
        )}

        {/* BOTTOM SECTIONS (Sean, 1 Oct 2026): the home page's Journal, Concepts,
            Research and Glossary blocks under every page, never the page's own.
            They replace the "From the glossary" / "From the journal" peeks that
            sat here. Keyed by page so each page starts its carousels fresh. */}
        {!showLoader && (() => {
          const tail: { exclude: BottomBlock[]; from: string } | null =
            // No research chart under the journal (Sean, 1 Oct 2026).
            tab === "journal" ? { exclude: ["journal", "research"], from: selDoc ? "journal-entry" : "journal" }
            : tab === "concepts" ? { exclude: ["concepts"], from: "concepts" }
            : tab === "glossary" ? { exclude: ["glossary"], from: gsel ? "glossary-term" : "glossary" }
            : tab === "data" ? { exclude: ["research"], from: `research/${dataSub}` }
            : tab === "documents" ? { exclude: [], from: "documents" }
            : tab === "author" ? { exclude: ["research", "glossary"], from: "author" }
            : null; // the disclaimer carries none
          return tail ? <BottomSections key={tail.from} exclude={tail.exclude} from={tail.from} /> : null;
        })()}
        </div>
      </main>

      <Footer onNav={(t) => { if (t === "data") arriveAtResearch("timeline"); setTab(t); setSel(null); setGsel(null); }} />

    </div>
  );
}

const JOURNAL_SORTS: { v: SortDir; l: string }[] = [{ v: "newest", l: "Newest first" }, { v: "oldest", l: "Oldest first" }];

const TAB_TITLE: Record<Tab, string> = { news: "News", journal: "Journal", glossary: "Glossary", documents: "Documents", data: "Research", concepts: "Concepts", author: "About the author", disclaimer: "Disclaimer" };

// ~200px page-title band under the nav; its h1 is the current section name,
// left-aligned and larger than any other heading. 80% width via its parent <main>.
function TitleBand({ title, actions, eyebrow }: { title: string; actions?: React.ReactNode; eyebrow?: string }) {
  return (
    <section className="w-full min-h-[72px] sm:min-h-[160px] flex flex-wrap items-end justify-between gap-x-6 gap-y-4 mb-4 pb-0 sm:mb-8 sm:pb-6">
      <div>
        {eyebrow && (
          <p className="font-display text-[12px] sm:text-[13px] font-semibold uppercase tracking-[0.14em] text-muted m-0 mb-2 sm:mb-3">{eyebrow}</p>
        )}
        <h1 className="font-display font-bold tracking-tight text-foreground text-[25px] md:text-[34px] lg:text-[42px] leading-none">{title}</h1>
      </div>
      {actions}
    </section>
  );
}

/* ---------- Feed ---------- */
function Feed({ items, excerpts, docCats, lead = [], total, from, filteredOf, searching, onClear, page, totalPages, setPage, onOpen, onSearch }: any) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <span />
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted">
            {items.length ? `${from}–${from + items.length - 1} of ${total}` : ""}
          </span>

        </div>
      </div>
      <div className="space-y-10">
        {items.map((d: Doc) => (
          <div key={d.id} className="relative">
          <Link href={journalHref(d.id)} onClick={spaClick(() => onOpen(d.id))} className="group block w-full text-left">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-muted">
              <span>{entryTypeLabel(docCats[d.id], d.doc_type)}</span>
              {d.audio_url && <span className="text-accent inline-flex items-center gap-1"><Volume2 size={12} /> audio</span>}
              {d.part != null && <span className="ml-auto">Part {d.part}</span>}
            </div>
            <div className="mt-1.5 font-display text-[19px] font-semibold text-foreground group-hover:text-accent transition-colors">{d.title || d.id}</div>
            <div className="text-[12px] text-muted mt-0.5">{d.entry_date}{d.weekday ? ` · ${d.weekday}` : ""}{d.recording_time ? ` · ${d.recording_time}` : ""}</div>
            <p className="mt-2.5 body-copy text-foreground/80 line-clamp-3">{excerpts[d.id] ?? "…"}</p>
            <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[11px] uppercase tracking-wide text-muted">
              {/* topics being filtered on come first, so the reason a card is listed is never cut off by the four-tag limit */}
              {(docCats[d.id] || []).filter((c: string) => c in THEMES)
                .sort((a: string, b: string) => Number(lead.includes(b)) - Number(lead.includes(a))).slice(0, 4).map((c: string) => <span key={c}>{THEMES[c]}</span>)}
            </div>
            <div className="mt-3 text-accent text-sm">Read →</div>
          </Link>
          <CardShare title={d.title || d.id} path={journalHref(d.id)} className="absolute -bottom-2 right-0" />
          </div>
        ))}
        {items.length === 0 && !searching && <div className="text-muted text-sm py-10 text-center">No entries match. <button onClick={onSearch} className="text-accent underline">Adjust filters</button></div>}
      </div>
      {totalPages > 1 && <Pager page={page} totalPages={totalPages} setPage={setPage} />}
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
function GlossarySection({ terms, gsel, setGsel, ctl, docCats }: { terms: any[]; gsel: string | null; setGsel: (s: string | null) => void; ctl: GCtl; docCats: Record<string, string[]> }) {
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
    content = <GlossaryList terms={terms} ctl={ctl} docCats={docCats} onOpen={setGsel} />;
  }
  return (
    // One SideNav across the site (Sean, 2026-08-21). Index mode: picking a
    // term replaces the content, so there is no scroll-spy — the active entry
    // is whatever is open.
    // THE RAIL IS THE GLOSSARY'S INDEX (Sean, 1 Oct 2026, after trying tiles:
    // "it's important that we see all the terms"). A quarter of the page wide,
    // larger type, and twice the gap to the definitions.
    <div className="lg:grid lg:grid-cols-[minmax(15rem,25%)_minmax(0,1fr)] lg:gap-x-16 lg:items-start">
      <SideNav
        large
        mode="index"
        label="Terms"
        sections={terms.map((t: any) => ({ id: t.slug, label: cleanTerm(t.term) }))}
        active={gsel}
        onPick={(slug: string) => setGsel(slug)}
        phoneHandledElsewhere={!gsel}
      />
      <div className="min-w-0">
        {content}
      </div>
    </div>
  );
}

type GSort = "az" | "za";
const GLOSSARY_SORTS: { v: GSort; l: string }[] = [
  { v: "az", l: "A to Z" }, { v: "za", l: "Z to A" },
];
type GCtl = {
  q: string; setQ: (v: string) => void; sort: GSort; setSort: (v: GSort) => void;
  topics: string[]; setTopics: (v: string[]) => void; match: "any" | "all"; setMatch: (m: "any" | "all") => void;
  panel: boolean; setPanel: (o: boolean) => void;
};
// A term's document id: the primary-record terms carry one; the site-written terms
// are IS-GLO-SITE-<SLUG> in the download and Supabase `documents`.
const glossaryDocId = (t: any) => t.document_id || `IS-GLO-SITE-${String(t.slug || t.term).toUpperCase().replace(/[^A-Z0-9]+/g, "-")}`;

/**
 * The Glossary list, with the same controls as the Journal and Concepts (Sean,
 * 30 Sep 2026): search in the Filter panel, Sort beside it, chips above the
 * list, and the phone icon bar (Terms / Sort / Filter).
 *
 * Topic: seven general topics, up to two per term (Sean, 30 Sep 2026), stored
 * like journal themes — category rows of kind `glossary_topic` on each term's
 * document id. Order and labels: lib/glossary-topics.json. Rules:
 * project/glossary-topics.md. Dates do not apply to definitions. "Most used in
 * the journal" was left out: usage links exist for only 16 of the terms, so it
 * would rank the newer ones last for a reason that is not true.
 */
function GlossaryList({ terms, ctl, docCats, onOpen }: { terms: any[]; ctl: GCtl; docCats: Record<string, string[]>; onOpen: (s: string) => void }) {
  const { q, setQ, sort, setSort, topics, setTopics, match, setMatch, panel, setPanel } = ctl;
  const ql = q.trim().toLowerCase();
  const topicsOf = (t: any) => (docCats[glossaryDocId(t)] || []).filter((c) => c in GLOSSARY_TOPICS.topics);
  // Only topics some term carries, in the agreed order.
  const topicOpts = useMemo(() => {
    const used = new Set(terms.flatMap((t) => topicsOf(t)));
    return Object.keys(GLOSSARY_TOPICS.topics).filter((k) => used.has(k));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [terms, docCats]);
  const topicLabel = (k: string) => (GLOSSARY_TOPICS.topics as Record<string, string>)[k] || k;
  const shown = useMemo(() => {
    const list = terms.filter((t) =>
      (!ql || t.term.toLowerCase().includes(ql) || (t.definition || "").toLowerCase().includes(ql)) &&
      (!topics.length || (match === "all" ? topics.every((x) => topicsOf(t).includes(x)) : topics.some((x) => topicsOf(t).includes(x)))));
    if (sort === "za") return [...list].reverse();
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [terms, ql, topics, match, sort, docCats]);
  // Paginate the term list, matching the journal feed (same PAGE_SIZE + Pager).
  const [gpage, setGpage] = useState(1);
  useEffect(() => { setGpage(1); }, [q, topics, match, sort]);
  const totalPages = Math.max(1, Math.ceil(shown.length / PAGE_SIZE));
  const page = Math.min(gpage, totalPages);
  const pageItems = shown.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const clearAll = () => { setQ(""); setTopics([]); };
  const groups: FilterGroup[] = topicOpts.length ? [{
    key: "gtopic", label: "Topic", options: topicOpts.map((v) => ({ v, l: topicLabel(v) })), values: topics,
    matchable: true, match, setMatch,
    hint: "The field a term belongs to. A term can sit in two.",
    toggle: (v) => setTopics(topics.includes(v) ? topics.filter((x) => x !== v) : [...topics, v]),
    clear: () => setTopics([]),
  }] : [];
  const pills = topics.map((v) => ({ key: `gtopic:${v}`, label: topicLabel(v), clear: () => setTopics(topics.filter((x) => x !== v)) }));
  const openPanel = () => { setPanel(true); track("filter_opened", { section: "glossary" }); };
  const onSort = (v: GSort) => { setSort(v); track("sort_changed", { sort: v, section: "glossary" }); };
  return (
    <div className="w-full mx-auto">
      <MobileBar
        months={{ items: terms.map((t) => ({ id: t.slug, label: cleanTerm(t.term) })), active: null, onPick: onOpen, label: "Terms", icon: List }}
        sort={{ value: sort, options: GLOSSARY_SORTS, label: "Sort terms", onChange: onSort }}
        onFilter={openPanel} filterOpen={panel} />
      <ActiveLine shown={shown.length} of={terms.length} noun="terms" q={q} clearQ={() => setQ("")}
        pills={pills} onClearAll={clearAll} countOnPhone
        controls={<>
          <SortSelect label="Sort terms" value={sort} options={GLOSSARY_SORTS} onChange={onSort} />
          <FilterButton count={pills.length + (ql ? 1 : 0)} open={panel} onOpen={openPanel} />
          <FilterPanel open={panel} setOpen={setPanel} title="Search & filter the glossary"
            q={q} setQ={setQ} placeholder={`Search ${terms.length} terms and their definitions`} searchLabel="Search the glossary"
            groups={groups} shown={shown.length} onClearAll={clearAll} />
        </>} />
      <div className="space-y-8">
        {pageItems.map((t: any) => {
          const { pron, body } = splitDef(t.definition);
          return (
            <div key={t.slug} className="relative">
            <Link href={glossaryHref(t.slug)} onClick={spaClick(() => onOpen(t.slug))} className="group block w-full text-left">
              <h2 className="font-display text-xl font-semibold text-foreground group-hover:text-accent transition-colors term-title">{cleanTerm(t.term)}</h2>
              {pron && <div className="text-xs text-muted italic mt-1">{pron}</div>}
              <p className="body-copy text-foreground/85 mt-2 whitespace-pre-wrap line-clamp-3">{cleanDef(body)}</p>
              <div className="mt-2 text-accent text-sm">Read →</div>
            </Link>
            <CardShare title={cleanTerm(t.term)} path={glossaryHref(t.slug)} className="absolute -bottom-2 right-0" />
            </div>
          );
        })}
        {shown.length === 0 && <div className="text-muted text-sm py-10 text-center">No terms match.{" "}<button type="button" onClick={clearAll} className="text-accent underline underline-offset-4">Clear all</button></div>}
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

/* ---------- Filter panel (slide-over) ---------- */
/* ---------- Journal search + filter toolbar ----------
 * The Concepts pattern (components/ConceptsToolbar.tsx), so the site has one
 * idiom (Sean, 30 Sep: "Let's just use the concepts filter"). Search narrows
 * the list as you type; Filter opens a panel of chip groups; active choices
 * read back as removable pills; "N of 417" says how much is shown. Not sticky.
 */
/* ---------- Export modal ----------
 * Every count below comes from lib/corpus-summary.ts, which is generated from
 * the zip this button serves. The previous copy was a hand-written sentence
 * that named Government Cloud and Public Health and never learned about Crime,
 * Concepts, or the research inputs — so it under-described the download for
 * weeks. A sentence about generated content has to be generated too.
 */
/* ---------- Documents ----------
 * Tiles, two across, matching Concepts (Sean, 30 Sep 2026). The research
 * documents lead; the four-part journal series follows at the bottom. Each tile opens the original
 * Google Doc and carries its own share icon. No filters. */
function DocumentsView() {
  const journal = DOCUMENTS.filter((d) => d.kind === "journal");
  const refs = DOCUMENTS.filter((d) => d.kind !== "journal");
  const tiles = (list: typeof DOCUMENTS) => (
    <ul className="list-none p-0 m-0 grid grid-cols-1 md:grid-cols-2 gap-5">
      {list.map((d) => (
        <li key={d.title} className="relative flex">
          <a href={d.url} target="_blank" rel="noreferrer noopener"
            onClick={() => track("document_opened", { title: d.title })}
            className="group flex flex-col w-full border border-edge p-6 pr-14 hover:border-foreground transition-colors">
            <span className="text-[12px] uppercase tracking-[0.08em] font-semibold text-muted mb-3">{d.subline}</span>
            <h3 className="font-display font-semibold text-foreground text-[22px] md:text-[24px] leading-tight mb-3 group-hover:underline underline-offset-4">
              {d.title}
            </h3>
            <p className="text-[17px] leading-[1.55] text-foreground/80 line-clamp-3 m-0 mb-5">{d.description}</p>
            <span className="mt-auto text-[14px] text-foreground">Open the original &#8599;</span>
          </a>
          <CardShare title={d.title} url={d.url} className="absolute top-3 right-3" />
        </li>
      ))}
    </ul>
  );
  return (
    <div className="w-full">
      {/* The journal series leads again (Sean, 30 Sep 2026: "move the section with
          the four part document series back to the top"). */}
      <h2 className={H2_CLASS}>The journal series</h2>
      <p className={SUB_CLASS}>The primary record, in four parts, as the original Google Docs.</p>
      {tiles(journal)}
      <h2 className={H2_CLASS + " !mt-16"}>The research documents</h2>
      <p className={SUB_CLASS}>Protection, legal plans and analysis built on the journal.</p>
      {tiles(refs)}
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
