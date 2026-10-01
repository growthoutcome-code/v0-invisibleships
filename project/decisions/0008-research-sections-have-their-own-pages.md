# 0008 — Research sections have their own pages

- **Status:** Accepted
- **Date:** 2026-09-30

## The question

Research had grown to four bodies of work (Timeline, Government Cloud, Public Health,
Crime) under one menu item and one title. Sean: "I think we need sub-navigation menu
items under the research main menu item due to the sheer volume of data."

## Decision

- **Addresses:** `/research/timeline`, `/research/government-cloud`,
  `/research/public-health`, `/research/crime`. `/research` goes to Timeline. The old
  `/data` and `/data/<section>` addresses redirect permanently (next.config.mjs). Only
  the three old section slugs redirect: `/data/tables/…` and the other data files the
  charts load must keep serving.
- **Menu:** Research opens a sub-menu of the four (hover or keyboard focus on desktop;
  indented under Research on phones). The word Research still opens Timeline.
- **Title:** a small "Research" label, then the section's own H1: The record over time,
  The government cloud record, The public health record, The crime record.
- **The section row** (Timeline · Government Cloud · Public Health · Crime) stays under
  the heading: on phones the menu is behind a button, and the row is the quickest way
  across.
- **Sidebars:** Timeline, Public Health and Crime keep their "on this page" outlines.
  Government Cloud's sidebar picks its views one at a time (Adoption map, Procurement,
  Investment, Litigation, Capabilities), then the research behind it and Sources; the
  report's own tab row is hidden.

One source for all of it: `lib/routes.ts` (`RESEARCH_SECTIONS`), read by the pages, the
menu, the footer, the sitemap and the address bar.

## Rejected

| Option | Why not |
|---|---|
| All five Government Cloud views stacked on one page, with an outline sidebar | A very long page; the report was built to show one view at a time. |
| Dropping the section row now that the menu lists the sections | On phones the menu is hidden behind a button. |
| Keeping `/data/...` addresses | Sean chose `/research/`. Redirects keep every shared link working. |

## What would change this

A fifth section, or Government Cloud views needing their own addresses
(`/research/government-cloud/procurement`) to be shared directly.
