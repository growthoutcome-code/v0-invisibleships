# 0005 — Where do search and filters live on the Journal and Concepts, and how are concepts shown?

- **Status:** Accepted
- **Date:** 2026-09-30
- **Supersedes:** the 26 Aug 2026 toolbar arrangement (search always visible, filters behind a panel), recorded only in the old `ConceptsToolbar.tsx` header comment

## The question

Both list pages had a toolbar strip above the list: an always-visible search box, a
Filter button, a count, and pills. Concepts also rendered all 40 concepts in full on
one page with a side rail of titles. Sean asked for concepts to be truncated and
paginated, and then whether the search box and pills could move into the panel,
leaving only Filter and Sort beside the page title — on both pages.

## Decision

- **Beside the page title:** a Sort menu and a Filter button (with a count of what
  is on). Nothing else.
- **Filter panel** (right side, 480px on wide screens, full width on phones): the
  search box at the top, every filter group, and a pinned "Show N" / "Clear all".
- **One line above the list, only while something is on:** "N of M", the search
  term and every filter as removable pills, and "Clear all". Not rendered when
  nothing is on.
- **Concepts** become tiles, two across (one on phones), twelve to a page, with no
  side rail. Each tile opens the concept on its own page, `/concepts/<id>`. Old
  anchors (`/concepts#<id>`) forward there. Sort: Default order, Documented first,
  A–Z.
- The Journal keeps its list layout and its Months rail; only the controls change.

Shared code: `components/ListControls.tsx`, `components/Pager.tsx`,
`components/ConceptArticle.tsx`, `app/concepts/[id]/page.tsx`.

## Why

- Sean, 30 Sep: "Concepts need to be truncated and the page itself needs pagination";
  "moving the search input and active chips/filter items all into the panel… all we
  have is the filter button and a sort button next to it"; "the journal should get
  the same treatment with the exception of the tiles."
- A concept runs 313–2,004 characters plus evidence, questions and references.
  Truncating in place leaves a long page of half-read text; a tile shows what decides
  whether to read on (origin, basis, title, opening lines, topics).
- Concepts are linked and cited from the home page, Public Health, Crime and outside
  the site, so the full text needs an address — the same reason the disclaimer keeps
  its own page rather than living only in a modal.

## Rejected

| Option | Why not |
|---|---|
| Pills inside the panel only | A reader who closed the panel, or arrived on a filtered link (the Research hero's "Start with…"), sees a shorter list with nothing saying why. The one-line summary outside the panel is the condition for hiding search at all. |
| Search box always visible (26 Aug arrangement) | Sean chose the quieter title row. The cost — search is one click away — is accepted; the summary line keeps an active search visible. |
| Controls in a narrow block (15–25%) beside the title | The search box shrinks to "Search…", Filter to an icon, and pills still need their own row. |
| Truncate concepts in place with "Read more" | Still one long page; expanded concepts have no address. |
| Open the full concept in a side panel | Cannot be linked, cited or indexed. |
| Keep the concept side rail | With tiles, search, filters and page numbers it had nothing left to do. |

## Consequences

- Search is one click further away on both pages. Watch `filter_opened` against
  searches; if readers stop searching, revisit.
- 40 new URLs (`/concepts/<id>`), added to the sitemap. Old anchors keep working
  through a client-side forward, so they cost one extra hop.
- Links inside concept text (lib/concepts.ts `references`) still read `/concepts#…`,
  because that text is also in the download and Supabase; they are rewritten to
  `/concepts/…` only when rendered.
- The Concepts filter state moved from DataView to JournalBrowser, because the title
  band that holds the controls is rendered there.

## What would change this

Evidence that readers do not find search (few `filter_opened` events relative to
visits, or searches falling after the change), or a request for a search-first
landing on either page.
