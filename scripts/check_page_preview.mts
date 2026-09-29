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
import { classifyPath } from "../lib/page-preview";

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

if (failures > 0) {
  console.error(`[page-preview] ${failures} failure(s).`);
  process.exit(1);
}
console.log(`[page-preview] ${cases.length} paths classified correctly, 4 malformed handled.`);
