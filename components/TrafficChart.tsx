"use client";

import { useState } from "react";
import { useNarrow } from "@/components/DataPrimitives";
import { Dialog, DialogContent, DialogHeader, DialogBody, DialogTitle } from "@/components/ui/dialog";
import { axisTicks, tickIndexes } from "@/lib/chart-axis";
import { track } from "@/lib/analytics";
import type { DayPoint } from "@/lib/insights-posthog";

/**
 * Visits over time, one line, one source.
 *
 * REPLACED THE DONUT. A donut answered "what proportion of traffic can be believed",
 * a fair question but a static one — Sean's actual question is whether anyone is
 * arriving, which is a question about time. A ring cannot show a marketing push
 * landing; a line can.
 *
 * ONE SERIES, NOT TWO. The first version drew PostHog and GA together. Sean,
 * 28 September: "we cannot have a two-line chart that says both." He was right, and
 * for a better reason than clutter: the two lines never measured the same population.
 * PostHog filters out the author, preview deployments and non-production hosts; GA
 * filters nothing. GA therefore sat permanently above PostHog, and a reader read the
 * gap as disagreement about arithmetic when it was mostly Sean's own visits.
 *
 * A CLIENT COMPONENT SINCE 29 SEPTEMBER, for the day panel. Sean: "just like any
 * other chart in the website, if you click on a line, it's going to give you a modal
 * with insights on that point in time." It follows SuicideChart's pattern rather than
 * inventing one — shared Dialog, useNarrow, transparent hit columns, a track() call on
 * open — so the two charts cannot drift into behaving differently.
 *
 * Inline SVG, no charting dependency, same as the tables that are their own bar
 * charts. The Data section's charting stack decision (project/archive/) scoped itself
 * to maps, network graphs and bespoke visuals and said standard charts were not what
 * it was for.
 */

type Geometry = { W: number; H: number; padT: number; padB: number; padL: number; padR: number };

// TWO GEOMETRIES, NOT ONE SCALED DOWN.
//
// The chart is an SVG with a viewBox and `w-full`, so on a phone the whole drawing is
// scaled to roughly 45% — which took the 9px axis labels down to about 4px and made
// the chart, in Sean's words, not mobile friendly. Scaling a desktop drawing is not a
// mobile chart. The narrow geometry is a smaller canvas with proportionally larger
// text, so a label that is 12 units tall here lands at roughly 11 real pixels on a
// phone instead of four.
const WIDE: Geometry = { W: 720, H: 200, padT: 12, padB: 26, padL: 38, padR: 10 };
const NARROW: Geometry = { W: 360, H: 208, padT: 10, padB: 30, padL: 34, padR: 8 };

const nf = new Intl.NumberFormat("en-US");

