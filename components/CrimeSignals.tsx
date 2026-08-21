"use client";

import { useEffect, useMemo, useState } from "react";
import ListPager from "@/components/ListPager";
import { DataNoteLine } from "@/components/DataIntro";
import DisclaimerLink from "@/components/DisclaimerLink";
import { SkeletonChart } from "@/components/Skeleton";
import {
  useTable, useDoc, usePager, useNarrow, TierChip, SourceLink, SectionSkeleton,
  DATA_WINDOW, dataWindowTicks, type SourceRec,
} from "@/components/DataPrimitives";
import { track } from "@/lib/analytics";

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
  tier: string; points: { year: number; value: number; tier?: string; note?: string }[];
  caveats?: string[];
};
type Chart = {
  title: string; unit: string; note: string; publisher: string; tier: string;
  series: ChartSeries[];
  markers?: { year: number; label: string }[];
};
type Lane = {
  name: string; counts: string; publisher: string; emphasis: boolean;
  base_year: number; base_value: number; unit_raw: string; tier: string;
  basis_short: string; caveats: string[];
  points: { year: number; value: number; raw: number; tier: string }[];
};
type LaneChart = {
  title: string; unit: string; note: string; publisher: string; tier: string;
  indexed: boolean; series: Lane[];
};
type NotCounted = {
  nc_id: string; category: string; status: string; detail: string;
  who_would_collect: string; tier: string; source_id: string | null;
};
type Sweep = {
  sweep_id: string; date: string; operation: string; agency: string;
  headline: string; what_the_number_is: string; for_scale: string;
  tier: string; source_id: string | null;
};

/* ---------------------------------------------------------------- chart --- */

