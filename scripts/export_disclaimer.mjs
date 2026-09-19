/**
 * Lift the standing disclaimer out of lib/disclaimer.ts for the Python side.
 *
 * Two languages need the same bytes: the site renders these strings from
 * TypeScript, and the corpus scripts write them into 840 markdown files from
 * Python. Retyping them in both places is how a disclaimer quietly comes to say
 * two different things. This writes the TypeScript's own values to
 * scripts/generated/disclaimer.json, which the Python scripts read.
 *
 * Deliberately NOT under public/data/: check_download_matches_site.py treats
 * anything there without a route into the zip as a failure, and this is a build
 * artefact rather than content.
 *
 * Run: node scripts/export_disclaimer.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "lib/disclaimer.ts");
const OUT_DIR = join(ROOT, "scripts/generated");
const OUT = join(OUT_DIR, "disclaimer.json");

const src = readFileSync(SRC, "utf8");

/** `export const NAME = "..."` — a single double-quoted literal, escapes intact. */
function lift(name) {
  const m = src.match(new RegExp(`export const ${name} =\\s*\\n?\\s*("(?:[^"\\\\]|\\\\.)*")`));
  if (!m) throw new Error(`${name} not found as a single string literal in lib/disclaimer.ts`);
  return JSON.parse(m[1]);
}

const title = lift("DISCLAIMER_TITLE");
const standing = lift("DISCLAIMER_STANDING");
const pointer = lift("DISCLAIMER_FILE_POINTER");
const footer = ["---", "", `## ${title}`, "", standing, "", pointer].join("\n");

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(OUT, JSON.stringify({ title, standing, pointer, footer }, null, 2) + "\n");
console.log(`disclaimer: ${standing.split(" ").length} words -> ${OUT.replace(ROOT + "/", "")}`);
