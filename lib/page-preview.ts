import { getJournalItem, getGlossaryItem } from "@/lib/server-corpus";
import { DATA_SECTIONS } from "@/lib/routes";

/**
 * What a path in the "Pages viewed" table actually is.
 *
 * The table showed raw paths — "/journal/is-j01-20250227-entry", "/data" — which say
 * how much something was read and nothing about what it was. Sean, 29 September: "can
 * we provide a modal that previews and links to the pages in the insights?"
 *
 * Two halves, deliberately separated. classifyPath() is pure string work and is
 * guarded by scripts/check_page_preview.mts. previewForPath() reads the bundled corpus
 * and is server-only, because getJournalItem touches the filesystem.
 */

export type PathKind =
  | "home" | "journal-index" | "journal-entry"
  | "glossary-index" | "glossary-term"
  | "concepts" | "data-index" | "data-section"
  | "documents" | "disclaimer" | "author" | "why" | "safety" | "insights"
  | "api" | "unknown";

/** The static routes, path -> kind. Anything with a parameter is handled below. */
const FIXED: Record<string, PathKind> = {
  "/": "home",
  "/journal": "journal-index",
  "/glossary": "glossary-index",
  "/concepts": "concepts",
  "/data": "data-index",
  "/documents": "documents",
  "/disclaimer": "disclaimer",
  "/author": "author",
  "/why": "why",
  "/safety": "safety",
  "/insights": "insights",
};

/**
 * Normalise an analytics path and say what it is.
 *
 * PURE, and it has to cope with whatever the two tools hand it. Google reports
 * `pagePath` with the query string attached, sometimes with a trailing slash, and
 * occasionally percent-encoded; PostHog reports `$pathname`. A classifier that only
 * understood tidy paths would file "/journal/" and "/journal?ref=x" as unknown and
 * quietly tell the reader the journal is not a page on this site. Encoded separators
 * are NOT decoded into real ones — see the note inside.
 */
export function classifyPath(raw: string): { kind: PathKind; param?: string; path: string } {
  let p = (raw || "").trim();
  // Query and fragment first: "/data?x=1#y" is still /data.
  p = p.split("?")[0].split("#")[0];
  p = p.toLowerCase();
  if (!p.startsWith("/")) p = `/${p}`;
  // Collapse repeated slashes and drop a trailing one, except on the root itself.
  p = p.replace(/\/{2,}/g, "/");
  if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);

  // DECODING HAPPENS PER SEGMENT, AFTER THE STRUCTURE IS FIXED, AND NEVER BEFORE.
  //
  // The first version decoded the whole path up front. scripts/check_page_preview.mts
  // caught what that means on its first run: "/%2Fjournal" became "//journal", the
  // slash-collapsing step turned it into "/journal", and the panel confidently
  // described a scanner probe as the journal index and offered a link to it. Turning
  // an encoded slash into a real one is the same over-decoding mistake that defeats
  // path-traversal filters; the stakes here are only a label, but the rule is the
  // same. %2F is a character in a segment, not a separator.
  const seg = p.split("/").filter(Boolean);
  const decode = (v: string) => {
    try {
      return decodeURIComponent(v);
    } catch {
      // A malformed escape ("%zz") throws. previewForPath runs on every row at render
      // time, so a throw here would take the whole page down for one bad path.
      return v;
    }
  };

  if (FIXED[p]) return { kind: FIXED[p], param: undefined, path: p };
  if (p.startsWith("/api/") || p === "/api") return { kind: "api", path: p };

  if (seg.length === 2) {
    if (seg[0] === "journal") return { kind: "journal-entry", param: decode(seg[1]), path: p };
    if (seg[0] === "glossary") return { kind: "glossary-term", param: decode(seg[1]), path: p };
    if (seg[0] === "data") return { kind: "data-section", param: decode(seg[1]), path: p };
  }
  return { kind: "unknown", path: p };
}

export type PagePreview = {
  /** The normalised path, which is what the row should display. */
  path: string;
  /** What a reader would call it. */
  title: string;
  /** "Journal entry", "Glossary term", "Section" — the row's category. */
  kind: string;
  /** A sentence or two about what is there. Never an excerpt of a journal body. */
  blurb: string;
  /** Small facts worth showing as chips: a date, a location, glossary terms. */
  facts: string[];
  /** Where to send the reader, or null when there is nothing to open. */
  href: string | null;
  /** Said plainly when the path is not a page of this site. */
  warning?: string;
};

