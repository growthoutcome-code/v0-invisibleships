# 0014 — Glossary: tiles, or the list with a bigger sidebar?

- **Status:** Accepted
- **Date:** 2026-10-01
- **Supersedes:** 0013

## The question

0013 replaced the Glossary's list and sidebar with three-up tiles, every term
on one page under letter headings. Looking at it, Sean reversed the change within
the hour: "Let's undo the glossary terms tiles and make the sidebar for the
glossary at least 25% of the width of the page and increase the font size by 15
to 20%… I don't care that they are redundant, it's important that we see all
the terms."

## Decision

The Glossary keeps the single-column list of definitions, with the sidebar of
every term beside it.
- **Width:** the sidebar is a quarter of the page, at least 15rem.
- **Type:** its entries are 16.5px, up from 14px (+18%). The "Terms" label is
  14px, up from 12px.
- **Gap:** the space between the sidebar and the definitions doubles, from 2rem
  to 4rem.

The larger size applies only to the Glossary (`large` on SideNav). The Journal's
rail is unchanged.

## Why

- The sidebar is the only place every term is visible at once. Sean's priority
  is that readers see all the terms; that the sidebar repeats the list below is
  acceptable.
- Tiles showed all terms too, but only by scrolling a 12,000px page.

## Rejected

| Option | Why not |
|---|---|
| Three-up tiles, all on one page (0013) | Built and reviewed. Sean preferred the list and a visible index of every term. |
| Paginated tiles | Hides most terms behind page buttons. |
| Dropping the sidebar as redundant | Redundancy is accepted; seeing every term is the point. |

## Consequences

- The `firstSentences` fix that came with 0013 stays. It is independent of the
  layout: "brain.space" and decimals no longer split sentences.

## What would change this

The glossary growing so long that the sidebar stops fitting on one screen
without heavy scrolling.
