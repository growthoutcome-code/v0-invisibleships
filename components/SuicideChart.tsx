"use client";

/**
 * The suicide chart — fourteen countries, both views, per-line detail panel.
 *
 * ONE CHART, TWO PLACES (Sean, 9 September: "include the full suicide chart…
 * all sparklines, and all chart functionality from the research section on the
 * home page"). This lived inside HealthSignals as a private function, which
 * meant the home page could not have it without a second implementation — and a
 * second implementation of a chart carrying method notes and per-country caveats
 * is exactly how two surfaces start telling a reader different things about the
 * same deaths.
 *
 * Moved here verbatim rather than rewritten. /data/public-health imports it and
 * renders it exactly as before; the home page passes the same document in from
 * the server instead of fetching it. Nothing about the chart's behaviour
 * changed in the move.
 *
 * useNarrow now comes from DataPrimitives rather than the copy that used to sit
 * in HealthSignals. They were the same function — the local one hard-coded the
 * 700px the shared one takes as its default.
 */
import { useMemo, useState } from "react";
import {
  DATA_WINDOW, dataWindowTicks, useNarrow,
} from "@/components/DataPrimitives";
import { MobileBars } from "@/components/ResearchCharts";
import {
  Dialog, DialogContent, DialogHeader, DialogBody, DialogTitle,
} from "@/components/ui/dialog";
import { track } from "@/lib/analytics";

export type IntlSeries = {
  country: string; emphasis: boolean; kind?: string; change_pct: number;
  points: { year: number; value: number }[];
  method?: string; basis_short?: string; source_url?: string; publisher?: string;
  tier?: string; caveats?: string[];
  extension?: {
    joins_at: number; scale_factor: number;
    points: { year: number; value: number; national_value: number }[];
    basis: string; basis_short: string; publisher: string; source_url: string;
    tier: string; crude: boolean; note: string;
  };
};
export type IntlChart = {
  title: string; unit: string; note: string; publisher: string; tier: string;
  source_url: string;
  series: IntlSeries[];
  covid_markers?: { date: string; x: number; label: string; source_url: string }[];
  extension_note?: string;
};

const SHORT_LABEL: Record<string, string> = {
  "United States": "US",
  "World average": "World",
  "World": "World",
  "United Kingdom": "UK",
  "Republic of Korea": "S. Korea",
  "South Korea": "S. Korea",
  "West Bank & Gaza": "WB & Gaza",
  "Russian Federation": "Russia",
};

