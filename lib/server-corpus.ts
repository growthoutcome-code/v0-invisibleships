// Server-only corpus reader. Reads the bundled JSON corpus from public/corpus
// at build/request time (fs) so item routes can statically generate pages and
// emit per-item preview metadata. Memoized so all pages share one parse.
import type { HomeQuotePick } from "@/lib/home-quotes";
import fs from "fs";
import path from "path";
import type { Doc, GlossaryTerm } from "./types";
import { EXTRA_GLOSSARY } from "./site-content";
import { cleanDef } from "./glossary-format";

type Loaded = {
  journal: Doc[];                       // sorted feed order, includes body_markdown
  byId: Map<string, Doc>;               // lowercased id -> journal doc
  docCats: Record<string, string[]>;
  docGloss: Record<string, string[]>;
  glossary: GlossaryTerm[];             // corpus + extra, sorted by term
  glossBySlug: Map<string, GlossaryTerm>;
};

let _cache: Loaded | null = null;

function load(): Loaded {
  if (_cache) return _cache;
  const dir = path.join(process.cwd(), "public", "corpus");
  const man = JSON.parse(fs.readFileSync(path.join(dir, "_manifest.json"), "utf8"));
  const n = man.doc_chunks as number;
  const all: any[] = [];
  for (let i = 0; i < n; i++) {
    all.push(...JSON.parse(fs.readFileSync(path.join(dir, `documents_${String(i).padStart(2, "0")}.json`), "utf8")));
  }
  const rels = JSON.parse(fs.readFileSync(path.join(dir, "rels.json"), "utf8"));

  const docCats: Record<string, string[]> = {};
  for (const r of rels.doc_categories || []) (docCats[r.document_id] ||= []).push(r.category_slug);
  const docGloss: Record<string, string[]> = {};
  for (const r of rels.doc_glossary || []) (docGloss[r.document_id] ||= []).push(r.glossary_slug);

  const journal = (all.filter((d) => d.collection === "journal") as Doc[]).sort(
    (a, b) => (a.entry_date || "").localeCompare(b.entry_date || "") || (a.recording_index || 0) - (b.recording_index || 0)
  );
  const byId = new Map<string, Doc>();
  for (const d of journal) byId.set(d.id.toLowerCase(), d);

  const corpusGloss = (rels.glossary || []) as GlossaryTerm[];
  const glossary = [...corpusGloss, ...EXTRA_GLOSSARY].sort((a, b) => a.term.localeCompare(b.term));
  const glossBySlug = new Map<string, GlossaryTerm>();
  for (const t of glossary) glossBySlug.set(t.slug.toLowerCase(), t);

  _cache = { journal, byId, docCats, docGloss, glossary, glossBySlug };
  return _cache;
}

export function allJournalParams() {
  return load().journal.map((d) => ({ id: d.id.toLowerCase() }));
}
export function allGlossaryParams() {
  return load().glossary.map((t) => ({ slug: t.slug.toLowerCase() }));
}

export type JournalItem = {
  doc: Doc;
  body: string;
  cats: string[];
  gloss: string[];
  prev?: { id: string; title: string };
  next?: { id: string; title: string };
};
export function getJournalItem(param: string): JournalItem | null {
  const L = load();
  const key = decodeURIComponent(param).toLowerCase();
  const doc = L.byId.get(key);
  if (!doc) return null;
  const idx = L.journal.findIndex((d) => d.id === doc.id);
  const prev = idx > 0 ? L.journal[idx - 1] : null;
  const next = idx >= 0 && idx < L.journal.length - 1 ? L.journal[idx + 1] : null;
  return {
    doc,
    body: doc.body_markdown || "",
    cats: L.docCats[doc.id] || [],
    gloss: L.docGloss[doc.id] || [],
    prev: prev ? { id: prev.id.toLowerCase(), title: prev.title || prev.id } : undefined,
    next: next ? { id: next.id.toLowerCase(), title: next.title || next.id } : undefined,
  };
}

export type GlossaryItem = {
  term: GlossaryTerm;
  prev?: { slug: string; term: string };
  next?: { slug: string; term: string };
};
export function getGlossaryItem(param: string): GlossaryItem | null {
  const L = load();
  const key = decodeURIComponent(param).toLowerCase();
  const term = L.glossBySlug.get(key);
  if (!term) return null;
  const idx = L.glossary.findIndex((t) => t.slug === term.slug);
  const prev = idx > 0 ? L.glossary[idx - 1] : null;
  const next = idx >= 0 && idx < L.glossary.length - 1 ? L.glossary[idx + 1] : null;
  return {
    term,
    prev: prev ? { slug: prev.slug.toLowerCase(), term: prev.term } : undefined,
    next: next ? { slug: next.slug.toLowerCase(), term: next.term } : undefined,
  };
}

