"use client";

import { useMemo, useState } from "react";
import { DATA_WINDOW, dataWindowTicks, useNarrow, TierChip } from "@/components/DataPrimitives";
import { track } from "@/lib/analytics";

/**
 * Multi-country line chart with a CONNECTED legend (Sean, 2026-08-21).
 *
 * The lesson from the five-lane chart: end-of-line labels fail when lines
 * converge, and a legend that is not wired to the lines is furniture. Here the
 * legend is the control surface —
 *
 *   hover/focus a legend entry  -> that line goes full-weight, others dim
 *   hover the plot              -> nearest line highlights and the tooltip
 *                                  names it (country · year · value)
 *   click line or legend        -> detail modal (full table, caveats, source)
 *
 * On phones there is no hover, so the legend entries are tap-to-highlight
 * (second tap opens the detail), which also serves keyboard users. The site is
 * monochrome, so highlight is carried by weight and dimming, not colour.
 *
 * Gap discipline: a null year in a series breaks the path — gaps are drawn as
 * gaps, never interpolated. Log scale is deliberately NOT used even though
 * Russia (30) and Japan (0.2) share the axis: the magnitude gap IS the story.
 */

export type IntlSeries = {
  name: string; code: string; emphasis: boolean; kind: string;
  basis_short: string; publisher: string; tier: string; counts: string;
  unit_raw: string;
  last: { year: number; value: number };
  points: { year: number; value: number; tier?: string }[];
  caveats: string[];
};
export type IntlChartDoc = {
  title: string; unit: string; note: string; publisher: string; tier: string;
  series: IntlSeries[];
};

