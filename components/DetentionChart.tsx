"use client";

import { useState } from "react";
import { DATA_WINDOW, dataWindowTicks, useNarrow, TierChip } from "@/components/DataPrimitives";
import { track } from "@/lib/analytics";

/**
 * ICE detention: population against its funded ceiling.
 *
 * This chart exists to keep three measures APART. Reporting on detention
 * routinely conflates an annual average, a funded bed level, and a single-day
 * snapshot, and the three diverge enormously in 2025-26 — so each is drawn
 * differently and named by its measure in the legend:
 *
 *   ADP          solid line, stopping where publication stops (FY2024)
 *   funded beds  stepped dashed line — a ceiling, not an observation
 *   single-day   POINTS ONLY, never joined: irregular snapshots, and a line
 *                between them would imply a series nobody published
 *
 * It also breaks the section's shared 1999-2025 window on purpose, because the
 * series has no comparable form before 2019 and four-fifths of a shared-window
 * chart would be empty. The break is stated on the page rather than silent.
 */

export type DetSeries = {
  name: string; emphasis: boolean; tier: string; measure: string; unit: string;
  basis_short: string; publisher: string;
  points: { year: number; value: number; tier?: string; note?: string }[];
  caveats: string[];
  /**
   * Last year before a declared change of basis. The path splits here rather
   * than being drawn through — same contract as the burglary lane on the harm
   * chart. Used by the incarceration chart, where BJS states its own 2022 and
   * 2023 correctional totals are not comparable with earlier years.
   */
  break_after?: number;
};
export type DetChart = {
  title: string; unit: string; note: string; publisher: string; tier: string;
  window: { from: number; to: number };
  window_note: string;
  series: DetSeries[];
  themes?: { statement: string; tier: string }[];
  accuracy_note?: string;
  /** "millions" renders the y axis as 1.2M; default is thousands (65k). */
  y_format?: string;
  /**
   * Offers the levels/change toggle. Only set it where year-over-year change is
   * a meaningful question — a stock counted the same way every year. It is
   * meaningless on irregular single-day snapshots and on a funded ceiling.
   */
  change_view?: boolean;
  /**
   * The bolded sentence under the plot. Defaults to the detention chart's
   * three-measures warning, which is a FALSE statement on any other chart —
   * so every new chart using this component sets its own.
   */
  legend_note?: string;
};

