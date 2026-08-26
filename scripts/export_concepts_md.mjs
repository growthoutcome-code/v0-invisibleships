/**
 * Export the Concepts to Markdown for the downloadable corpus.
 *
 * Why this exists
 * ---------------
 * The site has rendered sixteen concepts at /concepts since August. The corpus
 * has carried none of them. They WERE exported once — commit 7f21bdc on 17
 * August added the Markdown, a CSV and an exporter — and that commit was
 * reverted wholesale the same day (533cc00). The site kept the concepts; the
 * download lost them, and nothing noticed for a week, because nothing checks.
 *
 * Concepts are the hardest part of this archive to read from raw data: each one
 * carries a BASIS (documented / structural / pattern / testimony), an ORIGIN (ai / author),
 * a verification state, open questions it explicitly does not answer, and a
 * scope disclaimer. Those distinctions are the whole point — a reader who
 * rejects every `pattern` must still be able to rely on every `documented` one.
 * Flattened into JSON they are field values; written out as Markdown they are
 * the argument, and they survive being handed to an assistant on their own.
 *
 * lib/concepts.ts is TypeScript, so rather than add a build dependency this
 * lifts the array literal out and evaluates it. The data is plain strings,
 * arrays and objects — no imports, no expressions — so this is safe and has no
 * dependencies. If the file ever gains a computed value, this throws loudly
 * rather than exporting something wrong.
 *
 * Run: node scripts/export_concepts_md.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "lib/concepts.ts");
const OUT = join(ROOT, "public/data/concepts/md");

const AUTHOR = "Sean C. Harris";
const COPYRIGHT = "© 2026 Sean C. Harris. All Rights Reserved.";

const BASIS_NOTE = {
  documented: "A source, ruling or official record supports this directly.",
  structural: "This follows from what the dataset does or does not contain.",
  pattern: "An observation drawn from experience, offered as an observation.",
  testimony: "A dated first-person report of what the author experienced or was told. Verified by nobody.",
};
const ORIGIN_NOTE = {
  ai: "Derived by AI analysis of the dataset.",
  author: "The author's own observation, from experience.",
};
const VERIFICATION_LABEL = {
  unverified: "Not independently verified",
  partially_verified: "Partially verified",
  verified: "Independently verified",
};

const STANDING =
  "*Independent research compiled from public records for informational purposes " +
  "only. Not legal, medical, or investment advice. Every concept below states its " +
  "BASIS and its ORIGIN: a reader who rejects every `pattern` entry can still rely " +
  "on every `documented` one, and the two are never blended inside one concept. " +
  "Causes are reported as attributed, never asserted. See `meta/IS_META_disclaimer.md`.*";

// ---------------------------------------------------------------- extract
const src = readFileSync(SRC, "utf8");
const start = src.indexOf("export const CONCEPTS");
if (start < 0) throw new Error("CONCEPTS array not found in lib/concepts.ts");
// Seek past the '=' first: the declaration reads `CONCEPTS: Concept[] = [`, so
// the first '[' belongs to the TYPE annotation, not the array.
const eq = src.indexOf("=", start);
if (eq < 0) throw new Error("malformed CONCEPTS declaration");
const open = src.indexOf("[", eq);
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
if (end < 0) throw new Error("could not find the end of the CONCEPTS array");

let CONCEPTS;
try {
  CONCEPTS = new Function(`"use strict"; return (${src.slice(open, end)});`)();
} catch (e) {
  throw new Error(
    "lib/concepts.ts no longer evaluates as plain data — it may have gained an " +
    "import or a computed value. Fix the exporter rather than shipping a corpus " +
    "without concepts.\n" + e.message
  );
}
if (!Array.isArray(CONCEPTS) || !CONCEPTS.length) throw new Error("no concepts parsed");

// ---------------------------------------------------------------- render
const words = (t) => (t.match(/\b[\w'-]+\b/g) || []).length;

function toMarkdown(c) {
  const b = [`# ${c.title}`, "", STANDING, ""];
  b.push(
    `**Basis: ${c.basis}.** ${BASIS_NOTE[c.basis] || ""}  ` +
    `\n**Origin: ${c.origin}.** ${ORIGIN_NOTE[c.origin] || ""}`
  );
  if (c.verification && c.verification !== "verified") {
    b.push("", `**${VERIFICATION_LABEL[c.verification] || c.verification}.**`);
  }
  b.push("", c.body.trim(), "");

  if (c.evidence?.length) {
    b.push("## Evidence", "");
    for (const e of c.evidence) b.push(`- ${e}`);
    b.push("");
  }
  if (c.questions?.length) {
    b.push("## What this does not answer", "");
    for (const q of c.questions) b.push(`- ${q}`);
    b.push("");
  }
  if (c.comments?.length) {
    out.push("", "## Author's note", "");
    for (const m of c.comments) out.push(m, "");
    out.push("*Commentary by the author. Not evidence, and not a finding of this research.*", "");
  }
  if (c.references?.length) {
    b.push("## References", "");
    for (const r of c.references) b.push(`- [${r.label}](${r.href})`);
    if (c.referencesNote) b.push("", `*${c.referencesNote}*`);
    b.push("");
  }
  if (c.disclaimer) b.push("## Scope", "", c.disclaimer, "");

  const body = b.join("\n");
  const yaml = [
    "---",
    `id: IS-CON-${c.id.toUpperCase()}`,
    `title: Concept — ${c.title}`,
    "collection: concepts",
    "doc_type: concept",
    `basis: ${c.basis}`,
    `origin: ${c.origin}`,
    `verification: ${c.verification || "verified"}`,
    "generated_by: scripts/export_concepts_md.mjs",
    `word_count: ${words(body)}`,
    `author: ${AUTHOR}`,
    `copyright: ${COPYRIGHT}`,
    "---",
    "",
  ].join("\n");
  return yaml + body.trim() + "\n";
}

// ---------------------------------------------------------------- write
if (existsSync(OUT)) for (const f of readdirSync(OUT)) rmSync(join(OUT, f));
mkdirSync(OUT, { recursive: true });

let bytes = 0;
for (const c of CONCEPTS) {
  const text = toMarkdown(c);
  writeFileSync(join(OUT, `IS_CON_${c.id}.md`), text);
  bytes += text.length;
}

// an index, so a reader knows what is here and which entries they can lean on
const byBasis = {};
for (const c of CONCEPTS) (byBasis[c.basis] ||= []).push(c);
const idx = [
  "# Concepts — start here",
  "",
  STANDING,
  "",
  `**${CONCEPTS.length} concepts.** Each is a self-contained file, safe to hand to`,
  "an assistant on its own.",
  "",
  "## How to read the basis label",
  "",
  "| Basis | What it means | How much weight it carries |",
  "|---|---|---|",
  "| `documented` | A source, ruling or official record supports it directly | Strongest |",
  "| `structural` | It follows from what the dataset does or does not contain | Strong, but about the data, not the world |",
  "| `pattern` | An observation drawn from experience | Offered as an observation, not as proof |",
  "| `testimony` | A dated first-person report of what the author experienced or was told | Verified by nobody |",
  "",
  "A reader who rejects every `pattern` entry can still rely on every",
  "`documented` one. The two are never blended inside a single concept.",
  "",
  "## The concepts",
  "",
];
for (const basis of ["documented", "structural", "pattern", "testimony"]) {
  if (!byBasis[basis]?.length) continue;
  idx.push(`### ${basis} (${byBasis[basis].length})`, "");
  for (const c of byBasis[basis]) {
    const v = c.verification && c.verification !== "verified"
      ? ` — *${VERIFICATION_LABEL[c.verification]}*` : "";
    idx.push(`- **${c.title}** \`IS_CON_${c.id}.md\` · origin: ${c.origin}${v}`);
  }
  idx.push("");
}
const idxBody = idx.join("\n");
writeFileSync(
  join(OUT, "IS_CON_00_start-here.md"),
  [
    "---",
    "id: IS-CON-00-START-HERE",
    "title: Concepts — start here",
    "collection: concepts",
    "doc_type: section-overview",
    `concept_count: ${CONCEPTS.length}`,
    "generated_by: scripts/export_concepts_md.mjs",
    `word_count: ${words(idxBody)}`,
    `author: ${AUTHOR}`,
    `copyright: ${COPYRIGHT}`,
    "---",
    "",
  ].join("\n") + idxBody.trim() + "\n"
);

const counts = Object.entries(byBasis).map(([k, v]) => `${k} ${v.length}`).join(" · ");
console.log(`concepts : ${CONCEPTS.length + 1} markdown (${bytes.toLocaleString()} bytes) -> public/data/concepts/md`);
console.log(`           ${counts}`);
