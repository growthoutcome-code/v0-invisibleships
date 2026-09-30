# Data rules — where content lives, and how the copies stay the same

*Standing rules. Set 29 Sep 2026 (Sean: "every single journal entry, every word of
content in the website … in Supabase and the downloadable corpus … let's have some
consistency"). Reasoning and rejected alternatives: `decisions/0003-where-content-lives.md`.*

## 1. Three copies, one text

Every piece of reader-facing content exists in **three places, with the same words**:

| Copy | Where | Read by |
|---|---|---|
| **Download** | `public/invisible-ships-corpus.zip` (the "Corpus for AI" footer link) | readers and AI tools |
| **Supabase** | table `documents`, one row per document | the journal feed and reader, glossary tab, Ask |
| **Site data** | `public/corpus/*.json`, `public/data/**`, `lib/*.ts` | standalone pages, and the fallback when Supabase is down |

"Content" means anything a reader reads: journal entries, recordings and transcripts,
references, glossary terms, concepts, research (crime, public health, Government
Cloud), the author, terms, safety and why pages, the documents register, upcoming notes.

**Not content**, and kept out of Supabase: navigation, menus and footer labels
(`components/Header.tsx`, `components/Footer.tsx`); buttons and UI text; the
download's own packaging (README, START-HERE, manifests); chart data tables
(CSV/JSON/SQL files stay files; the words about them are content).

## 2. The download is the reference copy

`npm run corpus` builds the download from the sources (the Google Docs for the
journal; `lib/*.ts` and `research/` for site-authored content). The download is the
only copy that already holds everything in one format, so **the other two are checked
against it**:

- **A Supabase row = the download file's body** with the front matter removed and
  the standing disclaimer footer removed, trimmed. Header fields go into the columns
  of the same name (`id`, `title`, `collection`, `doc_type`, `part`, `source_*`,
  `word_count`, `author`, `copyright`, `audio_drive_id`, `audio_url`, …).
- **`path` = the file's path inside the download.** `id` = the header's `id`. IDs
  are never invented or renamed.
- **Site data** must match the same body and audio fields.

The download is the reference for *agreement*, not for *truth*: for the journal the
Google Doc is the record (rule 5).

### What is published from the Google Docs

- **The journal is the dated journal only.** Nothing from a Doc tab titled
  **"Transcripts In-Progress"** (Parts 03 and 04 have one) is published — not to the
  site, Supabase or the download (Sean, 30 Sep: "do not include any transcripts from
  those tabs. Doing so, will create duplicates that are incomplete"). Those tabs are
  working copies; an entry is published when Sean moves it into the journal tab.
- Removed 30 Sep 2026: 54 documents (18 entries + 36 recordings) that had been built
  from those tabs — every placeholder-only entry and every day published twice came
  from them. About 8,500 of their words existed only there (chiefly 28 Nov 2025 and a
  second 16 Oct 2025); they stay in the Docs and return when moved into the journal tab.
- Any converter must skip those tabs by name. A re-conversion that finds them is wrong.
- **A removed page never returns "not found."** Its old address redirects (temporary)
  to the same day in the main journal, or to the journal feed when that day is not
  there yet: `lib/journal-redirects.json`, read by `next.config.mjs`, checked by
  `npm run check`. When an entry comes back, delete its redirect.
- **Every journal document has one entry type** (Sean, 30 Sep 2026), stored as a
  category in all three copies (`rels.json` doc_categories, Supabase
  `document_categories`, the download's `categories:` line and manifests):
  `administrative-notes` — a comment from a Doc's "Administrative Comments" section
  (9: Part 01 ×3, Part 02 ×1, Part 03 ×2, Part 04 ×3); `manual-capture` — a day's
  entry written by hand; `recorded-transcription` — a recording's page. Shown as the
  label on feed cards (`lib/entry-type.ts`). Administrative notes *spoken inside*
  recordings or written inside a day's entry stay part of that page.
- **One copy of a repeated administrative comment.** Part 04 repeats Part 03's
  12 Oct and 16 Oct 2025 comments word for word; the Part 03 copies are published
  and `IS-J04-20251012-ENTRY` / `IS-J04-20251016-ENTRY` redirect to them.
- **Discovery Notes are published in the journal as unofficial entries** (Sean,
  30 Sep 2026; decision 0004). They are the author's emailed notes (9 Apr – 24 May
  2026), not in any Google Doc: `journal/discovery-notes/` in the download, type
  `discovery-notes` ("Discovery notes") everywhere. Each keeps the author's words
  unchanged under a banner that says it is unofficial, gives a heading and brief
  summary written by Claude (marked as the editor's), and points to the Critical
  Disclaimer. **No email labelling:** the subject line, sender and date header,
  sent times, message sub-headings, sign-off, signature and links to the email
  printouts are removed; only what the author wrote remains (Sean, 30 Sep). A
  note that names private people or mentions family, a legal matter or an
  employer is shown to Sean before publishing; he reviewed all 22 on 30 Sep and
  published them all, names as written ("Publish all of them.").

## 3. No structural changes without Sean

New content is **new rows in existing tables**, with `collection` taken from the
download header. No new tables, columns, views or functions, and no page switched to a
different data source, without Sean's explicit say-so. Anything that would need one is
written up as a proposal instead.

## 4. How a change reaches all three

1. Change the source (Google Doc, `lib/*.ts`, `research/`).
2. `npm run corpus` → rebuilds the download and site data.
3. `npm run check` → fails if the site data and the download disagree
   (`scripts/sync_site_data_from_download.py --check` covers the journal, which the
   older guard did not).
4. Supabase: upsert the changed rows from the download (rule 2), then run the
   Supabase check below. Supabase writes are not done from a build; they are done
   deliberately, and verified.
5. Sean commits and pushes. Nothing is published without him.

## 5. The record is never edited to agree

If copies disagree on **words**, report it and let Sean decide; do not pick a winner
silently. By default the Google Doc wins for the journal; Sean's explicit choice
overrides it.

**The Google Docs are never edited — by anyone, for any reason** (Sean, 29 Sep:
"I don't want any edits to any Google Doc ever"). They are the original record as
written. Where Sean approves a difference from a Doc, it lives in the three copies
only and is listed below, so a future re-conversion from the Doc carries it forward
instead of undoing it.

| Document | Differs from the Doc | Decided |
|---|---|---|
| IS-J01-20250227-ENTRY | Questions & Comments block added (not in the Doc) | Sean, 29 Sep 2026 (version B) |
| IS-J01-20250711-R11 and the 11 Jul entry list | audio link → `20250711-205502-02` (Doc links R14's file) | Sean, 29 Sep 2026 |
| IS-J01-20250712-R03 and the 12 Jul entry list | audio link → `20250712-100839` (Doc links R04's file) | Sean, 29 Sep 2026 |
| All Parts 01–03 recordings | audio links use the live Drive IDs (16 Aug map); the Doc's pre-December IDs are dead | audio map, 16 Aug 2026 |
| IS-J02-20250823-R12 | "(recording unavailable)", no link; the file does not exist | 16 Aug 2026 |
| 5 undated Part 01 entries (`IS-J01-…-EST-ENTRY`) | Dates chosen by Claude, marked "(estimated)" in the title and explained in `notes`; the Doc's heading ("Late 04/2025", "03/2025 - 04/2025", "Early Spring 2025, Estimated", "Feb 2025, Estimated", "Fall 2024 to Mar 2025") is the first line of the text | Sean, 30 Sep 2026 |
| IS-J02-20250825 (entry + 7 recordings) | Restored (its H3 heading had kept it out); audio links point at the live Drive files | Sean, 30 Sep 2026 |
| IS-J04-20251012-ENTRY, IS-J04-20251016-ENTRY | Not published: word-for-word repeats of the Part 03 administrative comments; redirect to them | Sean, 30 Sep 2026 |
| IS-J02-20250824-R04 and the 24 Aug entry list | Title, heading, `notes` and the entry's recording list say "second transcription of Recording 3": Part 02 transcribes `20250824-110328.mp3` twice (same timestamps, 93% same words); both kept | Sean, 30 Sep 2026 (option A) |
| IS-JDN-* (Discovery Notes) | Not in any Doc. Title, heading, summary and banner written by Claude from each note (the note's own words unchanged) | Sean, 30 Sep 2026 (decision 0004) |
| IS-JDN-20260523-0928 | The note was only a TypingMind share link. The link is replaced by the conversation it shows, under TypingMind's title "Persona Consumer Sign-In": the question and the final answer, word for word (md5-checked against the share page); the tool's 38 research-step messages are left out, and the answer's headings sit one level under the title | Sean, 30 Sep 2026 ("pull the conversation … and remove the URL") |

**Links are not words.** Repairing a dead audio link (a Drive ID) to the live copy
of the same file is a link fix, not an edit, and is applied to all three copies.

## 6. Audio

- Audio is resolved **by file name**. The Drive ID in every copy must point to the
  file named in `audio_file`. Map: 16 Aug 2026 audio map (283 of 286 resolved).
- A recording whose file does not exist is marked `(recording unavailable)` with no
  link (23 Aug 2025 R12).
- **A link opens exactly the recording its text names — the only recording linked
  for that slot.** Sean, 29 Sep: "we need the actual accurate recording for that day to
  be the only linked recording." Checked across all 598 audio links on 29 Sep: two
  recordings (11 Jul R11, 12 Jul R03) had been given the next recording's link in the
  Doc (R14's and R04's). Fixed in all three copies, on the recording page and in the
  day's list; the correctly named files exist in Sean's Drive.

## 7. Unofficial and unpublished material

Discovery Notes and anything else unofficial enter the download and Supabase only
after Sean approves, carrying their label (`doc_type` and entry type
`discovery-notes`, plus the unofficial banner) so no reader or query can mistake
them for official journal entries. All 22 approved 30 Sep 2026 (§2). `upcoming/` notes are labelled "not
completed entries".

## 8. Checks

| Check | How | When |
|---|---|---|
| Site data = download | `python3 scripts/sync_site_data_from_download.py . --check` (in `npm run check`) | every build |
| Download coverage of site pages | `scripts/check_download_matches_site.py` (in `npm run check`) | every build |
| Supabase = download | For every download file with an `id`: md5 of the body (rule 2) = `md5(body_markdown)` in Supabase; no Supabase row without a download file | after any Supabase write |
| Audio | `audio_files.drive_id` = `documents.audio_drive_id`; every ID resolves to the file named in `audio_file` | after any audio change |
| Link = name | every `[<name>.mp3](…/d/<id>)` link in every body uses the ID of the recording whose `audio_file` is `<name>` | after any audio change |
| Search index | `indexing-rules.md` §6 | after any body change |

Last full check, 30 Sep 2026 (after the in-progress tabs were removed): **778 of 778
download documents match Supabase; the 384 journal documents are identical in all
three copies; site data matches the download with nothing held; 526 of 526 audio
links open the file their text names.** `audio_files` holds one row per file name, so
two recordings that share a file (2 Dec R02/R03, intentional; 24 Aug R03/R04, two
transcriptions of one file, §5) have one row between them.

After the push (30 Sep 2026, commit `6b01654`, deployed): **811 of 811** download
documents match Supabase (md5 of every body; hash of the sorted id:md5 list equal),
and all 691 site-data documents match Supabase in title and text. Journal: 417
documents in all three copies (382 + 13 restored + 22 Discovery Notes). The 35 new
rows were read from the live site's own files, not pasted.

## 9. What Supabase does not do yet (so nobody assumes it does)

- Only the journal feed, the in-app reader and the glossary tab read Supabase. The
  standalone `/journal/[id]` and `/glossary/[slug]` pages, the home page, Concepts,
  Timeline and research pages, the Documents list and the author page read site data.
  Switching them is a structural change (rule 3).
- Search index for Ask: rules in `indexing-rules.md`. 1,571 passages from 774
  documents (30 Sep); embedding waits on Sean running it with his key. Ask is
  not live on the site.
