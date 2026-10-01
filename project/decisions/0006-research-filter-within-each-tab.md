# 0006 — How does Research get a filter?

- **Status:** Superseded by [0007](0007-research-has-no-filter.md) the same evening (the filter was removed; the tab layout below was kept)
- **Date:** 2026-09-30

## The question

The Journal, Concepts and Glossary share one filter pattern (0005). Sean asked for a
filter on Research too. Research is not one list: it is four report tabs (Timeline,
Government Cloud, Public Health, Crime) of charts, findings and registers.

## Decision

- **One filter per report tab**, acting on that tab's lists: sources, data points,
  milestones and registers. Government Cloud, Public Health and Crime each keep their
  own; switching tabs and back keeps it. Timeline has no list and no filter.
- **Charts are not filtered.** A series with points removed misstates it.
- **Four controls**, in the same panel as everywhere else: Search; Years (From–To,
  shown only where there is more than one year); Evidence strength (A documented,
  B corroborated, C claimed); Country (shown only where there is more than one).
- **Years and Country narrow only rows that carry a date or a place.** An undated
  source is not outside 2010–2015; it is undated. Every list says how many of its rows
  the filter kept.
- The tabs' own search boxes (Government Cloud sources, Public Health indicators)
  were folded into the panel.

- **Each tab opens the same way** (Sean, 30 Sep 2026: "a h2 or h3 title with the
  filter floating right at the top of the tab content. Charts are the first priority
  and descriptive copy can go underneath the charts"): heading left, Filter right,
  subline, then the first chart. Note lines, stat tiles and the summary of what a tab
  is built from move under the first chart. Timeline has no records to filter, so its
  heading row carries the timeline's own Domain picker in the same place.

Shared code: `components/ResearchFilter.tsx`, `components/TimelineHead.tsx`.

## Why

- Sean, 30 Sep 2026: "Let's do it within the tab, just as you've prescribed."
- Evidence strength fits the archive's standing condition that all information
  requires independent verification: a reader can keep only the strongest evidence.

## Rejected

| Option | Why not |
|---|---|
| One filter across all of Research, with a combined "All evidence" view | A new page type for a small gain; the tabs already separate the subjects. |
| Filter by publisher or vendor | A list of organizations (data-rules §2). In a Zersetzung context it reads as an accusation. |
| The journal's themes as a Topic filter | They describe what an entry records (death threats, harassment), not statistics. |
| Hiding undated or unplaced rows when Years or Country is set | Removes rows for lacking a field, not for failing the filter. |
| Pinning the phone Filter bar under the header | Each tab already pins its section menu there; two pinned bars stack. |

## What would change this

A request to search across all Research at once, or charts that can be filtered
without misstating a series (for example, a country chosen on a multi-country chart).
