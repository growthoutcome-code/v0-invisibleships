"use client";

import { useState } from "react";
import Link from "next/link";
import { useNarrow } from "@/components/DataPrimitives";
import { Dialog, DialogContent, DialogHeader, DialogBody, DialogTitle } from "@/components/ui/dialog";
import { axisTicks, tickIndexes } from "@/lib/chart-axis";
import { track } from "@/lib/analytics";
import type { DayPoint } from "@/lib/insights-posthog";

/**
 * Visits over time: this tab's tool solid, the other tab's tool faint behind it.
 *
 * THE SECOND LINE IS BACK, and deliberately. It was removed on 28 September because
 * two equal lines invited a comparison the numbers do not support. Sean, 29 September:
 * "I don't care that there is a difference. We'll figure that out in time. Please build
 * it as I suggested." So the comparison line returns in the shape he specified —
 * diminished, and clickable for an explanation that offers the other tab.
 *
 * Recorded because it is a real cost and not an oversight: sharing one axis means the
 * taller series sets the scale, so on the tab with the smaller numbers the primary line
 * uses less of its own chart than it did alone. That is inherent to an overlay in
 * absolute units. Indexing both series to their own first day would avoid it and was
 * offered; absolute units were chosen.
 *
 * A REAL TIME SCALE, not an index one. The old version spaced points evenly by
 * position, which was fine for one series and is wrong for two: the tools disagree
 * about which days exist at all — PostHog emits a zero for a quiet day, Google omits
 * it — so evenly spaced positions would put the same date in two different places.
 * Points are now placed by date, which also fixes a defect noted on 29 September, that
 * Google's x-axis ticks were unevenly spaced in calendar terms.
 */

type Series = { points: DayPoint[]; label: string };
type Compare = Series & {
  /** Where the other tab lives, for the panel's link. */
  href: string;
  /** One sentence for the panel: what this line is. */
  blurb: string;
};

type Geometry = { W: number; H: number; padT: number; padB: number; padL: number; padR: number };

// TWO GEOMETRIES, NOT ONE SCALED DOWN. The chart is an SVG with a viewBox and w-full,
// so on a phone the whole drawing scales to roughly 45% — which took 9px axis labels
// down to about 4px. The narrow canvas is smaller with proportionally larger text.
const WIDE: Geometry = { W: 720, H: 200, padT: 12, padB: 26, padL: 38, padR: 10 };
const NARROW: Geometry = { W: 360, H: 208, padT: 10, padB: 30, padL: 34, padR: 8 };

