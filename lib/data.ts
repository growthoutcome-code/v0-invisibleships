import { getSupabase } from "./supabase";
import type { Dataset, Doc, Category, GlossaryTerm } from "./types";

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