export default function IntlLineChart({
  chart, onPick,
}: { chart: IntlChartDoc; onPick: (s: IntlSeries) => void }) {
  const narrow = useNarrow();
  const [focus, setFocus] = useState<string | null>(null); // country code
  const [hoverYear, setHoverYear] = useState<number | null>(null);

  const W = 900, H = narrow ? 420 : 380;
  const padL = narrow ? 78 : 54, padR = narrow ? 24 : 60;
  const padT = narrow ? 30 : 24, padB = narrow ? 52 : 38;
  const fsTick = narrow ? 24 : 11, fsTip = narrow ? 24 : 12.5;

  const x0 = DATA_WINDOW.from, x1 = DATA_WINDOW.to;
  const vMax = useMemo(
    () => Math.max(...chart.series.flatMap((s) => s.points.map((p) => p.value))) * 1.06,
    [chart],
  );
  const X = (y: number) => padL + ((y - x0) / (x1 - x0)) * (W - padL - padR);
  const Y = (v: number) => padT + (1 - v / vMax) * (H - padT - padB);

  const yTicks = useMemo(() => {
    const step = vMax > 20 ? 10 : vMax > 8 ? 5 : 2;
    const out = [];
    for (let t = 0; t <= vMax; t += step) out.push(t);
    return out;
  }, [vMax]);

  /** Split a series into contiguous runs so publication gaps break the path. */
  const runs = (s: IntlSeries) => {
    const out: { year: number; value: number }[][] = [];
    let cur: { year: number; value: number }[] = [];
    s.points.forEach((p, i) => {
      if (i > 0 && p.year - s.points[i - 1].year > 1) {
        if (cur.length) out.push(cur);
        cur = [];
      }
      cur.push(p);
    });
    if (cur.length) out.push(cur);
    return out;
  };

  const dimmed = (s: IntlSeries) => focus !== null && focus !== s.code;
  const lit = (s: IntlSeries) => focus === s.code;

  const hovered = hoverYear === null ? [] :
    chart.series
      .map((s) => ({ s, p: s.points.find((q) => q.year === hoverYear) }))
      .filter((h) => h.p) as { s: IntlSeries; p: { year: number; value: number } }[];

  const legendTap = (s: IntlSeries) => {
    // Phones and keyboards: first activation highlights, second opens detail.
    if (focus === s.code) { onPick(s); track("intl_series_opened", { c: s.code }); }
    else { setFocus(s.code); track("intl_series_focused", { c: s.code }); }
  };

  return (
    <figure className="m-0 mb-6">
      <figcaption className="font-display font-semibold text-foreground text-[19px] mb-1">
        {chart.title}
      </figcaption>
      <p className="text-muted text-[13px] m-0 mb-3">{chart.unit}</p>

      {/* The legend, ABOVE the plot, wired to the lines. */}
      <ul className="list-none p-0 m-0 mb-3 flex flex-wrap gap-x-4 gap-y-1"
        onMouseLeave={() => setFocus(null)}>
        {chart.series.map((s) => (
          <li key={s.code}>
            <button
              type="button"
              onMouseEnter={() => setFocus(s.code)}
              onFocus={() => setFocus(s.code)}
              onClick={() => legendTap(s)}
              aria-pressed={lit(s)}
              className={`flex items-center gap-2 text-[15px] py-1 px-1 border-b-2 transition-colors ${
                lit(s) ? "border-foreground text-foreground"
                       : "border-transparent text-foreground/70 hover:text-foreground"
              }`}
            >
              <svg width="22" height="8" aria-hidden="true">
                <line x1="0" y1="4" x2="22" y2="4" stroke="currentColor"
                  strokeWidth={s.emphasis ? 3 : 1.5}
                  strokeDasharray={s.kind === "world" ? "4 3" : undefined} />
              </svg>
              {s.name}
            </button>
          </li>
        ))}
      </ul>

      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img"
        aria-label={`${chart.title}. ${chart.unit}. Use the legend buttons to highlight a country and open its detail.`}
        onMouseLeave={() => { setHoverYear(null); }}
        style={{ fontFamily: "inherit", overflow: "visible" }}>
        {yTicks.map((t) => (
          <g key={t}>
            <line x1={padL} y1={Y(t)} x2={W - padR} y2={Y(t)} stroke="rgb(var(--edge))" strokeWidth="1" />
            <text x={padL - 8} y={Y(t) + 4} fontSize={fsTick} fill="rgb(var(--muted))" textAnchor="end">{t}</text>
          </g>
        ))}
        {dataWindowTicks(narrow).map((y) => (
          <text key={y} x={X(y)} y={H - (narrow ? 22 : 12)} fontSize={fsTick}
            fill="rgb(var(--muted))" textAnchor="middle">{y}</text>
        ))}

        {chart.series.map((s) => {
          const base = s.emphasis ? (narrow ? 3.4 : 2.4) : (narrow ? 2 : 1.3);
          const sw = lit(s) ? base + 1.2 : base;
          const op = dimmed(s) ? 0.18 : s.emphasis || lit(s) ? 1 : 0.62;
          return (
            <g key={s.code}
              onClick={() => { onPick(s); track("intl_series_opened", { c: s.code }); }}
              onMouseEnter={() => setFocus(s.code)}
              style={{ cursor: "pointer", transition: "opacity 120ms" }}>
              {runs(s).map((r, i) => {
                const d = r.map((p, j) => `${j ? "L" : "M"}${X(p.year).toFixed(1)},${Y(p.value).toFixed(1)}`).join(" ");
                return (
                  <g key={i}>
                    <path d={d} fill="none" stroke="rgb(var(--foreground))" strokeWidth={sw}
                      strokeDasharray={s.kind === "world" ? "5 4" : undefined} opacity={op} />
                    {/* fat hit target */}
                    <path d={d} fill="none" stroke="transparent" strokeWidth={narrow ? 24 : 14} />
                    {/* single-point runs would be invisible as paths */}
                    {r.length === 1 && (
                      <circle cx={X(r[0].year)} cy={Y(r[0].value)} r={narrow ? 4 : 2.6}
                        fill="rgb(var(--foreground))" opacity={op} />
                    )}
                  </g>
                );
              })}
            </g>
          );
        })}

        {/* hover columns */}
        {Array.from({ length: x1 - x0 + 1 }, (_, i) => x0 + i).map((y) => (
          <rect key={y} x={X(y) - (W - padL - padR) / (x1 - x0) / 2} y={padT}
            width={Math.max(3, (W - padL - padR) / (x1 - x0))} height={H - padT - padB}
            fill="transparent" onMouseEnter={() => setHoverYear(y)} />
        ))}
        {hoverYear !== null && hovered.length > 0 && (
          <g pointerEvents="none">
            <line x1={X(hoverYear)} y1={padT} x2={X(hoverYear)} y2={H - padB}
              stroke="rgb(var(--muted))" strokeDasharray="3 3" />
            {(focus ? hovered.filter((h) => h.s.code === focus) : hovered).map((h, i) => (
              <circle key={i} cx={X(hoverYear)} cy={Y(h.p.value)} r={narrow ? 6 : 4.5}
                fill="rgb(var(--background))" stroke="rgb(var(--foreground))" strokeWidth="2" />
            ))}
            <text x={Math.min(Math.max(X(hoverYear), padL + 90), W - padR - 90)} y={padT - 8}
              fontSize={fsTip} fill="rgb(var(--foreground))" textAnchor="middle" fontWeight="600">
              {focus
                ? `${chart.series.find((s) => s.code === focus)?.name} · ${hoverYear}: ${
                    hovered.find((h) => h.s.code === focus)?.p.value ?? "—"}`
                : `${hoverYear} — hover the legend to single out a country`}
            </text>
          </g>
        )}
      </svg>

      <p className="text-muted text-[14px] measure mt-3 mb-0">
        Hover or tap a legend entry to light up its line; tap again (or click the line)
        for the full year-by-year table, method and caveats. Dashed line is the world
        aggregate. Breaks in a line are years the source does not publish.
      </p>
    </figure>
  );
}
