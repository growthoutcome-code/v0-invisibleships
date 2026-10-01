import { getJournalItem, getGlossaryItem } from "@/lib/server-corpus";
import { RESEARCH_SECTIONS } from "@/lib/routes";

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
  "/research": "data-index",
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

  // /research/<section>/<view> (30 Sep 2026): a view of a Research section.
  if (seg.length === 3 && seg[0] === "research") return { kind: "data-section", param: decode(seg[1]), path: p };
  if (seg.length === 2) {
    if (seg[0] === "journal") return { kind: "journal-entry", param: decode(seg[1]), path: p };
    if (seg[0] === "glossary") return { kind: "glossary-term", param: decode(seg[1]), path: p };
    // /data/<slug> is the pre-30-Sep address of /research/<slug>; both name the same section.
    if (seg[0] === "data" || seg[0] === "research") return { kind: "data-section", param: decode(seg[1]), path: p };
  }
  return { kind: "unknown", path: p };
}

/**
 * Plain readable prose from a corpus body, cut to length at a word boundary.
 *
 * PURE, and guarded — see scripts/check_page_preview.mts. Every failure mode here is
 * cosmetic until it is not: a stray "**" in a preview is only ugly, but an unclosed
 * link leaving a bare URL, or a cut landing mid-word, reads as carelessness on a page
 * whose whole argument is care.
 */
export function excerptFromMarkdown(raw: string, max = 320): string {
  let t = raw || "";
  t = t.replace(/^\s*---\r?\n[\s\S]*?\r?\n---\r?\n/, "");   // YAML frontmatter
  t = t.replace(/```[\s\S]*?```/g, " ");                        // fenced code
  t = t.replace(/!\[[^\]]*\]\([^)]*\)/g, " ");                   // images, before links
  t = t.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1");                 // links -> their text
  t = t.replace(/<([^<>\s]+)>/g, "$1");                          // autolinks
  t = t.replace(/^[ \t]*#{1,6}[ \t]*/gm, "");                    // headings
  t = t.replace(/^[ \t]*>[ \t]?/gm, "");                         // blockquotes
  t = t.replace(/^[ \t]*[-*+][ \t]+/gm, "");                     // list bullets
  t = t.replace(/(\*\*|__|\*|_|`)/g, "");                        // emphasis and inline code
  t = t.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const sp = cut.lastIndexOf(" ");
  // Cut at the last space, whenever there is one. The first version only honoured the
  // boundary past 60% of the limit, on the theory that an early space meant a very long
  // token; scripts/check_page_preview.mts showed what that actually does at a small
  // limit — "alpha bravo" at 10 characters came back as "alpha brav…", splitting a word
  // to save four characters. A hard cut is for the genuine case only: no space at all.
  const body = sp > 0 ? cut.slice(0, sp) : cut;
  return body.replace(/[\s,;:.\u2013\u2014-]+$/, "") + "\u2026";
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
  /** The opening of the page's own text, truncated. Absent where there is no body. */
  excerpt?: string;
  /** What the excerpt is, said above it. */
  excerptLabel?: string;
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
  author: { title: "Author", kind: "Page", blurb: "Who compiled the archive: work, training, volunteering and vaccination history." },
  why: { title: "Why", kind: "Page", blurb: "Perceptual set — what the name means and why the framing matters before reading." },
  safety: { title: "Safety", kind: "Page", blurb: "The content warning and crisis resources, on their own page." },
  insights: { title: "Insights", kind: "Page", blurb: "This page: what the site can see about its own traffic, and what it deliberately cannot." },
};

/**
 * Resolve one path to something a person can read, and a link to open it.
 *
 * EXCERPTS ARE SHOWN, which reverses an earlier call of mine. I had withheld journal
 * openings because lib/server-corpus.ts withholds them on the home page: 89 of the 438
 * documents open with euthanasia, self-harm or violence language inside their first 220
 * characters. Sean, 29 September: "remember, the visitor has already experienced the
 * gate with disclaimer." That is the distinction the home-page rule actually turns on,
 * and I had missed it. The gate cannot be dismissed and covers every route, and this
 * panel opens only on a click made after passing it — unlike the home page, which
 * paints before the gate arrives over it and is what a crawler sees.
 */
export function previewForPath(raw: string): PagePreview {
  const { kind, param, path } = classifyPath(raw);

  const fixed = SECTION_BLURB[kind];
  if (fixed) return { path, ...fixed, facts: [], href: path };

  if (kind === "data-section") {
    const hit = RESEARCH_SECTIONS.find((s) => s.slug === param);
    if (hit) return { path, title: hit.label, kind: "Research section", blurb: hit.blurb, facts: [], href: `/research/${hit.slug}` };
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
      blurb: "",
      excerpt: excerptFromMarkdown(item.body, 340),
      excerptLabel: "Opening of the entry",
      facts,
      href: path,
    };
  }

  if (kind === "glossary-term") {
    const item = param ? getGlossaryItem(param) : null;
    if (!item) {
      return { path, title: param ?? path, kind: "Glossary term", blurb: "No term with this slug is in the glossary.", facts: [], href: null, warning: "This term does not exist." };
    }
    const def = excerptFromMarkdown(item.term.definition || "", 340);
    return {
      path,
      title: item.term.term,
      kind: "Glossary term",
      blurb: "",
      excerpt: def || undefined,
      excerptLabel: "Definition",
      facts: def ? [] : ["No definition recorded"],
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
