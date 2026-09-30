// Joins a journal entry with the transcripts of its recordings, for reading.
//
// The corpus stores each day as one `entry` document (heading, meta, scene,
// methodology) plus one `recording` document per audio file (the transcript).
// In the Google Docs they are one entry: everything from the date heading to the
// next date heading. On the site the entry page showed only the first part, so a
// reader saw the context, a list of recording IDs and no transcripts.
//
// This puts them back together at read time, in recording order. It changes
// nothing in the corpus: every recording keeps its own page and ID, and the
// download is unaffected.
import type { Doc } from "./types";

type Rec = { id: string; body: string };

const RECORDINGS_LIST = /\n## Recordings this day\n[\s\S]*?(?=\n## |\n# |$)/;

/** Recording documents that belong to an entry, in recording order. */
export function recordingsFor(entryId: string, docs: Pick<Doc, "id" | "doc_type" | "recording_index">[]): string[] {
  if (!/-ENTRY$/.test(entryId)) return [];
  const base = entryId.replace(/-ENTRY$/, "") + "-R";
  return docs
    .filter((d) => d.doc_type === "recording" && d.id.startsWith(base) && /^R\d+$/.test(d.id.slice(base.length - 1)))
    .sort((a, b) => (a.recording_index || 0) - (b.recording_index || 0) || a.id.localeCompare(b.id))
    .map((d) => d.id);
}

/**
 * The entry's own text, followed by each recording's transcript.
 * The "Recordings this day" list is dropped because the recordings now follow in
 * full. Each recording's "# <date> — Recording N (HH:MM)" title becomes a section
 * heading on the entry page, with a link to the recording's own page.
 */
export function composeEntryBody(entryBody: string, recordings: Rec[]): string {
  const withBody = recordings.filter((r) => (r.body || "").trim());
  if (withBody.length === 0) return entryBody;
  const head = ("\n" + (entryBody || "")).replace(RECORDINGS_LIST, "\n").trim();
  const parts = withBody.map((r) => {
    const lines = r.body.trim().split("\n");
    let title = `Recording ${r.id.split("-").pop()}`;
    if (lines[0].startsWith("# ")) title = lines.shift()!.slice(2).trim();
    const page = `[Open this recording on its own page](/journal/${r.id.toLowerCase()})`;
    return [`## ${title}`, "", page, "", lines.join("\n").trim()].join("\n");
  });
  return [head, ...parts].join("\n\n");
}
