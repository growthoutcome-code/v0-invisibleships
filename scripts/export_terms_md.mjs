/**
 * Export the site's canonical terms to Markdown for the downloadable corpus.
 *
 * Why this exists
 * ---------------
 * The corpus shipped `meta/IS_META_copyright.md` and `meta/IS_META_disclaimer.md`
 * — verbatim extracts of the original Google Doc, frozen in August — and 75
 * corpus files pointed a reader at them. On 28 August the site's terms were
 * rewritten: the Critical Disclaimer scoped to the Journal, sharing rebuilt
 * around attribution so the corpus could legally be used the way it is built to
 * be used, and a statement of what the site measures. None of that could reach
 * the download, because the words lived inside a React component.
 *
 * They now live in lib/terms.ts. This turns them into the file the corpus ships.
 *
 * The two historical extracts stay exactly as they are. They carry
 * `source_doc_id` frontmatter and are accurate records of what the terms said
 * when the archive was written; rewriting them would falsify the extraction.
 * They are what the terms WERE. `meta/IS_META_terms.md` is what they ARE, and
 * it says so on its own face.
 *
 * The inline markup in lib/terms.ts is a Markdown subset on purpose, so nothing
 * is translated here — the strings are written out as they stand.
 *
 * Run: node scripts/export_terms_md.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "lib/terms.ts");
const OUT_DIR = join(ROOT, "public/data/site/terms");
const OUT = join(OUT_DIR, "IS_META_terms.md");

const AUTHOR = "Sean C. Harris";
const COPYRIGHT = "© 2026 Sean C. Harris. All Rights Reserved.";

// Lift `export const TERMS = [...]` out of the TypeScript and evaluate it. Plain
// strings, arrays and objects — no imports, no computed values — so this is
// safe. If it ever gains one, this throws rather than shipping something wrong.
const src = readFileSync(SRC, "utf8");
const decl = "export const TERMS";
const from = src.indexOf(decl);
if (from < 0) throw new Error("TERMS not found in lib/terms.ts");
const open = src.indexOf("[", src.indexOf("=", from));
let depth = 0, end = -1, inStr = null, esc = false;
for (let i = open; i < src.length; i++) {
  const c = src[i];
  if (inStr) {
    if (esc) esc = false;
    else if (c === "\\") esc = true;
    else if (c === inStr) inStr = null;
    continue;
  }
  if (c === '"' || c === "'" || c === "`") { inStr = c; continue; }
  if (c === "[") depth++;
  else if (c === "]") { depth--; if (depth === 0) { end = i + 1; break; } }
}
if (end < 0) throw new Error("could not find the end of the TERMS array");

let TERMS;
try {
  TERMS = new Function(`"use strict"; return (${src.slice(open, end)});`)();
} catch (e) {
  throw new Error(
    "lib/terms.ts no longer evaluates as plain data — it may have gained an " +
    "import or a computed value. Fix the exporter rather than shipping a corpus " +
    "whose terms differ from the site's.\n" + e.message
  );
}
if (!Array.isArray(TERMS) || !TERMS.length) throw new Error("no terms parsed");

const body = [
  "# Invisible Ships — Disclaimer, Copyright and Terms of Use",
  "",
  "*This is the canonical version, as published at https://www.invisibleships.com/disclaimer.*",
  "*It is generated from the same source the website renders, so the two cannot drift apart.*",
  "",
  "`meta/IS_META_copyright.md` and `meta/IS_META_disclaimer.md`, also in this",
  "corpus, are verbatim extracts of the original source document and record what",
  "the terms said when the archive was first written. They are kept unaltered as",
  "historical record. Where they differ from this file, **this file governs.**",
  "",
  "---",
  "",
];

for (const s of TERMS) {
  body.push(`## ${s.heading}`, "");
  for (const b of s.blocks) {
    if (b.kind === "subhead") body.push(`### ${b.text}`, "");
    else if (b.kind === "note") body.push(`*${b.text}*`, "");
    else if (b.kind === "ul") { for (const item of b.items) body.push(`- ${item}`); body.push(""); }
    else body.push(b.text, "");
  }
}

const text = body.join("\n").trim() + "\n";
const words = (text.match(/\b[\w'-]+\b/g) || []).length;

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(
  OUT,
  [
    "---",
    "id: IS-META-TERMS",
    "title: Disclaimer, Copyright and Terms of Use",
    "collection: meta",
    "doc_type: terms",
    "canonical: true",
    "supersedes: [IS_META_copyright.md, IS_META_disclaimer.md]",
    "source: lib/terms.ts (the same source the website renders)",
    "generated_by: scripts/export_terms_md.mjs",
    `section_count: ${TERMS.length}`,
    `word_count: ${words}`,
    `author: ${AUTHOR}`,
    `copyright: ${COPYRIGHT}`,
    "---",
    "",
  ].join("\n") + text
);

console.log(`terms    : ${TERMS.length} sections, ${words.toLocaleString()} words -> public/data/site/terms/IS_META_terms.md`);
