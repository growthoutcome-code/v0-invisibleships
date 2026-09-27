# Visit trust labels — tactics

- **Branch:** `main` (small enough not to branch; split out if it grows)
- **Started:** 2026-09-27
- **Status:** In progress
- **Decision record:** `project/decisions/0002-visit-trust-labels.md`

## Goal

Every visit on `/insights` says whether it actually came from the place it reports.
Four labels — Confirmed, Probable, Relay detected, Automated — and one location string
whose precision matches the label: a city when that can be stood behind, a time zone
when a relay is in the way.

## Approach

Pure PostHog. Four properties it already collects: `$geoip_city_name`,
`$geoip_time_zone`, `$timezone`, `$geoip_accuracy_radius`.

- `lib/visit-trust.ts` — `classifyVisit(signals)` returns `{ confidence, place, why }`.
  Pure, no I/O, no dataset.
- `lib/insights-posthog.ts` — HogQL grouping visits by those four properties.
- `app/insights/page.tsx` — headline tiles, a donut of the four labels, then the
  locations table.
- Raw signals (IP city, both time zones, radius) move behind the "How this is
  measured" dialog as evidence, not onto the face of the page.

## Acceptance

- [ ] A visit through Sean's VPN reads **Relay detected** on the live site *(needs deploy)*
- [ ] A visit from his normal connection reads **Confirmed** or **Probable** *(needs deploy)*
- [x] No location renders without a label
- [x] A relayed row shows a time zone, never a city — guarded, and the guard was
      mutation-tested
- [x] `/insights` matches the width of the header and footer at desktop size
- [x] `npm run check` passes (five guards)

## Steps

- [x] `lib/visit-trust.ts` with the four labels and the honest place string
- [x] `scripts/check_visit_trust.mts`, fixtured on real production rows, mutation-tested
- [x] PostHog query for labelled visit groups (`getVisitGroups`, HogQL + `{filters}`)
- [x] Page width: full width with `lg:px-[100px]`, matching Header/Footer
- [x] Donut chart, inline SVG, no charting dependency
- [x] Layout: tiles → donut → locations → pages → downloads
- [x] Opt-out moved to the bottom of the page, destructive styling
- [x] Retire the `gate_events` locations read; `network_type` stays on the tables
- [ ] Push, then `POSTHOG_PERSONAL_API_KEY` into Vercel *(Sean)*
- [ ] Live proof: one normal visit, one through the VPN *(Sean, 2 min)*
- [ ] ASN labels via iptoasn, to close the same-time-zone gap *(deferred)*

## Verified / not verified

**Verified:**

- The finding, by direct query against real events. The counts in `0002` are measured.
- The production query, run through the PostHog API with
  `filters: { filterTestAccounts: true }` — confirmed that HogQL accepts the project's
  own internal-traffic filter, so these numbers stay consistent with the tiles above
  them instead of hand-rolling the author exclusion.
- `classifyVisit()` against 12 cases whose fixtures are **real production rows**,
  including the null city and the 1000 km radius, both of which occur.
- The guard genuinely fails when the logic breaks. Two mutations: treating disagreeing
  clocks as agreement, and printing the relay's own city. **The first attempt at the
  second mutation silently did not apply and the guard "passed" — a no-op test that
  proved nothing.** Caught and redone. Worth remembering: a mutation test that cannot
  be shown to fail is not a test.
- Server-rendered output contains the donut, the confirmed tile, the locations table,
  the new width class and the opt-out section.

**Not verified, and not verifiable from here:** that the data path returns anything on
a real page load. **The development sandbox cannot reach PostHog or Supabase**
(`getaddrinfo EAI_AGAIN us.posthog.com`), so every local render is against empty data.
Sean's own machine can reach both, so `npm run dev` there shows real numbers. Live
behaviour is proven on the deployed site or not at all.

## Open questions

- **For Sean:** leave `anonymize_ips` off? It is currently off, which is why `$ip`
  exists. Leaving it off keeps ASN classification and retroactive analysis possible;
  turning it on kills both and also disables the `$ip` regex in the internal-traffic
  filter. Recommendation: leave it off.
- Should browser time zone become an *additional* author-exclusion signal? A Mountain
  time browser plus a relayed address is almost certainly Sean, and it would catch what
  the IP regex misses. It would also exclude a genuine Denver reader. Not decided.

## Notes and gotchas

- `cd X && cmd &` backgrounds the whole compound, so the `cd` never applies to the
  outer shell. Cost ten minutes.
- A dev server does not survive between `device_bash` calls; start it and curl it in
  the same call.
- `npm run corpus` must follow any edit to `lib/terms.ts`, or
  `check_download_matches_site.py` fails — correctly.
- No straight apostrophes inside the `TERMS` array; the export script breaks.
