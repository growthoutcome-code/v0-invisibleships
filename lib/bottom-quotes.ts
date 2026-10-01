/**
 * The journal slides for the bottom sections, built from lib/bottom-picks.ts.
 * Server only. The home page does not use this file.
 *
 * Sean, 1 Oct 2026, on how a slide reads:
 *   - "use the 'from the distance' label once, and then include the quoted
 *     lines underneath… with line breaks"; "do not repeat the same label in a
 *     row." Labels are "From the distance" and "From the author".
 *   - "We can remove the male, female labels."
 *   - "make sure that you're using quotes on the statements"; when it is all
 *     the author, "you can just do one paragraph."
 *   - date, time and location on every slide.
 *
 * WORD FOR WORD. Every passage is cut by curatedQuotes, the home page's own
 * cutter: anchored in the live corpus, the build fails if an anchor stops
 * matching, timecodes are dropped and the author's name is removed exactly as
 * on the home page. What this file changes is layout only:
 *   - a line's quoted words are kept and the entry's annotations around them
 *     (speaker tags, "Received telepathically") are dropped;
 *   - an author paragraph joins the transcript's fragments with spaces and
 *     marks skipped lines with "…";
 *   - where the record opens a quotation and never closes it, the slide closes
 *     it. The words are never touched, except by an edit Sean has approved
 *     for a slide (`edits` in lib/bottom-picks.ts), listed there by name.
 */
import { curatedQuotes, type JournalQuote } from "@/lib/server-corpus";
import { BOTTOM_QUOTES, type BottomQuotePick } from "@/lib/bottom-picks";

const LABEL = { distance: "From the distance", author: "From the author" } as const;

/** One passage, cut and cleaned by the home page's own cutter. */
function cut(id: string, p: { anchor: string; chars: number; min?: number }): string {
  return curatedQuotes([{ id, anchor: p.anchor, chars: p.chars, min: p.min, question: "" }])[0].body;
}

const OPEN = /^[“"]/;
const QUOTE = /(\(paraphrasing\)\s*)?(“[^”\n]*”|"[^"\n]*")/g;

/** The quoted lines in a passage, annotations dropped. */
function quotedLines(text: string): string[] {
  const out: string[] = [];
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    const found = [...line.matchAll(QUOTE)].map((m) => (m[1] ?? "") + m[2]);
    if (found.length) { out.push(...found); continue; }
    // An opened quotation the record never closes: take it up to the first
    // annotation and close it. ("…It’s really working! **Female #?*")
    if (OPEN.test(line)) {
      const words = line.split(/\s\*|\*\*/)[0].trim();
      out.push(words + (words.startsWith("“") ? "”" : '"'));
    }
  }
  // Straight quotation marks (the recordings) set as curly ones, so every
  // slide reads the same. Marks only; never the words.
  const curly = out.map((l) =>
    l.replace(/\s+/g, " ").trim().replace(/(^|\s)"/, "$1“").replace(/"$/, "”"));
  // ONE SENTENCE, ONE LINE. A transcript often breaks a sentence across lines
  // ("Because I represent the terrorist organization" / "that is doing this
  // to America."). A line with no closing punctuation runs on into the next.
  const joined: string[] = [];
  for (const l of curly) {
    const prev = joined[joined.length - 1];
    if (prev && !/[.?!…]”$/.test(prev) && /^“/.test(l) && /^“[a-z]/.test(l)) {
      joined[joined.length - 1] = prev.replace(/”$/, "") + " " + l.replace(/^“/, "");
    } else joined.push(l);
  }
  return joined;
}

/** An author paragraph: the passage's words in one pair of quotation marks. */
function paragraph(text: string): string {
  const trimmed = text.trim();
  // Spoken (a transcript): its fragments' own marks come off and the words
  // join. Written prose: annotations come off, inner quotes become single.
  const body = OPEN.test(trimmed)
    ? quotedLines(trimmed).map((l) => l.replace(/^(\(paraphrasing\)\s*)?[“"]|[”"]$/g, "$1")).join(" ")
    : trimmed
        .replace(/\*+[^*\n]*\*+/g, "")
        .replace(/\*/g, "")
        .replace(/“/g, "‘").replace(/”/g, "’")
        .replace(/\s+/g, " ");
  return body.trim();
}

export function bottomQuotes(picks: BottomQuotePick[] = BOTTOM_QUOTES): JournalQuote[] {
  return picks.map((pick) => {
    const parts: { label: string; lines: string[] }[] = [];
    for (const block of pick.blocks) {
      const texts = block.passages.map((p) => cut(pick.id, p));
      const lines = block.from === "author"
        ? [`“${texts.map(paragraph).join(" … ")}”`]
        : texts.flatMap(quotedLines);
      if (!lines.length || lines.every((l) => l.length < 3)) {
        throw new Error(`bottom quote ${pick.id}: a ${block.from} block came out empty. Re-cut its anchors.`);
      }
      const label = LABEL[block.from];
      const prev = parts[parts.length - 1];
      // Never the same label twice in a row: a second block from the same voice
      // joins the one before it.
      if (prev && prev.label === label) prev.lines.push(...lines);
      else parts.push({ label, lines });
    }
    // Wording Sean approved for this slide only (see `edits` in bottom-picks).
    for (const ed of pick.edits ?? []) {
      const part = parts.find((p) => p.lines.some((l) => l.includes(ed.from)));
      if (!part) {
        throw new Error(`bottom quote ${pick.id}: approved edit no longer matches: ${JSON.stringify(ed.from)}`);
      }
      part.lines = part.lines.map((l) => l.replace(ed.from, ed.to));
    }
    // The date, the audio flag and the entry link come from the document.
    const base = curatedQuotes([{ id: pick.id, anchor: pick.blocks[0].passages[0].anchor, chars: 40, question: "" }])[0];
    return {
      ...base,
      location: null,
      body: parts.map((p) => p.lines.join("\n")).join("\n\n"),
      question: pick.question,
      meta: pick.meta,
      parts,
    };
  });
}
