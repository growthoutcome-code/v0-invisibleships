"use client";

import { useEffect, useMemo, useState } from "react";
import ListPager from "@/components/ListPager";
import { DataNoteLine } from "@/components/DataIntro";
import DisclaimerLink from "@/components/DisclaimerLink";
import { SkeletonChart } from "@/components/Skeleton";
import {
  useTable, useDoc, usePager, useNarrow, TierChip, SourceLink, SectionSkeleton,
  DismissibleNote, ArchivedLink, DATA_WINDOW, dataWindowTicks, type SourceRec,
} from "@/components/DataPrimitives";
import IntlLineChart, { type IntlChartDoc, type IntlSeries } from "@/components/IntlLineChart";
import DetentionChart, { type DetChart, type DetSeries } from "@/components/DetentionChart";
import SideNav, { useSectionNav } from "@/components/SideNav";
import { track } from "@/lib/analytics";
import { MobileBars } from "@/components/ResearchCharts";

/**
 * Crime — the Data section's fourth sub-tab. United States only (Sean's scope).
 *
 * The section is built around a measurement problem rather than a number. US
 * crime is counted by three systems that disagree, and the question "is crime
 * rising?" has more than one defensible answer depending on which is cited. The
 * landing chart therefore shows TWO official homicide series side by side and
 * never reconciles them: the gap is the finding, not an error to be resolved.
 *
 * Same conventions as Public Health: tiered rows resolving to fetched sources,
 * causes attributed rather than asserted, and no claim that this dataset
 * corroborates the Government Cloud record or the journal.
 */

type Indicator = {
  indicator_id: string; geography: string; year: number; value: number;
  unit: string; tier: string; publisher?: string; source_id: string | null;
  workstream?: string; note?: string;
};
type DQ = {
  dq_id: string; geography: string; topic: string; issue: string;
  effect: string; tier: string; source_id: string | null;
};
type Trend = { topic: string; statement: string; tier: string; source_id: string | null };
type Caveat = { workstream: string; caveat: string; tier: string };
type Verdict = {
  claim: string; summary: string;
  key_figures: { figure: string; tier: string; source_id?: string | null }[];
};
type ChartSeries = {
  name: string; emphasis: boolean; basis_short: string; publisher: string;
  tier: string; unit?: string;
  points: { year: number; value: number; tier?: string; note?: string }[];
  caveats?: string[];
};
type Chart = {
  title: string; unit: string; note: string; publisher: string; tier: string;
  series: ChartSeries[];
  markers?: { year: number; label: string }[];
  y_format?: string;
  /** Offers the levels / year-over-year-change toggle. */
  change_view?: boolean;
  themes?: { statement: string; tier: string }[];
  accuracy_note?: string;
};
type Lane = {
  name: string; counts: string; publisher: string; emphasis: boolean;
  base_year: number; base_value: number; unit_raw: string; tier: string;
  basis_short: string; caveats: string[];
  points: { year: number; value: number; raw: number; tier: string }[];
  /**
   * Last year of the old basis, for a lane whose MEASUREMENT changed mid-series
   * (burglary: the FBI's Summary Reporting System ended in 2019 and the
   * NIBRS-based estimates that replaced it are not a continuation). The path is
   * split here rather than drawn through, because a continuous line across a
   * basis change asserts a single measurement that was never taken.
   */
  break_after?: number;
  /** Replaces the computed base→last percentage when one number would span a break. */
  summary?: string;
};
type LaneChart = {
  title: string; unit: string; note: string; publisher: string; tier: string;
  indexed: boolean; series: Lane[];
  themes?: { statement: string; tier: string }[];
};
type NotCounted = {
  nc_id: string; category: string; status: string; detail: string;
  who_would_collect: string; tier: string; source_id: string | null;
};
type TRMeasure = { who: string; what: string; status: string; tier: string; source_id: string | null };
type TR = {
  what_it_is: {
    definition: string; definition_source: string;
    philadelphia_definition: string; philadelphia_note: string;
    tactics: string[]; tactics_note: string; named_states: string;
    tier: string; source_id: string | null;
  };
  how_it_is_measured: TRMeasure[];
  the_gap: string;
  discipline_note: string;
};
type Sweep = {
  sweep_id: string; date: string; operation: string; agency: string;
  headline: string; what_the_number_is: string; for_scale: string;
  tier: string; source_id: string | null;
};

/* ---------------------------------------------------------------- chart --- */

/**
 * Six lanes on one indexed axis.
 *
 * The lanes count genuinely different things — deaths, offences known to police,
 * NCIC records entered, federal civil filings — in units that differ by orders
 * of magnitude. Raw values on a shared axis would flatten four of the five
 * against the floor, so each lane is indexed to its own first year in the
 * window = 100.
 *
 * That trade is stated rather than hidden: the chart shows DIRECTION and
 * relative change, never magnitude, and each label carries its base year so no
 * one reads two lanes at the same height as two equal quantities.
 */
