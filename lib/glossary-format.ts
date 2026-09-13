// Shared glossary/definition formatting — used by the in-app browser, the
// standalone term routes, and server-side metadata. Pure string helpers only
// (no JSX) so they're safe to import from server components.

// Strip markdown headings anywhere in a definition (some entries lead with "## term").
export function stripHeadings(str: string) {
  return (str || "").replace(/^\s*#{1,6}\s+.*(?:\n|$)/gm, "");
}
// Some term names carry raw markdown (links, bold). Render/​share them clean.
export function cleanTerm(str: string) {
  return (str || "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/\*+/g, "").trim();
}
export function cleanDef(str: string) {
  return stripHeadings(str)
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // links → text
    .replace(/\*+/g, "")                      // bold/italic markers
    .replace(/\n{3,}/g, "\n\n")               // collapse extra blank lines
    .trim();
}
// A definition may lead with a short pronunciation line, separated by a blank line.
export function splitDef(def?: string) {
  const cleaned = stripHeadings(def || "").trim();
  const parts: string[] = cleaned.split("\n\n");
  const pron = parts.length > 1 && parts[0].length < 80 ? parts[0].trim().replace(/\*+/g, "") : "";
  const body = pron ? parts.slice(1).join("\n\n") : cleaned;
  return { pron, body };
}
/**
 * The first `n` COMPLETE sentences of a definition.
 *
 * Sean, 8 September: "the glossary is truncating after one line. We want one
 * complete statement." The home page was calling a hard slice(0, 150), so every
 * slide ended mid-word on an ellipsis — including "cognitive liberty", whose
 * whole definition is 124 characters and would have fitted.
 *
 * Lifted out of JournalBrowser, where this has been doing the same job on the
 * glossary cards for months. `cap` defaults to that component's 220 so its
 * behaviour is unchanged; the home page passes a larger budget.
 *
 * STOPS AT AN EXAMPLES BLOCK. Several dictionary entries run straight from the
 * definition into quoted usage examples — a magazine sentence about soldiers is
 * not part of what "telepathy" means, and sentence-splitting alone walks
 * happily into it.
 */
/**
 * The first `n` COMPLETE sentences of a definition.
 *
 * Sean, 8 September: "the glossary is truncating after one line. We want one
 * complete statement." The home page was calling a hard slice(0, 150), so every
 * slide ended mid-word on an ellipsis — including "cognitive liberty", whose
 * whole definition is 122 characters and would have fitted.
 *
 * Rewritten 9 September when the home page asked for three to four lines each
 * and three separate faults surfaced at once:
 *
 *  1. AN EXAMPLES BLOCK IS NOT THE END OF THE DEFINITION. The old rule stopped
 *     dead at "Examples:", which for "telepathy" threw away the best three
 *     sentences in the entry — the neuroscience paragraph that sits AFTER the
 *     usage quotes. Example paragraphs are now dropped individually and the
 *     definition continues past them.
 *  2. ABBREVIATIONS ARE NOT SENTENCE ENDS. "(e.g. hands or feet)" and "In U.S.
 *     First Amendment terms" were being split at the internal full stops, so
 *     two slides ended on the fragments "g." and "S." — visible nonsense.
 *  3. Attribution and "Related terms" lines are navigation, not meaning.
 */
const ABBREV = /\b(e\.g|i\.e|etc|vs|cf|approx|Dr|Mr|Mrs|Ms|St|Jr|Sr|U\.S|U\.K|No)\./g;
const DOT = "\u0000";

export function firstSentences(text: string, n = 2, cap = 220): string {
  const blocks = (text || "")
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean)
    // Grammar and pronunciation head matter — "adjective form: telepathic (…)".
    .filter((b) => !/^\s*(?:adjective|adverb|noun|verb|plural|abbreviation)\b[^:]*\bform\s*:/i.test(b))
    .filter((b) => !/·/.test(b))
    // The label, the usage quotes under it, the source attribution, and the
    // related-terms navigation. None of them define the word.
    .filter((b) => !/^Examples?:/i.test(b))
    .filter((b) => !/^["\u201c]/.test(b))
    .filter((b) => !/^\s*[—-]\s*\[?[A-Z]/.test(b))
    .filter((b) => !/^Related terms?:/i.test(b));

  // A dictionary gloss often has no full stop of its own — telepathy's is just
  // ": communication from one mind to another by extrasensory means". Joining
  // on a bare space ran it straight into the paragraph after it with no break,
  // and the sentence splitter then treated the pair as one. Give every block a
  // terminator it is missing.
  const clean = blocks
    .map((b) => (/[.!?:]$/.test(b) ? b : b + "."))
    .join(" ")
    .replace(/^[\s:]+/, "")
    .replace(/\s+/g, " ")
    .trim();
  const masked = clean.replace(ABBREV, (m) => m.replace(/\./g, DOT)).replace(/\b([A-Z])\./g, (_m, c) => c + DOT);
  const matches = masked.match(/[^.!?]+[.!?]+(\s|$)/g);
  const unmask = (s: string) => s.replace(new RegExp(DOT, "g"), ".");

  if (!matches) return clean.length > cap ? clean.slice(0, cap).trim() + "…" : clean;

  // WHOLE SENTENCES ONLY. Take the next sentence only if it fits entirely —
  // stopping one sentence short beats publishing half of one.
  let out = "";
  let kept = 0;
  for (const s of matches) {
    if (kept >= n) break;
    const piece = unmask(s.trim());
    // A "sentence" this short is an artefact, never prose. Nothing real reads
    // "g." — see fault 2 above.
    //
    // AND IT MUST NOT SPEND A SLOT. This used to iterate matches.slice(0, n), so
    // a skipped fragment still consumed one of the n. "Then the hard case." is
    // 20 characters; it silently cost the prevention concept its whole second
    // half and left that slide at 298 characters while its neighbours ran to
    // 800. Count what is KEPT, not what is examined.
    if (piece.length < 25) continue;
    const next = (out ? out + " " : "") + piece;
    if (out && next.length > cap) break;
    out = next;
    kept += 1;
  }
  if (!out) out = unmask(masked);
  return out.length > cap ? out.slice(0, cap).trim() + "…" : out;
}

// One-line plain-text summary for meta descriptions / cards.
export function defSummary(def: string, n = 200) {
  const t = cleanDef(def).replace(/\s+/g, " ").trim();
  return t.length > n ? t.slice(0, n).replace(/\s+\S*$/, "") + "…" : t;
}
