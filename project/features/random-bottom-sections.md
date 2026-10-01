# Random bottom sections — tactics

- **Branch:** `main`
- **Started:** 2026-10-01
- **Status:** Ready to push
- **Decision record:** `project/decisions/0011-random-bottom-sections-from-a-pool.md`

## Goal

The bottom sections under every page show a different mix each time, drawn from a
small vetted pool, while the home page stays exactly as it is.

## Approach

- `lib/bottom-picks.ts` (new): six candidates each for Journal, Concepts and
  Glossary, three research charts, `BOTTOM_SHOW = 4`.
- `lib/home-sections.ts`: `conceptSlides()` and `glossarySlides()` take an optional
  picks list that defaults to the home picks; `bottomSectionsData()` now builds the
  bottom pools instead of the home content, and blanks quote locations.
- `components/BottomSections.tsx`: when the data arrives, picks 4 of each pool in
  random order and 1 chart. Homicide and break-ins are fetched from the existing
  `/data/crime/charts/*.json` only when picked, and render with `IntlLineChart`;
  clicking a line goes to that Crime page.

## Candidates

| Section | Pool |
|---|---|
| Journal (all 10 shown, random order) | Threats: 27 Feb 2025 (terrorist attack claim), 23 Aug 2025 R06 (euthanization list), 27 May 2025 ("I will never release you"), 17 Jul 2025 R05 (nuclear threat), 4 Mar 2025 morning ("here to punish someone"). Typed as they speak: 11 Jun 2025 ("kill him myself if he doesn't stop typing"), 6 Nov 2025 3:45am (the Moderna exchange). Technology: 29 May 2025 ("this is not technology" / "it's technology"), 9 Sep 2025 R03 (consent), 10 Jul 2025 R02 ("fancy high-powered phone") |
| Concepts (Concepts page tiles, two up, full page width; 3:2 cards on desktop, 480px on a phone, text filling each card; all 20 per visit, random order) | only-you-can-hear-it, can-you-record-it, who-owns-neural-data, explanation-is-part-of-the-harm, co-occurrence-is-not-cause, everyone-around-a-target, the-neurotech-bullhorn, low-number-may-mean-low-counting, prescribing-is-not-prevalence, ruin-first-then-rescue, attack-to-force-acknowledgment, denver-acoustic-weapons, made-into-assets-unknowing, no-private-thinking-space, nonsurgical-by-design, what-it-would-take, contractors-killed-and-freed, who-profits-from-a-body, children-wearables-and-rf, how-protected-is-your-medical-record |
| Research | suicide (unchanged block), homicide against the world, break-ins |
| Glossary | chilling-effect, no-touch-torture, parametric-array, phantom-sensations, presbycusis, targeted-individual |

Journal rules (Sean, 1 Oct 2026), built by `lib/bottom-quotes.ts`:
- Every passage cut by the home page's own cutter (anchored, verbatim, timecodes
  out, name removed). Layout only on top: "From the distance" / "From the
  author", never the same label twice in a row; each distance statement on its
  own line in quotation marks; an author turn as one quoted paragraph, skipped
  lines marked "…"; speaker tags (Male #1, Female) dropped; a sentence split
  across transcript lines joined; a quotation the record never closes, closed.
- A meta line with time and place under the date (from the entry header or the
  recording; the 6 Nov location is Sean's, 1 Oct 2026).
- Questions from the record first (6 of 10), otherwise Sean's wording.
- A critical-disclaimer link under every slide. The set deliberately includes
  passages the home page's rules exclude.

Not recorded, so not shown: any reply to the 4 Mar 8:09am line.

## Acceptance

- [x] Home page data byte-identical before and after (md5 of quotes, concept and glossary slides).
- [x] `app/page.tsx` untouched.
- [x] Every bottom carousel shows "1 / 4"; repeated loads show different first slides and charts.
- [x] No page shows its own section; Home and Disclaimer show none.
- [x] Journal (list and entries) shows Concepts and Glossary only: no research chart (Sean, 1 Oct 2026).
- [x] Concepts shows all 20, two up, random order: "1 / 10" on desktop, "1 / 20" on a phone.
- [ ] Sean reviews the journal excerpts and questions.

## Verified / not verified

Verified in a local dev server with headless Chromium (desktop 1366 and phone 390):
Journal, Concepts, Glossary, Research Crime and Public Health, Documents, Author, a
concept page, a glossary term page, Home. No page errors (only blocked external
requests from the sandbox). All three charts rendered; the phone homicide chart uses
the Crime page's existing bar view. `tsc --noEmit` and `check_no_name_lists.py` pass.

Not verified: a production `next build` (too long for the sandbox) and the live site.