function LaneChart({ chart, onPick }: { chart: LaneChart; onPick: (l: Lane) => void }) {
  const narrow = useNarrow();
  const [hoverYear, setHoverYear] = useState<number | null>(null);
  // Connected legend (Sean, 2026-08-21): four of the five lanes converge below
  // index 130, so end-of-line labels collapsed into a corner cluster. The
  // legend above the plot is now the key AND the control: hover/focus lights a
  // lane, tap once highlights (phones), tap again opens the detail modal.
  const [focus, setFocus] = useState<string | null>(null);

  const all = chart.series.flatMap((s) => s.points);
  if (all.length < 2) return null;

  const fsTick = narrow ? 24 : 11;
  const fsLabel = narrow ? 24 : 12;
  const W = 900, H = 380;
  const padL = narrow ? 78 : 54;
  const padR = narrow ? 24 : 60;
  const padT = narrow ? 30 : 26;
  const padB = narrow ? 52 : 38;

  const x0 = DATA_WINDOW.from, x1 = DATA_WINDOW.to;
  const vMax = Math.max(...all.map((p) => p.value)) * 1.08;
  const X = (y: number) => padL + ((y - x0) / (x1 - x0)) * (W - padL - padR);
  const Y = (v: number) => padT + (1 - v / vMax) * (H - padT - padB);

  const yTicks = [0, 100, 200, 300, 400].filter((t) => t <= vMax);
  const xTicks = dataWindowTicks(narrow);


  return (
    <figure className="m-0 mb-6">
      <figcaption className="font-display font-semibold text-foreground text-[19px] mb-1">
        {chart.title}
      </figcaption>
      <p className="text-muted text-[13px] m-0 mb-3">{chart.unit}</p>

      <ul className="list-none p-0 m-0 mb-3 flex flex-wrap gap-x-4 gap-y-1"
        onMouseLeave={() => setFocus(null)}>
        {chart.series.map((s) => (
          <li key={s.name}>
            <button type="button"
              onMouseEnter={() => setFocus(s.name)}
              onFocus={() => setFocus(s.name)}
              onClick={() => { if (focus === s.name) onPick(s); else setFocus(s.name); }}
              aria-pressed={focus === s.name}
              className={`flex items-center gap-2 text-[15px] py-1 px-1 border-b-2 transition-colors ${
                focus === s.name ? "border-foreground text-foreground"
                                 : "border-transparent text-foreground/70 hover:text-foreground"
              }`}>
              <svg width="22" height="8" aria-hidden="true">
                <line x1="0" y1="4" x2="22" y2="4" stroke="currentColor"
                  strokeWidth={s.emphasis ? 3 : 1.5} />
              </svg>
              {s.name}
            </button>
          </li>
        ))}
      </ul>

      {/* Below the breakpoint the plot is REPLACED by a ranked list. Four of
          the six lanes converge below index 130 and cannot be told apart in a
          phone's width — the chart stays legible and stops being readable.
          Values are indexed to each lane's own base, so the list is centred on
          zero: a fall and a rise are directions, not two lengths. */}
      {narrow ? (
        <MobileBars
          caption={`${chart.title} — each lane against its own first year in this window. Tap a row for its figures, method and sources.`}
          note="A ranked list shows the comparison, not the shape — it cannot show when a curve turned. The full chart is on a wider screen."
          rows={chart.series.map((l) => {
            const last = l.points[l.points.length - 1];
            return {
              key: l.name,
              label: l.name,
              value: last ? last.value - 100 : 0,
              display: last ? `${last.value >= 100 ? "+" : "\u2212"}${Math.abs(Math.round(last.value - 100))}%` : "\u2014",
              emphasis: l.emphasis,
              onOpen: () => { onPick(l); track("crime_lane_opened", { lane: l.name, via: "bars" }); },
            };
          })}
        />
      ) : (
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img"
        aria-label={`${chart.title}. ${chart.unit}. Use the legend buttons to highlight a lane and open its detail.`}
        onMouseLeave={() => setHoverYear(null)}
        style={{ fontFamily: "inherit", overflow: "visible" }}>
        {yTicks.map((t) => (
          <g key={t}>
            <line x1={padL} y1={Y(t)} x2={W - padR} y2={Y(t)}
              stroke="rgb(var(--edge))" strokeWidth={t === 100 ? 1.6 : 1} />
            <text x={padL - 8} y={Y(t) + 4} fontSize={fsTick} fill="rgb(var(--muted))" textAnchor="end">
              {t}
            </text>
          </g>
        ))}
        {/* the 100 line is the reference: everything above it has risen */}
        {!narrow && (
          <text x={W - padR + 6} y={Y(100) + 4} fontSize="10.5" fill="rgb(var(--muted))">
            start
          </text>
        )}
        {xTicks.map((y) => (
          <text key={y} x={X(y)} y={H - (narrow ? 22 : 12)} fontSize={fsTick}
            fill="rgb(var(--muted))" textAnchor="middle">{y}</text>
        ))}

        {chart.series.map((s, i) => {
          const pt = (p: { year: number; value: number }) =>
            `${X(p.year).toFixed(1)},${Y(p.value).toFixed(1)}`;
          // A declared basis change splits the path. Everything else about the
          // lane is unchanged, so the break reads as a break and not as a gap
          // in the data — the years either side are both published.
          const brk = s.break_after ?? null;
          const crosses = (a: { year: number }) => brk !== null && a.year === brk;
          const d = s.points
            .map((p, j) => `${j === 0 || crosses(s.points[j - 1]) ? "M" : "L"}${pt(p)}`)
            .join(" ");
          // Same convention as every other chart: dotted = not Tier A.
          const weak: string[] = [];
          s.points.forEach((p, j) => {
            if (p.tier && p.tier !== "A") {
              if (j > 0 && !crosses(s.points[j - 1])) weak.push(`M${pt(s.points[j - 1])}L${pt(p)}`);
              if (j < s.points.length - 1 && !crosses(p)) weak.push(`M${pt(p)}L${pt(s.points[j + 1])}`);
            }
          });
          const dim = focus !== null && focus !== s.name;
          const base = s.emphasis ? (narrow ? 3.4 : 2.3) : (narrow ? 2.4 : 1.4);
          const sw = focus === s.name ? base + 1.2 : base;
          // A lane sampled with gaps shows its points, so a straight run between
          // two distant years cannot read as data we do not have.
          const gappy = s.points.some((p, j) => j > 0 && p.year - s.points[j - 1].year > 1);
          return (
            <g key={i} onClick={() => onPick(s)} onMouseEnter={() => setFocus(s.name)}
              style={{ cursor: "pointer", transition: "opacity 120ms" }}>
              <path d={d} fill="none" stroke="rgb(var(--foreground))" strokeWidth={sw}
                opacity={dim ? 0.18 : s.emphasis || focus === s.name ? 1 : 0.6} />
              <path d={d} fill="none" stroke="transparent" strokeWidth={narrow ? 26 : 16} />
              {weak.map((w, k) => (
                <g key={k}>
                  <path d={w} fill="none" stroke="rgb(var(--background))" strokeWidth={sw + 1.6} />
                  <path d={w} fill="none" stroke="rgb(var(--foreground))" strokeWidth={sw}
                    strokeDasharray={narrow ? "2 5" : "1.5 4"} strokeLinecap="round"
                    opacity={dim ? 0.18 : s.emphasis || focus === s.name ? 1 : 0.6} />
                </g>
              ))}
              {gappy && s.points.map((p) => (
                <circle key={p.year} cx={X(p.year)} cy={Y(p.value)} r={narrow ? 4 : 2.6}
                  fill="rgb(var(--background))" stroke="rgb(var(--foreground))"
                  strokeWidth={narrow ? 2 : 1.3} opacity={dim ? 0.18 : 0.85} />
              ))}
              {/* the basis change, marked where the path splits */}
              {brk !== null && (
                <g>
                  <line x1={X(brk + 0.5)} y1={padT} x2={X(brk + 0.5)} y2={H - padB}
                    stroke="rgb(var(--muted))" strokeDasharray="2 6" strokeWidth="1"
                    opacity={dim ? 0.12 : focus === s.name ? 0.9 : 0.35} />
                  {focus === s.name && !narrow && (
                    <text x={X(brk + 0.5) + 5} y={padT + 11} fontSize="10.5"
                      fill="rgb(var(--muted))">basis changes</text>
                  )}
                </g>
              )}
              {/* every lane starts at 100 — mark it so the base year is visible */}
              <circle cx={X(s.points[0].year)} cy={Y(100)} r={narrow ? 4.5 : 3}
                fill="rgb(var(--foreground))" opacity={dim ? 0.18 : s.emphasis ? 1 : 0.6} />
            </g>
          );
        })}


        {Array.from({ length: x1 - x0 + 1 }, (_, i) => x0 + i).map((y) => (
          <rect key={y} x={X(y) - (W - padL - padR) / (x1 - x0) / 2} y={padT}
            width={Math.max(3, (W - padL - padR) / (x1 - x0))} height={H - padT - padB}
            fill="transparent" style={{ cursor: "pointer" }}
            onMouseEnter={() => setHoverYear(y)}
            onClick={(e) => {
              // forward clicks the overlay would otherwise swallow: open the
              // lane nearest the pointer at this year (focused lane wins)
              const svg = (e.currentTarget as SVGRectElement).ownerSVGElement!;
              const r = svg.getBoundingClientRect();
              const vy = ((e.clientY - r.top) / r.height) * H;
              let best: Lane | null = null, bd = Infinity;
              for (const s of chart.series) {
                const pts = s.points.filter((q) => q.year >= DATA_WINDOW.from && q.year <= DATA_WINDOW.to);
                if (!pts.length) continue;
                const p = pts.find((q) => q.year === y) ||
                  pts.reduce((a, b) => Math.abs(b.year - y) < Math.abs(a.year - y) ? b : a);
                const d = Math.abs(Y(p.value) - vy);
                if (d < bd) { bd = d; best = s; }
              }
              const target = focus ? chart.series.find((s) => s.name === focus) || best : best;
              if (target) onPick(target);
            }} />
        ))}
        {hoverYear !== null && (
          <g pointerEvents="none">
            <line x1={X(hoverYear)} y1={padT} x2={X(hoverYear)} y2={H - padB}
              stroke="rgb(var(--muted))" strokeDasharray="3 3" />
            <text x={Math.min(Math.max(X(hoverYear), padL + 90), W - padR - 90)} y={padT - 8}
              fontSize={fsLabel} fill="rgb(var(--foreground))" textAnchor="middle" fontWeight="600">
              {(() => {
                const f = chart.series.find((s) => s.name === focus);
                const p = f?.points.find((q) => q.year === hoverYear);
                return f && p
                  ? `${f.name} \u00b7 ${hoverYear} \u00b7 index ${p.value} \u00b7 ${p.raw.toLocaleString()}`
                  : `${hoverYear} \u2014 hover the legend to single out a lane`;
              })()}
            </text>
            {chart.series.map((s, i) => {
              const p = s.points.find((q) => q.year === hoverYear);
              return p ? (
                <circle key={i} cx={X(hoverYear)} cy={Y(p.value)} r={narrow ? 6 : 4.5}
                  fill="rgb(var(--background))" stroke="rgb(var(--foreground))" strokeWidth="2" />
              ) : null;
            })}
          </g>
        )}
      </svg>
      )}

      <ul className="list-none p-0 mt-4 mb-0">
        {chart.series.map((s, i) => {
          const last = s.points[s.points.length - 1];
          const pct = Math.round(last.value - 100);
          return (
            <li key={i} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 py-2 border-b border-edge/60 text-[15px]">
              <button type="button" onClick={() => onPick(s)}
                className="text-foreground font-semibold underline underline-offset-4 hover:text-accent text-left">
                {s.name}
              </button>
              <span className="text-muted">{s.counts}</span>
              <span className="ml-auto tabular-nums text-foreground/85 shrink-0">
                {/* a lane that changes basis states each half — one percentage
                    across a break would quote two measurements as one */}
                {s.summary ?? `${s.base_year}–${last.year}: ${pct > 0 ? "+" : ""}${pct}%`}
              </span>
            </li>
          );
        })}
      </ul>
    </figure>
  );
}

/**
 * Two official series on one axis, deliberately unreconciled.
 *
 * Monochrome, so identity is carried by stroke weight and an end label rather
 * than colour: the emphasised series is heavy and solid, the second is lighter
 * and dashed. Ranges differ (FBI 1960-2025, CDC 1950-2023) and that is drawn
 * honestly — each line simply starts and stops where its data does.
 */
