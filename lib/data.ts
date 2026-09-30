import { getSupabase } from "./supabase";
import type { Dataset, Doc, Category, GlossaryTerm } from "./types";
import { composeEntryBody, recordingsFor } from "./entry-body";

const INDEX_COLS =
  "id,path,title,collection,doc_type,part,source_url,entry_date,weekday,recording_index,recording_time,audio_file,audio_url,audio_duration,location,word_count,prev_id,next_id,notes";

let _bodies: Record<string, string> = {};

async function fromSupabase(): Promise<Dataset | null> {
  const sb = getSupabase();
  if (!sb) return null;
  try {
    const [docsR, catsR, dcR, gloR, dgR] = await Promise.all([
      sb.from("documents").select(INDEX_COLS).limit(10000),
      sb.from("categories").select("*").limit(10000),
      sb.from("document_categories").select("*").limit(20000),
      sb.from("glossary").select("*").limit(10000),
      sb.from("document_glossary_refs").select("*").limit(20000),
    ]);
    if (docsR.error) throw docsR.error;
    const docs = (docsR.data || []) as Doc[];
    if (docs.length === 0) return null; // not yet ingested -> fall back
    const docCats: Record<string, string[]> = {};
    for (const r of dcR.data || []) (docCats[r.document_id] ||= []).push(r.category_slug);
    const docGloss: Record<string, string[]> = {};
    for (const r of dgR.data || []) (docGloss[r.document_id] ||= []).push(r.glossary_slug);
    return {
      docs,
      categories: (catsR.data || []) as Category[],
      glossary: (gloR.data || []) as GlossaryTerm[],
      docCats, docGloss, source: "supabase",
    };
  } catch (e) {
    console.warn("[data] Supabase load failed, using bundled corpus:", e);
    return null;
  }
}

async function fromBundle(): Promise<Dataset> {
  const man = await fetch("/corpus/_manifest.json").then((r) => r.json());
  const n = man.doc_chunks as number;
  const chunks = await Promise.all(
    Array.from({ length: n }, (_, i) =>
      fetch(`/corpus/documents_${String(i).padStart(2, "0")}.json`).then((r) => r.json())
    )
  );
  const rels = await fetch("/corpus/rels.json").then((r) => r.json());
  const docs: Doc[] = [];
  _bodies = {};
  for (const c of chunks) for (const d of c) {
    if (d.body_markdown != null) { _bodies[d.id] = d.body_markdown; }
    const { body_markdown, ...idx } = d;
    docs.push(idx as Doc);
  }
  const docCats: Record<string, string[]> = {};
  for (const r of rels.doc_categories || []) (docCats[r.document_id] ||= []).push(r.category_slug);
  const docGloss: Record<string, string[]> = {};
  for (const r of rels.doc_glossary || []) (docGloss[r.document_id] ||= []).push(r.glossary_slug);
  return {
    docs,
    categories: rels.categories || [],
    glossary: rels.glossary || [],
    docCats, docGloss, source: "bundled",
  };
}

export async function loadDataset(): Promise<Dataset> {
  const sb = await fromSupabase();
  if (sb) return sb;
  return fromBundle();
}

export async function getBody(id: string, source: "supabase" | "bundled"): Promise<string> {
  if (source === "bundled") {
    if (_bodies[id] != null) return _bodies[id];
    return "";
  }
  const sb = getSupabase();
  if (!sb) return _bodies[id] || "";
  const { data, error } = await sb.from("documents").select("body_markdown").eq("id", id).single();
  if (error || !data) return _bodies[id] || "";
  return data.body_markdown || "";
}

/**
 * Journal documents whose TEXT matches a search (Sean, 30 Sep: bring the journal
 * search back and make it work). Supabase: the existing `documents.fts` column —
 * a generated full-text index over title + body, GIN-indexed — queried with
 * websearch syntax, so "shelter euthanization", "\"exact phrase\"" and "-word"
 * all work. No outside service is involved. Bundled fallback: the same syntax,
 * matched as plain text (case-insensitive, no word stemming). Returns ids; the caller also matches
 * title, id and location itself.
 */
export async function searchJournalText(q: string, source: "supabase" | "bundled"): Promise<Set<string>> {
  const query = q.trim();
  if (!query) return new Set();
  if (source === "supabase") {
    const sb = getSupabase();
    if (sb) {
      const { data, error } = await sb.from("documents").select("id")
        .eq("collection", "journal").textSearch("fts", query, { type: "websearch", config: "english" }).limit(2000);
      if (!error && data) return new Set((data as { id: string }[]).map((r) => r.id));
    }
  }
  // Same syntax as the Supabase path: "a phrase", -excluded, everything else required.
  const need: string[] = [], not: string[] = [];
  for (const m of query.toLowerCase().matchAll(/(-?)"([^"]+)"|(-?)(\S+)/g)) {
    const neg = (m[1] || m[3]) === "-", term = (m[2] ?? m[4] ?? "").trim();
    if (term && term !== "or") (neg ? not : need).push(term);
  }
  const hits = new Set<string>();
  for (const [id, body] of Object.entries(_bodies)) {
    const b = body.toLowerCase();
    if (need.every((w) => b.includes(w)) && !not.some((w) => b.includes(w))) hits.add(id);
  }
  return hits;
}

/**
 * An entry's text with its recordings' transcripts joined on, for the reader.
 * Anything that is not a journal entry returns its own body, unchanged.
 * See lib/entry-body.ts for why.
 */
export async function getEntryBody(id: string, ds: Pick<Dataset, "docs" | "source">): Promise<string> {
  const recIds = recordingsFor(id, ds.docs);
  if (recIds.length === 0) return getBody(id, ds.source);
  const ids = [id, ...recIds];
  let bodies: Record<string, string> = {};
  if (ds.source === "supabase") {
    const sb = getSupabase();
    if (sb) {
      const { data, error } = await sb.from("documents").select("id,body_markdown").in("id", ids);
      if (!error && data) for (const r of data as { id: string; body_markdown: string | null }[]) bodies[r.id] = r.body_markdown || "";
    }
  }
  for (const i of ids) if (bodies[i] == null) bodies[i] = _bodies[i] || "";
  return composeEntryBody(bodies[id], recIds.map((r) => ({ id: r, body: bodies[r] })));
}
