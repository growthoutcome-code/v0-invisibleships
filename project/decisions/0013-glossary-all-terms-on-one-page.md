# 0013 — Should the Glossary page be paginated tiles, or every term on one page?

- **Status:** Superseded by 0014 (same day: tiles undone, sidebar kept and enlarged)
- **Date:** 2026-10-01
- **Supersedes:** none

## The question

The Glossary was a single column of entries beside an A–Z sidebar. Sean found the
sidebar "tiny" and said "it doesn't present information well", and approved
three-up tiles. He first suggested 12 to 16 tiles a page, alphabetical. Then he
raised the risk: "the only thing that worries me is that people won't see the full
list… Do we load them all at once and abandon pagination?"

## Decision

Every term is shown on one page, in three-up tiles (two on a tablet, one on a
phone).
- **Order:** A to Z, under letter headings.
- **Navigation:** an A–Z strip above the tiles jumps to any letter. Letters with
  no terms are shown muted.
- **No pagination.**
- **No sidebar on the list.** It stays beside an open term, where it leads to the
  next one.
- **Sort and Filter** are unchanged and narrow the same page in place.

## Why

- With 12 tiles to a page, 44 of the 56 terms sat behind page buttons, which is
  exactly the risk Sean named. One page means every term is one scroll or one
  letter away.
- 56 terms is small enough to load at once: they are already in the client data
  set, so no extra request is made.
- Letter headings plus the strip give the full-list overview the sidebar was
  meant to give, at a readable size.

## Rejected

| Option | Why not |
|---|---|
| Paginated tiles, 12 or 15 a page | Hides most of the glossary behind page buttons, which is Sean's stated worry. |
| Keep the sidebar beside the tiles | The tiles already show every name. The sidebar repeated them in the smallest type on the page. |
| A continuous grid with no letter headings | Harder to find a term by eye; the strip would have nowhere to jump to. |
| Sentence case for term names | `.term-title` sets Title Case on purpose (it keeps acronyms like BCI intact). The tiles follow that rule. |

## Consequences

- Short letters leave part of a row empty (A has two terms). That is accepted as
  the cost of letter headings.
- The page is long: about 12,000px on desktop with 56 terms.

## What would change this

- The glossary growing past about 150 terms. At that size, return to pages within
  each letter.
- PostHog showing readers rarely scroll past the first letters.
