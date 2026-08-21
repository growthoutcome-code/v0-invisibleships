"use client";

import { useState } from "react";
import { useNarrow, TierChip } from "@/components/DataPrimitives";
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
};
export type DetChart = {
  title: string; unit: string; note: string; publisher: string; tier: string;
  window: { from: number; to: number };
  window_note: string;
  series: DetSeries[];
  themes?: { statement: string; tier: string }[];
  accuracy_note?: string;
};

export default function DetentionChart({
  chart, onPick,
}: { chart: DetChart; onPick: (s: DetSeries) => void }) {
  const narrow = useNarrow();
  const [focus, setFocus] = useState<string | null>(null);
  const [hover, setHover] = useState<{ s: DetSeries; p: { year: number; value: number; note?: string } } | null>(null);

  const W = 900, H = narrow ? 400 : 360;
  const padL = narrow ? 86 : 64, padR = narrow ? 22 : 54;
  const padT = narrow ? 30 : 26, padB = narrow ? 52 : 38;
  const fsTick = narrow ? 24 : 11, fsTip = narrow ? 22 : 12.5;

  const x0 = chart.window.from, x1 = chart.window.to;
  const vMax = Math.max(...chart.series.flatMap((s) => s.points.map((p) => p.value))) * 1.1;
  const X = (y: number) => padL + ((y - x0) / (x1 - x0)) * (W - padL - padR);
  const Y = (v: number) => padT + (1 - v / vMax) * (H - padT - padB);

  const yTicks = [0, 20000, 40000, 60000, 80000].filter((t) => t <= vMax);
  const xTicks: number[] = [];
  for (let y = x0; y <= x1; y += 1) xTicks.push(y);

  const fmt = (v: number) => `${Math.round(v / 1000)}k`;
  const dim = (s: DetSeries) => focus !== null && focus !== s.name;

  return (
    // data-own-window declares that this chart deliberately opts out of the
    // section's shared 1999-2025 axis; the alignment test reads this rather
    // than special-casing a title.
    <figure className="m-0 mb-6" data-own-window={`${chart.window.from}-${chart.window.to}`}>
      <figcaption className="font-display font-semibold text-foreground text-[19px] mb-1">
        {chart.title}
      </figcaption>
      <p className="text-muted text-[13px] m-0 mb-3">{chart.unit}</p>

      {/* legend names the MEASURE, not just the series — that is the point */}
      <ul className="list-none p-0 m-0 mb-3 flex flex-wrap gap-x-4 gap-y-1"
        onMouseLeave={() => setFocus(null)}>
        {chart.series.map((s) => (
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
        aria-label={`${chart.title}. ${chart.unit}. Three measures drawn separately: average daily population, funded beds, and single-day counts.`}
        onMouseLeave={() => setHover(null)}
        style={{ fontFamily: "inherit", overflow: "visible" }}>
        {yTicks.map((t) => (
          <g key={t}>
            <line x1={padL} y1={Y(t)} x2={W - padR} y2={Y(t)} stroke="rgb(var(--edge))" strokeWidth="1" />
            <text x={padL - 8} y={Y(t) + 4} fontSize={fsTick} fill="rgb(var(--muted))" textAnchor="end">{fmt(t)}</text>
          </g>
        ))}
        {xTicks.map((y) => (
          <text key={y} x={X(y)} y={H - (narrow ? 22 : 12)} fontSize={fsTick}
            fill="rgb(var(--muted))" textAnchor="middle">{narrow && y % 2 ? "" : y}</text>
        ))}

        {chart.series.map((s) => {
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
          const d = s.points.map((p, i) => {
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
              {s.points.map((p, i) => (
                <circle key={i} cx={X(p.year)} cy={Y(p.value)} r={narrow ? 4.5 : 3}
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
        line) for its figures, method and caveats. <strong className="text-foreground">
        The three measures are not interchangeable</strong> &mdash; an average, a funded
        ceiling and single-day snapshots. {chart.window_note}
      </p>
    </figure>
  );
}
