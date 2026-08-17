/**
 * Export the core concepts to public/concepts/ for the downloadable corpus.
 *
 * lib/concepts.ts is the single source of truth. This script reads the CONCEPTS
 * array out of it and evaluates it — safe because the array is plain object
 * literals with no imports or expressions. If that ever stops being true, this
 * script will throw rather than emit something stale.
 *
 * Emits:
 *   public/concepts/concepts.json   structured, mirrors lib/concepts.ts
 *   public/concepts/concepts.csv    flat, one row per concept
 *   public/concepts/<id>.md         one markdown file per concept
 *
 * Run after editing lib/concepts.ts, then rebuild the corpus zip.
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";

const SRC = "lib/concepts.ts";
const OUT = "public/concepts";

const src = readFileSync(SRC, "utf8");
const start = src.indexOf("export const CONCEPTS: Concept[] = [");
if (start < 0) throw new Error("CONCEPTS array not found in " + SRC);
const arr = src.slice(src.indexOf("[", start), src.lastIndexOf("];") + 1);

let concepts;
try {
  concepts = new Function(`return ${arr}`)();
} catch (e) {
  throw new Error("CONCEPTS is no longer a plain literal — export script needs updating: " + e.message);
}

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

writeFileSync(
  join(OUT, "concepts.json"),
  JSON.stringify(
    {
      schema_version: "1.0",
      project: "Invisible Ships",
      record_type: "core_concept",
      generated_from: SRC,
      count: concepts.length,
      field_definitions: {
        origin: ["ai", "author"],
        basis: ["documented", "structural", "pattern"],
        verification: ["unverified", "partially_verified", "verified"],
        sourceOrigin: ["journal", "data", "external_research"],
        note: "glossaryReferences are site-specific terms, not independent evidence.",
      },
      records: concepts,
    },
    null,
    2
  )
);

const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
const flat = (v) => (Array.isArray(v) ? v.map((x) => (typeof x === "string" ? x : x.label || x.term || x.title || "")).join(" | ") : v ?? "");
const cols = ["id", "title", "origin", "basis", "sourceOrigin", "taxonomy", "verification", "body", "evidence", "questions", "references", "referencesNote", "glossaryReferences", "hypotheses", "disclaimer"];
const rows = [cols.join(",")].concat(
  concepts.map((c) => cols.map((k) => esc(flat(c[k]))).join(","))
);
writeFileSync(join(OUT, "concepts.csv"), rows.join("\n") + "\n");

// Corpus files travel on their own — a reader may meet a single concept in an AI
// chat with no site around it. The standing notice therefore rides in every file
// rather than living only on the page.
const NOTICE = [
  "> **Read this first.** The author acknowledges that most of the material in this",
  "> collection is unverified. Concepts formed by the author record reported",
  "> experience; concepts that rest on *pattern* rest on observation rather than",
  "> documentation. Neither establishes a cause, a technology, a responsible party,",
  "> or a coordinated campaign, and none of it has been independently tested or",
  "> corroborated. Read alongside the full disclaimer:",
  "> https://www.invisibleships.com/disclaimer",
];

for (const c of concepts) {
  const lines = [
    `# ${c.title}`,
    "",
    ...NOTICE,
    "",
    `- id: ${c.id}`,
    `- who formed it: ${c.origin === "ai" ? "AI analysis" : "Author's observation"}`,
    `- what it rests on: ${c.basis}`,
    c.sourceOrigin ? `- source: ${c.sourceOrigin}` : null,
    c.taxonomy ? `- taxonomy: ${c.taxonomy}` : null,
    c.verification ? `- verification: ${c.verification}` : null,
    "",
    c.body,
    "",
  ].filter((x) => x !== null);

  if (c.hypotheses?.length) {
    lines.push("## Hypotheses (each unverified)", "");
    for (const h of c.hypotheses) lines.push(`### ${h.title} (${h.id})`, "", h.text, "");
  }
  if (c.evidence?.length) {
    lines.push("## Evidence", "");
    for (const e of c.evidence) lines.push(`- ${e}`);
    lines.push("");
  }
  if (c.questions?.length) {
    lines.push("## Open questions", "");
    for (const q of c.questions) lines.push(`- ${q}`);
    lines.push("");
  }
  if (c.glossaryReferences?.length) {
    lines.push("## Site glossary (not independent evidence)", "");
    for (const g of c.glossaryReferences) lines.push(`- ${g.term} — https://www.invisibleships.com${g.href}`);
    lines.push("");
  }
  if (c.references?.length) {
    lines.push("## References", "");
    for (const r of c.references) lines.push(`- ${r.label} — ${r.href.startsWith("http") ? r.href : "https://www.invisibleships.com" + r.href}`);
    lines.push("");
  }
  if (c.referencesNote) lines.push(`> ${c.referencesNote}`, "");
  lines.push("## Disclaimer", "");
  if (c.disclaimer) lines.push(c.disclaimer, "");
  lines.push(
    "See the full disclaimer: https://www.invisibleships.com/disclaimer",
    ""
  );

  writeFileSync(join(OUT, `${c.id}.md`), lines.join("\n"));
}

const counts = (key) =>
  concepts.reduce((m, c) => ((m[c[key]] = (m[c[key]] || 0) + 1), m), {});
const byOrigin = counts("origin");
const byBasis = counts("basis");

writeFileSync(
  join(OUT, "README-concepts.md"),
  [
    "# Invisible Ships — Core Concepts",
    "",
    ...NOTICE,
    "",
    `${concepts.length} concepts, exported from \`lib/concepts.ts\` — the single source of truth`,
    "behind https://www.invisibleships.com/concepts. This folder is a snapshot; the site",
    "is authoritative.",
    "",
    "## Two labels on every concept",
    "",
    "Each concept carries two independent labels, and they do not imply one another.",
    "",
    "**Who formed it**",
    "",
    `- \`ai\` — AI analysis (${byOrigin.ai || 0}): derived by a language model reading the research corpus.`,
    `- \`author\` — Author's observation (${byOrigin.author || 0}): formed by Sean C. Harris from lived experience.`,
    "",
    "**What it rests on**",
    "",
    `- \`documented\` (${byBasis.documented || 0}): supported by a court ruling, regulator decision, or official document.`,
    `- \`structural\` (${byBasis.structural || 0}): follows from what the dataset does and does not contain.`,
    `- \`pattern\` (${byBasis.pattern || 0}): an observation across material. Not documentation.`,
    "",
    "A `documented` concept stands whether or not you accept any `pattern` concept.",
    "That separation is the point of the labelling.",
    "",
    "## Files",
    "",
    "```",
    "concepts/",
    "  README-concepts.md",
    "  concepts.json     structured, mirrors lib/concepts.ts, includes field definitions",
    "  concepts.csv      one row per concept, list fields joined with |",
    `  <id>.md           one file per concept (${concepts.length})`,
    "```",
    "",
    "## Fields",
    "",
    "`verification` is `unverified` unless stated otherwise. `sourceOrigin` records where a",
    "concept came from — `journal`, `data`, or `external_research`. `glossaryReferences`",
    "point at site-specific terms and are **not** independent evidence. `references` mixing",
    "external links are context, not corroboration — read each concept's `referencesNote`.",
    "`hypotheses` are sub-claims, each unverified in its own right.",
    "",
    "© 2026 Sean C. Harris. All Rights Reserved.",
    "",
  ].join("\n")
);

console.log(`concepts exported: ${concepts.length}`);
console.log(`  ${OUT}/concepts.json`);
console.log(`  ${OUT}/concepts.csv`);
console.log(`  ${OUT}/README-concepts.md`);
console.log(`  ${OUT}/*.md  (${concepts.length} files)`);
