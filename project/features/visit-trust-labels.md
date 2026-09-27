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

- [ ] A visit through Sean's VPN reads **Relay detected** on the live site
- [ ] A visit from his normal connection reads **Confirmed** or **Probable**
- [ ] No location renders without a label
- [ ] A relayed row shows a time zone, never a city
- [ ] `/insights` matches the width of the header and footer at desktop size
- [ ] `npm run check` passes

## Steps

- [x] `lib/visit-trust.ts` with the four labels and the honest place string
- [ ] `scripts/check_visit_trust.mts`, fixtured on the real 470-event rows, plus a
      mutation test that it fails when broken
- [ ] PostHog query for labelled visit groups
- [ ] Page width: full width with `lg:px-[100px]`, matching Header/Footer
- [ ] Donut chart, inline SVG, no charting dependency
- [ ] Layout: tiles → donut → locations → pages → downloads
- [ ] Retire the `gate_events` locations table; keep `network_type` on the tables
- [ ] Push, then `POSTHOG_PERSONAL_API_KEY` into Vercel *(Sean)*
- [ ] Live proof: one normal visit, one through the VPN *(Sean, 2 min)*

## Verified / not verified

**Verified:** the finding itself, by direct query against 470 real events — the
ordering and counts in `0002` are measured, not estimated. `lib/visit-trust.ts`
typechecks.

**Not verified:** the classifier has no guard yet. The page has not rendered with real
labelled data and cannot be made to locally — **the development sandbox cannot reach
PostHog or Supabase** (`getaddrinfo EAI_AGAIN us.posthog.com`). So local render checks
prove the page compiles and lays out, never that the data path works. Logic gets
guarded as pure functions; the data path is proven on the deployed site or not at all.

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
