# 0010 — Every Research section shows one view at a time

- **Status:** Accepted
- **Date:** 2026-09-30
- **Supersedes:** the sidebar bullet of [0008](0008-research-sections-have-their-own-pages.md) (Timeline, Public Health and Crime kept long scrolling pages with "on this page" outlines)

## Decision

Sean, 30 Sep 2026: "mirror the Government Cloud section's separate pages instead of
long scrolling pages."

- **Every section's sidebar lists views, and one view shows at a time**, as Government
  Cloud already did. Headings are grouped so each view opens on a chart where the
  section has one:
  - Timeline: The master timeline · Does law follow capability? · What the research found · About this research
  - Government Cloud: Adoption map · Procurement · Investment · Litigation · Capabilities · The research behind this section · Sources
  - Public Health: Suicide around the world · Overdose deaths · Reading the evidence · Dated milestones · Indicators and sources
  - Crime: What the record counts · Homicide · Break-ins · Arrests · Who is held · Reports of the unexplained · Method, limits and sources
- **Every view has an address**, `/research/<section>/<view>`; the first view is also
  the section's own address. A link opens on the view; a refresh keeps it.
- **The four-second loader plays on arriving at a section, not on switching views.**
  Switching views is instant with a short fade (Sean chose this over a loader on every
  switch).

One table: `lib/routes.ts` (`RESEARCH_VIEWS`), read by the routes, the sidebars, the
address bar and the sitemap.

## Rejected

| Option | Why not |
|---|---|
| One view per existing heading | Several headings are a paragraph or a short list; the views would be nearly empty. |
| Views without addresses | A link to the homicide findings would open on the section's first view; a refresh would lose the reader's place. |
| The loader on every view switch | Four seconds on each click between related views. |

## What would change this

A view growing long enough to need its own sub-views, or readers not finding content
that used to be one scroll away (watch view-to-view movement in analytics).
