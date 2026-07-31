export type Doc = {
  id: string;
  path?: string;
  title?: string;
  collection: "journal" | "reference" | "glossary" | "meta" | string;
  doc_type: "entry" | "recording" | "section" | "term" | "meta" | string;
  part?: number | null;
  source_url?: string | null;
  entry_date?: string | null;
  weekday?: string | null;
  recording_index?: number | null;
  recording_time?: string | null;
  audio_file?: string | null;
  audio_url?: string | null;
  audio_duration?: string | null;
  location?: string | null;
  word_count?: number | null;
  prev_id?: string | null;
  next_id?: string | null;
  notes?: string | null;
  body_markdown?: string | null;
};
export type Category = { slug: string; kind: string; label?: string };
export type GlossaryTerm = { slug: string; term: string; document_id?: string; definition?: string };

export type Dataset = {
  docs: Doc[];
  categories: Category[];
  glossary: GlossaryTerm[];
  docCats: Record<string, string[]>;   // docId -> category slugs
  docGloss: Record<string, string[]>;  // docId -> glossary slugs referenced
  source: "supabase" | "bundled";
};
