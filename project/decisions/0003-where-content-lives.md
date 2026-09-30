# 0003 — Where does the site's content live, and which copy is the reference?

- **Status:** Accepted
- **Date:** 2026-09-29
- **Supersedes:** none

## The question

The site's content existed in three copies that had drifted apart: the download
(`invisible-ships-corpus.zip`), Supabase `documents`, and the site's bundled data.
Supabase held only the journal, references and 18 glossary terms — no concepts,
research, site glossary, author or terms pages. 274 journal documents in Supabase and
the site data still linked audio that died in the Dec 2025 re-upload, while the
download had the live links. Sean: *"every single journal entry, every word of content
in the website … in Supabase and the downloadable corpus … let's have some
consistency."* And: *"I don't want to make any structural changes."*

## Decision

**Three copies, one text; the download is the reference for agreement.** Every piece of
reader-facing content is in the download, in Supabase `documents` and in the site data,
with the same words. A Supabase row is the download file's body minus front matter and
the standing disclaimer footer, with header fields in the same-named columns. New
content is new rows in the existing table — no schema change. Rules:
`project/data-rules.md`.

Applied 29 Sep 2026: 120 documents added to Supabase (concepts 43, site glossary 29,
crime 22, public health 10, Government Cloud 9, meta 4, documents 1, research note 1,
upcoming 1); 229 audio links repaired in Supabase and the site data from the 16 Aug
audio map; 832 of 832 documents verified identical by md5.

## Why

- The download is the only copy that already held every section in one format, is
  rebuilt by `npm run corpus` from the sources, and already carries IDs and metadata in
  a header. Checking the others against it needs no new pipeline.
- Rows in the existing `documents` table need no migration and nothing reading the
  table changes behaviour: the feed filters `collection = 'journal'`, the glossary tab
  reads the separate `glossary` table, and Ask only sees rows with an embedding.
- The drift happened because no guard compared the journal: `check_download_matches_site.py`
  covers 186 site files and no journal entry. `sync_site_data_from_download.py --check`
  now does, inside `npm run check`.

## Rejected

| Option | Why not |
|---|---|
| A `body_full_markdown` column or `journal_entries_full` table for entries with transcripts joined | Structural; Sean declined. The site joins entry + recordings at read time (`lib/entry-body.ts`) from the rows that already exist. |
| New per-section tables (concepts, crime, …) | Structural, and it would split one kind of thing — a document with a body — across many tables. |
| Supabase as the reference copy | Nothing builds Supabase from the sources; the download is what `npm run corpus` produces. Making Supabase primary means a new write pipeline. |
| Google Docs as the reference for everything | They are the record for the journal only; concepts, research and site pages are authored in the repo. |
| Loading navigation, menus and footer labels | Not content. They live in components and change with the design, not the record. |
| Loading CSV/JSON/SQL chart data into `documents` | Tables of numbers, not text documents; they stay files in the download. Revisit if a page needs to query them. |
| Switching every page to read Supabase now | A structural change to how pages load; the standalone pages are statically generated from site data. Listed in data-rules §9 as not done. |

## Consequences

- A Supabase write is a deliberate, verified step after `npm run corpus`, not part of
  the build. Until there is a sync script with a service key, Claude does it and runs
  the md5 check.
- 120 new rows have no embeddings, so Ask cannot find them until an embedding run.
- Pages that read site data (most of them) do not reflect a Supabase-only edit. There
  must not be Supabase-only edits.

## What would change this

- Sean approving a structural change (a page reading Supabase, or a sync pipeline with
  a service key) — supersede this record rather than editing it.
- Supabase becoming the place content is authored, which would flip the reference copy.