/**
 * Material for the home page, read from the bundled corpus at build time.
 *
 * DELIBERATELY NOT EXCERPTS. The home page is ungated; the journal is not. Of
 * the 438 journal documents, 89 carry euthanasia, self-harm or violence
 * language inside their first 220 characters — including two of the eight most
 * recent. An auto-populated carousel of excerpts would put "come outside and
 * raise your hand for euthanization" in front of anyone who lands on the site,
 * with no warning, which is precisely what the gate in front of the journal
 * exists to prevent.
 *
 * So a card carries the date, the place, and the glossary terms that entry
 * actually uses. That is real content — it shows the archive is specific,
 * located and dated — and the text itself stays behind the warning. Swap in
 * hand-picked excerpts when somebody has chosen which entries are safe to quote
 * openly; the shape does not need to change.
 */
export type HomeEntry = {
  id: string;
  date: string;
  weekday: string | null;
  location: string | null;
  hasAudio: boolean;
  terms: { slug: string; term: string }[];
};

export function homeJournal(limit = 10): HomeEntry[] {
  const L = load();
  const out: HomeEntry[] = [];

  // Newest first, and entries rather than individual recordings: a day is the
  // unit a reader recognises.
  //
  // Only entries that carry at least one glossary term. The home section IS the
  // journal-to-glossary intersection, so an entry with no term has nothing to
  // show there; 121 of 140 entries qualify, and skipping the other 19 changes
  // which days appear, never their dates or their order. "All 140 entries" sits
  // under the carousel so the selection is never mistaken for the whole.
  for (let i = L.journal.length - 1; i >= 0 && out.length < limit; i--) {
    const d = L.journal[i];
    if (d.doc_type !== "entry" || !d.entry_date) continue;
    // Deduped, in the corpus's own order. Ordering by rarity was tried and
    // dropped: it puts an editorial thumb on which word leads, and it changed
    // nothing here because most recent entries carry exactly one term.
    const slugs = [...new Set(L.docGloss[d.id] || [])].slice(0, 3);
    if (slugs.length === 0) continue;
    out.push({
      id: d.id.toLowerCase(),
      date: d.entry_date,
      weekday: d.weekday ?? null,
      location: d.location ?? null,
      hasAudio: Boolean(d.audio_url || d.audio_file),
      terms: slugs
        .map((sl) => L.glossBySlug.get(sl.toLowerCase()))
        .filter((t): t is GlossaryTerm => Boolean(t))
        .map((t) => ({ slug: t.slug.toLowerCase(), term: t.term })),
    });
  }
  return out;
}

/**
 * The last journal entry, in full.
 *
 * Sean, 30 August: "lead with the last known journal entry for the journal
 * section. It needs to be fully exposed… and do not suggest any journal
 * entries."
 *
 * So there is no curation here any more, and that is the point. A hand-picked
 * set was a set of choices about what the archive looks like; the last entry is
 * simply where the record currently stands. It changes when the record changes
 * and nobody decides which face it shows.
 *
 * FULLY EXPOSED means the entry's own body, not an excerpt of it. The home page
 * is ungated, so this is a deliberate decision by the author about his own
 * words, taken with the site-wide content warning in front of it.
 *
 * Ordering: L.journal is sorted ascending by entry_date, so the last "entry"
 * document in that array is the newest day. Recordings are skipped — a day is
 * the unit a reader recognises, and a lone recording has no date header of its
 * own.
 */
export type LatestEntry = {
  id: string;
  date: string;
  weekday: string | null;
  location: string | null;
  hasAudio: boolean;
  /** The entry's body markdown, unedited. */
  body: string;
};

export function latestEntry(): LatestEntry | null {
  const L = load();
  for (let i = L.journal.length - 1; i >= 0; i--) {
    const d = L.journal[i];
    if (d.doc_type !== "entry" || !d.entry_date) continue;
    return {
      id: d.id.toLowerCase(),
      date: d.entry_date,
      weekday: d.weekday ?? null,
      location: d.location ?? null,
      hasAudio: Boolean(d.audio_url || d.audio_file),
      body: d.body_markdown || "",
    };
  }
  return null;
}