export default function DetentionChart({
  chart, onPick,
}: { chart: DetChart; onPick: (s: DetSeries) => void }) {
  const narrow = useNarrow();
  const [focus, setFocus] = useState<string | null>(null);
  const [hover, setHover] = useState<{ s: DetSeries; p: { year: number; value: number; note?: string } } | null>(null);
  // Levels or year-over-year change (Sean, 2026-08-22). Same control the
  // suicide chart carries. Change is computed only across CONSECUTIVE years
  // and never across a declared basis break — a percentage change spanning a
  // change of measurement is not a change in the world.
  const [mode, setMode] = useState<"level" | "change">("level");
  const asChange = (ser: DetSeries): DetSeries => ({
    ...ser,
    points: ser.points.flatMap((p, i) => {
      if (i === 0) return [];
      const prev = ser.points[i - 1];
      if (p.year - prev.year !== 1) return [];
      if (ser.break_after != null && prev.year === ser.break_after) return [];
      if (!prev.value) return [];
      return [{ ...p, value: ((p.value - prev.value) / prev.value) * 100 }];
    }),
    break_after: undefined,
  });
  const showChange = mode === "change" && !!chart.change_view;
  const drawn = showChange
    ? chart.series.filter((x) => x.measure === "stock").map(asChange).filter((x) => x.points.length > 1)
    : chart.series;

  const W = 900, H = narrow ? 400 : 360;
  const padL = narrow ? 86 : 64, padR = narrow ? 22 : 54;
  const padT = narrow ? 30 : 26, padB = narrow ? 52 : 38;
  const fsTick = narrow ? 24 : 11, fsTip = narrow ? 22 : 12.5;

  const x0 = chart.window.from, x1 = chart.window.to;
  const vals = drawn.flatMap((s) => s.points.map((p) => p.value));
  const vMax = (vals.length ? Math.max(...vals) : 1) * 1.1;
  // Change mode needs a signed axis with zero on it, or a fall reads as a rise.
  const vMin = showChange ? Math.min(...vals, 0) * 1.1 : 0;
  const X = (y: number) => padL + ((y - x0) / (x1 - x0)) * (W - padL - padR);
  const Y = (v: number) =>
    padT + (1 - (v - vMin) / (vMax - vMin)) * (H - padT - padB);

  // Ticks are derived, not hardcoded: this component now carries both a
  // 65,000-person detention chart and a 7,300,000-person incarceration one.
  // Step is the largest of 1/2/5 x 10^n that yields at most six gridlines.
  const yTicks = (() => {
    const span = vMax - vMin;
    const raw = span / 5;
    const mag = Math.pow(10, Math.floor(Math.log10(Math.max(raw, 1e-9))));
    const step = [1, 2, 5, 10].map((m) => m * mag).find((c) => c >= raw) ?? mag * 10;
    const out: number[] = [];
    for (let t = Math.ceil(vMin / step) * step; t <= vMax; t += step) out.push(t);
    if (showChange && !out.includes(0)) out.push(0);
    return out;
  })();
  // A chart whose window matches the section's shared one uses the shared
  // ticks, so its years line up with every other chart on the page. Only a
  // chart that genuinely opts out labels every year of its own window.
  const ownWindow = x0 !== DATA_WINDOW.from || x1 !== DATA_WINDOW.to;
  const xTicks: number[] = [];
  if (ownWindow) { for (let y = x0; y <= x1; y += 1) xTicks.push(y); }
  else xTicks.push(...dataWindowTicks(narrow));

  const fmt = (v: number) =>
    showChange
      ? `${v > 0 ? "+" : ""}${v.toFixed(v === 0 ? 0 : 1)}%`
      : chart.y_format === "millions"
      ? (v === 0 ? "0" : `${(v / 1e6).toFixed(v >= 1e6 ? 1 : 2)}M`)
      : `${Math.round(v / 1000)}k`;
  const dim = (s: DetSeries) => focus !== null && focus !== s.name;

  return (
    // data-own-window declares that this chart deliberately opts out of the
    // section's shared 1999-2025 axis; the alignment test reads this rather
    // than special-casing a title.
    <figure className="m-0 mb-6"
      {...(ownWindow ? { "data-own-window": `${chart.window.from}-${chart.window.to}` } : {})}>
      <figcaption className="font-display font-semibold text-foreground text-[19px] mb-1">
        {chart.title}
      </figcaption>
      <p className="text-muted text-[13px] m-0 mb-3">{chart.unit}</p>

      {chart.change_view && (
        <div role="group" aria-label="Chart view" className="flex gap-1 mb-3">
          {([["level", "Levels"], ["change", "Year-over-year change"]] as const).map(([m, label]) => (
            <button key={m} type="button"
              onClick={() => { setMode(m); track("incarceration_chart_mode", { mode: m }); }}
              aria-pressed={mode === m}
              className={`text-[13px] px-3 py-1 border transition-colors ${
                mode === m ? "border-foreground text-foreground font-semibold"
                           : "border-edge text-muted hover:text-foreground"
              }`}>
              {label}
            </button>
          ))}
        </div>
      )}

      {/* legend names the MEASURE, not just the series — that is the point */}
      <ul className="list-none p-0 m-0 mb-3 flex flex-wrap gap-x-4 gap-y-1"
        onMouseLeave={() => setFocus(null)}>
        {drawn.map((s) => (
          <li key={s.name}>
            <button type="button"
              onMouseEnter={() => setFocus(s.name)}
              onFocus={() => setFocus(s.name)}
              onClick={() => { if (focus === s.name) { onPick(s); track("detention_series_opened", { s: s.name }); } else setFocus(s.name); }}
              aria-pressed={focus === s.name}
              className={`flex items-center gap-2 text-[15px] py-1 px-1 border-b-2 transition-colors text-left ${
                focus === s.name ? "border-foreground text-foreground"
                                 : "border-transparent text-foreground/70 hover:text-foreground"
              }`}>
              <svg width="22" height="10" aria-hidden="true">
                {s.measure === "single_day" ? (
                  <>
                    <circle cx="4" cy="5" r="2.2" fill="currentColor" />
                    <circle cx="11" cy="5" r="2.2" fill="currentColor" />
                    <circle cx="18" cy="5" r="2.2" fill="currentColor" />
                  </>
                ) : (
                  <line x1="0" y1="5" x2="22" y2="5" stroke="currentColor"
                    strokeWidth={s.emphasis ? 3 : 1.6}
                    strokeDasharray={s.measure === "funded_beds" ? "5 3" : undefined} />
                )}
              </svg>
              {s.name}
            </button>
          </li>
        ))}
      </ul>

      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img"
        aria-label={`${chart.title}. ${chart.unit}. ${chart.series.length} measures drawn separately: ${chart.series.map((s) => s.name).join(", ")}.`}
        onMouseLeave={() => setHover(null)}
        style={{ fontFamily: "inherit", overflow: "visible" }}>
        {yTicks.map((t) => (
          <g key={t}>
            <line x1={padL} y1={Y(t)} x2={W - padR} y2={Y(t)} stroke="rgb(var(--edge))"
              strokeWidth={showChange && t === 0 ? 1.8 : 1} />
            <text x={padL - 8} y={Y(t) + 4} fontSize={fsTick} fill="rgb(var(--muted))" textAnchor="end">{fmt(t)}</text>
          </g>
        ))}
        {xTicks.map((y) => (
          <text key={y} x={X(y)} y={H - (narrow ? 22 : 12)} fontSize={fsTick}
            fill="rgb(var(--muted))" textAnchor="middle">
            {ownWindow && narrow && y % 2 ? "" : y}
          </text>
        ))}

        {drawn.map((s) => {
          const op = dim(s) ? 0.16 : s.emphasis || focus === s.name ? 1 : 0.7;
          const sw = (s.emphasis ? (narrow ? 3.4 : 2.4) : (narrow ? 2.2 : 1.6)) + (focus === s.name ? 1.1 : 0);
          const open = () => { onPick(s); track("detention_series_opened", { s: s.name }); };

          if (s.measure === "single_day") {
            // Points only. Joining irregular snapshots would invent a series.
            return (
              <g key={s.name} onMouseEnter={() => setFocus(s.name)} onClick={open}
                style={{ cursor: "pointer", transition: "opacity 120ms" }} opacity={op}>
                {s.points.map((p, i) => (
                  <circle key={i} cx={X(p.year)} cy={Y(p.value)} r={narrow ? 6 : 4.2}
                    fill="rgb(var(--background))" stroke="rgb(var(--foreground))"
                    strokeWidth={narrow ? 2.4 : 1.8}
                    onMouseEnter={() => setHover({ s, p })} />
                ))}
              </g>
            );
          }
          // Stepped for a funded ceiling: it is a level that holds until changed.
          // A declared basis break restarts the path instead of drawing through
          // it — the years either side are both published, so this is a break in
          // the MEASUREMENT, not a gap in the data.
          const brk = s.break_after ?? null;
          const d = s.points.map((p, i) => {
            const after = i > 0 && brk !== null && s.points[i - 1].year === brk;
            if (after) return `M${X(p.year).toFixed(1)},${Y(p.value).toFixed(1)}`;
            const seg = s.measure === "funded_beds" && i > 0
              ? `L${X(p.year).toFixed(1)},${Y(s.points[i - 1].value).toFixed(1)}L${X(p.year).toFixed(1)},${Y(p.value).toFixed(1)}`
              : `${i ? "L" : "M"}${X(p.year).toFixed(1)},${Y(p.value).toFixed(1)}`;
            return seg;
          }).join(" ");
          return (
            <g key={s.name} onMouseEnter={() => setFocus(s.name)} onClick={open}
              style={{ cursor: "pointer", transition: "opacity 120ms" }}>
              <path d={d} fill="none" stroke="rgb(var(--foreground))" strokeWidth={sw}
                strokeDasharray={s.measure === "funded_beds" ? "6 4" : undefined} opacity={op} />
              <path d={d} fill="none" stroke="transparent" strokeWidth={narrow ? 26 : 16} />
              {brk !== null && (
                <g>
                  <line x1={X(brk + 0.5)} y1={padT} x2={X(brk + 0.5)} y2={H - padB}
                    stroke="rgb(var(--muted))" strokeDasharray="2 6" strokeWidth="1"
                    opacity={dim(s) ? 0.12 : focus === s.name ? 0.9 : 0.35} />
                  {focus === s.name && !narrow && (
                    <text x={X(brk + 0.5) + 5} y={padT + 11} fontSize="10.5"
                      fill="rgb(var(--muted))">basis changes</text>
                  )}
                </g>
              )}
              {/* markers shrink on a long annual series so 25 years of
                  observations do not read as a string of beads */}
              {s.points.map((p, i) => (
                <circle key={i} cx={X(p.year)} cy={Y(p.value)}
                  r={s.points.length > 12 ? (narrow ? 3 : 1.9) : (narrow ? 4.5 : 3)}
                  fill="rgb(var(--foreground))" opacity={op}
                  onMouseEnter={() => setHover({ s, p })} />
              ))}
            </g>
          );
        })}

        {hover && (
          <g pointerEvents="none">
            <text x={Math.min(Math.max(X(hover.p.year), padL + 100), W - padR - 100)} y={padT - 8}
              fontSize={fsTip} fill="rgb(var(--foreground))" textAnchor="middle" fontWeight="600">
              {hover.s.name} · {hover.p.value.toLocaleString()}
            </text>
          </g>
        )}
      </svg>

      <p className="text-muted text-[14px] measure mt-3 mb-0">
        Hover or tap a legend entry to single out a measure; tap again (or click the
        line) for its figures, method and caveats.{" "}
        {showChange && (
          <><strong className="text-foreground">Showing year-over-year change.</strong>{" "}
          Each point is one year against the one before it. Years either side of a declared
          basis change are left out rather than differenced — a percentage across a change
          of measurement is not a change in the world.{" "}</>
        )}
        <strong className="text-foreground">{chart.legend_note ??
          "The three measures are not interchangeable — an average, a funded ceiling and single-day snapshots."}
        </strong> {chart.window_note}
      </p>
    </figure>
  );
}
