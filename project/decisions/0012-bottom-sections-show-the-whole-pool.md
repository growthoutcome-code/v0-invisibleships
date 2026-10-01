# 0012 — Should the bottom sections show a sample of the pool, or all of it?

- **Status:** Accepted
- **Date:** 2026-10-01
- **Supersedes:** 0011 (the "four of six" part; the pool, the home page rule and the builders stand)

## The question

0011 showed four of six candidates per section, in random order, plus one of three
research charts. The same day, Sean grew each pool and asked to see all of it, one
slide at a time, so that the randomness is visible ("we need to see that it
randomizes").

## Decision

Every bottom carousel shows its whole pool in a random order:

- **Journal:** 10 slides.
- **Concepts:** 20 tiles, two up across the full page width.
- **Glossary:** 12 terms.

The **Research** block is paused on every page until the charts are picked (`PAUSED`
in `components/BottomSections.tsx`). The home page chart is separate and unchanged.
The home page still keeps its own picks.

## Why

- Sean, 1 Oct 2026, on the journal: "show all 8 in random order, one at a time"
  (later 10). On concepts: "pick 20 concepts to randomize". On glossary: twelve terms
  chosen so that every topic is represented.
- The pools are vetted one by one, so showing all of a pool carries no risk that
  sampling avoided.
- Research: "Remove the research bottom section from all pages until we pick the
  charts. Do not remove the chart from the home page."

## Rejected

| Option | Why not |
|---|---|
| Keep four of six (0011) | Sean asked for larger pools, shown in full. |
| Delete the Research block | It is paused, not removed. It returns when the charts are chosen, and its code still builds. |
| Remove Research from the home page too | Sean: "Do not remove the chart from the home page." |

## Consequences

- Carousels are longer: "1 / 10", "1 / 10" two up (or "1 / 20" on a phone), and
  "1 / 12".
- A new candidate is still a one-line change in `lib/bottom-picks.ts`, and the
  builders still fail the build on a bad pick.

## What would change this

- Readers rarely getting past the first few slides (PostHog carousel events) would be
  a reason to sample again.
- Sean picking the charts would unpause Research.
