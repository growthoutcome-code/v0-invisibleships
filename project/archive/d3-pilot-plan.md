# Invisible Ships — d3.js Pilot Plan

*2026-08-16. A scoped, low-risk pilot to validate the d3 viz stack (visx + react-force-graph +
react-simple-maps) against real Invisible Ships data before committing to real features.
Companion to `charting-viz-stack-decision.md`. Not started — run at another time.*

## Goal
Prove the three viz types picked — **network graph, map, bespoke/custom** — work well in the
existing Next 14 / React 18 / shadcn stack, are **mobile-friendly**, and perform on a phone, using the
site's own data. Output = a go/no-go per category + reusable component patterns, with **zero production risk.**

## Guardrails (protects the work we just stabilized)
- **Branch-only.** Do all pilot work on a `d3-pilot` branch. **Do NOT merge to `main`.** Main -> Vercel
  production -> the monitor baseline we re-approved (`fcc56dad` / `dpl_8UrKNBtYh2W25UnTDYoTA2XAxt9E`).
  Staying off main means no new prod deploy, no digest "1 change" flag, no baseline churn.
- **If it's ever merged to main later:** expect a new prod deploy -> re-approve the baseline afterward
  (update `git_commit` + `prod_deployment_id` in `site_baseline.invisibleships.json`; see the monitor doc).
  Preview deploys (branch/PR) do NOT touch the production baseline, so they're safe.
- **Isolated surface.** One hidden route `/viz-lab` with `robots noindex`, NOT linked in nav, behind the
  existing access gate. Nothing public sees the pilot.
- **No SSR risk.** Every viz component is `"use client"` and loaded via `next/dynamic` with `ssr: false`
  (d3-force / force-graph / leaflet touch `window`). Keeps first paint + SSG routes unaffected.
- **Reuse the existing data layer.** Read the same `Dataset` from `lib/data.ts` (`ds.docs`, `ds.docCats`,
  `ds.docGloss`, `ds.categories`, `ds.glossary`). No new fetching, no schema changes, no Supabase writes.

## Dependencies to add (dev, on the branch only)
- Network: `react-force-graph-2d` (bundles d3-force; Canvas -> mobile pan/zoom/tap, performs at scale).
- Map: `react-simple-maps` + `topojson-client` (+ `@types/*`); a North-America/US TopoJSON (us-atlas / world-atlas).
- Custom: `@visx/responsive @visx/scale @visx/shape @visx/axis @visx/group @visx/tooltip` (visx = d3 math + React marks).
- Optional raw `d3` only if a bespoke piece needs a d3 module visx doesn't wrap.
- Keep each behind dynamic import so bundle impact is isolated and measurable.

## The three POCs (mapped to real data)

### POC 1 — Network graph of the corpus (react-force-graph-2d over rels.json)
- **Nodes:** documents (`ds.docs`, by `collection`/`doc_type`), category nodes (`ds.categories`), and
  glossary-term nodes (`ds.glossary`). **Edges:** `docCats` (doc->category) + `docGloss` (doc->glossary term).
- Color nodes by `kind`/`collection`; size by degree; label on tap; click a node -> deep-link to that
  entry/term (`/journal/[id]` or `/glossary/[slug]`). Start filtered to `collection==='journal'` +
  its glossary links to keep the first render light, with a toggle to show all.
- **Validate:** node/edge counts from the ~390 KB `rels.json`; FPS + pan/zoom/tap on a phone; whether SVG
  (visx/d3-force) would've choked vs Canvas (it will at this size — confirms the Canvas choice).

### POC 2 — Location map (react-simple-maps)
- Extract distinct non-null `Doc.location` values (entry/recording docs); build a small static
  `city -> [lng, lat]` lookup for the handful that appear (e.g. Denver, Seattle, Mexico City). Plot markers
  sized by entry count; tap a marker -> filtered journal list for that location.
- Base map: North-America TopoJSON via `react-simple-maps` ComposableMap/Geographies/Marker.
- **Validate:** SVG map is fine at this scale; tap targets + responsiveness on mobile; Tailwind/design-token
  styling. Upgrade path (react-leaflet / MapLibre GL) only if real tile/pan-zoom interaction is wanted later.

### POC 3 — Bespoke chart (visx)
- Candidate: **entries-over-time timeline** from `entry_date` (count/day or `word_count` trend), or a
  custom **radial-by-`part`** layout — something a stock chart lib can't style the way the site wants.
- Built from `@visx/scale` + `@visx/shape` + `@visx/axis` + `@visx/tooltip`, sized by `@visx/responsive`
  `ParentSize`. This is the "d3 math + React marks" pattern that carries the d3 knowledge forward.
- **Validate:** responsive resize, dark mode, tooltip touch behavior, that the visx DX feels good vs raw d3.

## Mobile test checklist (run each POC on a real phone + responsive devtools)
- Touch: pan / pinch-zoom / tap targets >= 44px; no hover-only affordances.
- Perf: interaction FPS; initial JS added (measure with the route's bundle report); lazy-load confirmed.
- Layout: `ParentSize`/container resize correct at 320-430px widths; no overflow.
- Theme: light + dark match design tokens.
- Robustness: no `window`/SSR crash; graceful with missing fields (null `location`/`entry_date`).

## Success criteria (go/no-go per category)
Renders correctly from live data · interactive + comfortable on a phone · acceptable perf & bundle cost
(lazy-loaded) · styles match the design system. Each category gets keep / adjust-approach / swap-library.

## Sequencing & effort
1. Branch + `/viz-lab` hidden route shell (noindex, gated, dynamic-import scaffold). ~small.
2. POC 1 network graph (highest-value, exercises the biggest data). ~1/2-1 session.
3. POC 2 map + POC 3 visx chart. ~1/2-1 session.
4. Mobile pass + write up findings back into `charting-viz-stack-decision.md`. ~small.
Rough total: **1-2 focused sessions.** Rollback = delete the branch; nothing else is touched.

## Decision gate (end of pilot)
Confirm per category: react-force-graph (network) / react-simple-maps vs MapLibre (map) / visx (custom).
Then, and only then, integrate into real features — at which point the merge-to-main + baseline-re-approval
note above applies.

## When ready
Create the branch, scaffold `/viz-lab`, and build the three POCs against `lib/data.ts`.
(Other UI cleanup is queued first.)
