/**
 * The standing notice — one sentence pair that travels with every piece of
 * content, on the site and in the download.
 *
 * WHY THIS IS SEPARATE FROM lib/terms.ts. That file holds the full terms as
 * structured data, and `scripts/export_terms_md.mjs` evaluates its `TERMS`
 * array literally — no identifiers, no computed values. These strings are
 * needed in places that array cannot reach: React components that render a
 * single line under an item, and Python scripts that write footers into 840
 * files inside the zip. So they live here as plain literals, and
 * `scripts/export_disclaimer.mjs` lifts them into
 * `scripts/generated/disclaimer.json` for the Python side.
 *
 * ONE SOURCE, THREE LENGTHS. The full Critical Disclaimer is in lib/terms.ts
 * and is what /disclaimer, the gate and meta/IS_META_terms.md render. What is
 * here is the short form, and it says the two things that matter if a reader
 * sees nothing else: the transcripts are external communication the author
 * disavows, and nothing here is verified.
 *
 * Sean, 19 September: "let's make sure that as we add content, we don't have to
 * discuss this topic again." That is what the guard in
 * scripts/check_disclaimer_coverage.py enforces against these exact strings.
 * Change them here and every surface moves; change them anywhere else and the
 * guard fails, which is the point.
 */

export const DISCLAIMER_TITLE = "Critical Disclaimer on Transcripts and Accusations";

/** The short form. Rendered under every item on the site; the body of the corpus footer. */
export const DISCLAIMER_STANDING =
  "Transcripts and statements recorded in this archive are external communications and do NOT represent the author's beliefs, views, or intent. Nothing here accuses, blames, or alleges malfeasance by any named person, company, or government body, and all of this information requires independent verification.";

/** Where the full text lives, for a reader on the site. */
export const DISCLAIMER_HREF = "/disclaimer";

/** Where the full text lives, for a reader holding a file out of the corpus. */
export const DISCLAIMER_FILE_POINTER =
  "The full Critical Disclaimer, copyright and terms are in meta/IS_META_terms.md, and at https://www.invisibleships.com/disclaimer.";

/**
 * The block appended to every markdown file in the corpus.
 *
 * Additive and fenced by a rule and a heading, so a reader can see exactly
 * where the extracted document ends and the archive's own notice begins. The
 * content above it is never edited — an extract that has been rewritten is no
 * longer an extract, which is the same rule the superseded banners follow.
 */
export const DISCLAIMER_FILE_FOOTER = [
  "---",
  "",
  `## ${DISCLAIMER_TITLE}`,
  "",
  DISCLAIMER_STANDING,
  "",
  DISCLAIMER_FILE_POINTER,
].join("\n");
