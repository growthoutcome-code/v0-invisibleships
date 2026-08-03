// GET /api/library — the public curated question library (pinned starter chips
// + Sean-approved past questions). Rendered under the Chat input, and what the
// disabled state points people to. Curate in the Supabase dashboard by setting
// is_published = true (and is_pinned for canonical starters).

import { supabase, json } from "@/lib/ai/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const { data, error } = await supabase
    .from("chat_library")
    .select("question_hash, question, answer, citations, is_pinned")
    .limit(100);
  if (error) return json({ error: "library_failed" }, 500);
  return json({ items: data ?? [] });
}

