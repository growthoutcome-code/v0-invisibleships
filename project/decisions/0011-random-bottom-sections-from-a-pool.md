# 0011 — Should the bottom sections show random content, and from where?

- **Status:** Superseded by 0012 (all of each pool is now shown; Research paused)
- **Date:** 2026-10-01
- **Supersedes:** none

## The question

The bottom sections (Journal, Concepts, Research, Glossary under every page except
the home page) showed exactly the home page's slides. Sean asked for them to be
random, without touching the home page: "I don't think we need to pull from the
entire library… four to six selections for each bottom section… maybe just random
is better."

## Decision

Random, from a vetted pool. Each section has six candidates in
`lib/bottom-picks.ts`, none of them on the home page. Every page load shows four of
the six in a random order, and one research chart of three (suicide, homicide,
break-ins). The home page keeps its own picks and is unchanged.

## Why

- Most of the library cannot be shown cold. Journal excerpts must avoid passages
  centred on suicide, self-harm or euthanasia, private individuals' names and
  accusations against named organizations (`lib/home-quotes.ts`); a random excerpt
  breaks one of those most of the time. Two glossary entries render as broken
  slides (`mosquito-device`, `brain-data-as-a-service…`) and `sampling-limit` is
  cut at a decimal point. One concept (`how-protected-is-your-medical-record`)
  stops before its point at slide length.
- No overlap with the home page means a reader who has seen it always meets
  something new at the bottom.
- The same builders as the home page build the bottom slides, so a bad pick fails
  the build instead of rendering.

## Rejected

| Option | Why not |
|---|---|
| Random from the whole library | Breaks the journal exclusion rules and shows broken glossary slides. |
| Fixed curated list, no randomness | What existed; Sean asked for random. |
| Reuse the home page's picks, shuffled | The bottom sections would only ever repeat the home page. |
| Show all six, shuffled | Shorter carousels are more likely to be read through; four keeps "1 / 4". |
| Change the home builders' content | Sean: the home page sections "need to stay exactly what they are". |

## Consequences

- Adding a candidate is a one-line change in `lib/bottom-picks.ts`. Journal picks
  need an anchor and an open question, like the home page's.
- Research charts other than these three are not drop-in: they use other chart
  components.
- What would reopen this: a reason to curate per page (for example, crime charts
  only under Crime-adjacent pages).
