# Invisible Ships — Data Visualization / Charting Stack Decision

*2026-08-16. Recommendation captured; pending final confirmation + first build.*

## Context
- Stack: Next 14 (App Router) + React 18 + TS 5.6 + Tailwind 3.4 + shadcn/ui (Radix + CVA + lucide).
- **No charting lib installed yet** (checked `package.json` + code imports — clean slate, no prior decision).
- Sean likes **d3.js**, open to comparable alternatives that fit the codebase. Priority: **mobile-friendly**.
- Planned viz types: **Maps/geographic, Relationship/network graph, Bespoke/custom interactive.**
  Explicitly NOT standard charts.

## Decision / recommendation
Because the three chosen viz types (maps, network graph, custom) are all d3's wheelhouse and are NOT what
Recharts/shadcn-charts do, **d3 stays** — the question is how to use it in React without fighting the DOM.

- **Bespoke / custom interactive -> `visx` (Airbnb).** Core framework. visx *is* d3 (wraps d3 scales/shapes/
  geo/network) exposed as React components -> React owns the DOM, d3 knowledge transfers. Responsive via
  `@visx/responsive` `ParentSize`; touch-capable. Lower-level (you assemble more) — correct tradeoff for custom.
- **Network graph (`public/corpus/rels.json`, ~390 KB) -> `react-force-graph`** (Canvas/WebGL): turnkey
  force-directed graph with mobile pan/zoom/drag/touch, performs at scale. Alt: `d3-force` + React/visx SVG
  for fuller bespoke styling, but you hand-wire the simulation + drag, and SVG slows past a few hundred nodes.
- **Maps / geographic (Denver/Seattle/Mexico) -> `react-simple-maps`** (React wrapper over `d3-geo` + TopoJSON,
  SVG, Tailwind-styleable). Step up to **`react-leaflet` / `MapLibre GL`** only if a real interactive tile map
  is needed (Canvas/WebGL). `@visx/geo` can also do this under visx if we want one framework.

## Rejected / not chosen (and why)
- **shadcn Charts (Recharts)** — would be the default *for standard charts*; best-integrated with shadcn,
  mobile-friendly. Not chosen because the work isn't standard charts. Keep in back pocket if they come up later.
- **Nivo** — d3-based React, has Network/Geo/Chord; nice defaults but heavier and SVG-bound; visx more flexible.
- **Chart.js / ECharts** — capable (ECharts even does graph+map) but less React-idiomatic / larger; visx keeps it d3-native.
- **Raw d3 controlling the DOM** — avoid: fights React. Use d3 for *math*, React/visx for *marks*.

## Practical notes
- Expect **~2-3 focused libs** (visx + react-force-graph + a map lib), not one. visx is the connective
  tissue (all d3-native), so it doesn't feel like unrelated stacks.
- **Mobile perf rule:** SVG (visx, react-simple-maps) fine to moderate element counts; switch to Canvas/WebGL
  (react-force-graph, MapLibre) when scenes get large/heavily interactive on phones.
- Next 14 App Router: mark viz components `"use client"` and lazy-load (`next/dynamic`, `ssr:false`).

## Next step (when ready)
Run `d3-pilot-plan.md`: scaffold a hidden `/viz-lab`, build a react-force-graph view of `rels.json`, a
react-simple-maps location map, and a tiny visx custom chart — validate feel + mobile perf before committing.
