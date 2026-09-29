# Insights page restructure — tactics

- **Branch:** `main`
- **Started:** 2026-09-29
- **Status:** In progress
- **Decision record:** `project/decisions/0001-measurement-and-privacy.md` for what the
  page is allowed to show; this doc is the layout and source-precedence work on top of it.

## Goal

The page should answer one question on sight: how many people have read this, and
where from. Google Analytics leads because it is the tool the site will be judged
by once marketing starts, and PostHog sits behind it as the second opinion that can
say whether a location is a real reader or one person behind a shuffling exit.

Sean, 28 September: "what we want to lead with are pages. And then underneath
locations for both pages." And on the source split: "we cannot have a two-line chart
that says both... let's lead with Google Analytics in the tabs, and then PostHog
separate."

## The precedence call, and its cost

GA leads. This is a deliberate choice against the more accurate number, and the
reason is worth keeping written down because it will look like a mistake later.

GA reports ~150 sessions where PostHog reports ~22. The gap is almost entirely the
author. PostHog applies a project-level internal-traffic filter (cohort, host, IP,
`is_author is_not_set`); GA's Data API cannot read the author cookie, and its only
exclusion lever is internal-traffic-by-IP, which is useless against a rotating VPN
exit. So GA's headline number counts Sean as a reader and PostHog's does not.

GA leads anyway, for two reasons. It will not silently drop real readers the way an
over-eager filter can, and it is the number anyone else will quote back. But the page
must not imply the two are interchangeable, which is why:

- the downloads tile says "author included" in its own caption rather than relying on
  a page-level line, and
- locations on the GA tab carry no confidence flag, with a line saying where the flags
  live.

## Approach

`app/insights/page.tsx` is the whole layout. `components/InsightsControls.tsx` owns
the tabs and range dropdown. `components/TrafficChart.tsx` is the chart.
`lib/insights-ga.ts` and `lib/insights-posthog.ts` are the two readers.

Section order, identical on both tabs:

    controls → tiles → Pages viewed → Locations → chart → how this is measured → opt-out

Source is a URL param (`?source=`), so the tabs stay plain anchors that work without
JS and the page stays `force-dynamic`. `both` is gone; a legacy `?source=both` falls
through to `ga`.

## The 13 changes

Chrome:

1. Remove the "Measurement" kicker.
2. Headline becomes "Insights"; `metadata.title` with it.
3. Remove the "All time · every figure since the site launched" subline.
4. Remove `MeasurementAlert` from the page and delete the component. The permanent
   "How this is measured" at the foot keeps the caveats.

Tabs:

5. Google first, labelled "Google" — not "Google Analytics". The chart's series label
   has to change with it or the page contradicts its own tab.
6. PostHog second.
7. No "Both".

Google tab metrics:

8. Tile order: Pages viewed, Sessions, Users, Corpus downloads.
9. The downloads tile caption carries "all time, author included".

Layout, both tabs:

10. Pages table moves above the chart.
11. Locations beneath pages. On the Google tab this needs a new `runReport` on
    `city`/`region`/`country`.

Chart:

12. Y-axis gets intermediate ticks on a rounded step. `{[0, max]}` becomes computed
    ticks, so a max of 13 reads 0/4/8/12 rather than 0/13.
13. Single series. The two-series comparison, the legend and the day-union logic go.

Folded in:

14. Each tab fetches only its own source. Six parallel fetches currently run on every
    load regardless of tab.

## Acceptance

- [ ] `/insights` opens on the Google tab with no query string.
- [ ] No text anywhere on the page reads "Measurement" or "Google Analytics".
- [ ] The headline reads "Insights" and there is no subline under it.
- [ ] The Google tab's first tile is Pages viewed; the fourth is Corpus downloads and
      its caption says the count includes the author.
- [ ] Both tabs show, in this order: tiles, Pages viewed, Locations, chart.
- [ ] The chart's y-axis shows at least three labelled values, and the top one is a
      round number at or above the series maximum.
- [ ] The Google tab's locations table lists cities and says where the relay flags are.
- [ ] `?source=both` loads the Google tab rather than erroring.
- [ ] The Google tab issues no PostHog request; the PostHog tab issues no GA request.
- [ ] `npx tsc --noEmit` and `npm run check` both clean.

## Steps

