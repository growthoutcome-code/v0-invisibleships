# 0015 — May the News page filter and chart by publisher and country?

- **Status:** Accepted
- **Date:** 2026-10-02
- **Supersedes:** none. This is a scoped exception to the rule in data-rules §2 and
  CLAUDE.md §6: no lists of organizations or names as tags, filters, facets or
  pages.

## The question

The News page lists outside reporting and official releases, with a chart panel
and filters. Two of the natural views are "Where from" (the publisher) and
"By country" (the foreign state an official release names). Both are lists of
organizations or states, which the standing rule forbids.

## Decision

Allowed **on the News page only**, as tabs and filters:
- the **publisher** of an item (a news outlet, the Justice Department, the WHO, …);
- the **country** an official release names.

Sean, 2 Oct 2026: "Publishers and country are okay as tabs and filters."

Still forbidden everywhere, including News:
- filters, tags or facets by company, agency or person named **in** an item: the
  defendants, the companies under contract, the people in a story.

## Why

- The rule exists because the names in the record are likely false in most cases,
  and a list would repeat the defamation tactic the site documents. A publisher is
  the author of the item, not its subject, and is accused of nothing.
- Country is the state named by the official source itself (for example, "acting
  as an agent of the People's Republic of China"). Filtering by it repeats the
  source's own attribution, not the archive's.

## Rejected

| Option | Why not |
|---|---|
| No publisher or country views at all | Loses "where is this coming from" and the China, Russia and Iran split Sean asked for. |
| Filters by organization or person named in an item | The exact harm the rule prevents. |
| Extending the exception to other sections | No case has been made; the rule stands elsewhere. |

## Consequences

- `scripts/check_no_name_lists.py` needs a narrow allowance for the News
  `publisher` and `country` fields, and nothing else.
- Country labels must come from the official source's own wording, never be
  inferred.

## What would change this

A publisher or country view being used, or read, as an accusation, such as a
country filter shown over items that are not official releases.
