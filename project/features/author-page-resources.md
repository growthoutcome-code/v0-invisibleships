# Author page: resources from Part 01 — tactics

- **Branch:** `author-page-resources`
- **Started:** 2026-09-29
- **Status:** In progress
- **Decision record:** none. The scope choices are Sean's content calls, recorded below.

## Goal

The author page gives readers a factual picture of who compiled the archive: his work, training, volunteering and vaccination history, with links they can check for themselves.

## Approach

- The content comes from the "Sean Harris Resources" list in the Appendix of the Part 01 Google Doc, from Professional through Volunteering, plus a Covid-19 vaccination section Sean added.
- All copy lives in `AUTHOR` in `lib/site-content.ts`, as typed plain data (`sections[]`).
- `AuthorView` in `components/JournalBrowser.tsx` renders it.
- `scripts/export_site_content_md.mjs` writes the same sections to `meta/IS_META_author-statement.md`.

Scope set by Sean, 29 Sep 2026. Do not add these back without asking him:

- **Left out:**
  - Everything after Volunteering in the source list: the post-vaccination infection albums, the YouTube and Bonfire links, and the doctor letter.
  - The Telepathy, Neuralink and Faraday appendix lists.
  - Background, "Read first" and the Introduction material.
- **Drug test link left out** for now. Sean is deciding what to reveal ahead of social media marketing.
- **Contact line removed** from the page.
- **Bio rewritten.** It now leads with the professional background and drops "displaced", "request for life-saving assistance" and "neuro-tech terrorism". The summary paragraph is unchanged.
- **Vaccination dates are from memory.** Moderna 2021, Pfizer booster 2022, noted "*Confirmed dates and batch numbers to come". The booster year may be 2021: boosters were authorized in Sep–Oct 2021, and Part 01 places the infection in 2021, after a booster.
- **Intro line above the sections** (Sean's choice, 29 Sep) explains why the background is there. Damaging a reputation is described as a documented part of Zersetzung tactics, in general terms with no accusation, which keeps it inside the Critical Disclaimer. The term links to `/glossary/zersetzung-tactics`, in the same tab.
- **Record-lookup links go to official government pages only** (CDC, Colorado, Oregon). Third-party record sites are not used.

## Acceptance

- [x] Every outside link opens in a new tab with `rel="noopener noreferrer"`. Checked in headless Chromium: 13 of 13. (Muay Thai carries two links, TFW and Easton, added 29 Sep.)
- [x] Every URL resolves to the intended page. Checked 29 Sep. The Spartan URL was updated to `www.spartan.com` because the old host redirects. LinkedIn only shows an auth wall to a logged-out fetch, so it was confirmed by search index.
- [x] No horizontal scroll at 390px or 1400px.
- [x] `npm run corpus` and `npm run check` pass.
- [ ] Preview deployment reviewed.
- [ ] Production live.

## Verified / not verified

- **Verified (headless Chromium on `next dev`):** the rendering and link attributes described above.
- **Verified (`npm run check`):** the exported MD matches the site.
- **Not verified:** that the `author_link_opened` PostHog event lands. It is written, not exercised. Test clicks ran with `?analytics=off`.

## Open questions

- The confirmed vaccination dates and batch numbers.

## Notes and gotchas

- `AUTHOR` must stay evaluable as plain JS: the exporter lifts the object literal and runs it. Put types on the declaration (`AUTHOR: AuthorInfo`). An `as` inside the literal breaks the export.
- The dead-looking reference to `IS_META_about-author.md` in the author statement is fine. That file ships inside the zip under `meta/`.
- Stopping the dev server with `pkill -f "next dev"` from the same shell kills that shell too. Kill it by PID.
