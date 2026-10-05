# 0018 — How often does the gate show?

- **Status:** Accepted
- **Date:** 2026-10-04
- **Supersedes:** none (earlier rules lived only in code comments; history below)

## The question

The entry gate carries the content warning, the perceptual set and the Critical
Disclaimer. How often should a returning reader on the same device meet it?

## Decision

**On the first visit, and then once every 30 days.** Passing the gate stores
the time on the device. For 30 days (`GATE_REPEAT_DAYS` in `lib/gate.ts`) the
reader goes straight in; after that the gate shows once more and the clock
restarts. The gate is mandatory: only entering closes it (see the amendment below). Bumping `GATE_VERSION` still shows it to everyone at once.

Sean, 4 Oct 2026: "make sure the gate only fires the first time you visit. And
maybe every week thereafter." Amended the same day: "make sure the gate only
opens once every 30 days." The interval went from 7 days to 30.

## Why

- The rule has moved three times, each for a real reason:
  - 20 Aug to 30 Sep: once per browser session. Readers met the full gate
    again in every new session.
  - 30 Sep: first visit only, remembered forever ("make the gate only show up
    on the first visit").
  - 3 Oct: every visit to the home page, temporarily, so the new gate changes
    could be seen ("until we get the gate changes worked out").
- First visit only meant a returning reader never saw the disclaimer again,
  and a shared computer never showed it to the next person. Thirty days keeps
  it in front of regular readers without stopping them every week.
- The disclaimer is also under every page of content (`StandingDisclaimer`),
  so the gate does not have to carry it alone.

## Rejected

| Option | Why not |
|---|---|
| Every visit, or every home-page visit | The 3 Oct stopgap. It stops regular readers every time and inflates `gate_opened` counts |
| First visit only, forever | A returning reader never sees the disclaimer again |
| Once per browser session | Most returning visits are new sessions, so it was close to every visit |
| A cookie set by the server | Same effect as localStorage, plus a cookie to explain; the gate is a client component already |

## Consequences

- Devices that passed under the old rule stored "1" with no date. They meet the
  gate once more after this ships, then follow the 30-day rule.
- `gate_opened` counts for 3 and 4 Oct are inflated by the every-home-visit
  rule. From 4 Oct, a regular reader adds one `gate_opened` every 30 days.
- Private browsing and blocked storage still show the gate on every load, as
  before.

## What would change this

Gate wording that must reach everyone at once (bump `GATE_VERSION`), a legal
requirement to show the terms on every visit, or evidence that the 30-day gate
drives regular readers away (a fall in returning visitors after a gate week).

## Amendment, 4 Oct 2026: outside clicks on the home page

On the home page (`/`), a click outside the gate card no longer closes it; the
gate stays until the reader enters. On every other page an outside click still
closes it (that is not a pass). Escape still closes it everywhere, because a
keyboard user needs a way out of a modal. Sean: "make sure that if you click
outside the gate, it does not shut the gate on the home page."

## Amendment, 4 Oct 2026 (evening): the gate is mandatory

Sean: "That gate is mandatory." Nothing closes the gate except entering it: not Escape, and not a click outside the card, on any page. The session memory of a closed gate (`is_gate_dismissed_<version>`) is gone, so only a pass (stored for 30 days) skips it. Keyboard users move through the steps with Tab and Enter. This replaces the outside-click amendment above.
