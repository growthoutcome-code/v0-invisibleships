# Glossary tiles — tactics

- **Branch:** `main`
- **Started:** 2026-10-01
- **Status:** Reversed the same day: tiles undone, sidebar enlarged (decision 0014)
- **Decision records:** `0013` (tiles, superseded) and `0014` (wide sidebar, current)

## Goal

Readers can scan the whole glossary at a glance and open any term. The page no
longer looks like a cramped list.

## Approach

- **`components/GlossaryTile.tsx` (new).** In the Concepts tile family. Each tile
  has:
  - the term's topics as labels;
  - the term (h3) and its pronunciation;
  - a three-sentence summary;
  - "Read →", with share in the corner.
- **`components/JournalBrowser.tsx` → `GlossaryList`.** All shown terms, grouped by
  first letter under h2 letter headings, with the A–Z jump strip. Pagination is
  removed. `GlossarySection` renders the SideNav only when a term is open.
- **The summary** is `firstSentences(cleanDef(body), 3, 420)` with dictionary sense
  colons removed and each sentence capitalised.
- **`lib/glossary-format.ts`.** `firstSentences` no longer treats a full stop
  without a following space as a sentence end. That fixed:
  - "brain.space" and the decimals "0.65", "17.4 kHz", "$42.9bn", "26.2%";
  - one home page slide, whose eyesight is it, which now shows the whole
    "$42.9bn" sentence instead of the fragment "9bn across 27 awards…".

## Acceptance

- [x] 56 tiles on one page, A to Z, under letter headings, at 1440, 900 and 390 wide.
- [x] The A–Z strip jumps to a letter; letters with no terms are muted and disabled.
- [x] A tile opens its term page, and that page keeps the sidebar.
- [x] No tile summary starts with or contains a dictionary ": ".
- [x] `tsc --noEmit` and `npm run check` pass.
- [ ] Sean reviews it live.

## Verified / not verified

Verified in the local dev server with headless Chromium:
- screenshots at desktop, tablet and phone;
- the letter jump to S;
- opening tinnitus from a tile;
- no page errors.

Every glossary and concept slide body was compared before and after the cutter
fix; only the decimal and brain.space cases changed.

Not verified: the live site, and Filter or Sort on the new layout. Their code is
unchanged and they feed the same list.

## Reversal, 1 Oct 2026

Sean undid the tiles and asked for a sidebar at least 25% wide, with type 15 to
20% larger and more room beside it. Changes:
- `GlossaryTile.tsx` is deleted.
- `GlossaryList` is back to the list.
- `SideNav` gains `large`: 16.5px entries and a 14px label.
- The Glossary grid is `minmax(15rem,25%)` wide with a 4rem gap.

Verified at 1440px in headless Chromium. The decimal fix in `firstSentences`
stays.