function TwoSeriesChart({ chart, onPick }: { chart: Chart; onPick: (s: ChartSeries) => void }) {
  const narrow = useNarrow();
  const [hoverYear, setHoverYear] = useState<number | null>(null);
  const [showMarkers, setShowMarkers] = useState(true);
  // Defaults to the shared Data-section window so this chart's years line up
  // with the suicide and overdose charts. The full record is one click away
  // rather than discarded — the 1980 and 1991 peaks are real and worth seeing,
  // they just should not set the axis for every other chart on the site.
  const [fullRecord, setFullRecord] = useState(false);
  // Connected legend (same contract as the lane and international charts):
  // hover/focus lights a series, tap once highlights, tap again opens detail.
  const [focus, setFocus] = useState<string | null>(null);

  // Levels or year-over-year change (Sean, 2026-08-22). Change is computed only
  // between CONSECUTIVE years: a series with a gap gets no bar across it, since
  // the difference between 2019 and 2024 is not a year-over-year change.
  const [mode, setMode] = useState<"level" | "change">("level");
  const showChange = mode === "change" && !!chart.change_view;

  const fmtV = (v: number) =>
    showChange
      ? `${v > 0 ? "+" : ""}${v.toFixed(v === 0 ? 0 : 1)}%`
      : chart.y_format === "millions" ? `${(v / 1e6).toFixed(v >= 10e6 ? 0 : 1)}M` : v.toFixed(0);

  const windowed = fullRecord ? chart.series : chart.series.map((s) => ({
    ...s,
    points: s.points.filter((p) => p.year >= DATA_WINDOW.from && p.year <= DATA_WINDOW.to),
  })).filter((s) => s.points.length > 1);

  const view = (showChange
    ? windowed.map((s) => ({
        ...s,
        points: s.points.flatMap((p, i) => {
          const prev = s.points[i - 1];
          if (!prev || p.year - prev.year !== 1 || !prev.value) return [];
          return [{ ...p, value: ((p.value - prev.value) / prev.value) * 100 }];
        }),
      })).filter((s) => s.points.length > 1)
    : windowed);

  const all = view.flatMap((s) => s.points);
  if (all.length < 2) return null;

  const beyond = chart.series.flatMap((s) => s.points).filter((p) => p.year < DATA_WINDOW.from);
  const earliest = beyond.length ? Math.min(...beyond.map((p) => p.year)) : null;

  // 900-wide viewBox on a 390px screen is a 0.43x scale, so these are sized to
  // clear the 9px floor the test suite asserts (measured 10.4px at 390px).
  const fsTick = narrow ? 24 : 11;
  const fsLabel = narrow ? 24 : 12.5;
  const W = 900, H = 340;
  const padL = narrow ? 78 : 54;
  const padR = narrow ? 24 : 180;
  const padT = narrow ? 30 : 26;
  const padB = narrow ? 52 : 38;

  const years = all.map((p) => p.year);
  const vals = all.map((p) => p.value);
  const x0 = fullRecord ? Math.min(...years) : DATA_WINDOW.from;
  const x1 = fullRecord ? Math.max(...years) : DATA_WINDOW.to;
  const v1 = Math.max(...vals) * 1.12;
  // Change mode needs zero on the axis, or a fall reads as a rise.
  const v0 = showChange ? Math.min(...vals, 0) * 1.12 : 0;
  const X = (y: number) => padL + ((y - x0) / (x1 - x0)) * (W - padL - padR);
  const Y = (v: number) => padT + (1 - (v - v0) / (v1 - v0)) * (H - padT - padB);

  const yTicks = (() => {
    const t = Array.from({ length: 5 }, (_, i) => v0 + ((v1 - v0) * i) / 4);
    // Zero must be ON the axis in change mode, or a fall reads as a rise.
    return showChange && !t.some((x) => Math.abs(x) < 1e-9) ? [...t, 0].sort((a, b) => a - b) : t;
  })();
  // Shared tick years in the default window; the full-record view spans 75
  // years and needs its own coarser stepping.
  let xTicks: number[] = [];
  if (fullRecord) {
    const xStep = narrow ? 20 : 10;
    for (let y = Math.ceil(x0 / xStep) * xStep; y <= x1; y += xStep) xTicks.push(y);
  } else {
    xTicks = dataWindowTicks(narrow);
  }

  /** True when a series has any gap wider than one year between points. */
  const sparse = (s: ChartSeries) =>
    s.points.some((p, i) => i > 0 && p.year - s.points[i - 1].year > 1);

  const hovered = hoverYear === null ? null : view.map((s) => ({
    s, p: s.points.find((p) => p.year === hoverYear),
  })).filter((h) => h.p);

  return (
    <figure className="m-0 mb-6">
      <figcaption className="font-display font-semibold text-foreground text-[19px] mb-1">
        {chart.title}
      </figcaption>
      <p className="text-muted text-[13px] m-0 mb-3">{chart.unit}</p>

      <ul className="list-none p-0 m-0 mb-3 flex flex-wrap gap-x-4 gap-y-1"
        onMouseLeave={() => setFocus(null)}>
        {view.map((s) => (
          <li key={s.name}>
            <button type="button"
              onMouseEnter={() => setFocus(s.name)}
              onFocus={() => setFocus(s.name)}
              onClick={() => {
                if (focus === s.name) onPick(chart.series.find((o) => o.name === s.name) || s);
                else setFocus(s.name);
              }}
              aria-pressed={focus === s.name}
              className={`flex items-center gap-2 text-[15px] py-1 px-1 border-b-2 transition-colors ${
                focus === s.name ? "border-foreground text-foreground"
                                 : "border-transparent text-foreground/70 hover:text-foreground"
              }`}>
              <svg width="22" height="8" aria-hidden="true">
                <line x1="0" y1="4" x2="22" y2="4" stroke="currentColor"
                  strokeWidth={s.emphasis ? 3 : 1.5} />
              </svg>
              {s.name.split("\u2014")[0].trim()}
            </button>
          </li>
        ))}
      </ul>

      <svg
        viewBox={`0 0 ${W} ${H}`} width="100%" role="img"
        aria-label={`${chart.title}. ${chart.unit}. Use the legend buttons to highlight a series and open its detail.`}
        onMouseLeave={() => setHoverYear(null)}
        style={{ fontFamily: "inherit", overflow: "visible" }}
      >
        {yTicks.map((t, i) => (
          <g key={i}>
            <line x1={padL} y1={Y(t)} x2={W - padR} y2={Y(t)} stroke="rgb(var(--edge))" strokeWidth="1" />
            <text x={padL - 8} y={Y(t) + 4} fontSize={fsTick} fill="rgb(var(--muted))" textAnchor="end">
              {fmtV(t)}
            </text>
          </g>
        ))}
        {xTicks.map((y) => (
          <text key={y} x={X(y)} y={H - (narrow ? 22 : 12)} fontSize={fsTick} fill="rgb(var(--muted))" textAnchor="middle">
            {y}
          </text>
        ))}

        {/* Dated context markers — toggleable so the default view stays clean. */}
        {showMarkers && chart.markers?.filter((m) => m.year >= x0 && m.year <= x1).map((m, mi) => {
          // Adjacent marker years (2020 and 2021) collide once rotated, so each
          // label steps down from the last when its neighbour is within 3 years.
          const prev = chart.markers![mi - 1];
          const step = prev && m.year - prev.year <= 3 ? 46 : 0;
          const ly = padT + 4 + step;
          return (
            <g key={m.year} opacity={0.55}>
              <line x1={X(m.year)} y1={padT} x2={X(m.year)} y2={H - padB}
                stroke="rgb(var(--muted))" strokeDasharray="2 4" strokeWidth="1" />
              {!narrow && (
                <text x={X(m.year) - 5} y={ly} fontSize="10.5" fill="rgb(var(--muted))"
                  textAnchor="end" transform={`rotate(-90 ${X(m.year) - 5} ${ly})`}>
                  {m.year}
                </text>
              )}
            </g>
          );
        })}

        {view.map((s, i) => {
          const pt = (p: { year: number; value: number }) =>
            `${X(p.year).toFixed(1)},${Y(p.value).toFixed(1)}`;
          const d = s.points.map((p, j) => `${j ? "L" : "M"}${pt(p)}`).join(" ");
          // Dotted means UN-VETTED, matching the Public Health charts, where a
          // dotted run marks a weaker or different basis. It must never carry
          // series identity — that is what stroke weight and the end label do.
          // Each non-Tier-A point is dotted together with the segment reaching
          // it, so the break is visible where the evidence changes.
          const weak: string[] = [];
          s.points.forEach((p, j) => {
            if (p.tier && p.tier !== "A") {
              if (j > 0) weak.push(`M${pt(s.points[j - 1])}L${pt(p)}`);
              if (j < s.points.length - 1) weak.push(`M${pt(p)}L${pt(s.points[j + 1])}`);
            }
          });
          const dim = focus !== null && focus !== s.name;
          const baseSw = s.emphasis ? (narrow ? 3.5 : 2.4) : (narrow ? 2.4 : 1.5);
          const sw = focus === s.name ? baseSw + 1.2 : baseSw;
          const last = s.points[s.points.length - 1];
          return (
            <g key={i}
              /* The modal is the supporting-data view, so it always opens the
                 COMPLETE series — never the windowed slice the axis shows. */
              onClick={() => onPick(chart.series.find((o) => o.name === s.name) || s)}
              onMouseEnter={() => setFocus(s.name)}
              style={{ cursor: "pointer", transition: "opacity 120ms" }}>
              <path
                d={d} fill="none" stroke="rgb(var(--foreground))"
                strokeWidth={sw}
                opacity={dim ? 0.18 : s.emphasis || focus === s.name ? 1 : 0.62}
              />
              {/* over-draw the un-vetted stretches in the background colour, then
                  redraw them dotted — a dashed overlay alone would leave the
                  solid line showing through beneath it */}
              {weak.map((w, k) => (
                <g key={k}>
                  <path d={w} fill="none" stroke="rgb(var(--background))" strokeWidth={sw + 1.6} />
                  <path d={w} fill="none" stroke="rgb(var(--foreground))" strokeWidth={sw}
                    strokeDasharray={narrow ? "2 5" : "1.5 4"} strokeLinecap="round"
                    opacity={s.emphasis ? 1 : 0.62} />
                </g>
              ))}
              {/* fat invisible hit target so the line is clickable on touch */}
              <path d={d} fill="none" stroke="transparent" strokeWidth={narrow ? 26 : 16} />
              {/* A series sampled at intervals (the CDC run is decadal before 2003)
                  must show WHERE it was sampled: a smooth line across a ten-year
                  gap implies values that were never published. */}
              {sparse(s) && s.points.map((pt) => (
                <circle key={pt.year} cx={X(pt.year)} cy={Y(pt.value)} r={narrow ? 4 : 2.8}
                  fill="rgb(var(--background))" stroke="rgb(var(--foreground))"
                  strokeWidth={narrow ? 2 : 1.4} opacity={0.85} />
              ))}
              {!narrow && (
                <text
                  x={X(last.year) + 8} y={Y(last.value) + 4} fontSize={fsLabel}
                  fill="rgb(var(--foreground))" fontWeight={s.emphasis ? 700 : 500}
                  opacity={s.emphasis ? 1 : 0.8}
                >
                  {s.name.split("—")[0].trim()}
                </text>
              )}
            </g>
          );
        })}

        {/* hover columns */}
        {Array.from({ length: x1 - x0 + 1 }, (_, i) => x0 + i).map((y) => (
          <rect key={y} x={X(y) - (W - padL - padR) / (x1 - x0) / 2} y={padT}
            width={Math.max(3, (W - padL - padR) / (x1 - x0))} height={H - padT - padB}
            fill="transparent" style={{ cursor: "pointer" }}
            onMouseEnter={() => setHoverYear(y)}
            onClick={(e) => {
              // The hover overlay sits above the lines, so it must forward
              // clicks: open the series whose value at this year is nearest
              // the pointer (falling back to the focused one).
              const svg = (e.currentTarget as SVGRectElement).ownerSVGElement!;
              const r = svg.getBoundingClientRect();
              const vy = ((e.clientY - r.top) / r.height) * H;
              let best: ChartSeries | null = null, bd = Infinity;
              for (const s of view) {
                const p = s.points.find((q) => q.year === y) ||
                  s.points.reduce((a, b) => Math.abs(b.year - y) < Math.abs(a.year - y) ? b : a);
                if (!p) continue;
                const d = Math.abs(Y(p.value) - vy);
                if (d < bd) { bd = d; best = s; }
              }
              const target = focus ? view.find((s) => s.name === focus) || best : best;
              if (target) onPick(chart.series.find((o) => o.name === target.name) || target);
            }} />
        ))}
        {hoverYear !== null && hovered && hovered.length > 0 && (
          <g pointerEvents="none">
            <line x1={X(hoverYear)} y1={padT} x2={X(hoverYear)} y2={H - padB}
              stroke="rgb(var(--muted))" strokeDasharray="3 3" />
            {hovered.map((h, i) => (
              <circle key={i} cx={X(hoverYear)} cy={Y(h.p!.value)} r={narrow ? 6 : 4.5}
                fill="rgb(var(--background))" stroke="rgb(var(--foreground))" strokeWidth="2" />
            ))}
            <text x={Math.min(Math.max(X(hoverYear), padL + 90), W - padR - 90)} y={padT - 8}
              fontSize={fsLabel} fill="rgb(var(--foreground))" textAnchor="middle" fontWeight="600">
              {(() => {
                const f = focus ? hovered.find((h) => h.s.name === focus) : null;
                return f
                  ? `${f.s.name.split("\u2014")[0].trim()} \u00b7 ${hoverYear} \u00b7 ${fmtV(f.p!.value)}`
                  : `${hoverYear}: ${hovered.map((h) => fmtV(h.p!.value)).join(" / ")}`;
              })()}
            </text>
          </g>
        )}
      </svg>

      <div className="flex flex-wrap items-center gap-4 mt-3">
        <button
          type="button"
          onClick={() => { setShowMarkers((v) => !v); track("crime_markers_toggled"); }}
          aria-pressed={showMarkers}
          className="text-[14px] text-muted hover:text-foreground underline underline-offset-4"
        >
          {showMarkers ? "Hide" : "Show"} dated markers
        </button>
        {earliest && (
          <button
            type="button"
            onClick={() => { setFullRecord((v) => !v); track("crime_full_record_toggled"); }}
            aria-pressed={fullRecord}
            className="text-[14px] text-muted hover:text-foreground underline underline-offset-4"
          >
            {fullRecord
              ? `Back to ${DATA_WINDOW.from}\u2013${DATA_WINDOW.to}`
              : `Show the full record (${earliest}\u2013${DATA_WINDOW.to})`}
          </button>
        )}
        {chart.change_view && (
          <span role="group" aria-label="Chart view" className="flex gap-1">
            {([["level", "Levels"], ["change", "Year-over-year change"]] as const).map(([m, label]) => (
              <button key={m} type="button"
                onClick={() => { setMode(m); track("crime_chart_mode", { mode: m }); }}
                aria-pressed={mode === m}
                className={`text-[13px] px-3 py-1 border transition-colors ${
                  mode === m ? "border-foreground text-foreground font-semibold"
                             : "border-edge text-muted hover:text-foreground"
                }`}>
                {label}
              </button>
            ))}
          </span>
        )}
        <span className="text-muted text-[14px]">Click either line for its method and sources.</span>
      </div>
      {showChange && (
        <p className="text-muted text-[14px] measure mt-2 mb-0">
          <strong className="text-foreground">Showing year-over-year change.</strong>{" "}
          Each point is one year against the one before it, so a year with no
          published predecessor has no point — the difference between 2019 and 2024
          is not a year-over-year change and is not drawn as one.
        </p>
      )}

      {/* On phones the end labels are dropped, so the key carries identity. */}
      {narrow && (
        <ul className="list-none p-0 mt-3 mb-0">
          {view.map((s, i) => (
            <li key={i} className="text-[15px] text-foreground/85 py-1">
              <span className="font-semibold">{s.emphasis ? "———" : "‒‒‒"}</span> {s.name}
            </li>
          ))}
        </ul>
      )}
      {/* A compact KEY, not a caveat paragraph: what a mark means belongs at
          the chart. The reasoning behind the grammar lives in the disclaimer. */}
      <p className="text-muted text-[14px] measure mt-3 mb-0">
        <span className="text-foreground">· · ·</span> Dotted stretches are years that are
        not Tier A. Weight, not dashing, separates the two series.
      </p>
    </figure>
  );
}

