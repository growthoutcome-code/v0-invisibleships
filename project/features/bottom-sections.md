# Bottom sections — tactics

- **Branch:** `main` (pushed by Sean from GitHub Desktop)
- **Started:** 2026-10-01
- **Status:** In progress — built and tested locally, awaiting push
- **Decision record:** none yet

## Goal

Every page except the home page ends with a way on into the rest of the archive,
built from four of the home page's sections: Journal, Concepts, Research (the
suicide chart) and Glossary. Sean, 1 Oct 2026: "We need to add bottom sections to
each page of the site to promote engagement." His rules:

1. Never a bottom section that repeats the page it sits on.
2. The home sections' extra copy is not carried.
3. They replace the "From the glossary" peek under the journal (and the "From the
   journal" peek under the glossary).

## Approach

- `lib/home-sections.ts` (server) builds the concept slides, glossary slides,
  curated journal quotations and the suicide chart. The home page (`app/page.tsx`)
  and the bottom sections both use it, so a bottom block can never disagree with the
  home section it copies — including the glossary's deliberate order.
- `app/api/bottom-sections/route.ts` serves that data, `force-static`: computed at
  build from the same corpus files, no function call at request time. It is not new
  content and no new corpus path; it is the home page's data in another form.
- `components/BottomSections.tsx` (client) renders the blocks in a fixed order,
  `exclude`-ing the page's own. Each block: eyebrow and question from the home
  section, the visual, one "Go to …" link. Data is fetched only when the reader is
  within a screen of the bottom (IntersectionObserver), once per visit.
- Mounted in `JournalBrowser.tsx` (all SPA pages) and in the three item readers
  (`JournalItemReader`, `ConceptItemReader`, `GlossaryItemReader`).

| Page | Journal | Concepts | Research | Glossary |
|---|:-:|:-:|:-:|:-:|
| Journal (list, entry) | — | ✓ | ✓ | ✓ |
| Concepts (list, concept) | ✓ | — | ✓ | ✓ |
| Glossary (list, term) | ✓ | ✓ | ✓ | — |
| Research (all four) | ✓ | ✓ | — | ✓ |
| Documents | ✓ | ✓ | ✓ | ✓ |
| Author | ✓ | ✓ | — | — |
| Disclaimer, Home | none | | | |

Design choices, each approved by Sean on 1 Oct:

- Journal block uses the home page's curated quotations, not random entry cards.
- Glossary block uses the home page's curated picks, not a random draw.
- Research is left off every Research page, not just Public Health: a chart under a
  page of charts.
- The suicide chart keeps its support line (988 / findahelpline.com) — safety
  information, not disclaimer copy — and the home section's one must-keep fact (the
  WHO basis ends at the US peak; the US has fallen since, to 13.7 in 2024).
- Its heading is the finding ("Suicide is rising in the United States and South
  Korea, while the world's rate fell 27%") rather than "What does the research
  show?", which stacked three titles saying the same thing.
- Motifs (Sean, 1 Oct, after the first build): `carry` directly behind the journal
  quotations and `recede` behind the whole glossary block, placed as the home page
  places them. The page-level motif on the journal and glossary pages stops at the
  top rule of the bottom sections (`PageMotif` clips its own lower edge), and
  neither page shows its own block, so two motions never meet.
- Concepts autoplays off, so two rotating carousels never share a screen.
- Every link click fires `bottom_section_click` with `from` (page) and `block`.

## Acceptance

- [x] Each page shows exactly the blocks in the table (checked on all 14 routes).
- [x] The page's own section never appears.
- [x] The "From the glossary" / "From the journal" peeks are gone (code removed).
- [x] The home page renders unchanged from the shared builders.
- [x] Chart end labels are not cut off (SuicideChart `padR` 128 → 164 on desktop).
- [ ] Live on production after Sean's push.

## Verified / not verified

- Verified locally (Playwright, desktop 1366 and phone 390): block sets per page,
  rendering of all four blocks, no page errors, `npx tsc --noEmit`.
- `/api/bottom-sections` returns 5 quotes, 7 concept slides, 6 glossary slides and
  the chart in `next dev`. **Not verified:** the `force-static` output in a
  production build (`next build` does not fit the sandbox's time limit) — check the
  Vercel build log and the live URL after the push.
- `bottom_section_click` events: written, not yet seen in PostHog.

## Open questions

- Whether the Author page should carry more than Journal and Concepts.

## Notes and gotchas

- The SuicideChart `padR` change also moves the Public Health page's chart: its end
  labels were being clipped there too.
