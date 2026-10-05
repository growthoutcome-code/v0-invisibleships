# Gate on phones, and a welcome for readers in other languages — tactics

- **Branch:** `gate-mobile-and-welcome`
- **Started:** 2026-10-03
- **Status:** First part merged (950610b, 3 Oct). Second part (below) ready for Sean to commit
- **Decision record:** `project/decisions/0017-readers-in-other-languages.md`

## Goal

A reader on a phone can see how to go on from the first screen of the gate, and
a reader whose browser is set to another language is told, in that language, how
to read the archive: download the corpus and translate the files, or let the
browser translate the pages. Translating the pages must not break the site.

## Approach

- `components/EntryGate.tsx`
  - On phones the card is the screen's height (`gate-card` in `app/globals.css`),
    so Back and Continue stay pinned and only the step's text scrolls. From `sm`
    up nothing changes.
  - Focus opens on the title, not the first answer to the optional question.
  - Back is invisible on step 1 but keeps its place.
  - The disclaimer box loses its `max-h-[52vh]` cap (the card bounds it now) and
    reads at 16px on phones, 17px above `sm`, instead of the site-wide 22px.
  - Step 1 shows the corpus line in English, or the note in the browser's
    language, below the content warning. Event `gate_language_welcome_shown`
    with `welcome_language` when the note is shown.
- `lib/gate-languages.ts`: the English line, 11 notes (Chinese simplified and
  traditional, Spanish, French, German, Portuguese, Japanese, Korean, Russian,
  Arabic, Hindi) and `welcomeFor()`, which reads only the first browser language.
- `components/CopyrightTerms.tsx`: in the gate variant only, the disclaimer's own
  heading is not printed under the identical step title.
- `app/layout.tsx`: an inline head script that stops browser translators from
  crashing React (Chromium issue 41407169).

## Second part, 3 Oct afternoon (Sean's requests)

- **Gate on every home-page visit, for now** (turned off 4 Oct; see the fourth part). `GATE_ON_EVERY_HOME_VISIT` in
  `EntryGate.tsx`. A device that had passed the gate once never saw the new one,
  which is why the morning's changes were not visible. Other pages keep the
  first-visit rule. While it is on, `gate_opened` counts home visits.
- **A click outside the card, or Escape, closes the gate.** Not recorded as
  passed; remembered for the tab's session (`is_gate_dismissed_v2` in
  sessionStorage) so it does not reopen page after page, and it returns on the
  next visit. Event `gate_dismissed` with `gate_step`. This reverses the 15 Sep
  rule that only the last step's button closed the gate (Sean, 3 Oct).
- **Five more languages:** Persian (right to left), Turkish, Vietnamese,
  Indonesian (also the old `in` code), Italian. 16 in all, all AI-drafted.

Verified with Playwright, desktop and 375x667 phone: a click on the card does
not close it; a click or tap on the dark area does; Escape does; nothing is
recorded as passed; the next page and a reload stay closed in that tab; the
home page opens it again; Persian, Italian and Vietnamese notes render, Persian
right to left. `npm run check` and `tsc` pass.

## Third part, 3 Oct late afternoon: a download button in the note

- Each of the 16 notes now carries a download button with its label in that
  language (Sean: "make sure the button is translated"), and the notes say
  "below" instead of "once inside, use Corpus for AI". The English line for
  English browsers is unchanged and has no button.
- Same route as the export dialog, `/api/corpus?from=gate_welcome`, so
  `entry_point` tells the two apart; click event `export_downloaded` with
  `from: gate_welcome` and `welcome_language`.
- The box keeps the note's direction, so in Persian and Arabic the button sits
  on the right. The size (".zip · 3.9 MB", from `CORPUS_SUMMARY`) sits beside the
  button in its own left-to-right run.

Verified at 360x740 in Persian, Arabic, French, Chinese (Taiwan), Hindi and
German: the button fits the box (French and German overflowed until the size
moved out of it), Persian and Arabic place it on the right, a click downloads
`invisible-ships-corpus.zip` and leaves the gate open, no errors, English shows
no button. `npm run check` and `tsc` pass.

## Fourth part, 4 Oct: first visit, then weekly

- `GATE_ON_EVERY_HOME_VISIT` is now false. Sean: "make sure the gate only fires
  the first time you visit. And maybe every week thereafter."
- `lib/gate.ts` stores the time of the pass instead of "1"; the gate shows again
  after `GATE_REPEAT_DAYS` (7). Old "1" values meet the gate once more.
- **Same day, changed to 30 days.** Sean: "make sure the gate only opens once
  every 30 days." `GATE_REPEAT_DAYS` is now 30.
- **Home page: an outside click no longer closes the gate.** Sean: "make sure
  that if you click outside the gate, it does not shut the gate on the home
  page." On `/` the gate stays until the reader enters; on every other page a
  click outside still closes it. Escape still closes it everywhere, as the
  keyboard way out.
  Decision record `0018`.
- Shipped in the same commit as the home animation update (the seated figure is
  now a woman with a ponytail).

Verified with Playwright on the dev server: a fresh device sees the gate; after
entering, a reload and the home page do not show it; with the stored time moved
8 days back it shows again; an old "1" value shows it; Escape keeps it closed in
that tab and a new tab shows it again.

## Acceptance

- [x] On 360x740, 375x667 and 390x844, Continue is on screen when the gate opens, on every step.
- [x] Nothing looks selected when the gate opens; focus is on the title.
- [x] The disclaimer title appears once; Enter stays locked until the end is reached, then enters.
- [x] English browsers see the English line; zh-CN, zh-TW, ar, es see their note; Arabic reads right to left; Italian (no note) sees the English line.
- [x] Under a simulated translator, the News page survives sorting, filtering and tab changes.
- [x] `npm run check` and `tsc --noEmit` pass.
- [ ] Sean tries the gate on his own phone after deploy, and translates a page in Chrome.

## Verified / not verified

Verified on 3 Oct, in a local dev server with Playwright (Chromium):

- All acceptance rows above except the last, at the sizes and languages listed.
- Translator simulation (every text node replaced with `<font>` wrappers, as
  Chrome does): **without the guard, changing the News sort blanked the page
  (12 errors, no text left); with it, no errors and the page intact.** The gate
  itself completed under the same simulation either way.

Not verified:

- Real Chrome, Edge or Safari translation (the simulation follows Chrome's
  documented behaviour, but it is a simulation).
- Real iOS Safari and Android Chrome. `dvh` falls back to `vh` where missing.
- That `gate_language_welcome_shown` reaches PostHog and GA: the tests ran with
  analytics off. The call is the same `track()` every other gate event uses.
- The translations: **AI-drafted, unreviewed.** See the header of
  `lib/gate-languages.ts`.

## Open questions

- Whether to have a native speaker check the 11 notes before marketing abroad.

## Notes and gotchas

- `innerText` of a `visibility: hidden` element is empty. Tests looking for the
  invisible Back button must use `textContent`.
- The page behind the gate has its own `role="region"`; scope test selectors to
  `[role=dialog]`.

- **Same evening: the gate is mandatory.** Sean: "That gate is mandatory." Escape and an outside click no longer close it on any page, and the tab-session memory of a closed gate is removed. Only entering closes it. Decision 0018, amended.
