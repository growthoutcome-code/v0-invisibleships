/**
 * Export the site-authored content that lives in TypeScript to Markdown.
 *
 * Why this exists
 * ---------------
 * `lib/site-content.ts` holds three bodies of work that the site renders and the
 * corpus has never carried:
 *
 *   EXTRA_GLOSSARY  ~20 glossary terms written directly for the site. The corpus
 *                   ships 18 glossary files from the original document series;
 *                   the site shows around 37. These are the difference.
 *   DOCUMENTS       the register of the source document series, with what each
 *                   one is and where it lives.
 *   AUTHOR          the author statement (a version is already in meta/, so only
 *                   the parts that differ are exported).
 *
 * None of it had an owner. The corpus is assembled by scripts that each know
 * about their own folder, and content written into a .ts file matched none of
 * them, so it silently never appeared.
 *
 * These terms are SITE-AUTHORED, not extracted from the document series, and the
 * export says so in every file. That distinction matters: a reader must be able
 * to tell a term lifted from the primary record from one written to explain the
 * work, and the existing corpus glossary files carry a source document id that
 * these genuinely do not have. Inventing one would be worse than saying so.
 *
 * Run: node scripts/export_site_content_md.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "lib/site-content.ts");
const OUT_GLO = join(ROOT, "public/data/site/glossary");
const OUT_DOC = join(ROOT, "public/data/site/documents");

const AUTHOR = "Sean C. Harris";
const COPYRIGHT = "© 2026 Sean C. Harris. All Rights Reserved.";
const PROVENANCE =
  "*Site-authored. This term was written for invisibleships.com to explain the " +
  "work; it is not extracted from the source document series, and it carries no " +
  "source-document id for that reason. Terms drawn from the primary record are in " +
  "`glossary/` and do carry one.*";

const src = readFileSync(SRC, "utf8");
const words = (t) => (t.match(/\b[\w'-]+\b/g) || []).length;

/** Lift a plain-data array literal out of the TypeScript and evaluate it. */
function lift(name) {
  const start = src.indexOf(`${name}:`) >= 0 ? src.indexOf(`${name}:`) : src.indexOf(`${name} =`);
  if (start < 0) throw new Error(`${name} not found in lib/site-content.ts`);
  const eq = src.indexOf("=", start);
  const open = src.indexOf("[", eq);
  if (open < 0) throw new Error(`${name} is not an array literal`);
  let depth = 0, end = -1, q = null, esc = false;
  for (let i = open; i < src.length; i++) {
    const c = src[i];
    if (q) {
      if (esc) esc = false;
      else if (c === "\\") esc = true;
      else if (c === q) q = null;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") { q = c; continue; }
    if (c === "[") depth++;
    else if (c === "]") { depth--; if (!depth) { end = i + 1; break; } }
  }
  if (end < 0) throw new Error(`could not find the end of ${name}`);
  // `doc("<id>")` builds a Google Docs URL; provide it so DOCUMENTS evaluates.
  const doc = (id) => `https://docs.google.com/document/d/${id}/edit`;
  try {
    return new Function("doc", `"use strict"; return (${src.slice(open, end)});`)(doc);
  } catch (e) {
    throw new Error(
      `${name} no longer evaluates as plain data — it may have gained an import ` +
      `or a computed value. Fix the exporter rather than shipping without it.\n${e.message}`
    );
  }
}

function fresh(dir) {
  if (existsSync(dir)) for (const f of readdirSync(dir)) rmSync(join(dir, f));
  mkdirSync(dir, { recursive: true });
}

// ------------------------------------------------------------------ glossary
const TERMS = lift("EXTRA_GLOSSARY");
fresh(OUT_GLO);
let gBytes = 0;
for (const t of TERMS) {
  // The definition's first line is the pronunciation, by convention.
  const lines = (t.definition || "").split("\n");
  const pron = /^[A-Z··\s'-]+$/.test((lines[0] || "").trim()) && lines[0].trim().length < 40
    ? lines.shift().trim() : "";
  const bodyText = lines.join("\n").trim();
  const body = [
    `# ${t.term}`, "", PROVENANCE, "",
    pron ? `*${pron}*\n` : "",
    bodyText, "",
  ].join("\n");
  const text = [
    "---",
    `id: IS-GLO-SITE-${(t.slug || t.term).toUpperCase().replace(/[^A-Z0-9]+/g, "-")}`,
    `title: Glossary — ${t.term}`,
    "collection: glossary",
    "doc_type: term",
    "provenance: site-authored",
    `slug: ${t.slug || ""}`,
    "categories: [glossary, reference]",
    `word_count: ${words(body)}`,
    `author: ${AUTHOR}`,
    `copyright: ${COPYRIGHT}`,
    "---",
    "",
  ].join("\n") + body.trim() + "\n";
  const fname = `IS_GLO_SITE_${(t.slug || t.term).replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.md`;
  writeFileSync(join(OUT_GLO, fname), text);
  gBytes += text.length;
}

// ----------------------------------------------------------------- documents
const DOCS = lift("DOCUMENTS");
fresh(OUT_DOC);
const db = [
  "# The source document series",
  "",
  "*The documents this archive is built from. Listed here so the corpus records " +
  "what exists and where, not only what was extracted from it.*",
  "",
  `**${DOCS.length} documents.**`,
  "",
];
for (const d of DOCS) {
  db.push(`## ${d.title}`, "");
  if (d.subline) db.push(`*${d.subline}*`, "");
  if (d.description) db.push(d.description, "");
  if (d.url) db.push(`<${d.url}>`, "");
}
const dbody = db.join("\n");
writeFileSync(
  join(OUT_DOC, "IS_DOC_series-register.md"),
  [
    "---",
    "id: IS-DOC-SERIES-REGISTER",
    "title: The source document series",
    "collection: meta",
    "doc_type: register",
    `document_count: ${DOCS.length}`,
    "generated_by: scripts/export_site_content_md.mjs",
    `word_count: ${words(dbody)}`,
    `author: ${AUTHOR}`,
    `copyright: ${COPYRIGHT}`,
    "---",
    "",
  ].join("\n") + dbody.trim() + "\n"
);

console.log(`glossary : ${TERMS.length} site-authored terms (${gBytes.toLocaleString()} bytes) -> public/data/site/glossary`);
console.log(`documents: 1 register covering ${DOCS.length} documents -> public/data/site/documents`);