/* ----------------------------------------------------------------- view --- */

export default function CrimeSignals({ onGoTimeline }: { onGoTimeline?: () => void }) {
  const indicators = useTable<Indicator>("/data/crime/tables/crime_indicators.json");
  const dq = useTable<DQ>("/data/crime/tables/crime_data_quality.json");
  const trends = useTable<Trend>("/data/crime/tables/crime_trends.json");
  const caveats = useTable<Caveat>("/data/crime/tables/crime_caveats.json");
  const sources = useTable<SourceRec>("/data/crime/tables/crime_sources.json");
  const verdict = useDoc<Verdict>("/data/crime/tables/crime_verdict.json");
  const chart = useDoc<Chart>("/data/crime/charts/homicide_two_measures.json");
  const lanes = useDoc<LaneChart>("/data/crime/charts/harm_lanes_indexed.json");
  // Reports of the unexplained (Sean, 2026-08-22). Sits in Act 3, with the
  // limits, because three of its four lanes are really findings about what is
  // and is not counted.
  const anomalies = useDoc<LaneChart>("/data/crime/charts/anomalies_indexed.json");
  const notCounted = useTable<NotCounted>("/data/crime/tables/crime_not_counted.json");
  const sweeps = useTable<Sweep>("/data/crime/tables/crime_sweeps.json");
  const tr = useDoc<TR>("/data/crime/tables/crime_transnational.json");
  const intl = useDoc<IntlChartDoc>("/data/crime/charts/homicide_international.json");
  const burg = useDoc<IntlChartDoc & {
    themes?: { statement: string; tier: string }[];
    answer?: { question: string; body: string; consequence: string; tier: string;
               source_ids?: string[]; source_id?: string | null };
  }>("/data/crime/charts/burglary_international.json");
  const arrests = useDoc<Chart>("/data/crime/charts/arrests_over_time.json");
  const accomplishments = useDoc<{ title: string; intro: string; discipline: string;
    rows: { what: string; kind: string; claim: string; corroboration: string; tier: string; source_id: string | null }[];
  }>("/data/crime/tables/crime_accomplishments.json");
  const intlDrugs = useDoc<{ title: string; why_no_chart: string; rows: any[] }>("/data/crime/tables/crime_intl_drug_deaths.json");
  const intlMissing = useDoc<{ title: string; why_no_chart: string; rows: any[] }>("/data/crime/tables/crime_intl_missing.json");
  const [intlPicked, setIntlPicked] = useState<IntlSeries | null>(null);
  const detention = useDoc<DetChart>("/data/crime/charts/detention_capacity.json");
  const [detPicked, setDetPicked] = useState<DetSeries | null>(null);
  // Incarceration (Sean, 2026-08-22): arrests are a flow counted by police,
  // this is the stock counted by corrections — a genuinely independent check
  // on whether the enforcement story shows up anywhere else.
  const incarc = useDoc<DetChart>("/data/crime/charts/incarceration_over_time.json");
  const intlIncarc = useDoc<{ title: string; why_no_chart: string; rows: any[] }>(
    "/data/crime/tables/crime_intl_incarceration.json");
  const nav = useSectionNav("crime-root");

  const srcs = sources || [];
  const [picked, setPicked] = useState<ChartSeries | null>(null);
  const [lanePicked, setLanePicked] = useState<Lane | null>(null);

  // Escape closes the series modal. Caught by the test suite: without this the
  // dialog traps the reader, since the backdrop and the close button were the
  // only exits and neither is reachable from the keyboard.
  useEffect(() => {
    if (!picked && !lanePicked && !intlPicked && !detPicked) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setPicked(null); setLanePicked(null); setIntlPicked(null); setDetPicked(null); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [picked, lanePicked, intlPicked, detPicked]);

  const trendsP = usePager(trends, 5);
  const dqP = usePager(dq, 5);
  const srcP = usePager(srcs, 25);

  // 2026 year-to-date. Kept off the chart on purpose (see cq09): a partial year
  // plotted on an annual series reads as a completed one.
  const ytd = useMemo(
    () => (indicators || []).filter((r) => r.workstream === "W1-YTD"),
    [indicators],
  );
  const ytdLabel: Record<string, string> = {
    ccj_h1_homicide_pct_change: "Homicide",
    ccj_h1_robbery_pct_change: "Robbery",
    ccj_h1_carjacking_pct_change: "Carjacking",
    ccj_h1_mv_theft_pct_change: "Motor vehicle theft",
    ccj_h1_gun_assault_pct_change: "Gun assault",
    ccj_h1_agg_assault_pct_change: "Aggravated assault",
    ccj_h1_sexual_assault_pct_change: "Sexual assault",
    ccj_h1_domestic_violence_pct_change: "Domestic violence",
    rtci_ytd_murder_pct_change: "Murder (separate 566-agency index, to April)",
  };

  const clearance = useMemo(
    () => (indicators || [])
      .filter((r) => r.indicator_id === "homicide_clearance_rate")
      .sort((a, b) => a.year - b.year),
    [indicators],
  );

  return (
    // Grid, not float (Sean, 2026-08-21): a floated rail is ignored by
    // block-level siblings, so every section rendered underneath it — the
    // overlap and the vertical gap were the same bug. min-w-0 lets the content
    // track shrink below its children's intrinsic width, which is what keeps
    // the 100%-width chart SVGs inside their column.
    <div className="w-full lg:grid lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-x-10 lg:items-start">
      <SideNav mode="outline" sections={nav.sections} active={nav.active} />
      <div id="crime-root" className="min-w-0">
      {/* ================= THE OPENING =================
          Sean, 2026-08-22: "Do not begin the Data/Crime page with text. Use a
          chart." So the six-lane chart is the first thing rendered — no note
          line, no act banner, no verdict above it.

          The verdict moved under the chart at the same time, and that fixed a
          duplication as well as an ordering problem: the old verdict summary
          enumerated overdoses, homicide, defamation and missing persons, which
          are the first four rows of this chart's own summary block a screen
          below. The reader met the same four findings twice before seeing a
          line drawn. The verdict now answers the question instead, and the
          lanes are left to the chart. Scope note follows the chart per Sean's
          choice of option B. ================================================ */}
      <section className="mb-16">
        {lanes === null ? <SkeletonChart /> : (
          <>
            <LaneChart chart={lanes} onPick={setLanePicked} />
            {!!lanes.themes?.length && (
              <div className="mt-2 mb-5">
                <h3 className="font-display font-semibold text-foreground text-[19px] mb-2">
                  What the chart shows
                </h3>
                <ul className="list-none p-0 m-0">
                  {lanes.themes.map((t, i) => (
                    <li key={i} className="flex items-baseline gap-3 py-2 border-b border-edge/60 text-[16px] text-foreground/90">
                      <TierChip t={t.tier} />
                      <span className="measure">{t.statement}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <p className="text-muted text-[15px] measure">{lanes.note}</p>
          </>
        )}

      {/* The section's overall result, stated once, dismissible. Sean asked for
          the finding and the limit together — and for the limit to point at the
          disclaimer rather than repeat it here. */}
      <DismissibleNote storageKey="is_crime_section_findings_v1">
        <strong className="text-foreground/80">What this section found:</strong> crime did not
        rise overall between 1999 and 2025. Overdose deaths and defamation filings did.
        Harassment cannot be answered &mdash; nobody counts it. These findings are only as good
        as the records we could reach.{" "}
        <DisclaimerLink from="crime">Read the full disclaimer</DisclaimerLink>.
      </DismissibleNote>

      <DataNoteLine from="crime">
        United States only unless a chart says otherwise · AI-assisted research from public
        records · every figure evidence-graded and linked to the source it was read from ·
        dotted, hollow, broken and points-only lines all mean specific things, set out under
        &ldquo;How to read the charts&rdquo; in the{" "}
        <DisclaimerLink from="crime">full disclaimer</DisclaimerLink> ·
      </DataNoteLine>

      {/* ---- the verdict: the considered answer, under the chart it rests on ---- */}
      {verdict === null ? <SectionSkeleton title="Is crime rising or falling?" /> : (
        <div>
          <h2 className="font-display font-semibold text-foreground text-[21px] mb-3">
            {verdict.claim}
          </h2>
          {verdict.summary.split("\n\n").map((para, i) => (
            <p key={i} className="body-copy text-foreground/90 measure">{para}</p>
          ))}
          <ul className="list-none p-0 m-0 mt-4">
            {verdict.key_figures.map((f, i) => (
              <li key={i} className="flex items-baseline gap-3 py-2 border-b border-edge/60 text-[16px] text-foreground/85">
                <TierChip t={f.tier} />
                <span className="measure">{f.figure}</span>
                <span className="ml-auto"><SourceLink id={f.source_id} sources={srcs} /></span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {intlDrugs && (
        <div className="mt-10 pt-6 border-t border-edge">
          <h3 className="font-display font-semibold text-foreground text-[19px] mb-2">{intlDrugs.title}</h3>
          <p className="text-muted text-[15px] measure mb-6">
            Overdose deaths are the steepest-rising lane on the chart above, and nobody was
            charged with any of them. They sit here as a measure of harm, not of crime; the
            Public Health section carries the substantive record. {intlDrugs.why_no_chart}
          </p>
          <ul className="list-none p-0 m-0">
            {intlDrugs.rows.map((r, i) => (
              <li key={i} className="py-3 border-b border-edge/60">
                <div className="flex flex-wrap items-baseline gap-3 text-[16px]">
                  <TierChip t={r.tier === "absence" ? "A" : r.tier} />
                  <span className="text-foreground font-semibold">{r.country}</span>
                  {r.value !== null ? (
                    <span className="text-foreground/85 tabular-nums">
                      {r.value.toLocaleString()} <span className="text-muted">({r.year})</span>
                    </span>
                  ) : (
                    <span className="text-muted uppercase tracking-wide text-[13px]">not counted comparably</span>
                  )}
                  <span className="ml-auto"><SourceLink id={r.source_id} sources={srcs} /></span>
                </div>
                <p className="text-muted text-[14px] measure mt-1 mb-0">
                  {r.unit ? `${r.unit}. ` : ""}{r.definition}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
      </section>


      {/* ---- homicide: one lens among several, no longer the lead ---- */}
      <section className="mb-12">
        <h2 className="font-display font-semibold text-foreground text-[21px] mb-4">
          Homicide
        </h2>
        {chart === null ? <SkeletonChart /> : (
          <>
            <TwoSeriesChart chart={chart} onPick={setPicked} />
            {!!chart.themes?.length && (
              <div className="mt-2 mb-5">
                <h3 className="font-display font-semibold text-foreground text-[19px] mb-2">What this shows</h3>
                <ul className="list-none p-0 m-0">
                  {chart.themes.map((t, i) => (
                    <li key={i} className="flex items-baseline gap-3 py-2 border-b border-edge/60 text-[16px] text-foreground/90">
                      <TierChip t={t.tier} />
                      <span className="measure">{t.statement}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <p className="text-muted text-[15px] measure">{chart.note}</p>
          </>
        )}
      </section>

      {/* ---- clearance ---- */}
      {!!clearance.length && (
        <section className="mb-16">
          <h3 className="font-display font-semibold text-foreground text-[19px] mb-2">
            How many homicides are cleared
          </h3>
          <p className="text-muted text-[15px] mb-6 measure">
            &ldquo;Cleared&rdquo; means closed by arrest or by exceptional means &mdash; which
            includes cases where the suspect died or could not be extradited. It is not a
            conviction rate, and it is not a solve rate, though it is reported as both.
            These are selected years: no continuous national annual series is published.
          </p>
          <ul className="list-none p-0 m-0">
            {clearance.map((r) => (
              <li key={r.year} className="flex items-baseline gap-3 py-3 border-b border-edge/60 text-[16px] text-foreground/85">
                <TierChip t={r.tier} />
                <span className="font-semibold text-foreground w-16 shrink-0">{r.year}</span>
                <span>{r.value}%</span>
                <span className="ml-auto"><SourceLink id={r.source_id} sources={srcs} /></span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ---- international (Sean, 2026-08-21): one honest chart, two honest
             non-charts ---- */}
      <section className="mb-14">
        <h2 className="font-display font-semibold text-foreground text-[21px] mb-4">
          Homicide against the world
        </h2>
        {intl === null ? <SkeletonChart /> : (
          <>
            <IntlLineChart chart={intl} onPick={setIntlPicked} />
            {!!(intl as any).themes?.length && (
              <div className="mt-2 mb-5">
                <h3 className="font-display font-semibold text-foreground text-[19px] mb-2">What this shows</h3>
                <ul className="list-none p-0 m-0">
                  {(intl as any).themes.map((t: { statement: string; tier: string }, i: number) => (
                    <li key={i} className="flex items-baseline gap-3 py-2 border-b border-edge/60 text-[16px] text-foreground/90">
                      <TierChip t={t.tier} />
                      <span className="measure">{t.statement}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <p className="text-muted text-[15px] measure">{intl.note}</p>
          </>
        )}
      </section>

      {/* ---- break-ins abroad, and the offence that is not an offence
             (Sean, 2026-08-21: "have home invasions increased in the US and
             abroad?" and "are they documented or labelled as a burglary?").
             The chart answers the first question; the block under it answers
             the second, which turns out to be why the first has no answer. ---- */}
      <section className="mb-14">
        <h2 className="font-display font-semibold text-foreground text-[21px] mb-4">
          Break-ins
        </h2>
        {burg === null ? <SkeletonChart /> : (
          <>
            <IntlLineChart chart={burg} onPick={setIntlPicked} />
            {!!burg.themes?.length && (
              <div className="mt-2 mb-5">
                <h3 className="font-display font-semibold text-foreground text-[19px] mb-2">What this shows</h3>
                <ul className="list-none p-0 m-0">
                  {burg.themes.map((t, i) => (
                    <li key={i} className="flex items-baseline gap-3 py-2 border-b border-edge/60 text-[16px] text-foreground/90">
                      <TierChip t={t.tier} />
                      <span className="measure">{t.statement}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <p className="text-muted text-[15px] measure">{burg.note}</p>
            {burg.answer && (
              <div className="mt-8 pt-6 border-t border-edge">
                <h3 className="font-display font-semibold text-foreground text-[19px] mb-3">
                  {burg.answer.question}
                </h3>
                <p className="body-copy text-foreground/90 measure">{burg.answer.body}</p>
                <p className="body-copy text-foreground/90 measure">{burg.answer.consequence}</p>
                {/* one paragraph, several publishers — every one of them files
                    home invasion under something else, so listing a single
                    source would hide most of the evidence for the finding */}
                <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-[15px] mt-4 mb-0">
                  <TierChip t={burg.answer.tier} />
                  <span className="text-muted">Recorded in full in the register below.</span>
                  <span className="ml-auto flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    {(burg.answer.source_ids ?? [burg.answer.source_id ?? null]).map((id, i) => (
                      <SourceLink key={i} id={id} sources={srcs} />
                    ))}
                  </span>
                </p>
              </div>
            )}
          </>
        )}
      </section>

      {/* ---- arrests over time (Sean, 2026-08-21): the 1997 peak ---- */}
      <section className="mb-14">
        {arrests === null ? <SkeletonChart /> : (
          <>
            <h2 className="font-display font-semibold text-foreground text-[21px] mb-3">
              Arrests
            </h2>
            {arrests.accuracy_note && (
              <DismissibleNote storageKey="is_crime_arrests_accuracy_v1">
                {arrests.accuracy_note}
              </DismissibleNote>
            )}
            <TwoSeriesChart chart={arrests} onPick={setPicked} />
            {!!arrests.themes?.length && (
              <div className="mt-2 mb-5">
                <h3 className="font-display font-semibold text-foreground text-[19px] mb-2">
                  What the chart shows
                </h3>
                <ul className="list-none p-0 m-0">
                  {arrests.themes.map((t, i) => (
                    <li key={i} className="flex items-baseline gap-3 py-2 border-b border-edge/60 text-[16px] text-foreground/90">
                      <TierChip t={t.tier} />
                      <span className="measure">{t.statement}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <p className="text-muted text-[15px] measure">{arrests.note}</p>
          </>
        )}
      </section>

      {/* ---- sweeping enforcement: headline arrest numbers ---- */}
      {!!sweeps?.length && (
        <section className="mb-14">
          <h3 className="font-display font-semibold text-foreground text-[19px] mb-2">
            Enforcement in sweeps
          </h3>
          <p className="text-muted text-[15px] mb-6 measure">
            Arrest counts announced as headline figures. An arrest is an enforcement
            action, not an adjudicated fact &mdash; each entry records what the number
            actually counts.
          </p>
          <ul className="list-none p-0 m-0">
            {sweeps.map((w) => (
              <li key={w.sweep_id} className="py-4 border-b border-edge/60">
                <div className="flex flex-wrap items-baseline gap-3">
                  <TierChip t={w.tier} />
                  <span className="text-foreground text-[17px] font-semibold">{w.operation}</span>
                  <span className="text-muted text-[14px]">{w.date}</span>
                  <span className="ml-auto"><SourceLink id={w.source_id} sources={srcs} /></span>
                </div>
                <p className="body-copy text-foreground/85 measure mt-2 mb-0 text-[17px]">
                  {w.headline} <span className="text-muted">&mdash; {w.agency}</span>
                </p>
                <p className="text-muted text-[15px] measure mt-2 mb-0">{w.what_the_number_is}</p>
                <p className="text-muted text-[15px] measure mt-1 mb-0"><em>For scale:</em> {w.for_scale}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ---- law enforcement accomplishments (Sean, 2026-08-21) ---- */}
      {accomplishments && (
        <section className="mb-14">
          <h3 className="font-display font-semibold text-foreground text-[19px] mb-3">
            {accomplishments.title}
          </h3>
          <p className="body-copy text-foreground/90 measure mb-6">{accomplishments.intro}</p>
          <ul className="list-none p-0 m-0">
            {accomplishments.rows.map((r, i) => (
              <li key={i} className="py-4 border-b border-edge/60">
                <div className="flex flex-wrap items-baseline gap-3">
                  <TierChip t={r.tier} />
                  <span className="text-foreground text-[17px] font-semibold">{r.what}</span>
                  <span className="text-muted text-[13px] uppercase tracking-wide">{r.kind}</span>
                  <span className="ml-auto"><SourceLink id={r.source_id} sources={srcs} /></span>
                </div>
                <p className="body-copy text-foreground/85 measure mt-2 mb-0 text-[17px]">{r.claim}</p>
                <p className="text-muted text-[14px] measure mt-1 mb-0">{r.corroboration}</p>
              </li>
            ))}
          </ul>
          <p className="text-muted text-[15px] measure mt-4">{accomplishments.discipline}</p>
        </section>
      )}

      {/* ---- transnational repression (Sean, 2026-08-21) ---- */}
      {tr && (
        <section className="mb-14">
          <h3 className="font-display font-semibold text-foreground text-[19px] mb-3">
            Transnational repression
          </h3>
          <p className="body-copy text-foreground/90 measure">
            <TierChip t={tr.what_it_is.tier} />{" "}
            &ldquo;{tr.what_it_is.definition}&rdquo;{" "}
            <span className="text-muted text-[15px]">&mdash; {tr.what_it_is.definition_source}.</span>
          </p>
          <p className="text-muted text-[15px] measure mt-3">
            {tr.what_it_is.named_states} FBI Philadelphia&rsquo;s framing:{" "}
            &ldquo;{tr.what_it_is.philadelphia_definition}&rdquo; ({tr.what_it_is.philadelphia_note})
          </p>
          <h3 className="font-display font-semibold text-foreground text-[17px] mt-6 mb-2">
            The FBI&rsquo;s own tactic list
          </h3>
          <ul className="list-disc pl-5 m-0 text-[16px] text-foreground/85 measure">
            {tr.what_it_is.tactics.map((t, i) => <li key={i} className="mb-1">{t}</li>)}
          </ul>
          <p className="text-muted text-[15px] measure mt-3">{tr.what_it_is.tactics_note}</p>

          <h3 className="font-display font-semibold text-foreground text-[17px] mt-6 mb-2">
            How it is measured &mdash; if at all
          </h3>
          <ul className="list-none p-0 m-0">
            {tr.how_it_is_measured.map((m, i) => (
              <li key={i} className="py-4 border-b border-edge/60">
                <div className="flex flex-wrap items-baseline gap-3">
                  <TierChip t={m.tier} />
                  <span className="text-foreground text-[16px] font-semibold">{m.who}</span>
                  <span className="text-muted text-[14px] uppercase tracking-wide">{m.status}</span>
                  <span className="ml-auto"><SourceLink id={m.source_id} sources={srcs} /></span>
                </div>
                <p className="body-copy text-foreground/85 measure mt-2 mb-0 text-[17px]">{m.what}</p>
              </li>
            ))}
          </ul>
          <p className="body-copy text-foreground/90 measure mt-5">{tr.the_gap}</p>
          <p className="text-muted text-[15px] measure mt-3">{tr.discipline_note}</p>
        </section>
      )}

      {/* ---- incarceration: the stock, where arrests were the flow
             (Sean, 2026-08-22). Sits between arrests and ICE detention on
             purpose: who gets arrested, who ends up held, and the separate
             civil system running alongside. Chart first, plain-language block
             underneath, per the section's standing rule. ---- */}
      <section className="mb-14">
        <h2 className="font-display font-semibold text-foreground text-[21px] mb-3">
          Who is held
        </h2>
        {incarc === null ? <SkeletonChart /> : (
          <>
            {incarc.accuracy_note && (
              <DismissibleNote storageKey="is_crime_incarceration_accuracy_v1">
                {incarc.accuracy_note}
              </DismissibleNote>
            )}
            <DetentionChart chart={incarc} onPick={setDetPicked} />
            {!!incarc.themes?.length && (
              <div className="mt-2 mb-5">
                <h3 className="font-display font-semibold text-foreground text-[19px] mb-2">
                  What the chart shows
                </h3>
                <ul className="list-none p-0 m-0">
                  {incarc.themes.map((t, i) => (
                    <li key={i} className="flex items-baseline gap-3 py-2 border-b border-edge/60 text-[16px] text-foreground/90">
                      <TierChip t={t.tier} />
                      <span className="measure">{t.statement}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <p className="text-muted text-[15px] measure">{incarc.note}</p>

          </>
        )}
      </section>

      {/* ---- incarceration internationally: the third documented non-chart ---- */}
      {intlIncarc && (
        <section className="mb-14">
          <h3 className="font-display font-semibold text-foreground text-[19px] mb-2">{intlIncarc.title}</h3>
          <p className="text-muted text-[15px] measure mb-6">{intlIncarc.why_no_chart}</p>
          <ul className="list-none p-0 m-0">
            {intlIncarc.rows.map((r, i) => (
              <li key={i} className="py-3 border-b border-edge/60">
                <div className="flex flex-wrap items-baseline gap-3 text-[16px]">
                  <TierChip t={r.tier} />
                  <span className="text-foreground font-semibold">{r.country}</span>
                  <span className="text-foreground/85 tabular-nums">
                    {r.value.toLocaleString()}{" "}
                    <span className="text-muted">{r.unit}</span>
                  </span>
                  {/* the date is the point of this table, so it is never a footnote */}
                  <span className="text-muted text-[14px] italic">as at {r.year}</span>
                  <span className="ml-auto"><SourceLink id={r.source_id} sources={srcs} /></span>
                </div>
                <p className="text-muted text-[14px] measure mt-1 mb-0">{r.definition}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ---- detention: where a sweep goes (Sean, 2026-08-21) ---- */}
      <section className="mb-14">
        {detention === null ? <SkeletonChart /> : (
          <>
            <h2 className="font-display font-semibold text-foreground text-[21px] mb-3">
              ICE detention
            </h2>
            {detention.accuracy_note && (
              <DismissibleNote storageKey="is_crime_detention_accuracy_v1">
                {detention.accuracy_note}
              </DismissibleNote>
            )}
            <DetentionChart chart={detention} onPick={setDetPicked} />
            {!!detention.themes?.length && (
              <div className="mt-2 mb-5">
                <h3 className="font-display font-semibold text-foreground text-[19px] mb-2">
                  What the chart shows
                </h3>
                <ul className="list-none p-0 m-0">
                  {detention.themes.map((t, i) => (
                    <li key={i} className="flex items-baseline gap-3 py-2 border-b border-edge/60 text-[16px] text-foreground/90">
                      <TierChip t={t.tier} />
                      <span className="measure">{t.statement}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <p className="text-muted text-[15px] measure">{detention.note}</p>
          </>
        )}
      </section>

      {/* ---- what nobody counts: the lead finding (Sean, 2026-08-21) ---- */}
      {/* ---- reports of the unexplained: chart first, plain-language block
             underneath, absences carried at the same weight as the lines ---- */}
      <section className="mb-14">
        <h2 className="font-display font-semibold text-foreground text-[21px] mb-3">
          Reports of the unexplained
        </h2>
        {anomalies === null ? <SkeletonChart /> : (
          <>
            <LaneChart chart={anomalies} onPick={setLanePicked} />
            {!!anomalies.themes?.length && (
              <div className="mt-2 mb-5">
                <h3 className="font-display font-semibold text-foreground text-[19px] mb-2">
                  What the chart shows
                </h3>
                <ul className="list-none p-0 m-0">
                  {anomalies.themes.map((t, i) => (
                    <li key={i} className="flex items-baseline gap-3 py-2 border-b border-edge/60 text-[16px] text-foreground/90">
                      <TierChip t={t.tier} />
                      <span className="measure">{t.statement}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <p className="text-muted text-[15px] measure">{anomalies.note}</p>
          </>
        )}
      </section>

      {notCounted === null ? <SectionSkeleton title="What nobody counts" /> : !!notCounted.length && (
        <section className="mb-14">
          <h3 className="font-display font-semibold text-foreground text-[19px] mb-3">
            What nobody counts
          </h3>
          <p className="body-copy text-foreground/90 measure mb-6">
            The kinds of harm this site is most concerned with are the ones with no
            national statistic. That is not a research failure &mdash; it is the finding.
            Each entry below names what is uncounted, why, and the body that would have
            to count it and does not.
          </p>
          <ul className="list-none p-0 m-0">
            {notCounted.map((n) => (
              <li key={n.nc_id} className="py-4 border-b border-edge/60">
                <div className="flex flex-wrap items-baseline gap-3">
                  <TierChip t={n.tier} />
                  <span className="text-foreground text-[17px] font-semibold">{n.category}</span>
                  <span className="text-muted text-[14px] uppercase tracking-wide">{n.status}</span>
                  <span className="ml-auto"><SourceLink id={n.source_id} sources={srcs} /></span>
                </div>
                <p className="body-copy text-foreground/85 measure mt-2 mb-0 text-[17px]">{n.detail}</p>
                <p className="text-muted text-[14px] measure mt-2 mb-0">
                  <em>Who would have to count it:</em> {n.who_would_collect}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {intlMissing && (
        <section className="mb-14">
          <h3 className="font-display font-semibold text-foreground text-[19px] mb-2">{intlMissing.title}</h3>
          <p className="text-muted text-[15px] measure mb-6">{intlMissing.why_no_chart}</p>
          <ul className="list-none p-0 m-0">
            {intlMissing.rows.map((r, i) => (
              <li key={i} className="py-3 border-b border-edge/60">
                <div className="flex flex-wrap items-baseline gap-3 text-[16px]">
                  <TierChip t={r.tier} />
                  <span className="text-foreground font-semibold">{r.country}</span>
                  <span className="text-foreground/85 tabular-nums">
                    {r.value.toLocaleString()} <span className="text-muted">({r.year})</span>
                  </span>
                  <span className="ml-auto"><SourceLink id={r.source_id} sources={srcs} /></span>
                </div>
                <p className="text-muted text-[14px] measure mt-1 mb-0">{r.unit}. {r.note}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ---- method: the one section that owns no chart, and says why ---- */}
      <section className="mb-10 pt-6 border-t-2 border-edge">
        <h2 className="font-display font-semibold text-foreground text-[21px] mb-2">
          Method, limits and sources
        </h2>
        <p className="text-muted text-[15px] measure mb-0">
          Every section above opens with a chart. This one has none, because what follows is
          how the counting was done and where it fails &mdash; the partial year, the trends,
          the data-quality register, and the 197 sources every figure resolves to. See the{" "}
          <DisclaimerLink from="crime">full disclaimer</DisclaimerLink> for how this research
          was gathered and how to read the charts.
        </p>
      </section>

      {/* ---- 2026 year to date ---- */}
      {!!ytd.length && (
        <section className="mb-16">
          <h3 className="font-display font-semibold text-foreground text-[19px] mb-2">
            Where 2026 stands
          </h3>
          <p className="text-muted text-[15px] mb-6 measure">
            The chart above ends at 2025, the last complete year, so it lines up with every
            other chart in this section. There is no national 2026 statistic yet — the FBI
            publishes annually. What exists is below: a 36-city half-year comparison and a
            separate 566-agency index. Both are urban samples, not the country.
          </p>
          <ul className="list-none p-0 m-0">
            {ytd.map((r) => {
              const up = r.value > 0;
              return (
                <li key={r.indicator_id}
                  className="flex items-baseline gap-3 py-3 border-b border-edge/60 text-[16px] text-foreground/85">
                  <TierChip t={r.tier} />
                  <span className="measure">{ytdLabel[r.indicator_id] || r.indicator_id}</span>
                  <span className={`font-semibold tabular-nums ${up ? "text-foreground" : "text-foreground/70"}`}>
                    {up ? "+" : ""}{r.value}%
                  </span>
                  {up && <span className="text-[13px] uppercase tracking-wide text-foreground">rose</span>}
                  <span className="ml-auto"><SourceLink id={r.source_id} sources={srcs} /></span>
                </li>
              );
            })}
          </ul>
          <p className="text-muted text-[14px] measure mt-4">
            Nine of thirteen offences fell. The two that rose are listed alongside the rest,
            not omitted: reporting only the decline would be the selective framing this
            dataset exists to avoid.
          </p>
        </section>
      )}

      {/* ---- trends ---- */}
      {trends === null ? <SectionSkeleton title="What the series show" /> : !!trends.length && (
        <section ref={trendsP.ref} className="mb-16">
          <h3 className="font-display font-semibold text-foreground text-[19px] mb-2">What the series show</h3>
          <ul className="list-none p-0 m-0">
            {trendsP.slice.map((t, i) => (
              <li key={i} className="flex items-baseline gap-3 py-3 border-b border-edge/60 text-[16px] text-foreground/85">
                <TierChip t={t.tier} />
                <span className="measure">{t.statement}</span>
                <span className="ml-auto"><SourceLink id={t.source_id} sources={srcs} /></span>
              </li>
            ))}
          </ul>
          <ListPager page={trendsP.page} totalPages={trendsP.totalPages} setPage={trendsP.setPage} scrollTo={trendsP.scrollTo} />
        </section>
      )}

      {/* ---- data quality: the spine ---- */}
      {dq === null ? <SectionSkeleton title="How much the numbers can be trusted" /> : !!dq.length && (
        <section ref={dqP.ref} className="mb-16">
          <h3 className="font-display font-semibold text-foreground text-[19px] mb-2">
            How much the numbers can be trusted
          </h3>
          <p className="text-muted text-[15px] mb-6 measure">
            This register is the section, not a footnote to it. Where the counting is the
            problem, the counting is the finding.
          </p>
          <ul className="list-none p-0 m-0">
            {dqP.slice.map((d) => (
              <li key={d.dq_id} className="py-4 border-b border-edge/60">
                <div className="flex items-baseline gap-3">
                  <TierChip t={d.tier} />
                  <span className="text-foreground text-[16px] font-medium measure">{d.topic}</span>
                  <span className="ml-auto"><SourceLink id={d.source_id} sources={srcs} /></span>
                </div>
                <p className="body-copy text-foreground/85 measure mt-2 mb-0 text-[17px]">{d.issue}</p>
                <p className="text-muted text-[15px] measure mt-2 mb-0"><em>Effect:</em> {d.effect}</p>
              </li>
            ))}
          </ul>
          <ListPager page={dqP.page} totalPages={dqP.totalPages} setPage={dqP.setPage} scrollTo={dqP.scrollTo} />
        </section>
      )}

      {/* ---- caveats ---- */}
      {!!caveats?.length && (
        <section className="mb-16">
          <h3 className="font-display font-semibold text-foreground text-[19px] mb-2">
            Read before quoting any figure
          </h3>
          <ul className="list-none p-0 m-0">
            {caveats.map((c, i) => (
              <li key={i} className="flex items-baseline gap-3 py-3 border-b border-edge/60 text-[16px] text-foreground/85">
                <TierChip t={c.tier} />
                <span className="measure">{c.caveat}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ---- cross-link, not an overlay ---- */}
      {onGoTimeline && (
        <section className="mb-16">
          <button
            type="button"
            onClick={() => { onGoTimeline(); track("crime_to_timeline"); }}
            className="body-copy text-foreground underline underline-offset-4 hover:text-accent text-left measure"
          >
            See how this period sits against the procurement and legislation record &rarr;
          </button>
          <p className="text-muted text-[14px] measure mt-2">
            Shown side by side on one clock, never overlaid. Two things happening in the
            same year is a co-occurrence, and this record cannot establish more than that.
          </p>
        </section>
      )}

      {/* ---- sources ---- */}
      {!!srcs.length && (
        <section ref={srcP.ref} className="mb-16">
          <h3 className="font-display font-semibold text-foreground text-[19px] mb-2">Sources</h3>
          <p className="text-muted text-[15px] mb-6 measure">
            {srcs.filter((s) => s.evidence_tier === "A").length} Tier A ·{" "}
            {srcs.filter((s) => s.evidence_tier === "B").length} Tier B ·{" "}
            {srcs.filter((s) => s.evidence_tier === "C").length} Tier C. Every figure above
            resolves to one of these. See the{" "}
            <DisclaimerLink from="crime">full disclaimer</DisclaimerLink> for how this
            research was gathered.
          </p>
          <ul className="list-none p-0 m-0">
            {srcP.slice.map((s) => (
              <li key={s.source_id} className="flex items-baseline gap-3 py-3 border-b border-edge/60 text-[15px]">
                <TierChip t={s.evidence_tier} />
                <a href={s.url} target="_blank" rel="noreferrer noopener"
                  className="text-foreground/85 underline underline-offset-4 hover:text-accent measure">
                  {s.title || s.url}
                </a>
                <ArchivedLink rec={s} />
                <span className="ml-auto text-muted text-[13px] shrink-0">{s.publisher}</span>
              </li>
            ))}
          </ul>
          <ListPager page={srcP.page} totalPages={srcP.totalPages} setPage={srcP.setPage} scrollTo={srcP.scrollTo} />
        </section>
      )}

      </div>{/* /content column — modals live outside the grid */}

      {/* ---- per-lane detail ---- */}
      {lanePicked && (
        <div role="dialog" aria-modal="true" aria-label={lanePicked.name}
          className="fixed inset-0 z-50 bg-background/85 overflow-y-auto p-4 sm:p-10"
          onClick={() => setLanePicked(null)}>
          <div className="max-w-3xl mx-auto bg-background border border-edge p-6 sm:p-8"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-4">
              <h3 className="font-display font-semibold text-foreground text-[22px] m-0">{lanePicked.name}</h3>
              <button type="button" onClick={() => setLanePicked(null)}
                className="ml-auto text-muted hover:text-foreground text-[22px] leading-none" aria-label="Close">
                ×
              </button>
            </div>
            <p className="text-muted text-[15px] mt-3 mb-0">
              <strong className="text-foreground/80">Counts:</strong> {lanePicked.counts} ·{" "}
              <strong className="text-foreground/80">Publisher:</strong> {lanePicked.publisher} ·{" "}
              <TierChip t={lanePicked.tier} />
            </p>
            <p className="text-muted text-[15px] mt-2 mb-0">
              Indexed to {lanePicked.base_year} = 100, where the raw figure was{" "}
              <strong className="text-foreground/85">{lanePicked.base_value.toLocaleString()}</strong>.
            </p>
            {!!lanePicked.caveats?.length && (
              <ul className="list-disc pl-5 mt-4 text-[15px] text-foreground/85">
                {lanePicked.caveats.map((c, i) => <li key={i} className="mb-1">{c}</li>)}
              </ul>
            )}
            <h4 className="font-display font-semibold text-foreground text-[16px] mt-6 mb-2">
              Raw figures, year by year
            </h4>
            <div className="max-h-[42vh] overflow-y-auto scroll-thin border-t border-edge">
              <table className="w-full text-[15px]">
                <thead>
                  <tr className="text-muted text-[13px] text-left">
                    <th className="py-1.5 font-normal w-20">Year</th>
                    <th className="py-1.5 font-normal">Raw</th>
                    <th className="py-1.5 font-normal">Index</th>
                  </tr>
                </thead>
                <tbody>
                  {lanePicked.points.slice().reverse().map((q) => (
                    <tr key={q.year} className="border-b border-edge/50">
                      <td className="py-1.5 text-muted">{q.year}</td>
                      <td className="py-1.5 text-foreground/90">{q.raw.toLocaleString()}{q.tier !== "A" ? " *" : ""}</td>
                      <td className="py-1.5 text-foreground/70">{q.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-muted text-[13px] mt-2 mb-0">* not Tier A — drawn dotted on the chart.</p>
          </div>
        </div>
      )}

      {/* ---- per-measure detail (detention) ---- */}
      {detPicked && (
        <div role="dialog" aria-modal="true" aria-label={detPicked.name}
          className="fixed inset-0 z-50 bg-background/85 overflow-y-auto p-4 sm:p-10"
          onClick={() => setDetPicked(null)}>
          <div className="max-w-3xl mx-auto bg-background border border-edge p-6 sm:p-8"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-4">
              <h3 className="font-display font-semibold text-foreground text-[22px] m-0">{detPicked.name}</h3>
              <button type="button" onClick={() => setDetPicked(null)}
                className="ml-auto text-muted hover:text-foreground text-[22px] leading-none" aria-label="Close">×</button>
            </div>
            <p className="text-muted text-[15px] mt-3 mb-0">
              <strong className="text-foreground/80">Measure:</strong> {detPicked.basis_short} ·{" "}
              <strong className="text-foreground/80">Publisher:</strong> {detPicked.publisher} ·{" "}
              <TierChip t={detPicked.tier} />
            </p>
            <ul className="list-disc pl-5 mt-4 text-[15px] text-foreground/85">
              {detPicked.caveats.map((c, i) => <li key={i} className="mb-1.5">{c}</li>)}
            </ul>
            <h4 className="font-display font-semibold text-foreground text-[16px] mt-6 mb-2">
              The figures
            </h4>
            <p className="text-muted text-[14px] mt-0 mb-2">Each row: {detPicked.unit}.</p>
            <div className="max-h-[42vh] overflow-y-auto scroll-thin border-t border-edge">
              <table className="w-full text-[15px]">
                <tbody>
                  {detPicked.points.slice().reverse().map((q, i) => (
                    <tr key={i} className="border-b border-edge/50 align-top">
                      <td className="py-1.5 text-muted w-20">{Math.floor(q.year)}</td>
                      <td className="py-1.5 text-foreground/90 tabular-nums w-24">{q.value.toLocaleString()}</td>
                      <td className="py-1.5 text-muted text-[13px]">{q.note || ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ---- per-country detail (international homicide) ---- */}
      {intlPicked && (
        <div role="dialog" aria-modal="true" aria-label={intlPicked.name}
          className="fixed inset-0 z-50 bg-background/85 overflow-y-auto p-4 sm:p-10"
          onClick={() => setIntlPicked(null)}>
          <div className="max-w-3xl mx-auto bg-background border border-edge p-6 sm:p-8"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-4">
              <h3 className="font-display font-semibold text-foreground text-[22px] m-0">{intlPicked.name}</h3>
              <button type="button" onClick={() => setIntlPicked(null)}
                className="ml-auto text-muted hover:text-foreground text-[22px] leading-none" aria-label="Close">×</button>
            </div>
            <p className="text-muted text-[15px] mt-3 mb-0">
              <strong className="text-foreground/80">Basis:</strong> {intlPicked.basis_short} ·{" "}
              <strong className="text-foreground/80">Publisher:</strong> {intlPicked.publisher} ·{" "}
              <TierChip t={intlPicked.tier} />
            </p>
            {!!intlPicked.caveats?.length && (
              <ul className="list-disc pl-5 mt-4 text-[15px] text-foreground/85">
                {intlPicked.caveats.map((c, i) => <li key={i} className="mb-1">{c}</li>)}
              </ul>
            )}
            <h4 className="font-display font-semibold text-foreground text-[16px] mt-6 mb-2">
              Year by year ({intlPicked.points[0].year}&ndash;{intlPicked.last.year})
            </h4>
            <div className="max-h-[42vh] overflow-y-auto scroll-thin border-t border-edge">
              <table className="w-full text-[15px]">
                <tbody>
                  {intlPicked.points.slice().reverse().map((q) => (
                    <tr key={q.year} className="border-b border-edge/50">
                      <td className="py-1.5 text-muted w-24">{q.year}</td>
                      <td className="py-1.5 text-foreground/90">{q.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ---- per-series detail ---- */}
      {picked && (
        <div
          role="dialog" aria-modal="true" aria-label={picked.name}
          className="fixed inset-0 z-50 bg-background/85 overflow-y-auto p-4 sm:p-10"
          onClick={() => setPicked(null)}
        >
          <div
            className="max-w-3xl mx-auto bg-background border border-edge p-6 sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4">
              <h3 className="font-display font-semibold text-foreground text-[22px] m-0">{picked.name}</h3>
              <button type="button" onClick={() => setPicked(null)}
                className="ml-auto text-muted hover:text-foreground text-[22px] leading-none" aria-label="Close">
                ×
              </button>
            </div>
            <p className="text-muted text-[15px] mt-3 mb-0">
              <strong className="text-foreground/80">Basis:</strong> {picked.basis_short} ·{" "}
              <strong className="text-foreground/80">Publisher:</strong> {picked.publisher} ·{" "}
              <TierChip t={picked.tier} />
            </p>
            {!!picked.caveats?.length && (
              <ul className="list-disc pl-5 mt-4 text-[15px] text-foreground/85">
                {picked.caveats.map((c, i) => <li key={i} className="mb-1">{c}</li>)}
              </ul>
            )}
            <h4 className="font-display font-semibold text-foreground text-[16px] mt-6 mb-2">
              Full record, year by year ({picked.points[0].year}&ndash;{picked.points[picked.points.length - 1].year})
            </h4>
            {/* The bare "2024 7522824" rows explained nothing (Sean, 2026-08-21):
                the table now says what each column is, formats the number as a
                number, and carries the per-year note where one exists. */}
            <p className="text-muted text-[14px] mt-0 mb-2">
              Each row: the year, and {picked.unit || picked.basis_short}.
            </p>
            <div className="max-h-[42vh] overflow-y-auto scroll-thin border-t border-edge">
              <table className="w-full text-[15px]">
                <thead>
                  <tr className="text-muted text-[13px] text-left">
                    <th className="py-1.5 font-normal w-20">Year</th>
                    <th className="py-1.5 font-normal">{picked.unit ? picked.unit.charAt(0).toUpperCase() + picked.unit.slice(1) : "Value"}</th>
                    <th className="py-1.5 font-normal">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {picked.points.slice().reverse().map((p) => (
                    <tr key={p.year} className="border-b border-edge/50">
                      <td className="py-1.5 text-muted">{p.year}</td>
                      <td className="py-1.5 text-foreground/90 tabular-nums">
                        {p.value.toLocaleString()}{p.tier && p.tier !== "A" ? " *" : ""}
                      </td>
                      <td className="py-1.5 text-muted text-[13px]">{p.note ? p.note.split(".")[0] : ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-muted text-[13px] mt-2 mb-0">* not Tier A &mdash; drawn dotted on the chart.</p>
          </div>
        </div>
      )}
    </div>
  );
}