const nf = new Intl.NumberFormat("en-US");
const time = (day: string) => Date.parse(`${day}T00:00:00Z`);

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
  compare,
}: {
  points: DayPoint[];
  label: string;
  note?: string;
  compare?: Compare | null;
}) {
  const narrow = useNarrow();
  const [open, setOpen] = useState<number | null>(null);
  const [cmpOpen, setCmpOpen] = useState(false);

  if (points.length === 0) {
    return <p className="mt-3 text-[14px] text-muted">No daily figures available for this range.</p>;
  }

  const g = narrow ? NARROW : WIDE;
  const fontAxis = narrow ? 12 : 9;

  const days = [...points].sort((a, b) => a.day.localeCompare(b.day));
  const cmp = compare ? [...compare.points].sort((a, b) => a.day.localeCompare(b.day)) : [];

  const total = days.reduce((a, p) => a + p.n, 0);
  const cmpTotal = cmp.reduce((a, p) => a + p.n, 0);

  // The axis holds BOTH series, which is what makes them comparable at a glance and
  // what costs the shorter one its height. See the note at the top of this file.
  const peak = Math.max(...days.map((p) => p.n), ...cmp.map((p) => p.n));
  const ticks = axisTicks(peak);
  const top = ticks[ticks.length - 1];

  // Every date either tool reported, for the x domain and the date labels.
  const union = Array.from(new Set([...days, ...cmp].map((p) => p.day))).sort();
  const t0 = time(union[0]);
  const t1 = time(union[union.length - 1]);
  const plotW = g.W - g.padL - g.padR;

  const x = (day: string) => g.padL + (t1 === t0 ? 0 : ((time(day) - t0) / (t1 - t0)) * plotW);
  const y = (n: number) => g.padT + (1 - n / top) * (g.H - g.padT - g.padB);
  const bandW = plotW / Math.max(1, union.length - 1);

  const line = (ps: DayPoint[]) =>
    ps.map((p, i) => `${i === 0 ? "M" : "L"} ${x(p.day).toFixed(1)} ${y(p.n).toFixed(1)}`).join(" ");

  const xTicks = tickIndexes(union.length, narrow ? 3 : 5);

  const picked = open === null ? null : days[open];
  const prev = open !== null && open > 0 ? days[open - 1] : null;
  const rank = picked ? days.filter((d) => d.n > picked.n).length + 1 : 0;
  const share = picked && total > 0 ? (picked.n / total) * 100 : 0;
  const delta = picked && prev ? picked.n - prev.n : null;

  return (
    <div className="mt-4">
      <svg
        viewBox={`0 0 ${g.W} ${g.H}`}
        className="h-auto w-full touch-manipulation"
        role="img"
        aria-label={
          `Visits per day, ${label}: ${total} in total across ${days.length} days, peaking at ${peak}.` +
          (compare ? ` A second, fainter line shows ${compare.label} over the same period, ${cmpTotal} in total.` : "")
        }
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

        {/* HIT COLUMNS, THE BOTTOM LAYER ON PURPOSE. SuicideChart carries a comment
            about the afternoon this cost: rendered last, transparent columns sit on
            top of the lines and swallow every click, and the chart looks broken while
            every handler is correct. One per day of THIS tab's series, since that is
            what the day panel describes. */}
        {days.map((p, i) => (
          <rect key={`hit-${p.day}`} x={x(p.day) - bandW / 2} y={g.padT}
                width={bandW} height={g.H - g.padT - g.padB}
                fill="transparent" style={{ cursor: "pointer" }}
                onClick={() => { setOpen(i); track("insights_chart_day_opened", { source: label, day: p.day, visits: p.n }); }} />
        ))}

        {/* The comparison line, under the primary one and diminished. */}
        {cmp.length > 0 && (
          <path d={line(cmp)} fill="none" stroke="currentColor" strokeWidth="1.5"
                strokeLinejoin="round" strokeLinecap="round" strokeDasharray="4 3"
                vectorEffect="non-scaling-stroke"
                className="pointer-events-none text-foreground" style={{ opacity: 0.3 }} />
        )}

        <path d={line(days)} fill="none" stroke="currentColor" strokeWidth="1.75"
              strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke"
              className="pointer-events-none text-foreground" />

        {(days.length === 1 || bandW >= (narrow ? 9 : 6)) &&
          days.map((p) => (
            <circle key={`dot-${p.day}`} cx={x(p.day)} cy={y(p.n)} r={narrow ? 3 : 2.4}
                    className="pointer-events-none fill-current text-foreground" />
          ))}

        {/* The comparison line's own hit target, ABOVE the day columns so that a click
            on the faint line explains the faint line rather than opening a day. A wide
            transparent stroke, because a 1.5px dashed line is not something anyone can
            hit with a fingertip. */}
        {cmp.length > 0 && compare && (
          <path d={line(cmp)} fill="none" stroke="transparent" strokeWidth="16"
                style={{ cursor: "pointer" }}
                onClick={() => { setCmpOpen(true); track("insights_chart_compare_opened", { from: label, to: compare.label }); }} />
        )}

        {picked && open !== null && (
          <>
            <line x1={x(picked.day)} x2={x(picked.day)} y1={g.padT} y2={g.H - g.padB}
                  stroke="currentColor" strokeWidth="1" strokeDasharray="3 3"
                  className="pointer-events-none text-muted" />
            <circle cx={x(picked.day)} cy={y(picked.n)} r={narrow ? 5 : 4}
                    className="pointer-events-none fill-current text-foreground" />
          </>
        )}

        {xTicks.map((i) => (
          <g key={`xt-${i}`}>
            <line x1={x(union[i])} x2={x(union[i])} y1={g.H - g.padB} y2={g.H - g.padB + 4}
                  stroke="currentColor" strokeWidth="1" className="text-edge" />
            <text x={x(union[i])} y={g.H - g.padB + 4 + fontAxis + 2}
                  textAnchor={i === 0 ? "start" : i === union.length - 1 ? "end" : "middle"}
                  style={{ fontSize: fontAxis }} className="fill-current text-muted">
              {shortDate(union[i])}
            </text>
          </g>
        ))}
      </svg>

      {/* A LEGEND, which one line did not need and two do. The faint line is also a
          button here: a reader who does not think to press a dashed line in a chart
          still has somewhere to find out what it is. */}
      {compare && cmp.length > 0 && (
        <p className="m-0 mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-[13px] text-muted">
          <span className="flex items-center gap-2">
            <svg width="20" height="6" aria-hidden className="shrink-0">
              <line x1="0" y1="3" x2="20" y2="3" stroke="currentColor" strokeWidth="1.75" className="text-foreground" />
            </svg>
            {label}
          </span>
          <button
            type="button"
            onClick={() => { setCmpOpen(true); track("insights_chart_compare_opened", { from: label, to: compare.label, via: "legend" }); }}
            className="flex items-center gap-2 border-0 bg-transparent p-0 text-[13px] text-muted underline underline-offset-4 transition-colors hover:text-foreground"
          >
            <svg width="20" height="6" aria-hidden className="shrink-0">
              <line x1="0" y1="3" x2="20" y2="3" stroke="currentColor" strokeWidth="1.5"
                    strokeDasharray="4 3" className="text-foreground" style={{ opacity: 0.3 }} />
            </svg>
            {compare.label}
          </button>
        </p>
      )}

      {note && <p className="mt-3 max-w-3xl text-[13px] leading-relaxed text-muted">{note}</p>}

      {/* The day panel. */}
      <Dialog open={picked !== null} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent size="md">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">{picked ? longDate(picked.day) : ""}</DialogTitle>
          </DialogHeader>
          <DialogBody>
            {picked && (
              <>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <div className="border border-edge p-3">
                    <div className="font-display text-[26px] font-semibold leading-none text-foreground">{nf.format(picked.n)}</div>
                    <div className="font-display mt-2 text-[11px] uppercase tracking-[0.14em] text-muted">
                      {label === "Google" ? "Sessions" : "Visits"}
                    </div>
                  </div>
                  <div className="border border-edge p-3">
                    <div className="font-display text-[26px] font-semibold leading-none text-foreground">
                      {share < 1 && share > 0 ? "<1" : Math.round(share)}%
                    </div>
                    <div className="font-display mt-2 text-[11px] uppercase tracking-[0.14em] text-muted">Of the range</div>
                  </div>
                  <div className="border border-edge p-3">
                    <div className="font-display text-[26px] font-semibold leading-none text-foreground">
                      {delta === null ? "—" : delta > 0 ? `+${nf.format(delta)}` : nf.format(delta)}
                    </div>
                    <div className="font-display mt-2 text-[11px] uppercase tracking-[0.14em] text-muted">On the day before</div>
                  </div>
                </div>

                <p className="mt-4 text-[15px] leading-relaxed text-foreground/85">
                  {picked.n === 0
                    ? "No visits were recorded on this day."
                    : rank === 1
                      ? `The busiest day in this range: nothing else reaches ${nf.format(picked.n)}.`
                      : `Ranks ${rank} of ${days.length} days in this range. The busiest reached ${nf.format(peak)}.`}
                  {prev ? ` The day before recorded ${nf.format(prev.n)}.` : " This is the first day in the range."}
                </p>

                <p className="mt-4 border-t border-edge pt-3 text-[13px] leading-relaxed text-muted">
                  A day&rsquo;s figure is a count of recorded visits, not of people. It cannot say
                  how many distinct readers are behind it, and there is no per-day breakdown of
                  pages or places &mdash; both tables below the chart cover the whole range.
                </p>
              </>
            )}
          </DialogBody>
        </DialogContent>
      </Dialog>

      {/* The comparison panel: what the faint line is, and the way to it. */}
      {compare && (
        <Dialog open={cmpOpen} onOpenChange={setCmpOpen}>
          <DialogContent size="md">
            <DialogHeader>
              <DialogTitle className="font-display text-2xl">{compare.label}</DialogTitle>
            </DialogHeader>
            <DialogBody>
              <p className="font-display m-0 text-[11px] uppercase tracking-[0.14em] text-muted">
                The fainter line
              </p>
              <p className="mt-3 text-[15px] leading-relaxed text-foreground/85">{compare.blurb}</p>
              <p className="mt-4 text-[15px] leading-relaxed text-foreground/85">
                Over this range it recorded{" "}
                <span className="font-display text-foreground">{nf.format(cmpTotal)}</span> against{" "}
                <span className="font-display text-foreground">{nf.format(total)}</span> on the{" "}
                {label} line. The two tools define a visit differently and filter differently, so
                the totals are not expected to match and neither one corrects the other.
              </p>
              <Link
                href={compare.href}
                className="font-display mt-5 inline-block border border-foreground px-4 py-2 text-[12px] font-medium uppercase tracking-[0.14em] text-foreground transition-colors hover:bg-foreground hover:text-background"
              >
                Open the {compare.label} tab
              </Link>
            </DialogBody>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