const SECTION_BLURB: Partial<Record<PathKind, { title: string; kind: string; blurb: string }>> = {
  home: { title: "Home", kind: "Landing page", blurb: "The front door: what the archive is, the latest entries, and the way into each section." },
  "journal-index": { title: "Journal", kind: "Section", blurb: "The dated journal — every entry, by month, newest first. The archive's primary record." },
  "glossary-index": { title: "Glossary", kind: "Section", blurb: "The archive's terms, defined once and linked from wherever they are used." },
  concepts: { title: "Concepts", kind: "Section", blurb: "The claims the archive makes, each carrying its evidence basis, its origin, and what would change it." },
  "data-index": { title: "Research", kind: "Section", blurb: "The research verticals and the timeline, drawn from public records and statistical releases." },
  documents: { title: "Documents", kind: "Section", blurb: "Primary documents and filings referenced elsewhere in the archive." },
  disclaimer: { title: "Disclaimer", kind: "Page", blurb: "The Critical Disclaimer on Transcripts and Accusations, in full, plus copyright and terms." },
  author: { title: "Author", kind: "Page", blurb: "Who compiled the archive and on what basis." },
  why: { title: "Why", kind: "Page", blurb: "Perceptual set — what the name means and why the framing matters before reading." },
  safety: { title: "Safety", kind: "Page", blurb: "The content warning and crisis resources, on their own page." },
  insights: { title: "Insights", kind: "Page", blurb: "This page: what the site can see about its own traffic, and what it deliberately cannot." },
};

/**
 * Resolve one path to something a person can read, and a link to open it.
 *
 * NO JOURNAL EXCERPTS, and that is not an oversight. lib/server-corpus.ts carries the
 * reasoning at length: of the 438 journal documents, 89 open with euthanasia, self-harm
 * or violence language inside their first 220 characters, which is why the home page
 * shows a date, a place and the entry's glossary terms rather than its opening line.
 * The same rule applies here. A preview panel is exactly the surface where an
 * auto-generated first sentence would put that text in front of somebody who asked
 * only "what is this page". Glossary definitions are different and are shown: a
 * definition is written to be read out of context.
 */
export function previewForPath(raw: string): PagePreview {
  const { kind, param, path } = classifyPath(raw);

  const fixed = SECTION_BLURB[kind];
  if (fixed) return { path, ...fixed, facts: [], href: path };

  if (kind === "data-section") {
    const hit = DATA_SECTIONS.find((s) => s.slug === param);
    if (hit) return { path, title: hit.label, kind: "Research vertical", blurb: hit.blurb, facts: [], href: path };
    return { path, title: param ?? path, kind: "Research vertical", blurb: "A research vertical that is no longer part of the site.", facts: [], href: null, warning: "This vertical does not exist." };
  }

  if (kind === "journal-entry") {
    const item = param ? getJournalItem(param) : null;
    if (!item) {
      return { path, title: param ?? path, kind: "Journal entry", blurb: "No entry with this identifier is in the corpus.", facts: [], href: null, warning: "This entry does not exist. A request for it is far likelier to be a scanner than a reader." };
    }
    const d = item.doc;
    const facts = [
      d.entry_date ? `${d.weekday ? `${d.weekday}, ` : ""}${d.entry_date}` : null,
      d.location || null,
      d.audio_url || d.audio_file ? "Has audio" : null,
      d.word_count ? `${d.word_count.toLocaleString("en-US")} words` : null,
      item.gloss.length ? `${item.gloss.length} glossary ${item.gloss.length === 1 ? "term" : "terms"}` : null,
    ].filter(Boolean) as string[];
    return {
      path,
      title: d.title || d.id,
      kind: "Journal entry",
      // Deliberately describes rather than quotes — see the note above this function.
      blurb: "A dated entry in the journal. Its text is not previewed here: journal entries can open on material the site puts a content warning in front of, so this panel names the entry and leaves the reading to the page itself.",
      facts,
      href: path,
    };
  }

  if (kind === "glossary-term") {
    const item = param ? getGlossaryItem(param) : null;
    if (!item) {
      return { path, title: param ?? path, kind: "Glossary term", blurb: "No term with this slug is in the glossary.", facts: [], href: null, warning: "This term does not exist." };
    }
    const def = (item.term.definition || "").trim();
    return {
      path,
      title: item.term.term,
      kind: "Glossary term",
      blurb: def ? (def.length > 320 ? `${def.slice(0, 317)}…` : def) : "This term has no definition recorded yet.",
      facts: [],
      href: path,
    };
  }

  if (kind === "api") {
    return { path, title: path, kind: "Endpoint", blurb: "A server route rather than a page. It answers requests from the site itself — the corpus download and the gate log both run through these.", facts: [], href: null, warning: "Not a page, so there is nothing to open." };
  }

  return {
    path,
    title: path,
    kind: "Unrecognised",
    blurb: "This path is not a route of this site. It can still collect visits: a link from elsewhere, a scanner probing for common filenames, or a page that once existed and has since been removed.",
    facts: [],
    href: null,
    warning: "Not a page on this site.",
  };
}
