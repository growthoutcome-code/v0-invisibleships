// Entry type of a journal document (Sean, 30 Sep 2026): "Administrative notes"
// (the Docs' Administrative Comments sections), "Manual capture" (a day's entry
// written by hand), "Recorded transcription" (a recording's page) or "Discovery
// notes" (unofficial: the author's emailed notes, from which entries are written). Stored as
// categories in all three copies (see project/data-rules.md); this only reads them.
export const ENTRY_TYPES: Record<string, string> = {
  "administrative-notes": "Administrative notes",
  "manual-capture": "Manual capture",
  "recorded-transcription": "Recorded transcription",
  "discovery-notes": "Discovery notes",
};

export function entryTypeLabel(cats: string[] | undefined, docType?: string | null): string {
  const t = (cats || []).find((c) => c in ENTRY_TYPES);
  return t ? ENTRY_TYPES[t] : docType || "";
}

export const withoutEntryType = (cats: string[] | undefined) => (cats || []).filter((c) => !(c in ENTRY_TYPES));
