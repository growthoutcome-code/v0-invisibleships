// Server-only corpus reader. Reads the bundled JSON corpus from public/corpus
// at build/request time (fs) so item routes can statically generate pages and
// emit per-item preview metadata. Memoized so all pages share one parse.
import type { HomeQuotePick } from "@/lib/home-quotes";
import fs from "fs";
import path from "path";
import type { Doc, GlossaryTerm } from "./types";
import { EXTRA_GLOSSARY } from "./site-content";
import { cleanDef, splitDef, firstSentences } from "./glossary-format";

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
  /** The archive's own open question for this slide. Curated picks only. */
  question?: string;
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

    /** Cut one anchored passage. Called once for `anchor`, once per `also`. */
    const passage = (anchor: string, chars: number, min?: number): string => {
      const at = body.indexOf(anchor);
      if (at < 0) {
        throw new Error(
          `home quote: anchor ${JSON.stringify(anchor)} no longer appears in ${pick.id}. ` +
            `The entry was edited. Re-cut the anchor in lib/home-quotes.ts.`
        );
      }
      // Open on the speaker's own quotation mark. Falling back to the start of
      // the line puts whatever preamble shares that line in front of the quote,
      // which buries the line that actually lands.
      //
      // ONLY IF THAT QUOTE MARK IS ON THE ANCHOR'S OWN LINE. Without that
      // condition the search walks backwards past line breaks and opens on a
      // completely different quotation: the first `also` passage written, which
      // anchors on "Additional information was suggested telepathically",
      // snapped back to the preceding line and rendered the self-identification
      // quote instead of the sentence it was pointed at. An anchor is either
      // inside a quotation — in which case its opening mark shares its line — or
      // it is prose, and prose starts where its line starts.
      const quoteAt = Math.max(body.lastIndexOf("\u201c", at), body.lastIndexOf('"', at));
      const sameLine = quoteAt >= 0 && !body.slice(quoteAt, at).includes("\n");
      const from = sameLine && at - quoteAt < 200 ? quoteAt : body.lastIndexOf("\n", at) + 1;
      let cut = body.slice(from, from + chars);
      // End on a sentence, not on whatever character the budget landed on.
      //   1. punctuation + closing quote  — a quoted sentence, the common case
      //   2. a bare closing curly quote   — a quote with no terminal punctuation
      //   3. a sentence end               — for prose entries that are not quotes
      const floor = Math.max(24, min ?? 24);
      const above = (i: number) => i > floor;
      const quoted = [...cut.matchAll(/[.?!\u2026]["\u201d]/g)];
      const lastQuoted = quoted[quoted.length - 1];
      const curly = cut.lastIndexOf("\u201d");
      const sentences = [...cut.matchAll(/[.?!\u2026](\s|$)/g)];
      const lastSentence = sentences[sentences.length - 1];
      if (lastQuoted && above(lastQuoted.index ?? 0)) {
        cut = cut.slice(0, (lastQuoted.index ?? 0) + 2);
      } else if (above(curly)) {
        cut = cut.slice(0, curly + 1);
      } else if (lastSentence && above(lastSentence.index ?? 0)) {
        cut = cut.slice(0, (lastSentence.index ?? 0) + 1);
      } else {
        // NO BOUNDARY ABOVE THE FLOOR — without this the excerpt is left as the
        // raw slice, cut mid-word with no ellipsis. `min` is a preference for a
        // longer excerpt, never a licence to publish a broken one.
        const best = Math.max(
          lastQuoted ? (lastQuoted.index ?? 0) + 2 : -1,
          curly >= 0 ? curly + 1 : -1,
          lastSentence ? (lastSentence.index ?? 0) + 1 : -1,
        );
        if (best > 24) cut = cut.slice(0, best);
      }
      // Strip transcript timecodes — [00:04:25], [ 8m33s ], (17:08). Load-bearing
      // inside an entry, pure noise on a slide. Stripped here rather than in the
      // corpus, which stays untouched.
      return cut
        .replace(/\s*[[(]\s*\d{1,2}(?:[:m]\d{1,2}){1,2}s?\s*[\])]/g, "")
        .replace(/[ \t]+\n/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
    };

    let cut = [
      passage(pick.anchor, pick.chars, pick.min),
      ...(pick.also ?? []).map((x) => passage(x.anchor, x.chars, x.min)),
    ].join("\n\n");

    // THE AUTHOR'S NAME COMES OUT (Sean, 8 September): "please remove my name
    // Sean Harris from any quote. You can keep the quote. Just remove my name."
    //
    // Done here rather than in the corpus, which stays byte-identical to what
    // the archive publishes — this is a presentation rule for the front page,
    // not an edit to the record. It is also the same rule the archive already
    // applies to everyone else: anonymise the person, never degrade the record.
    //
    // Only the vocative forms are handled, because those are the ones that
    // delete cleanly: "Sean Harris! Stop typing…" and "I'm a female, Sean."
    // A name used as a subject or object ("I told Sean about it") cannot be
    // deleted without breaking the sentence, so rather than quietly shipping
    // broken prose the build FAILS and says to re-cut the anchor — the same
    // discipline the anchors themselves run under.
    // ONLY THE VOCATIVE FORMS ARE TOUCHED, and that restriction is the whole
    // safety of this. Deleting the name wherever it appears looks like it works
    // and quietly does not: "This is the voice of Sean Christopher Harris and I
    // am being asked to repeat a statement" becomes "This is the voice of and I
    // am…", which is broken prose that no longer contains the word the check
    // was looking for. So the name is removed ONLY where it is being addressed —
    // opening a quotation, or set off by a comma — and every other appearance
    // fails the build instead of shipping a mangled sentence.
    cut = cut
      // "Sean Harris! Stop typing…" / "“Sean, please stop."  — opening address
      .replace(/(^|[“"‘'\n])\s*Sean(?:\s+Christopher)?(?:\s+Harris)?\b\s*[!,]\s*/g, "$1")
      // "I'm a female, Sean." — trailing address, comma and all
      .replace(/,\s*Sean(?:\s+Christopher)?(?:\s+Harris)?\b(?=\s*[.!?,”"]|$)/g, "")
      .replace(/[ \t]{2,}/g, " ")
      .replace(/\s+([.!?,])/g, "$1");
    // WHERE THE NAME CANNOT BE DELETED, IT IS MARKED (8 September). Until now
    // this threw, on the grounds that "This is the voice of Sean Christopher
    // Harris and I am…" cannot have the name cut out of it without producing
    // "the voice of and I am…". That was right about the danger and wrong about
    // the remedy: the first entry's strongest continuation runs straight through
    // exactly that sentence, and refusing to render it meant the slide stopped
    // three sentences early.
    //
    // A bracketed marker is the ordinary scholarly form for this and it is more
    // honest than either alternative — it neither leaves the name in nor hides
    // that something was taken out. The vocative forms above still delete
    // cleanly, because "Sean Harris! Stop typing" loses nothing without them.
    cut = cut.replace(/\bSean(?:\s+Christopher)?(?:\s+Harris)?\b/g, "[name removed]");
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
      question: pick.question,
    };
  });
}

/**
 * Glossary terms for the home page carousel, as COMPLETE statements.
 *
 * Two things were wrong here before 8 September. It cut at a hard 150
 * characters, so every slide ended mid-word; and it used cleanDef alone, which
 * strips markdown headings but NOT the dictionary head matter — so the home
 * page was the one surface in the site rendering "per·SEP·choo·uhl set, noun A
 * perceptual set is a tendency to…" with the term repeated as the slide title
 * directly above it. Every other glossary surface already used splitDef.
 */
export function homeGlossary(
  slugs: string[],
): { slug: string; term: string; pron: string; summary: string }[] {
  const L = load();
  return slugs
    .map((sl) => L.glossBySlug.get(sl.toLowerCase()))
    .filter((t): t is GlossaryTerm => Boolean(t))
    .map((t) => ({
      slug: t.slug.toLowerCase(),
      term: t.term,
      // Three sentences at 460, not two at 320 — Sean, 9 September: "we need
      // more meat under the glossary section… three to four lines of text."
      // The pronunciation was already being computed by splitDef and thrown
      // away; it is the one piece of a dictionary entry the site had nowhere to
      // put, and a slide with the term as its heading is where it belongs.
      pron: splitDef(t.definition || "").pron.replace(/\s+/g, " ").trim(),
      // 500, not 460: "cognitive liberty" opens with a 122-character sentence
      // followed by a 370-character one, and at 460 the pair did not fit, so the
      // slide rendered two lines where the others rendered five. The cap has to
      // clear the longest real sentence in the set or it silently truncates the
      // entry that most needs the room.
      summary: firstSentences(cleanDef(splitDef(t.definition || "").body), 3, 500),
    }));
}

/** How many terms the glossary holds, for the home page's meta line. */
export function glossaryCount(): number {
  return load().glossBySlug.size;
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