function longDate(day: string) {
  return new Date(`${day}T00:00:00Z`).toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
  });
}
function shortDate(day: string) {
  return new Date(`${day}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", timeZone: "UTC",
  });
}

export default function TrafficChart({
  points,
  label,
  note,
}: {
  points: DayPoint[];
  /** "Google" or "PostHog" — named in the accessible description and the day panel. */
  label: string;
  note?: string;
}) {
  const narrow = useNarrow();
  const [open, setOpen] = useState<number | null>(null);

  if (points.length === 0) {
    return <p className="mt-3 text-[14px] text-muted">No daily figures available for this range.</p>;
  }

  const g = narrow ? NARROW : WIDE;
  const fontAxis = narrow ? 12 : 9;

  // Sorted here rather than trusted from the caller. GA returns dates as YYYYMMDD and
  // omits days with no traffic; PostHog includes them as zero. Sorting the ISO strings
  // is correct for both.
  const days = [...points].sort((a, b) => a.day.localeCompare(b.day));
  const total = days.reduce((a, p) => a + p.n, 0);
  const peak = Math.max(...days.map((p) => p.n));
  const ticks = axisTicks(peak);
  const top = ticks[ticks.length - 1];

  // Fewer date labels on a phone: four dates across 360 units is already tight, and a
  // crowded axis is the thing that makes small charts unreadable.
  const xTicks = tickIndexes(days.length, narrow ? 3 : 5);

  const x = (i: number) =>
    g.padL + (days.length <= 1 ? 0 : (i / (days.length - 1)) * (g.W - g.padL - g.padR));
  const y = (n: number) => g.padT + (1 - n / top) * (g.H - g.padT - g.padB);
  const bandW = (g.W - g.padL - g.padR) / Math.max(1, days.length - 1);

  const path = days.map((p, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(p.n).toFixed(1)}`).join(" ");

  const picked = open === null ? null : days[open];
  const prev = open !== null && open > 0 ? days[open - 1] : null;
  const rank = picked ? days.filter((d) => d.n > picked.n).length + 1 : 0;
  const share = picked && total > 0 ? (picked.n / total) * 100 : 0;
  const delta = picked && prev ? picked.n - prev.n : null;

  function pick(i: number) {
    setOpen(i);
    track("insights_chart_day_opened", { source: label, day: days[i].day, visits: days[i].n });
  }

  return (
    <div className="mt-4">
      <svg
        viewBox={`0 0 ${g.W} ${g.H}`}
        className="h-auto w-full touch-manipulation"
        role="img"
        aria-label={`Visits per day, ${label}. ${total} in total across ${days.length} days, peaking at ${peak}.`}
      >
        {ticks.map((v) => (
          <g key={v}>
            <line x1={g.padL} x2={g.W - g.padR} y1={y(v)} y2={y(v)}
                  stroke="currentColor" strokeWidth="1" className="text-edge" />
            <text x={g.padL - 6} y={y(v) + fontAxis / 3} textAnchor="end"
                  style={{ fontSize: fontAxis }} className="fill-current text-muted">
              {v}
            </text>
          </g>
        ))}

        {/* HIT COLUMNS, AND THEY ARE THE BOTTOM LAYER ON PURPOSE.
            SuicideChart carries a comment about this that cost somebody an afternoon:
            rendered last, transparent columns sit on top of the line and swallow every
            click, and the chart looks broken while every handler is correct. Drawn
            first, the line and its dots stay hittable and these catch everything else,
            so a tap anywhere in a day's column opens that day. */}
        {days.map((p, i) => (
          <rect
            key={`hit-${p.day}`}
            x={x(i) - bandW / 2}
            y={g.padT}
            width={bandW}
            height={g.H - g.padT - g.padB}
            fill="transparent"
            style={{ cursor: "pointer" }}
            onClick={() => pick(i)}
          />
        ))}

        <path d={path} fill="none" stroke="currentColor" strokeWidth="1.75"
              strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke"
              className="pointer-events-none text-foreground" />

        {/* A dot per day when they are far enough apart to aim at, and always for a
            single day, which has no line to draw at all. Below that spacing the dots
            merge into a bar and the hit columns are doing the work anyway. */}
        {(days.length === 1 || bandW >= (narrow ? 9 : 6)) &&
          days.map((p, i) => (
            <circle key={`dot-${p.day}`} cx={x(i)} cy={y(p.n)} r={narrow ? 3 : 2.4}
                    className="pointer-events-none fill-current text-foreground" />
          ))}

        {/* The selected day, marked so the panel and the chart agree about which point
            is being described. */}
        {picked && open !== null && (
          <>
            <line x1={x(open)} x2={x(open)} y1={g.padT} y2={g.H - g.padB}
                  stroke="currentColor" strokeWidth="1" strokeDasharray="3 3"
                  className="pointer-events-none text-muted" />
            <circle cx={x(open)} cy={y(picked.n)} r={narrow ? 5 : 4}
                    className="pointer-events-none fill-current text-foreground" />
          </>
        )}

        {xTicks.map((i) => (
          <g key={`xt-${i}`}>
            <line x1={x(i)} x2={x(i)} y1={g.H - g.padB} y2={g.H - g.padB + 4}
                  stroke="currentColor" strokeWidth="1" className="text-edge" />
            <text
              x={x(i)}
              y={g.H - g.padB + 4 + fontAxis + 2}
              textAnchor={i === 0 ? "start" : i === days.length - 1 ? "end" : "middle"}
              style={{ fontSize: fontAxis }}
              className="fill-current text-muted"
            >
              {shortDate(days[i].day)}
            </text>
          </g>
        ))}
      </svg>

      <p className="font-display m-0 mt-3 text-[12px] uppercase tracking-[0.14em] text-muted">
        {label} &middot; {nf.format(total)} total &middot; tap a day for detail
      </p>

      {note && <p className="mt-3 max-w-3xl text-[13px] leading-relaxed text-muted">{note}</p>}

      <Dialog open={picked !== null} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent size="md">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">
              {picked ? longDate(picked.day) : ""}
            </DialogTitle>
          </DialogHeader>
          <DialogBody>
            {picked && (
              <>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <div className="border border-edge p-3">
                    <div className="font-display text-[26px] font-semibold leading-none text-foreground">
                      {nf.format(picked.n)}
                    </div>
                    <div className="font-display mt-2 text-[11px] uppercase tracking-[0.14em] text-muted">
                      {label === "Google" ? "Sessions" : "Visits"}
                    </div>
                  </div>
                  <div className="border border-edge p-3">
                    <div className="font-display text-[26px] font-semibold leading-none text-foreground">
                      {share < 1 && share > 0 ? "<1" : Math.round(share)}%
                    </div>
                    <div className="font-display mt-2 text-[11px] uppercase tracking-[0.14em] text-muted">
                      Of the range
                    </div>
                  </div>
                  <div className="border border-edge p-3">
                    <div className="font-display text-[26px] font-semibold leading-none text-foreground">
                      {delta === null ? "—" : delta > 0 ? `+${nf.format(delta)}` : nf.format(delta)}
                    </div>
                    <div className="font-display mt-2 text-[11px] uppercase tracking-[0.14em] text-muted">
                      On the day before
                    </div>
                  </div>
                </div>

                <p className="mt-4 text-[15px] leading-relaxed text-foreground/85">
                  {/* A zero day gets said plainly. Ranking it produced "ranks 14 of 60",
                      which is arithmetically true and tells the reader nothing — with
                      dozens of days tied on zero, the rank is an artefact of the tie
                      rather than a fact about the day. */}
                  {picked.n === 0
                    ? "No visits were recorded on this day."
                    : rank === 1
                      ? `The busiest day in this range: nothing else reaches ${nf.format(picked.n)}.`
                      : `Ranks ${rank} of ${days.length} days in this range. The busiest reached ${nf.format(peak)}.`}
                  {prev ? ` The day before recorded ${nf.format(prev.n)}.` : " This is the first day in the range."}
                </p>

                {/* WHAT THIS PANEL DELIBERATELY DOES NOT CLAIM.
                    A day's figure is a count, not a readership. Neither tool can say
                    how many distinct people are behind it, and on the Google tab the
                    author is inside the number. Saying so here, where somebody is
                    looking at one day closely enough to have clicked it, matters more
                    than saying it once at the foot of the page. */}
                <p className="mt-4 border-t border-edge pt-3 text-[13px] leading-relaxed text-muted">
                  {label === "Google"
                    ? "Google counts every visit this day, the author’s included, and cannot separate them. It also cannot say how many distinct people are behind this number, or whether any of them came through a relay."
                    : "The author, preview deployments and non-production hosts are excluded from this figure. It still cannot say how many distinct people are behind it — one reader behind a rotating address can appear as several."}
                </p>
                <p className="mt-2 text-[13px] leading-relaxed text-muted">
                  There is no per-day breakdown of pages or places. Both tables below the
                  chart cover the whole range, not this day.
                </p>
              </>
            )}
          </DialogBody>
        </DialogContent>
      </Dialog>
    </div>
  );
}
