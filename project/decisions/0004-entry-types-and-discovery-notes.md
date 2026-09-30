# 0004 — How are journal documents typed, and where do the Discovery Notes go?

- **Status:** Accepted
- **Date:** 2026-09-30
- **Supersedes:** none

## The question

The journal mixed three kinds of document without saying which was which: the
administrative comments at the top of each Google Doc, day entries written by
hand, and recording transcripts. Separately, 22 emails the author sent himself
("Invisible Ships Discovery Notes", 9 Apr – 24 May 2026) are the notes entries are
written from. None of them is in the Docs or the journal. The question was whether
and how to label every journal document, and where the notes belong.

## Decision

Every journal document carries exactly one **entry type**, stored as a category in
all three copies (no schema change): `administrative-notes`, `manual-capture`,
`recorded-transcription` or `discovery-notes`. The label shows on feed cards and
pages (`lib/entry-type.ts`). The Discovery Notes are published **in the journal
feed** under their own type, "Discovery notes" (Sean: option a). Each opens with a
heading and a brief summary written by Claude from the note, marked as the
editor's, and a banner saying it is unofficial and pointing to the Critical
Disclaimer. The author's words follow unchanged, with all email labelling removed
(subject, sender, sent times, message sub-headings, sign-off, signature, printout
links). Notes that name private people or mention family, a legal matter or an
employer are shown to Sean first; on 30 Sep he reviewed all 22 (names, public
figures, places and links listed for him) and published them all as written.

## Why

- Sean, 30 Sep: "Maybe add an 'entry type' label" and, on the wording,
  "yes those work". On the notes: "a — please generate a heading based on the
  content for each … and a brief summary for each — point to the disclaimer."
- Categories are rows, not columns, so the type needs no schema change (CLAUDE.md
  §6: no structural changes without Sean) and travels to the download's
  `categories:` line and manifests unchanged.
- A type is filterable. Readers who want only the record can filter the notes out;
  readers who want the newest material find it where they look for the journal.
- The notes are raw. A summary helps readers, but it is not the author's text, so
  it is labelled as the editor's and kept in the banner, apart from the note.

## Rejected

| Option | Why not |
|---|---|
| A separate "Discovery notes" section, outside the feed (option b) | Claude's first suggestion; Sean chose the feed. The type label and banner do the separating. |
| Download only for now (option c) | Leaves the three copies unequal for readers of the site. |
| Put the notes into a Google Doc first | The Docs are never edited by Claude (data-rules §5). |
| A `doc_type` or new column for entry type | A structural change; categories already carry types. |
| Publish without review | 9 notes name family members, a legal matter, a past employer or a shelter resident. They were held until Sean had seen every name, place and link; he then published all 22. |
| Redact private names | Offered (for example "J\*\*\* S\*\*\*"); Sean chose to publish as written. |
| Keep both copies of the repeated administrative comments (Part 03 and Part 04) | They are word for word the same; one copy plus a redirect keeps one text. |

## Consequences

- The journal feed now holds material that is not in the Google Docs. The type,
  the title ("Discovery Notes, <time>: <heading>") and the banner must stay on
  every note so it is never mistaken for an official entry.
- Headings and summaries are Claude's words inside the three copies; they are
  listed as an approved difference class in data-rules §5.
- The notes name private people ("Amy", "Joshua M\*\*\*", "Jonathan Smeggler",
  "Dr. Brain"), public figures and places, as the author wrote them. The standing
  disclaimer — no accusation against any named person — is linked from every note.
- A future note that names private people is shown to Sean before publishing.
- Supabase rows for the notes are inserted at the push, so the live feed never
  links to a page that is not deployed yet.

## What would change this

Sean moving the notes' content into a Google Doc (then the Doc becomes the record
and the notes' pages follow it), or readers finding the notes in the feed
confusing enough to move them to a separate section (option b).
