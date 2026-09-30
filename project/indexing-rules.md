# Indexing rules — the search index behind Ask

> **Status, 30 Sep 2026: dormant.** Sean: "Let's not do that yet. Let's keep that part
> of the chat feature, which is in a separate branch … I don't know if I'm actually
> going to do that feature." The index belongs to the `ai-chat` branch. Until Sean
> decides to build the chat feature: nothing is sent to Gemini, no embeddings are run,
> and the passages are **not** rebuilt when entries change (they may drift — rebuild
> them first if the feature goes ahead). The `document_chunks` table and
> `embed_chunks_batch` stay in Supabase unused; removing them is Sean's call. If the
> feature goes ahead, the Gemini key goes into Vercel's environment settings and the
> site embeds passages itself — no SQL step for Sean.

*Standing rules. Set 29 Sep 2026 (Sean: "Let's index. Absolutely … make sure that we
have … some kind of indexing rules document"). Companion to `data-rules.md`: that file
says what the content is; this one says how it is made searchable.*

## 1. What the index is

Ask ("Ask the Corpus", built on the `ai-chat` branch, **not live on the site**) answers
only from passages it retrieves. Retrieval runs on two things in Supabase:

| Piece | What it is |
|---|---|
| `document_chunks` | passages cut from `documents.body_markdown` (`chunk_id`, `document_id`, `seq`, `content`, `embedding`) |
| `match_chunks(query_embedding, query_text, match_count)` | returns the closest embedded passages, with the document's title, type, date and audio link |

The index is **derived**. It is never edited by hand and never holds text that is not in
`documents`. If the index and `documents` disagree, the index is wrong; rebuild it.

The older document-level path (`documents.embedding`, `match_documents`, `embed_batch`)
is superseded by chunks and is not maintained. **Note:** the `ai-chat` branch's
`app/api/ask/route.ts` still calls `match_documents`; switching it to `match_chunks` is
item 2 of that branch's remaining work (`claude/ai-chat-build-status.md`, 4 Aug) and
must happen before Ask goes live, or Ask will search the unmaintained path.

## 2. What goes in

Every published document in `documents`, **except**:

| Excluded | Why |
|---|---|
| `collection = 'upcoming'` | planning notes, labelled "not completed entries" |
| `collection = 'research-notes'` | internal working notes about the site, not archive content |
| `IS-META-COPYRIGHT`, `IS-META-DISCLAIMER` | superseded extracts; Ask must cite the operative terms (`IS-META-TERMS`), not these |
| Discovery Notes / anything unpublished | not in `documents` until Sean approves (data-rules §7) |
| empty bodies | nothing to search |

Journal **entries** are indexed as well as recordings. In `documents` an entry holds the
scene, meta and Questions & Comments, and not the transcripts, so indexing both adds no
duplicate text. (August's index skipped entries because they were then going to hold the
transcripts too.)

## 3. How passages are cut

- Straight from `body_markdown`, no rewriting, no prefix: passage `seq` =
  `substr(body, seq*4400 + 1, 5000)`. **5,000 characters, 600 overlap.** Every word
  lands in at least one passage; nothing is truncated.
- Passages continue until one reaches the end of the body:
  `seq` = 0 … `greatest(0, ceil((length − 5000) / 4400))`.
- `chunk_id` = `<document id>-c<seq, 3 digits>`, e.g. `IS-J01-20250710-R02-c002`.
- This matches the August index exactly (verified 29 Sep on 317 unchanged passages).

## 4. How passages are embedded

- Model: **`gemini-embedding-001`**, 3,072 dimensions — one model for every passage and
  every question. Vectors from different models cannot be mixed; changing the model
  means re-embedding everything.
- Function: `embed_chunks_batch(n, api_key)` embeds up to `n` passages that have no
  embedding and returns `(embedded, attempted, remaining)`. Failed calls (rate limits)
  are skipped and retried on the next run.
- **The API key is Sean's and is never written into a file, a chat, a commit or a
  table.** Sean runs the batch himself in the Supabase SQL editor; Claude does not
  handle the key.
- The free tier limits embeddings (~35 a minute in August). Run in small batches until
  `remaining = 0`, or enable Gemini billing (under $1 for the whole corpus, one time).

## 5. When the index is rebuilt

After **any** change to a document's `body_markdown` in Supabase (data-rules §4):

1. Delete that document's passages; recut it (§3). A whole-index rebuild is the same
   operation over every document and is safe: it only removes derived data.
2. Embed the new passages (§4).
3. Check (§6).

A passage whose document changed keeps its old embedding only until step 1; there is no
partial update of a passage.

## 6. Checks

| Check | Pass |
|---|---|
| Every passage matches its document | `content = substr(body, seq*4400+1, 5000)` for all rows |
| Every indexed document is fully covered | passage count = the §3 formula, for every document in §2 |
| No passage for an excluded or deleted document | 0 rows |
| Embedded | `count(embedding) = count(*)` before Ask goes live |

## 7. Status

- 29 Sep 2026: index rebuilt to these rules — 1,698 passages from 828 documents.
- 30 Sep 2026: the 54 documents from the "Transcripts In-Progress" tabs were removed
  (data-rules §2); their passages went with them (1,571 passages from 774 documents).
- 30 Sep 2026: the 2 repeated Part 04 administrative comments were deleted (data-rules
  §2). **Now 1,569 passages from 772 documents**; all §6 checks pass except
  "Embedded", waiting on Sean running §4. The 13 restored documents get their
  passages at the push.
- Ask itself is not on the live site. Wiring it (the `ai-chat` branch: `/ask` route,
  providers, limits, Turnstile) is separate work and a separate decision.
