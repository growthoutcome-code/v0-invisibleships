// Server-only corpus reader. Reads the bundled JSON corpus from public/corpus
// at build/request time (fs) so item routes can statically generate pages and
// emit per-item preview metadata. Memoized so all pages share one parse.
import fs from "fs";
import path from "path";
import type { Doc, GlossaryTerm } from "./types";
import { EXTRA_GLOSSARY } from "./site-content";
import { cleanDef } from "./glossary-format";

type Loaded = {
  journal: Doc[];                       // sorted feed order, includes body_markdown
  byId: Map<string, Doc>;               // lowercased id -> journal doc
  docCats: Record<string, string[]>;
  docGloss: Record<string, string[]>;
  glossary: GlossaryTerm[];             // corpus + extra, sorted by term
  glossBySlug: Map<string, GlossaryTerm>;
};

let _cache: Loaded | null = null;

function load(): Loaded {
  if (_cache) return _cache;
  const dir = path.join(process.cwd(), "public", "corpus");
  const man = JSON.parse(fs.readFileSync(path.join(dir, "_manifest.json"), "utf8"));
  const n = man.doc_chunks as number;
  const all: any[] = [];
  for (let i = 0; i < n; i++) {
    all.push(...JSON.parse(fs.readFileSync(path.join(dir, `documents_${String(i).padStart(2, "0")}.json`), "utf8")));
  }
  const rels = JSON.parse(fs.readFileSync(path.join(dir, "rels.json"), "utf8"));

  const docCats: Record<string, string[]> = {};
  for (const r of rels.doc_categories || []) (docCats[r.document_id] ||= []).push(r.category_slug);
  const docGloss: Record<string, string[]> = {};
  for (const r of rels.doc_glossary || []) (docGloss[r.document_id] ||= []).push(r.glossary_slug);

  const journal = (all.filter((d) => d.collection === "journal") as Doc[]).sort(
    (a, b) => (a.entry_date || "").localeCompare(b.entry_date || "") || (a.recording_index || 0) - (b.recording_index || 0)
  );
  const byId = new Map<string, Doc>();
  for (const d of journal) byId.set(d.id.toLowerCase(), d);

  const corpusGloss = (rels.glossary || []) as GlossaryTerm[];
  const glossary = [...corpusGloss, ...EXTRA_GLOSSARY].sort((a, b) => a.term.localeCompare(b.term));
  const glossBySlug = new Map<string, GlossaryTerm>();
  for (const t of glossary) glossBySlug.set(t.slug.toLowerCase(), t);

  _cache = { journal, byId, docCats, docGloss, glossary, glossBySlug };
  return _cache;
}

export function allJournalParams() {
  return load().journal.map((d) => ({ id: d.id.toLowerCase() }));
}
export function allGlossaryParams() {
  return load().glossary.map((t) => ({ slug: t.slug.toLowerCase() }));
}

export type JournalItem = {
  doc: Doc;
  body: string;
  cats: string[];
  gloss: string[];
  prev?: { id: string; title: string };
  next?: { id: string; title: string };
};
export function getJournalItem(param: string): JournalItem | null {
  const L = load();
  const key = decodeURIComponent(param).toLowerCase();
  const doc = L.byId.get(key);
  if (!doc) return null;
  const idx = L.journal.findIndex((d) => d.id === doc.id);
  const prev = idx > 0 ? L.journal[idx - 1] : null;
  const next = idx >= 0 && idx < L.journal.length - 1 ? L.journal[idx + 1] : null;
  return {
    doc,
    body: doc.body_markdown || "",
    cats: L.docCats[doc.id] || [],
    gloss: L.docGloss[doc.id] || [],
    prev: prev ? { id: prev.id.toLowerCase(), title: prev.title || prev.id } : undefined,
    next: next ? { id: next.id.toLowerCase(), title: next.title || next.id } : undefined,
  };
}

export type GlossaryItem = {
  term: GlossaryTerm;
  prev?: { slug: string; term: string };
  next?: { slug: string; term: string };
};
export function getGlossaryItem(param: string): GlossaryItem | null {
  const L = load();
  const key = decodeURIComponent(param).toLowerCase();
  const term = L.glossBySlug.get(key);
  if (!term) return null;
  const idx = L.glossary.findIndex((t) => t.slug === term.slug);
  const prev = idx > 0 ? L.glossary[idx - 1] : null;
  const next = idx >= 0 && idx < L.glossary.length - 1 ? L.glossary[idx + 1] : null;
  return {
    term,
    prev: prev ? { slug: prev.slug.toLowerCase(), term: prev.term } : undefined,
    next: next ? { slug: next.slug.toLowerCase(), term: next.term } : undefined,
  };
}

// Plain-text excerpt for meta descriptions (strips timestamps, audio lines, markdown).
export function excerptOf(md: string, n = 200): string {
  const lines = (md || "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .filter((l) => !l.startsWith("#") && !l.startsWith("**Audio") && !/^File duration/i.test(l));
  const text = lines
    .join(" ")
    .replace(/\[[0-9:]+\]/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*#>]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > n ? text.slice(0, n).replace(/\s+\S*$/, "") + "…" : text;
}
export function glossarySummary(def: string, n = 200): string {
  const t = cleanDef(def).replace(/\s+/g, " ").trim();
  return t.length > n ? t.slice(0, n).replace(/\s+\S*$/, "") + "…" : t;
}