/**
 * The newest entries, with their bodies — the home page slides THROUGH the
 * record rather than listing it.
 *
 * Sean, 30 August: "those don't add any value. We just wanna slide through
 * entries." The cards of dates and places were navigation furniture; a reader
 * moving to the next slide should get the next entry's words, not a link to
 * them. So each slide is an entry, newest first, and the carousel is how you
 * move back through the record.
 *
 * Still no curation: date order, nothing chosen. Truncation happens at render.
 */
export type JournalQuote = {
  id: string;
  date: string;
  weekday: string | null;
  location: string | null;
  hasAudio: boolean;
  body: string;
};

export function journalQuotes(count = 8): JournalQuote[] {
  const L = load();
  const out: JournalQuote[] = [];
  for (let i = L.journal.length - 1; i >= 0 && out.length < count; i--) {
    const d = L.journal[i];
    if (d.doc_type !== "entry" || !d.entry_date) continue;
    if (!(d.body_markdown || "").trim()) continue;
    out.push({
      id: d.id.toLowerCase(),
      date: d.entry_date,
      weekday: d.weekday ?? null,
      location: d.location ?? null,
      hasAudio: Boolean(d.audio_url || d.audio_file),
      body: d.body_markdown || "",
    });
  }
  return out;
}

/**
 * The curated home-page quotations, cut from the live corpus.
 *
 * The build FAILS if an anchor no longer matches its document — see
 * lib/home-quotes.ts for why that is the point rather than an inconvenience.
 * A quotation that cannot be located in the entry it cites must never render.
 */
export function curatedQuotes(picks: HomeQuotePick[]): JournalQuote[] {
  const L = load();
  return picks.map((pick) => {
    const d = L.byId.get(pick.id.toLowerCase());
    if (!d) {
      throw new Error(`home quote: no journal document with id ${pick.id}`);
    }
    const body = d.body_markdown || "";
    const at = body.indexOf(pick.anchor);
    if (at < 0) {
      throw new Error(
        `home quote: anchor ${JSON.stringify(pick.anchor)} no longer appears in ${pick.id}. ` +
          `The entry was edited. Re-cut the anchor in lib/home-quotes.ts.`
      );
    }
    // Open on the speaker's own quotation mark. Falling back to the start of
    // the line puts whatever preamble shares that line in front of the quote,
    // which buries the line that actually lands.
    const quoteAt = Math.max(body.lastIndexOf("\u201c", at), body.lastIndexOf('"', at));
    const from = quoteAt >= 0 && at - quoteAt < 200 ? quoteAt : body.lastIndexOf("\n", at) + 1;
    let cut = body.slice(from, from + pick.chars);
    // Trim back to the last closing quotation mark, so no slide ends on half a
    // line or on a dangling speaker tag.
    const close = Math.max(cut.lastIndexOf("\u201d"), cut.lastIndexOf('"'));
    if (close > 40) cut = cut.slice(0, close + 1);
    if (!d.entry_date) {
      throw new Error(`home quote: ${pick.id} has no entry_date`);
    }
    return {
      id: d.id.toLowerCase(),
      date: d.entry_date,
      weekday: d.weekday ?? null,
      location: d.location ?? null,
      hasAudio: Boolean(d.audio_url || d.audio_file),
      body: cut.trim(),
    };
  });
}

/** Glossary terms with a usable one-line summary, for the home page strip. */
export function homeGlossary(slugs: string[]): { slug: string; term: string; summary: string }[] {
  const L = load();
  return slugs
    .map((sl) => L.glossBySlug.get(sl.toLowerCase()))
    .filter((t): t is GlossaryTerm => Boolean(t))
    .map((t) => ({
      slug: t.slug.toLowerCase(),
      term: t.term,
      summary: glossarySummary(t.definition || "", 150),
    }));
}

export function journalStats() {
  const L = load();
  const days = new Set(L.journal.filter((d) => d.doc_type === "entry").map((d) => d.entry_date)).size;
  const recordings = L.journal.filter((d) => d.doc_type === "recording").length;
  return { days, recordings, docs: L.journal.length };
}

// Plain-text excerpt for meta descriptions (strips timestamps, audio lines, markdown).
export function excerptOf(md: string, n = 200): string {
  const lines = (md || "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .filter((l) => !l.startsWith("#") && !l.startsWith("**Audio") && !/^File duration/i.test(l));
  const text = lines
    .join(" ")
    .replace(/\[[0-9:]+\]/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*#>]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > n ? text.slice(0, n).replace(/\s+\S*$/, "") + "…" : text;
}
export function glossarySummary(def: string, n = 200): string {
  const t = cleanDef(def).replace(/\s+/g, " ").trim();
  return t.length > n ? t.slice(0, n).replace(/\s+\S*$/, "") + "…" : t;
}
