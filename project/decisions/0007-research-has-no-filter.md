# 0007 — Research has no filter

- **Status:** Accepted
- **Date:** 2026-09-30
- **Supersedes:** [0006](0006-research-filter-within-each-tab.md)

## The question

0006 gave each Research tab a filter (search, years, evidence strength, country)
acting on its lists. Built, tested, and seen by Sean the same evening.

## Decision

- **No filter on Research.** Sean, 30 Sep 2026: "now that I see it lets remove the
  filters from the research section. It's only restricting information."
- The two search boxes the filter had absorbed come back as they were: Government
  Cloud's sources ("Filter by publisher, title or URL") and Public Health's indicators.
- **Kept from 0006: the tab layout.** Every tab opens with an H2 and a subline, then
  the chart; descriptive copy (note lines, stat tiles, the summary of what a tab is
  built from, Timeline's findings) follows the charts. Timeline's heading row carries
  the chart's existing Domain picker on the right (`components/TimelineHead.tsx`).

## Why

Research is evidence presented as findings. A reader narrowing it sees less of the
record, not a clearer view of it; the lists are already short and paged.

## Rejected

| Option | Why not |
|---|---|
| Keep the filter on some tabs only | The same objection applies to every tab. |
| Keep evidence strength alone | Still restricts what a reader sees; tiers are already marked on every row. |

## What would change this

Research lists long enough that paging stops working, or a reader request to find
one thing in them that search alone does not serve.