- [x] Write this doc.
- [x] 1–4, chrome. `MeasurementAlert.tsx` deleted; its now-orphaned `fadeIn` keyframes
      removed from `app/globals.css`.
- [x] 5–7, tabs. `toSource()` and `DEFAULT_SOURCE` now live in `InsightsControls.tsx`
      so the page resolves `?source=` against one constant.
- [x] 8–9, GA tiles.
- [x] 10–11 layout and the GA locations report.
- [x] 12–13, chart. `axisTicks()` exported and guarded.
- [x] 14, fetch trimming — `loadPostHog()` gathers the PostHog tab's five queries so the
      Google tab can skip all of them.
- [x] Typecheck and guards.
- [ ] Review the rendered page at localhost.
- [ ] Commit.

## Verified / not verified

**Verified by machine.** `npx tsc --noEmit` clean. `npm run check` clean, now including
`scripts/check_axis_ticks.mts` — 505 axis scales from 0 to 250,000 against five
invariants (starts at zero, integers only, strictly increasing, top tick at or above the
peak, 3 to 7 ticks). That guard was mutation-tested four ways, all four caught:
dropping the integer clamp, flooring the top tick instead of ceiling, starting the axis
at the first step instead of zero, and asking for ten times too many ticks. The file was
restored byte-for-byte afterwards and the guard re-run.

**Found by that guard on its first run**, before any of it reached the page: a peak of 1
produced a step of 0.5, and rounding the labels turned `[0, 0.5, 1]` into `[0, 1, 1]` —
two gridlines at different heights carrying the same number. The step is rounded now
rather than the labels.

**Not verified.** Nothing on this page has been seen rendering with live data. The
numbers themselves cannot be exercised from the sandbox, which cannot reach PostHog or
the GA Data API, so both readers are still only read rather than run. Specifically
unproven: the GA locations report returns what its dimensions promise; the corrected
`users` total agrees with the GA dashboard; `?source=both` lands on the Google tab.

Standing note on verification for this repo: `npx tsc --noEmit` and `npm run check`
are the checks to run. **Do not run `npm run build` on Sean's machine.** On
29 September a backgrounded `npm run build` overwrote `.next` while his dev server was
serving out of it, truncating `react-loadable-manifest.json` to 2 bytes and removing
`BUILD_ID`. The site lost its CSS and navigation and read as completely broken. The
fix was `rm -rf .next` and a dev restart. Vercel builds on push; there is no reason to
build locally.

## Open questions

- Whether the GA locations table should rank by sessions or by pageviews. Starting
  with sessions, since the table answers "how many people" rather than "how much
  reading".
- Whether PostHog should become the default tab once the author exclusion is trusted
  enough that its number is believable rather than merely smaller.

## Notes and gotchas

- **`users` was wrong, and is the reason to distrust any GA figure this page derives by
  arithmetic.** The tiles summed `totalUsers` across the daily rows. `totalUsers` is not
  additive — somebody reading on Monday and again on Thursday is one user and two daily
  rows — so the page reported more users than GA's own dashboard did for the same window.
  Fixed by asking GA for the range with no `date` dimension, which is the only way to get
  the de-duplication, since only GA holds the identity behind it. Any future metric added
  here needs the same question asked of it: is this additive across days, or not?
- A literal `\u2014` was sitting in JSX text in the IP-rotation paragraph, rendering as
  those six characters rather than an em dash. In JSX children that is not an escape. Use
  the HTML entity, or a real character, and never a JS escape in text position — it works
  inside a `{"..."}` expression and fails silently outside one, which is why it survived.

- The corpus-downloads tile is deliberately the **all-time unfiltered** count. It read
  0 for weeks while 18 downloads sat in PostHog, because it showed the post-filter
  figure and every one of those downloads was the author's. A transparency page whose
  download counter says nothing while downloads have happened reads as "nobody wants
  this", which is a different and false claim. Hence the count plus an honest caption.
- `?source=` and `?range=` are what make this route dynamic. Keep `force-dynamic`
  explicit anyway; a future refactor that drops a searchParam would otherwise start
  serving a cached page of stale numbers.
- GA returns dates as `YYYYMMDD` and omits days with no traffic. PostHog includes them
  as zero. With the two-series union gone, the single-series path still has to
  tolerate gaps in the GA day list.