export function MultiLineChart({ chart }: { chart: IntlChart }) {
  const [hoverYear, setHoverYear] = useState<number | null>(null);
  const narrow = useNarrow();
  // Two views of the same twelve series. "rate" answers "how high?"; "change"
  // answers "by how much?" — which is the question the ~30% claim is actually
  // about, and which a levels chart cannot show (Sean, 2026-08-20).
  // Default view: relative change. The rate view is dominated by Russia's 2000
  // level (53) which squashes every other line into the lower third.
  const [mode, setMode] = useState<"rate" | "change">("change");
  const indexed = mode === "change";
  // Window: the full two-decade record, or the pandemic era. Comparable
  // international estimates stop at 2021 — see the note under the chart.
  // The pandemic zoom (2017–2021) was removed on 2026-08-28 at Sean's request:
  // fourteen series compressed into four years is a thicket, and the full
  // window carries the finding anyway. The state stays so the covid markers and
  // the denser tick set keep their code path if a narrower window is ever
  // reinstated with fewer lines on it.
  const [win] = useState<"full" | "covid">("full");
  // COVID markers follow the window (Sean, 2026-08-21): the checkbox is
  // gone — the pandemic-window view shows the markers with room to breathe,
  // and the full view never renders them cramped at the right edge.
  const showCovid = win === "covid";
  const [open, setOpen] = useState<IntlSeries | null>(null);
  const winFrom = win === "covid" ? 2017 : 0;
  // padL scales with the tick font. It was a flat 44 at every width while the
  // ticks grew to 18px on a phone, so "+150%" and "same as 2000" started left of
  // x=0 and rendered as "00%" and "ame". The sibling chart above already does
  // `narrow ? 92 : 56`; this one never got the same treatment.
  const W = 760, H = 440, padT = 18, padB = 34;
  // On a phone the SVG scales to ~47%, which would render 11.5px labels at ~5px.
  // Label only the US and the world there, at a size that survives the scale;
  // every country's numbers are in the ranked table directly below.
  const padL = narrow ? 64 : 44;
  const padR = narrow ? 128 : 128;
  // The national continuation is part of the full-range view; the pandemic
  // window keeps it too, since 2022-2025 is exactly the period of interest.
  const withExt = chart.series.map((s) => ({
    ...s,
    points: [...s.points, ...((s.extension?.points || []).map((p) => ({ year: p.year, value: p.value })))],
  }));
  const view = withExt.map((s) => ({ ...s, points: s.points.filter((p) => p.year >= winFrom) }));
  const base = new Map(view.map((s) => [s.country, s.points[0]?.value ?? 1]));
  const val = (s: { country: string }, v: number) =>
    indexed ? (v / (base.get(s.country) || 1)) * 100 : v;
  const all = view.flatMap((s) => s.points.map((p) => ({ ...p, value: val(s, p.value) })));
  if (!all.length) return null;
  // Same shared window as every other Data chart (see DATA_WINDOW). The WHO
  // segment begins in 2000, one tick inside the axis, which is honest: there
  // is no comparable 1999 estimate to draw.
  const x0 = Math.min(DATA_WINDOW.from, ...all.map((p) => p.year));
  const x1 = Math.max(DATA_WINDOW.to, ...all.map((p) => p.year));
  const vMax = Math.max(...all.map((p) => p.value));
  const v0 = 0, v1 = vMax * 1.08;
  // Headline figures are computed over the WHO comparable period only (to 2021),
  // because that is the stretch where a cross-country claim is legitimate — the
  // national extensions end in different years.
  const whoChange = (c: string) => {
    const ser = chart.series.find((x) => x.country === c);
    if (!ser) return null;
    const pts = ser.points.filter((p) => p.year >= (winFrom || 0));
    if (pts.length < 2) return null;
    const a = pts[0].value, b = pts[pts.length - 1].value;
    return { pct: ((b - a) / a) * 100, from: pts[0].year, to: pts[pts.length - 1].year };
  };
  const usW = whoChange("United States"), wdW = whoChange("World");

  const winChange = (c: string) => {
    const ser = view.find((x) => x.country === c);
    if (!ser || ser.points.length < 2) return 0;
    const a = ser.points[0].value, b = ser.points[ser.points.length - 1].value;
    return ((b - a) / a) * 100;
  };
  const fmtEnd = (s: { country: string }, v: number) => {
    if (!indexed) return v.toFixed(1);
    const c = winChange(s.country);
    return `${c > 0 ? "+" : ""}${c.toFixed(0)}%`;
  };
  const X = (y: number) => padL + ((y - x0) / (x1 - x0)) * (W - padL - padR);
  const Y = (v: number) => padT + (1 - (v - v0) / (v1 - v0)) * (H - padT - padB);

  // End labels: sort by value and enforce a minimum vertical gap so eight
  // countries remain readable where their 2021 values sit close together.
  const MIN_GAP = 14;
  const ends = view
    .map((s) => {
      const raw = s.points[s.points.length - 1];
      return { s, last: { year: raw.year, value: val(s, raw.value), raw: raw.value } };
    })
    .sort((a, b) => a.last.value - b.last.value);
  // Walk top-to-bottom (highest value first) and push each label down only as
  // far as it must go to clear the one above it. Seeded at -Infinity so the
  // first label keeps its true position.
  let prevY = -Infinity;
  const placed = ends
    .slice()
    .reverse()
    .map((e) => {
      const y = Math.max(Y(e.last.value), prevY + MIN_GAP);
      prevY = y;
      return { ...e, labelY: y };
    });

  const yTicks = (indexed ? [0, 50, 100, 150, 200] : [0, 10, 20, 30, 40, 50]).filter((t) => t <= v1);
  // Default view uses the shared Data-section tick years so gridlines line up
  // with the overdose and crime charts. The COVID window is a deliberate zoom
  // and keeps its own denser ticks.
  const xTicks = (win === "covid" ? [2017, 2019, 2021, 2023, 2025] : dataWindowTicks(narrow))
    .filter((y) => y >= x0 && y <= x1);

  return (
    <figure className="m-0 mb-6">
      <figcaption className="mb-1">
        <span className="block font-display font-semibold text-foreground text-[19px]">
          {win === "covid"
            ? (indexed
                ? (usW
                    ? `Suicide rates through the pandemic: the US ${usW.pct >= 0 ? "rose" : "fell"} ${Math.abs(Math.round(usW.pct))}% from ${usW.from} to ${usW.to}`
                    : `Suicide rates through the pandemic`)
                : `Suicide rate through the pandemic, 2017–${x1}`)
            : (indexed
                ? (usW && wdW
                    ? `Suicide rates, ${usW.from}–${usW.to}: the US rose ${Math.round(usW.pct)}% while the world fell ${Math.abs(Math.round(wdW.pct))}%`
                    : `Suicide rates, change over the period`)
                : `Suicide rate, 2000–${x1}: the US against twelve countries and the world`)}
        </span>
        <span className="block text-foreground/75 text-[15px] mt-1">
          {indexed
            ? `Each line starts at its own ${win === "covid" ? 2017 : 2000} suicide rate — for the US that was 11.2 deaths per 100,000 people, roughly 32,000 deaths that year. Above the middle line means more suicide deaths per person than then; below means fewer. Headline figures compare the WHO period, to 2021; dotted tails run on each country's own statistics.`
            : "Suicide deaths per 100,000 people per year — for the US, 15.6 per 100,000 is roughly 52,000 deaths in a year. Rates are adjusted so countries with older or younger populations can be compared."}
        </span>
      </figcaption>
      <p className="text-muted text-[13px] m-0 mb-3">
        Bold line = United States · long-dashed line = world average · dotted after 2021 = each
        country&rsquo;s own national statistics ·{" "}
        {narrow ? "every country's figures are in the table below" : "hover any year to read all fourteen, or click anywhere on the plot for the nearest line's sources and method"}.
      </p>
      <div className="flex flex-wrap gap-x-6 gap-y-2 mb-3">
      {showCovid && x1 <= 2021 && (
        <span className="text-muted text-[12px] self-center">
          booster and end-of-emergency markers fall after 2021
        </span>
      )}
      <div role="group" aria-label="Chart view" className="flex gap-1">
        {([["rate", "Rate per 100,000"], ["change", "Change over period"]] as const).map(([m, label]) => (
          <button key={m} type="button" onClick={() => { setMode(m); track("health_chart_mode", { mode: m }); }}
            aria-pressed={mode === m}
            className={`text-[13px] px-3 py-1 border transition-colors ${
              mode === m ? "border-foreground text-foreground font-semibold" : "border-edge text-muted hover:text-foreground"
            }`}>
            {label}
          </button>
        ))}
      </div>
      </div>
      {/* On a phone fourteen lines are an indistinguishable grey mass — legible
          and uninformative. Below the breakpoint the chart is REPLACED by a
          ranked bar list; no duplicate chart underneath (Sean, 2026-08-27). */}
      {narrow ? (
        <MobileBars
          caption={`${chart.title}. Tap a row for that country's figures, method and sources.`}
          note="A ranked list shows the comparison, not the shape — it cannot show when a curve turned. The full chart is on a wider screen."
          rows={ends.map(({ s: ser, last }) => ({
            key: ser.country,
            label: SHORT_LABEL[ser.country] ?? ser.country,
            value: indexed ? last.value - 100 : last.value,
            display: fmtEnd(ser, last.value),
            emphasis: ser.emphasis || ser.kind === "world",
            onOpen: () => { setOpen(ser); track("health_chart_series_opened", { country: ser.country, via: "bars" }); },
          }))}
        />
      ) : (
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={chart.title}
        onMouseLeave={() => setHoverYear(null)} style={{ fontFamily: "inherit" }}>
        {yTicks.map((t) => (
          <g key={t}>
            <line x1={padL} y1={Y(t)} x2={W - padR} y2={Y(t)} stroke="rgb(var(--edge))" strokeWidth="1" />
            <text x={padL - 8} y={Y(t) + 4} fontSize={narrow ? 18 : 11} fill="rgb(var(--muted))" textAnchor="end">
              {indexed ? (t === 100 ? "same" : `${t > 100 ? "+" : "−"}${Math.abs(t - 100)}%`) : t}
            </text>
          </g>
        ))}
        {xTicks.map((y) => (
          <text key={y} x={X(y)} y={H - 8} fontSize={narrow ? 18 : 11} fill="rgb(var(--muted))" textAnchor="middle">{y}</text>
        ))}
        {x1 > 2021 && x0 < 2021 && (
          <g pointerEvents="none">
            <line x1={X(2021)} y1={padT} x2={X(2021)} y2={H - padB}
              stroke="rgb(var(--edge))" strokeWidth="1.5" />
            <text x={X(2021) + 4} y={H - padB - 6} fontSize={narrow ? 15 : 10}
              fill="rgb(var(--muted))">national statistics →</text>
          </g>
        )}
        {showCovid && (chart.covid_markers || [])
          .filter((m) => m.x >= x0 && m.x <= x1)
          .map((m) => (
            <g key={m.date} pointerEvents="none">
              <line x1={X(m.x)} y1={padT + 26} x2={X(m.x)} y2={H - padB}
                stroke="rgb(var(--foreground))" strokeWidth="1" strokeDasharray="2 3" opacity="0.55" />
              <text x={X(m.x)} y={padT + 22} fontSize={narrow ? 14 : 10}
                fill="rgb(var(--muted))" textAnchor="middle">{m.label}</text>
            </g>
          ))}
        {x1 >= 2020 && x0 <= 2020 && (
          <>
            <rect x={X(2020)} y={padT} width={Math.max(0, X(x1) - X(2020))} height={H - padT - padB}
              fill="rgb(var(--foreground))" opacity="0.05" />
            <line x1={X(2020)} y1={padT} x2={X(2020)} y2={H - padB}
              stroke="rgb(var(--muted))" strokeWidth="1" />
            <text x={X(2020) + 5} y={padT + (narrow ? 16 : 11)} fontSize={narrow ? 16 : 10.5} fill="rgb(var(--muted))">
              COVID-19
            </text>
          </>
        )}
        {indexed && (
          <>
            <line x1={padL} y1={Y(100)} x2={W - padR} y2={Y(100)}
              stroke="rgb(var(--foreground))" strokeWidth="1" opacity="0.45" />
            <text x={padL + 4} y={Y(100) - 5} fontSize={narrow ? 16 : 10.5} fill="rgb(var(--muted))">
              same as {x0}
            </text>
          </>
        )}
        {hoverYear !== null && (
          <line x1={X(hoverYear)} y1={padT} x2={X(hoverYear)} y2={H - padB}
            stroke="rgb(var(--muted))" strokeDasharray="3 3" pointerEvents="none" />
        )}
        {view.map((s) => {
          const ext = s.extension;
          if (!ext) return null;
          const seg = [...s.points.filter((p) => p.year === ext.joins_at), ...s.points.filter((p) => p.year > ext.joins_at)];
          if (seg.length < 2) return null;
          return (
            <path key={"ext-" + s.country}
              d={seg.map((p, i) => `${i ? "L" : "M"}${X(p.year).toFixed(1)},${Y(val(s, p.value)).toFixed(1)}`).join(" ")}
              fill="none"
              stroke={s.emphasis ? "rgb(var(--foreground))" : "rgb(var(--muted))"}
              strokeWidth={s.emphasis ? 3 : 1.4}
              strokeDasharray={s.emphasis ? "6 3" : "4 3"}
              opacity={s.emphasis ? 1 : 0.7} />
          );
        })}
        {/* Hover / pick columns, one per year.

            These are fill="transparent", which RECEIVES pointer events, and they
            cover the entire plot. Until 2026-08-28 they were rendered LAST — on
            top of the per-series hit paths — so they silently swallowed every
            click inside the plot area. The hit paths below were correct all
            along and simply unreachable: the only clickable things left were the
            legend and the right-edge labels, both outside the plot. Sean: "I
            cannot click on those lines."

            They are now the bottom layer, and they carry a click of their own:
            at a crossing, the series nearest the pointer wins rather than
            whichever hit path happened to come later in the DOM. That is the
            case that prompted the report — a line crossing the US line that
            could not be identified. */}
        {Array.from({ length: x1 - x0 + 1 }, (_, i) => x0 + i).map((y) => (
          <rect key={y} x={X(y) - (W - padL - padR) / (x1 - x0) / 2} y={padT}
            width={(W - padL - padR) / (x1 - x0)} height={H - padT - padB}
            fill="transparent" style={{ cursor: "pointer" }}
            onMouseEnter={() => setHoverYear(y)}
            onClick={(e) => {
              const svg = e.currentTarget.ownerSVGElement;
              const ctm = svg?.getScreenCTM();
              if (!svg || !ctm) return;
              const pt = svg.createSVGPoint();
              pt.x = e.clientX;
              pt.y = e.clientY;
              const at = pt.matrixTransform(ctm.inverse());
              let best: (typeof view)[number] | null = null;
              let bestDist = Infinity;
              for (const cand of view) {
                const q = cand.points.find((r) => r.year === y);
                if (!q) continue;
                const d = Math.abs(Y(val(cand, q.value)) - at.y);
                if (d < bestDist) { bestDist = d; best = cand; }
              }
              if (best) {
                setOpen(best);
                track("health_chart_series_opened", { country: best.country, via: "plot", year: y });
              }
            }} />
        ))}
        {view.map((s) => (
          <path key={s.country}
            d={s.points.filter((p) => !s.extension || p.year <= s.extension.joins_at)
              .map((p, i) => `${i ? "L" : "M"}${X(p.year).toFixed(1)},${Y(val(s, p.value)).toFixed(1)}`).join(" ")}
            fill="none"
            stroke={s.emphasis ? "rgb(var(--foreground))" : "rgb(var(--muted))"}
            strokeWidth={s.emphasis ? 3 : s.kind === "world" ? 1.5 : 1.1}
            strokeDasharray={s.kind === "world" ? "5 4" : undefined}
            opacity={s.emphasis ? 1 : s.kind === "world" ? 0.9 : 0.6} />
        ))}
        {view.map((s) => (
          <path key={"hit-" + s.country}
            d={s.points.map((p, i) => `${i ? "L" : "M"}${X(p.year).toFixed(1)},${Y(val(s, p.value)).toFixed(1)}`).join(" ")}
            fill="none" stroke="transparent" strokeWidth="14"
            style={{ cursor: "pointer" }}
            onClick={() => { setOpen(s); track("health_chart_series_opened", { country: s.country }); }}>
            <title>{`${s.country} — click for sources and method`}</title>
          </path>
        ))}
        {placed
          .filter(({ s }) => !narrow || s.emphasis || s.kind === "world")
          .map(({ s, last, labelY }) => (
          <g key={s.country}>
            <line x1={X(last.year)} y1={Y(last.value)} x2={W - padR + 6} y2={labelY}
              stroke="rgb(var(--edge))" strokeWidth="1" />
            {/* On a phone the gutter holds LABEL + VALUE, not a label — "US +36%"
                fits, "World −23%" did not, and widening the gutter only moved
                the cliff. Anchor to the right EDGE at narrow instead: the text
                grows leftward into the gutter and cannot clip at any length. */}
            <text x={narrow ? W - 6 : W - padR + 10} y={labelY + 4}
              textAnchor={narrow ? "end" : "start"}
              fontSize={narrow ? 22 : s.emphasis ? 13 : 11.5}
              fill={s.emphasis ? "rgb(var(--foreground))" : "rgb(var(--muted))"}
              fontWeight={s.emphasis || s.kind === "world" ? 700 : 400}
              style={{ cursor: "pointer" }}
              onClick={() => { setOpen(s); track("health_chart_series_opened", { country: s.country, via: "label" }); }}>
              {/* 86px of gutter at 22px type fits "US", not "United States" — and
                  the two series clipped were the two the chart exists to
                  contrast. Full names are in the ranked table directly below. */}
              {narrow ? SHORT_LABEL[s.country] ?? s.country : s.country}{" "}
              {hoverYear === null
                ? fmtEnd(s, last.value)
                : (() => {
                    const p = s.points.find((q) => q.year === hoverYear);
                    if (!p) return "—";
                    return indexed
                      ? `${p.value >= (base.get(s.country) || 0) ? "+" : ""}${(((p.value / (base.get(s.country) || 1)) - 1) * 100).toFixed(0)}%`
                      : p.value.toFixed(1);
                  })()}
            </text>
          </g>
        ))}
                {hoverYear !== null && (
          <text x={X(hoverYear)} y={padT - 2} fontSize={narrow ? 18 : 12} fontWeight="600"
            fill="rgb(var(--foreground))" textAnchor="middle" pointerEvents="none">
            {hoverYear}{narrow ? "" : indexed ? " — change since start" : " — deaths per 100,000"}
          </text>
        )}
      </svg>
      )}

      <Dialog open={!!open} onOpenChange={(v) => !v && setOpen(null)}>
        {/* md: a single country's provenance. Was a bespoke 720px. */}
        <DialogContent size="md">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">{open?.country}</DialogTitle>
          </DialogHeader>
          {open && (
          <DialogBody>
            <div className="mt-1">
              <p className="body-copy text-foreground/90 m-0 mb-4">
                {(open.extension
                  ? open.extension.points[open.extension.points.length - 1].national_value
                  : open.points[open.points.length - 1].value).toFixed(1)} suicide deaths per 100,000
                people in {open.extension
                  ? open.extension.points[open.extension.points.length - 1].year
                  : open.points[open.points.length - 1].year}
                {open.kind === "world" ? "" : ", against"}{" "}
                {open.kind === "world" ? "" : `${open.points[0].value.toFixed(1)} in ${open.points[0].year} — a change of ${open.change_pct > 0 ? "+" : ""}${open.change_pct.toFixed(0)}% across the WHO period, ${open.points[0].year}–${open.points[open.points.length - 1].year}`}
                {open.kind === "world" ? `a change of ${open.change_pct.toFixed(0)}% since ${open.points[0].year}` : ""}.
              </p>

              <h4 className="text-[13px] uppercase tracking-[0.08em] font-semibold text-foreground mb-2">
                How this is measured
              </h4>
              <p className="text-[15px] text-foreground/85 m-0 mb-4">{open.method}</p>

              {!!open.caveats?.length && (
                <>
                  <h4 className="text-[13px] uppercase tracking-[0.08em] font-semibold text-foreground mb-2">
                    What to know before quoting it
                  </h4>
                  <ul className="list-none p-0 m-0 mb-4">
                    {open.caveats.map((c, i) => (
                      <li key={i} className="text-[15px] text-foreground/85 py-1.5 pl-5 relative">
                        <span aria-hidden className="absolute left-0 top-1.5 text-foreground">—</span>{c}
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {/* Sean, 2026-08-28, reading South Korea against the United States: "could
                  this reading be inaccurate because of a population inconsistency?" Age
                  structure is handled — the WHO series is age-standardised — but he had
                  picked up 105% and 36% off the chart while this modal said 83% and 40%.
                  Both were right. The indexed end-label runs to the END of the line,
                  which for a country with an extension is its own national statistics to
                  2024; the modal quoted the WHO period. Two numbers for one line on one
                  screen, and nothing said why.
              
                  A cross-country comparison is only valid on the WHO figure. That is now
                  stated, rather than implied by a dash pattern and a line of caption. */}
              {open.extension && (() => {
                const first = open.points[0];
                const whoLast = open.points[open.points.length - 1];
                const extLast = open.extension.points[open.extension.points.length - 1];
                const extPct = ((extLast.value / first.value) - 1) * 100;
                const sign = (n: number) => (n > 0 ? "+" : "");
                return (
                  <div className="border border-edge rounded-lg p-4 mb-4 bg-foreground/[0.03]">
                    <h4 className="text-[13px] uppercase tracking-[0.08em] font-semibold text-foreground mb-2">
                      Which figure to quote
                    </h4>
                    <p className="text-[15px] text-foreground/85 m-0 mb-2">
                      <strong>{sign(open.change_pct)}{open.change_pct.toFixed(0)}% ({first.year}–{whoLast.year})</strong>{" "}
                      — {first.value.toFixed(1)} to {whoLast.value.toFixed(1)} per 100,000, age-standardised to the
                      WHO world standard population. This is the figure comparable with every other line on
                      this chart, because every line is on that one method.
                    </p>
                    <p className="text-[15px] text-foreground/85 m-0">
                      The line continues to {extLast.year} on {open.country}&rsquo;s own national statistics,
                      which puts the change since {first.year} at{" "}
                      <strong>{sign(extPct)}{extPct.toFixed(0)}%</strong> — and that is the number the
                      end-of-line label shows. Do <strong>not</strong> compare it with another country&rsquo;s:
                      national methods differ from each other and from the WHO basis, so the gap between two
                      of them is partly a gap of method. For the shape of recent years it is the better
                      series; for comparing countries, use {sign(open.change_pct)}{open.change_pct.toFixed(0)}%.
                    </p>
                  </div>
                );
              })()}
              
              {open.extension && (
                <div className="border border-edge rounded-lg p-4 mb-4">
                  <h4 className="text-[13px] uppercase tracking-[0.08em] font-semibold text-foreground mb-2">
                    After 2021 — {open.country}&rsquo;s own statistics
                  </h4>
                  <p className="text-[15px] text-foreground/85 m-0 mb-2">{open.extension.basis}.</p>
                  {open.extension.crude && (
                    <p className="text-[15px] text-foreground/85 m-0 mb-2">
                      <strong>This is a crude rate</strong> — not adjusted for age — so it is not
                      comparable with the standardised figures before 2021 or with other countries.
                    </p>
                  )}
                  <p className="text-[15px] text-foreground/85 m-0 mb-3">{open.extension.note}</p>
                  <table className="w-full text-[14px] mb-2">
                    <thead>
                      <tr className="text-left text-muted text-[12px] uppercase tracking-wide">
                        <th className="py-1 pr-4 font-medium">Year</th>
                        <th className="py-1 pr-4 font-medium text-right">As published</th>
                        <th className="py-1 font-medium text-right">On the chart</th>
                      </tr>
                    </thead>
                    <tbody>
                      {open.extension.points.map((p) => (
                        <tr key={p.year} className="border-t border-edge/50">
                          <td className="py-1 pr-4 text-muted tabular-nums">{p.year}</td>
                          <td className="py-1 pr-4 text-right tabular-nums text-foreground/85">{p.national_value.toFixed(1)}</td>
                          <td className="py-1 text-right tabular-nums text-muted">{p.value.toFixed(1)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="text-muted text-[13px] m-0">
                    &ldquo;On the chart&rdquo; is the published figure multiplied by{" "}
                    {open.extension.scale_factor.toFixed(3)} so the line joins the WHO series at 2021
                    instead of stepping by an amount that is purely a difference of method. The
                    year-on-year movement is unchanged. Source: {open.extension.publisher} · Tier{" "}
                    {open.extension.tier} ·{" "}
                    <a href={open.extension.source_url} target="_blank" rel="noreferrer noopener"
                      className="underline underline-offset-4 hover:text-foreground">open the data</a>
                  </p>
                </div>
              )}

              <h4 className="text-[13px] uppercase tracking-[0.08em] font-semibold text-foreground mb-2">
                {open.extension ? "WHO series, every year to 2021" : "Every year"}
              </h4>
              <div className="max-h-[240px] overflow-y-auto border border-edge rounded-lg mb-4">
                <table className="w-full text-[14px]">
                  <tbody>
                    {open.points.map((p) => (
                      <tr key={p.year} className="border-b border-edge/50 last:border-0">
                        <td className="py-1.5 px-4 text-muted tabular-nums">{p.year}</td>
                        <td className="py-1.5 px-4 text-right tabular-nums text-foreground/85">{p.value.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="text-muted text-[14px] m-0">
                Source: {open.publisher} · Tier {open.tier} ·{" "}
                <a href={open.source_url} target="_blank" rel="noreferrer noopener"
                  className="underline underline-offset-4 hover:text-foreground">open the data</a>
              </p>
            </div>
          </DialogBody>
          )}
        </DialogContent>
      </Dialog>
    </figure>
  );
}
