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
const THEME_LABEL = {
  record: "The record and its limits",
  procurement: "Procurement and accountability",
  surveillance: "Surveillance and the person",
  neurotech: "Neurotechnology",
  coercion: "Coercion and control",
  health: "Health outcomes",
  experience: "Reported experience",
};
const THEME_NOTE = {
  record: "What this archive can and cannot show, and why an absence proves little.",
  procurement: "Who buys what, and what happens when a finding lands against them.",
  surveillance: "What is collected about people who never agreed to any of it.",
  neurotech: "What can actually be read from a brain, and under what conditions.",
  coercion: "Documented methods for controlling a person without touching them.",
  health: "Population outcomes measured against the rest of the world.",
  experience: "First-person report, and what is known about experience without an external source.",
};
const AUDIENCE_LABEL = {
  household: "Households and individuals",
  investigators: "Law enforcement and investigators",
  policy: "Legislators and regulators",
  clinicians: "Clinicians",
  press: "Press and researchers",
};
const AUDIENCE_NOTE = {
  household: "For a person who thinks something is happening to them, or to someone they live with.",
  investigators: "For anyone whose job is to establish what happened and to whom.",
  policy: "For anyone writing or enforcing a rule about any of this.",
  clinicians: "For anyone a frightened person is likely to reach first.",
  press: "For anyone who has to decide whether a claim can be published.",
};
const BASIS_WEIGHT = {
  documented: "Strongest",
  structural: "Strong, but about the data, not the world",
  pattern: "Offered as an observation, not as proof",
  testimony: "Verified by nobody",
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

// The tiers are ranked, and the ranking is the point: a reader is told which
// entries they may lean on and which they may not, per entry, before they read
// one. Naming a specific tier here was a mistake — the disclaimer went stale the
// moment `pattern` emptied out and `testimony` opened. It now states the RULE,
// which does not go stale, and the start-here index carries the live counts.
const STANDING =
  "*Independent research compiled from public records for informational purposes " +
  "only. Not legal, medical, or investment advice. Every concept states its BASIS, " +
  "its ORIGIN, its THEME and the readers it was written for. The basis tiers are " +
  "ranked, and never blended inside a single concept: a reader who accepts only " +
  "`documented` entries can still rely on every one of those and discard the rest " +
  "without unpicking anything. `testimony` is a dated first-person report, " +
  "verified by nobody, and says so on its own face wherever it appears. Causes are " +
  "reported as attributed, never asserted. See `meta/IS_META_disclaimer.md`.*";

// ---------------------------------------------------------------- extract
const src = readFileSync(SRC, "utf8");

/**
 * Lift one `export const NAME = <literal>` out of lib/concepts.ts and evaluate
 * it.
 *
 * The file is TypeScript, so rather than add a build dependency this reads the
 * literal directly. Everything lifted here is plain strings, numbers, arrays
 * and objects — no imports, no expressions beyond string concatenation — so it
 * is safe to evaluate. If a value ever becomes computed, this throws loudly
 * rather than exporting something wrong.
 *
 * This was bespoke to CONCEPTS until 27 August. That is why FINDINGS,
 * NOT_ESTABLISHED, RESEARCH_INTRO and SOURCE_YEARS — every word of the summary
 * layer a reader sees above the concepts — appeared nowhere in the download:
 * there was no way to reach them, so nobody did.
 */
function lift(name) {
  const decl = `export const ${name}`;
  const from = src.indexOf(decl);
  if (from < 0) throw new Error(`${name} not found in lib/concepts.ts`);
  // Seek the assignment. A type annotation carries its own brackets —
  // `SOURCE_YEARS: { ... }[] =` — so track depth and take the first '=' that
  // sits outside all of them.
  let i = from + decl.length, depth = 0;
  for (; i < src.length; i++) {
    const c = src[i];
    if ("[{(<".includes(c)) depth++;
    else if ("]})>".includes(c)) depth--;
    else if (c === "=" && depth === 0) break;
  }
  if (i >= src.length) throw new Error(`malformed ${name} declaration`);
  i++;
  while (/\s/.test(src[i])) i++;

  const opener = src[i];
  let end = -1, inStr = null, esc = false;
  if (opener === "[" || opener === "{") {
    const close = opener === "[" ? "]" : "}";
    let d = 0;
    for (let j = i; j < src.length; j++) {
      const c = src[j];
      if (inStr) {
        if (esc) esc = false;
        else if (c === "\\") esc = true;
        else if (c === inStr) inStr = null;
        continue;
      }
      if (c === '"' || c === "'" || c === "`") { inStr = c; continue; }
      if (c === opener) d++;
      else if (c === close) { d--; if (d === 0) { end = j + 1; break; } }
    }
  } else {
    // A string, possibly a multi-line `"a" + "b"` concatenation. Run to the
    // semicolon that ends the statement, ignoring any inside a string.
    for (let j = i; j < src.length; j++) {
      const c = src[j];
      if (inStr) {
        if (esc) esc = false;
        else if (c === "\\") esc = true;
        else if (c === inStr) inStr = null;
        continue;
      }
      if (c === '"' || c === "'" || c === "`") { inStr = c; continue; }
      if (c === ";") { end = j; break; }
    }
  }
  if (end < 0) throw new Error(`could not find the end of ${name} in lib/concepts.ts`);

  try {
    return new Function(`"use strict"; return (${src.slice(i, end)});`)();
  } catch (e) {
    throw new Error(
      `${name} in lib/concepts.ts no longer evaluates as plain data — it may ` +
      "have gained an import or a computed value. Fix the exporter rather than " +
      "shipping a corpus without it.\n" + e.message
    );
  }
}

const CONCEPTS = lift("CONCEPTS");
if (!Array.isArray(CONCEPTS) || !CONCEPTS.length) throw new Error("no concepts parsed");

// The summary layer. A reader downloads this archive to check the site; these
// four are the site's own headline claims, its own statement of what it cannot
// show, and its citation index. Shipping the concepts without them shipped the
// argument without its limits.
const FINDINGS = lift("FINDINGS");
const NOT_ESTABLISHED = lift("NOT_ESTABLISHED");
const RESEARCH_INTRO = lift("RESEARCH_INTRO");
const SOURCE_YEARS = lift("SOURCE_YEARS");

// Every axis declared on a Concept must reach the exported frontmatter. If a
// sixth axis is added to lib/concepts.ts and not to AXES, this names it rather
// than letting it go missing the way `theme` and `audience` did.
const AXES = ["basis", "origin", "theme", "audience"];
{
  const declared = new Set();
  for (const c of CONCEPTS) for (const k of Object.keys(c)) declared.add(k);
  const known = new Set([...AXES, "id", "title", "body", "evidence", "questions",
    "references", "referencesNote", "verification", "disclaimer", "comments",
    "authorStatement", "aiAssessment"]);
  const unknown = [...declared].filter((k) => !known.has(k));
  if (unknown.length) {
    throw new Error(
      "lib/concepts.ts has field(s) this exporter does not know about: " +
      unknown.join(", ") + ". Add them to the export, or to the known list if " +
      "they are deliberately site-only."
    );
  }
  const missing = CONCEPTS.filter((c) => AXES.some((a) => c[a] == null ||
    (Array.isArray(c[a]) && !c[a].length)));
  if (missing.length) {
    throw new Error(
      "concept(s) missing a required axis: " + missing.map((c) => c.id).join(", ")
    );
  }
}

// ---------------------------------------------------------------- render
const words = (t) => (t.match(/\b[\w'-]+\b/g) || []).length;

function toMarkdown(c) {
  const b = [`# ${c.title}`, "", STANDING, ""];
  b.push(
    `**Basis: ${c.basis}.** ${BASIS_NOTE[c.basis] || ""}  ` +
    `\n**Origin: ${c.origin}.** ${ORIGIN_NOTE[c.origin] || ""}  ` +
    `\n**Theme: ${THEME_LABEL[c.theme] || c.theme}.**` +
    (c.audience?.length
      ? `  \n**Written for: ${c.audience.map((a) => AUDIENCE_LABEL[a] || a).join(" · ")}.**`
      : "")
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
  if (c.authorStatement?.length) {
    b.push("", "## The author states", "");
    for (const m of c.authorStatement) b.push(m, "");
    b.push("*The author's own words, printed as given. Unverified, and not a finding of this research.*", "");
  }
  if (c.aiAssessment?.length) {
    b.push("", "## AI assessment", "");
    for (const m of c.aiAssessment) b.push(m, "");
    b.push("*Written by an AI model at the author's request. Published unedited by the author, and not independent verification.*", "");
  }
  if (c.comments?.length) {
    b.push("", "## Author's note", "");
    for (const m of c.comments) b.push(m, "");
    b.push("*Commentary by the author. Not evidence, and not a finding of this research.*", "");
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
    `theme: ${c.theme}`,
    `audience: [${(c.audience || []).join(", ")}]`,
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
const byBasis = {}, byTheme = {}, byAudience = {};
for (const c of CONCEPTS) {
  (byBasis[c.basis] ||= []).push(c);
  (byTheme[c.theme] ||= []).push(c);
  for (const a of c.audience || []) (byAudience[a] ||= []).push(c);
}
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
  "| Basis | What it means | How much weight it carries | In this archive |",
  "|---|---|---|---|",
  ...["documented", "structural", "pattern", "testimony"].map(
    (k) => `| \`${k}\` | ${BASIS_NOTE[k]} | ${BASIS_WEIGHT[k]} | ${(byBasis[k] || []).length} |`
  ),
  "",
  "The tiers are ranked and never blended inside a single concept, so a reader",
  "can accept the top of the table and discard the rest without unpicking",
  "anything. The counts above are live: a tier showing 0 has no entries in this",
  "release, and a tier's presence in the table is a definition, not a claim that",
  "the archive uses it.",
  "",
  "## The themes",
  "",
  "| Theme | What it covers | Concepts |",
  "|---|---|---|",
  ...Object.keys(THEME_LABEL)
    .filter((t) => byTheme[t]?.length)
    .map((t) => `| ${THEME_LABEL[t]} | ${THEME_NOTE[t]} | ${byTheme[t].length} |`),
  "",
  "## Who each concept is written for",
  "",
  "Concepts carry an `audience` in their frontmatter, and most carry more than",
  "one. These are routes in, not walls — nothing is hidden from anybody.",
  "",
  "| Audience | Who that means | Concepts |",
  "|---|---|---|",
  ...Object.keys(AUDIENCE_LABEL)
    .filter((a) => byAudience[a]?.length)
    .map((a) => `| ${AUDIENCE_LABEL[a]} | ${AUDIENCE_NOTE[a]} | ${byAudience[a].length} |`),
  "",
  "## What this section does not establish",
  "",
  ...NOT_ESTABLISHED.map((n) => `- ${n}`),
  "",
  "Set out in full in `IS_CON_00_not-established.md`. The headline findings are",
  "in `IS_CON_00_findings.md`, and every dated source behind them is in",
  "`source-years.csv`.",
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

// ---------------------------------------------------------------- summary layer
// The site shows these ABOVE the concepts: the headline findings, the standing
// limits, and the dated sources the whole section rests on. Until 27 August none
// of the three reached the download, so a reader checking the archive got the
// claims without the limits and the citations without the index. That is the
// wrong way round — a skeptical reader needs the limits most.

const front = (fields) =>
  ["---", ...fields, "generated_by: scripts/export_concepts_md.mjs",
   `author: ${AUTHOR}`, `copyright: ${COPYRIGHT}`, "---", ""].join("\n");

const findingsBody = [
  "# What this research found",
  "",
  STANDING,
  "",
  RESEARCH_INTRO,
  "",
  "Each figure below resolves to a named source inside the concept it links to.",
  "None of them is a finding about any individual person, including the author.",
  "",
  ...FINDINGS.flatMap((f) => [
    `## ${f.stat}`,
    "",
    f.line,
    "",
    `Read it in full: \`IS_CON_${f.id}.md\``,
    "",
  ]),
  "## What none of it establishes",
  "",
  ...NOT_ESTABLISHED.map((n) => `- ${n}`),
  "",
  "Set out on its own in `IS_CON_00_not-established.md`, which is the file to",
  "read first if you are here to check this archive rather than to use it.",
].join("\n");

writeFileSync(
  join(OUT, "IS_CON_00_findings.md"),
  front([
    "id: IS-CON-00-FINDINGS",
    "title: Concepts — what this research found",
    "collection: concepts",
    "doc_type: section-summary",
    `finding_count: ${FINDINGS.length}`,
    `word_count: ${words(findingsBody)}`,
  ]) + findingsBody.trim() + "\n"
);

const limitsBody = [
  "# What this research does not establish",
  "",
  STANDING,
  "",
  "These four limits stand over every concept, every chart and every table in",
  "this archive. They are not a disclaimer bolted on at the end; they are the",
  "conditions under which everything else here was written, and a reader is",
  "entitled to hold the archive to them.",
  "",
  ...NOT_ESTABLISHED.flatMap((n, i) => [`${i + 1}. ${n}`, ""]),
  "## Why this is a file of its own",
  "",
  "An archive that states its own limits in a place a reader has to go looking",
  "for has not really stated them. This file exists so the limits travel with",
  "the download, and so they can be handed to an assistant on their own,",
  "alongside any concept, without the concept's author choosing which parts",
  "come along.",
  "",
  "See also `meta/IS_META_disclaimer.md` for the full legal notice, and",
  "`IS_CON_00_findings.md` for the claims these limits apply to.",
].join("\n");

writeFileSync(
  join(OUT, "IS_CON_00_not-established.md"),
  front([
    "id: IS-CON-00-NOT-ESTABLISHED",
    "title: Concepts — what this research does not establish",
    "collection: concepts",
    "doc_type: section-limits",
    `limit_count: ${NOT_ESTABLISHED.length}`,
    `word_count: ${words(limitsBody)}`,
  ]) + limitsBody.trim() + "\n"
);

// The citation index, as data rather than prose: a reader can sort it, and can
// see for themselves that the record here is not recent.
const csvCell = (v) => {
  const t = String(v ?? "");
  return /[",\n]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t;
};
const csv = [
  ["year", "source", "url", "cited_by_concept_ids", "cited_by_files"].join(","),
  ...[...SOURCE_YEARS]
    .sort((a, b) => a.year - b.year || a.label.localeCompare(b.label))
    .map((r) => [
      r.year,
      r.label,
      r.url || "",
      (r.cites || []).join(" "),
      (r.cites || []).map((id) => `IS_CON_${id}.md`).join(" "),
    ].map(csvCell).join(",")),
].join("\n") + "\n";
writeFileSync(join(ROOT, "public/data/concepts/source-years.csv"), csv);

console.log(
  `summary  : findings (${FINDINGS.length}), not-established (${NOT_ESTABLISHED.length}), ` +
  `source-years.csv (${SOURCE_YEARS.length} dated sources, ` +
  `${SOURCE_YEARS.filter((r) => r.url).length} with a public URL)`
);

const counts = Object.entries(byBasis).map(([k, v]) => `${k} ${v.length}`).join(" · ");
console.log(`concepts : ${CONCEPTS.length + 1} markdown (${bytes.toLocaleString()} bytes) -> public/data/concepts/md`);
console.log(`           ${counts}`);
