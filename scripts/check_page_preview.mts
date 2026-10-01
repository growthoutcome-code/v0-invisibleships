/**
 * Guard for the /insights path classifier.
 *
 * WHY THIS IS GUARDED. classifyPath decides what the preview panel says a path IS, and
 * every way it can be wrong is silent. Mis-file "/journal" and a reader is told the
 * journal is not a page on this site. Mis-file a real entry and the panel refuses to
 * link to it. Mis-file a scanner probe as a journal entry and the panel claims an
 * entry exists that does not. None of that throws, and none of it is visible without
 * clicking the exact row that broke.
 *
 * The inputs are not tidy. Google reports pagePath with the query string attached and
 * sometimes a trailing slash; PostHog reports $pathname. Both see percent-encoding and
 * both see whatever a scanner asks for.
 */
import { classifyPath, excerptFromMarkdown } from "../lib/page-preview";

let failures = 0;
const fail = (m: string) => { console.error(`  ✗ ${m}`); failures++; };

const cases: [string, string, string?][] = [
  // [input, expected kind, expected param]
  ["/", "home"],
  ["", "home"],
  ["/journal", "journal-index"],
  ["/journal/", "journal-index"],
  ["/JOURNAL", "journal-index"],
  ["/journal?ref=twitter", "journal-index"],
  ["/journal#top", "journal-index"],
  ["/journal/is-j01-20250227-entry", "journal-entry", "is-j01-20250227-entry"],
  ["/journal/IS-J01-20250227-ENTRY", "journal-entry", "is-j01-20250227-entry"],
  ["/journal/is-j01-20250227-entry/", "journal-entry", "is-j01-20250227-entry"],
  ["/journal/is-j01-20250227-entry?utm_source=x", "journal-entry", "is-j01-20250227-entry"],
  ["/glossary", "glossary-index"],
  ["/glossary/perceptual-set", "glossary-term", "perceptual-set"],
  ["/concepts", "concepts"],
  ["/data", "data-index"],
  ["/data/crime", "data-section", "crime"],
  ["/data/public-health", "data-section", "public-health"],
  ["/research", "data-index"],
  ["/research/timeline", "data-section", "timeline"],
  ["/research/government-cloud", "data-section", "government-cloud"],
  ["/research/crime/homicide", "data-section", "crime"],
  ["/documents", "documents"],
  ["/disclaimer", "disclaimer"],
  ["/author", "author"],
  ["/why", "why"],
  ["/safety", "safety"],
  ["/insights", "insights"],
  ["/insights?source=posthog&range=30d", "insights"],
  ["/api/corpus", "api"],
  ["/api/gate", "api"],
  // Real traffic this site has actually seen, and the shapes scanners send.
  ["/capture", "unknown"],
  ["/wp-login.php", "unknown"],
  ["/.env", "unknown"],
  ["/journal/a/b", "unknown"],
  ["//journal//", "journal-index"],
  ["journal", "journal-index"],
  ["/%2Fjournal", "unknown"],
];

for (const [input, kind, param] of cases) {
  const got = classifyPath(input);
  if (got.kind !== kind) fail(`${JSON.stringify(input)} -> kind ${got.kind}, expected ${kind}`);
  if (param !== undefined && got.param !== param) {
    fail(`${JSON.stringify(input)} -> param ${JSON.stringify(got.param)}, expected ${JSON.stringify(param)}`);
  }
  if (!got.path.startsWith("/")) fail(`${JSON.stringify(input)} -> path ${got.path} has no leading slash`);
  if (got.path.length > 1 && got.path.endsWith("/")) fail(`${JSON.stringify(input)} -> path ${got.path} keeps a trailing slash`);
  if (got.path !== got.path.toLowerCase()) fail(`${JSON.stringify(input)} -> path ${got.path} is not lowercased`);
}

// A malformed escape must classify rather than throw. This is the one that would take
// the whole page down with it, since previewForPath runs on every row at render time.
for (const nasty of ["/%zz", "/journal/%e0%a4%a", "/%", "/%%%"]) {
  try {
    const got = classifyPath(nasty);
    if (!got.path.startsWith("/")) fail(`${nasty}: no leading slash`);
  } catch (e) {
    fail(`${nasty}: threw ${(e as Error).message}`);
  }
}

// --- excerpts ----------------------------------------------------------------
//
// Guarded because the failures are quiet and land in front of a reader: markup
// surviving into the panel, a link collapsing to a bare URL, or a cut mid-word.
const ex: [string, string, string][] = [
  ["strips bold", "**Thursday 02/27/25** Middle eastern male voice", "Thursday 02/27/25 Middle eastern male voice"],
  ["strips headings", "### A heading\n\nThe body.", "A heading The body."],
  ["keeps link text", "See [the ruling](https://example.com/x) for detail.", "See the ruling for detail."],
  ["drops images", "![alt](a.png) After the image.", "After the image."],
  ["unwraps autolinks", "Mail <a@b.com> please.", "Mail a@b.com please."],
  ["drops frontmatter", "---\ntitle: x\n---\nReal text.", "Real text."],
  ["collapses whitespace", "One.\n\n  Two.\n\n\nThree.", "One. Two. Three."],
  ["strips bullets", "- first\n- second", "first second"],
  ["drops code fences", "Before ```js\nvar x=1;\n``` after", "Before after"],
  ["empty stays empty", "", ""],
];
for (const [name, input, expected] of ex) {
  const got = excerptFromMarkdown(input, 500);
  if (got !== expected) fail(`excerpt ${name}: got ${JSON.stringify(got)}, expected ${JSON.stringify(expected)}`);
}

// Truncation: at a word boundary, with an ellipsis, never longer than asked.
const long = "alpha bravo charlie delta echo foxtrot golf hotel india juliet kilo lima mike";
for (const max of [10, 20, 40, 60]) {
  const got = excerptFromMarkdown(long, max);
  if (got.length > max + 1) fail(`truncate max=${max}: ${got.length} chars for a ${max} limit`);
  if (!got.endsWith("\u2026")) fail(`truncate max=${max}: no ellipsis on ${JSON.stringify(got)}`);
  if (/\s\u2026$/.test(got)) fail(`truncate max=${max}: space before the ellipsis`);
  // The cut must not split a word: everything before the ellipsis must be whole words
  // of the original.
  const words = got.slice(0, -1).trim().split(" ");
  if (words.length > 1 && !long.split(" ").includes(words[words.length - 1])) {
    fail(`truncate max=${max}: last word ${JSON.stringify(words[words.length - 1])} is cut`);
  }
}
// Text shorter than the limit is returned whole, with no ellipsis.
if (excerptFromMarkdown("Short enough.", 100) !== "Short enough.") fail("short text was altered");
if (excerptFromMarkdown("Short enough.", 100).endsWith("\u2026")) fail("short text gained an ellipsis");

if (failures > 0) {
  console.error(`[page-preview] ${failures} failure(s).`);
  process.exit(1);
}
console.log(`[page-preview] ${cases.length} paths, 4 malformed, ${ex.length} excerpt rules, 4 truncations.`);