/**
 * Five lanes on one indexed axis.
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

  const all = chart.series.flatMap((s) => s.points);
  if (all.length < 2) return null;

  const fsTick = narrow ? 24 : 11;
  const fsLabel = narrow ? 24 : 12;
  const W = 900, H = 380;
  const padL = narrow ? 78 : 54;
  const padR = narrow ? 24 : 210;
  const padT = narrow ? 30 : 26;
  const padB = narrow ? 52 : 38;

  const x0 = DATA_WINDOW.from, x1 = DATA_WINDOW.to;
  const vMax = Math.max(...all.map((p) => p.value)) * 1.08;
  const X = (y: number) => padL + ((y - x0) / (x1 - x0)) * (W - padL - padR);
  const Y = (v: number) => padT + (1 - v / vMax) * (H - padT - padB);

  const yTicks = [0, 100, 200, 300, 400].filter((t) => t <= vMax);
  const xTicks = dataWindowTicks(narrow);

  // End labels de-collide by pushing apart to a minimum spacing, bottom-up.
  const MIN_GAP = narrow ? 26 : 15;
  let prevY = -Infinity;
  const ends = chart.series
    .map((s) => ({ s, last: s.points[s.points.length - 1] }))
    .sort((a, b) => b.last.value - a.last.value)
    .reverse()
    .map((e) => {
      const y = Math.max(Y(e.last.value), prevY + MIN_GAP);
      prevY = y;
      return { ...e, labelY: y };
    });

  return (
    <figure className="m-0 mb-6">
      <figcaption className="font-display font-semibold text-foreground text-[19px] mb-1">
        {chart.title}
      </figcaption>
      <p className="text-muted text-[13px] m-0 mb-3">{chart.unit}</p>

      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img"
        aria-label={`${chart.title}. ${chart.unit}.`}
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
          const d = s.points.map((p, j) => `${j ? "L" : "M"}${pt(p)}`).join(" ");
          // Same convention as every other chart: dotted = not Tier A.
          const weak: string[] = [];
          s.points.forEach((p, j) => {
            if (p.tier && p.tier !== "A") {
              if (j > 0) weak.push(`M${pt(s.points[j - 1])}L${pt(p)}`);
              if (j < s.points.length - 1) weak.push(`M${pt(p)}L${pt(s.points[j + 1])}`);
            }
          });
          const sw = s.emphasis ? (narrow ? 3.4 : 2.3) : (narrow ? 2.4 : 1.4);
          // A lane sampled with gaps shows its points, so a straight run between
          // two distant years cannot read as data we do not have.
          const gappy = s.points.some((p, j) => j > 0 && p.year - s.points[j - 1].year > 1);
          return (
            <g key={i} onClick={() => onPick(s)} style={{ cursor: "pointer" }}>
              <path d={d} fill="none" stroke="rgb(var(--foreground))" strokeWidth={sw}
                opacity={s.emphasis ? 1 : 0.6} />
              <path d={d} fill="none" stroke="transparent" strokeWidth={narrow ? 26 : 16} />
              {weak.map((w, k) => (
                <g key={k}>
                  <path d={w} fill="none" stroke="rgb(var(--background))" strokeWidth={sw + 1.6} />
                  <path d={w} fill="none" stroke="rgb(var(--foreground))" strokeWidth={sw}
                    strokeDasharray={narrow ? "2 5" : "1.5 4"} strokeLinecap="round"
                    opacity={s.emphasis ? 1 : 0.6} />
                </g>
              ))}
              {gappy && s.points.map((p) => (
                <circle key={p.year} cx={X(p.year)} cy={Y(p.value)} r={narrow ? 4 : 2.6}
                  fill="rgb(var(--background))" stroke="rgb(var(--foreground))"
                  strokeWidth={narrow ? 2 : 1.3} opacity={0.85} />
              ))}
              {/* every lane starts at 100 — mark it so the base year is visible */}
              <circle cx={X(s.points[0].year)} cy={Y(100)} r={narrow ? 4.5 : 3}
                fill="rgb(var(--foreground))" opacity={s.emphasis ? 1 : 0.6} />
            </g>
          );
        })}

        {!narrow && ends.map((e, i) => (
          <text key={i} x={W - padR + 8} y={e.labelY + 4} fontSize={fsLabel}
            fill="rgb(var(--foreground))" fontWeight={e.s.emphasis ? 700 : 500}
            opacity={e.s.emphasis ? 1 : 0.75}>
            {e.s.name} {Math.round(e.last.value)}
          </text>
        ))}

        {Array.from({ length: x1 - x0 + 1 }, (_, i) => x0 + i).map((y) => (
          <rect key={y} x={X(y) - (W - padL - padR) / (x1 - x0) / 2} y={padT}
            width={Math.max(3, (W - padL - padR) / (x1 - x0))} height={H - padT - padB}
            fill="transparent" onMouseEnter={() => setHoverYear(y)} />
        ))}
        {hoverYear !== null && (
          <g pointerEvents="none">
            <line x1={X(hoverYear)} y1={padT} x2={X(hoverYear)} y2={H - padB}
              stroke="rgb(var(--muted))" strokeDasharray="3 3" />
            <text x={Math.min(Math.max(X(hoverYear), padL + 40), W - padR - 20)} y={padT - 8}
              fontSize={fsLabel} fill="rgb(var(--foreground))" textAnchor="middle" fontWeight="600">
              {hoverYear}
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
                {s.base_year}&ndash;{last.year}: {pct > 0 ? "+" : ""}{pct}%
              </span>
            </li>
          );
        })}
      </ul>
      <p className="text-muted text-[14px] measure mt-3 mb-0">
        Each lane starts at 100 in its own first year, marked with a dot. Heights are not
        comparable between lanes &mdash; these count different things. Dotted stretches are
        years that are not Tier A; hollow points mark a lane sampled with gaps.
      </p>
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

  const view = fullRecord ? chart.series : chart.series.map((s) => ({
    ...s,
    points: s.points.filter((p) => p.year >= DATA_WINDOW.from && p.year <= DATA_WINDOW.to),
  })).filter((s) => s.points.length > 1);

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
  const X = (y: number) => padL + ((y - x0) / (x1 - x0)) * (W - padL - padR);
  const Y = (v: number) => padT + (1 - v / v1) * (H - padT - padB);

  const yTicks = Array.from({ length: 5 }, (_, i) => (v1 * i) / 4);
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

      <svg
        viewBox={`0 0 ${W} ${H}`} width="100%" role="img"
        aria-label={`${chart.title}. ${chart.unit}.`}
        onMouseLeave={() => setHoverYear(null)}
        style={{ fontFamily: "inherit", overflow: "visible" }}
      >
        {yTicks.map((t, i) => (
          <g key={i}>
            <line x1={padL} y1={Y(t)} x2={W - padR} y2={Y(t)} stroke="rgb(var(--edge))" strokeWidth="1" />
            <text x={padL - 8} y={Y(t) + 4} fontSize={fsTick} fill="rgb(var(--muted))" textAnchor="end">
              {t.toFixed(0)}
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
          const sw = s.emphasis ? (narrow ? 3.5 : 2.4) : (narrow ? 2.4 : 1.5);
          const last = s.points[s.points.length - 1];
          return (
            <g key={i}
              /* The modal is the supporting-data view, so it always opens the
                 COMPLETE series — never the windowed slice the axis shows. */
              onClick={() => onPick(chart.series.find((o) => o.name === s.name) || s)}
              style={{ cursor: "pointer" }}>
              <path
                d={d} fill="none" stroke="rgb(var(--foreground))"
                strokeWidth={sw}
                opacity={s.emphasis ? 1 : 0.62}
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
            fill="transparent" onMouseEnter={() => setHoverYear(y)} />
        ))}
        {hoverYear !== null && hovered && hovered.length > 0 && (
          <g pointerEvents="none">
            <line x1={X(hoverYear)} y1={padT} x2={X(hoverYear)} y2={H - padB}
              stroke="rgb(var(--muted))" strokeDasharray="3 3" />
            {hovered.map((h, i) => (
              <circle key={i} cx={X(hoverYear)} cy={Y(h.p!.value)} r={narrow ? 6 : 4.5}
                fill="rgb(var(--background))" stroke="rgb(var(--foreground))" strokeWidth="2" />
            ))}
            <text x={Math.min(Math.max(X(hoverYear), padL + 70), W - padR - 20)} y={padT - 8}
              fontSize={fsLabel} fill="rgb(var(--foreground))" textAnchor="middle" fontWeight="600">
              {hoverYear}: {hovered.map((h) => h.p!.value.toFixed(1)).join(" / ")}
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
        <span className="text-muted text-[14px]">Click either line for its method and sources.</span>
      </div>

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
      <p className="text-muted text-[14px] measure mt-3 mb-0">
        <span className="text-foreground">· · ·</span> Dotted stretches are years that are
        not Tier A — read from a published chart rather than stated in report text, or
        resting on a collection the publisher itself flagged. Line weight, not dashing,
        distinguishes the two series.
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
  const notCounted = useTable<NotCounted>("/data/crime/tables/crime_not_counted.json");
  const sweeps = useTable<Sweep>("/data/crime/tables/crime_sweeps.json");

  const srcs = sources || [];
  const [picked, setPicked] = useState<ChartSeries | null>(null);
  const [lanePicked, setLanePicked] = useState<Lane | null>(null);

  // Escape closes the series modal. Caught by the test suite: without this the
  // dialog traps the reader, since the backdrop and the close button were the
  // only exits and neither is reachable from the keyboard.
  useEffect(() => {
    if (!picked && !lanePicked) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setPicked(null); setLanePicked(null); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [picked, lanePicked]);

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
    <div className="w-full">
      <DataNoteLine from="crime">
        United States only · AI-assisted research from public records · every figure
        evidence-graded and linked to the source it was read from ·
      </DataNoteLine>

      {/* ---- what nobody counts: the lead finding (Sean, 2026-08-21) ---- */}
      {notCounted === null ? <SectionSkeleton title="What nobody counts" /> : !!notCounted.length && (
        <section className="mb-14">
          <h2 className="font-display font-semibold text-foreground text-[24px] mb-3">
            What nobody counts
          </h2>
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

      {/* ---- the priority lanes, indexed ---- */}
      <section className="mb-14">
        {lanes === null ? <SkeletonChart /> : (
          <>
            <LaneChart chart={lanes} onPick={setLanePicked} />
            <p className="body-copy text-foreground/90 measure">{lanes.note}</p>
          </>
        )}
      </section>

      {/* ---- sweeping enforcement: headline arrest numbers ---- */}
      {!!sweeps?.length && (
        <section className="mb-14">
          <h2 className="font-display font-semibold text-foreground text-[21px] mb-2">
            Enforcement in sweeps
          </h2>
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

      {/* ---- homicide: one lens among several, no longer the lead ---- */}
      <section className="mb-12">
        <h2 className="font-display font-semibold text-foreground text-[21px] mb-4">
          The homicide lens
        </h2>
        {chart === null ? <SkeletonChart /> : (
          <>
            <TwoSeriesChart chart={chart} onPick={setPicked} />
            <p className="body-copy text-foreground/90 measure">{chart.note}</p>
          </>
        )}
      </section>

      {/* ---- 2026 year to date ---- */}
      {!!ytd.length && (
        <section className="mb-16">
          <h2 className="font-display font-semibold text-foreground text-[21px] mb-2">
            Where 2026 stands
          </h2>
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

      {/* ---- verdict ---- */}
      {verdict === null ? <SectionSkeleton title="Is crime rising or falling?" /> : (
        <section className="mb-16">
          <h2 className="font-display font-semibold text-foreground text-[21px] mb-3">
            {verdict.claim}
          </h2>
          <p className="body-copy text-foreground/90 measure">{verdict.summary}</p>
          <ul className="list-none p-0 m-0 mt-4">
            {verdict.key_figures.map((f, i) => (
              <li key={i} className="flex items-baseline gap-3 py-2 border-b border-edge/60 text-[16px] text-foreground/85">
                <TierChip t={f.tier} />
                <span className="measure">{f.figure}</span>
                <span className="ml-auto"><SourceLink id={f.source_id} sources={srcs} /></span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ---- clearance ---- */}
      {!!clearance.length && (
        <section className="mb-16">
          <h2 className="font-display font-semibold text-foreground text-[21px] mb-2">
            How many homicides are cleared
          </h2>
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

      {/* ---- trends ---- */}
      {trends === null ? <SectionSkeleton title="What the series show" /> : !!trends.length && (
        <section ref={trendsP.ref} className="mb-16">
          <h2 className="font-display font-semibold text-foreground text-[21px] mb-2">What the series show</h2>
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
          <h2 className="font-display font-semibold text-foreground text-[21px] mb-2">
            How much the numbers can be trusted
          </h2>
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
          <h2 className="font-display font-semibold text-foreground text-[21px] mb-2">
            Read before quoting any figure
          </h2>
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
          <h2 className="font-display font-semibold text-foreground text-[21px] mb-2">Sources</h2>
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
                <span className="ml-auto text-muted text-[13px] shrink-0">{s.publisher}</span>
              </li>
            ))}
          </ul>
          <ListPager page={srcP.page} totalPages={srcP.totalPages} setPage={srcP.setPage} scrollTo={srcP.scrollTo} />
        </section>
      )}

      {/* ---- per-lane detail ---- */}
      {lanePicked && (
        <div role="dialog" aria-modal="true" aria-label={lanePicked.name}
          className="fixed inset-0 z-50 bg-background/85 overflow-y-auto p-4 sm:p-10"
          onClick={() => setLanePicked(null)}>
          <div className="max-w-[720px] mx-auto bg-background border border-edge p-6 sm:p-8"
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

      {/* ---- per-series detail ---- */}
      {picked && (
        <div
          role="dialog" aria-modal="true" aria-label={picked.name}
          className="fixed inset-0 z-50 bg-background/85 overflow-y-auto p-4 sm:p-10"
          onClick={() => setPicked(null)}
        >
          <div
            className="max-w-[720px] mx-auto bg-background border border-edge p-6 sm:p-8"
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
            <div className="max-h-[42vh] overflow-y-auto scroll-thin border-t border-edge">
              <table className="w-full text-[15px]">
                <tbody>
                  {picked.points.slice().reverse().map((p) => (
                    <tr key={p.year} className="border-b border-edge/50">
                      <td className="py-1.5 text-muted w-24">{p.year}</td>
                      <td className="py-1.5 text-foreground/90">{p.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
