# Gate on phones, and a welcome for readers in other languages — tactics

- **Branch:** `gate-mobile-and-welcome`
- **Started:** 2026-10-03
- **Status:** Ready to merge (Sean commits and pushes)
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
