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
 * filters nothing. GA therefore sat permanently above PostHog, and a reader — Sean
 * included — naturally read the gap as disagreement about arithmetic when it was
 * mostly his own visits. Two tabs, one line each, and each caption says whose visits
 * are in it.
 *
 * Inline SVG, no charting dependency, same as the tables that are their own bar
 * charts. A line over a few dozen points is arithmetic, and a library would ship more
 * bytes than the whole page.
 */

const W = 720;
const H = 200;
const PAD = { top: 12, right: 8, bottom: 22, left: 34 };

/**
 * Gridline values from 0 to at or above the series maximum, on a round step.
 *
 * Sean, 28 September: "for the vertical axis, the y-axis, let's include some numbers
 * in between 0 and 13." The chart had exactly two labels, 0 and the maximum, so a peak
 * of 13 gave no way to read the height of anything else on the line.
 *
 * Steps come from the 1-2-5 family, so labels stay whole numbers — these are counts of
 * visits, and an axis reading 3.25 would be nonsense for a thing you cannot have a
 * quarter of. The top tick is rounded UP past the peak, which also stops the line from
 * touching the ceiling of the plot.
 */
export function axisTicks(max: number): number[] {
  const peak = Math.max(1, max);
  const target = peak / 4;
  const mag = 10 ** Math.floor(Math.log10(target));
  const norm = target / mag;
  // The 1-2-2.5-5-10 family. 2.5 earns its place on the sizes this page actually
  // shows: a peak of 984 without it lands on a step of 500 and an axis reading
  // 0 / 500 / 1000, which is three labels and no detail. With it the step is 250.
  const nice = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10) * mag;
  // INTEGER STEPS ONLY, and never zero.
  //
  // Found by scripts/check_axis_ticks.mts on its first run: a peak of 1 produced a
  // step of 0.5, and rounding the labels for display turned [0, 0.5, 1] into
  // [0, 1, 1] — a duplicated gridline drawn twice at different heights with the same
  // number beside it. Rounding the STEP rather than the labels is the fix; these are
  // counts of visits, and half a visit is not a quantity.
  const step = Math.max(1, Math.round(nice));
  const top = Math.ceil(peak / step) * step;
  const out: number[] = [];
  for (let v = 0; v <= top; v += step) out.push(v);
  return out;
}

export default function TrafficChart({
  points,
  label,
  note,
}: {
  points: DayPoint[];
  /** Used in the accessible description and the total beneath the chart. */
  label: string;
  note?: string;
}) {
  if (points.length === 0) {
    return <p className="mt-3 text-[14px] text-muted">No daily figures available for this range.</p>;
  }

  // Sorted here rather than trusted from the caller. GA returns dates as YYYYMMDD and
  // omits days with no traffic; PostHog includes them as zero. Sorting the ISO strings
  // is correct for both, and the gaps in GA's list are left as gaps rather than
  // invented as zeroes, because GA genuinely does not tell us which it means.
  const days = [...points].sort((a, b) => a.day.localeCompare(b.day));
  const total = days.reduce((a, p) => a + p.n, 0);
  const peak = Math.max(...days.map((p) => p.n));
  const ticks = axisTicks(peak);
  const top = ticks[ticks.length - 1];

  const x = (i: number) =>
    PAD.left + (days.length <= 1 ? 0 : (i / (days.length - 1)) * (W - PAD.left - PAD.right));
  const y = (n: number) => PAD.top + (1 - n / top) * (H - PAD.top - PAD.bottom);

  const path = days
    .map((p, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(p.n).toFixed(1)}`)
    .join(" ");

  const fmt = (d: string) =>
    new Date(`${d}T00:00:00Z`).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      timeZone: "UTC",
    });

  return (
    <div className="mt-4">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full"
        role="img"
        aria-label={`Visits per day, ${label}. ${total} in total, peaking at ${peak} on one day.`}
      >
        {ticks.map((v) => (
          <g key={v}>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={y(v)}
              y2={y(v)}
              stroke="currentColor"
              strokeWidth="1"
              className="text-edge"
            />
            <text
              x={PAD.left - 6}
              y={y(v) + 4}
              textAnchor="end"
              className="fill-current text-[9px] text-muted"
            >
              {v}
            </text>
          </g>
        ))}

        <path
          d={path}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          className="text-foreground"
        />

        {/* A single day has no line to draw, so it gets a dot. Without this the chart
            renders an empty grid on a range with one day of traffic in it. */}
        {days.length === 1 && (
          <circle cx={x(0)} cy={y(days[0].n)} r="3" className="fill-current text-foreground" />
        )}

        {days.length > 1 && (
          <>
            <text x={PAD.left} y={H - 6} className="fill-current text-[9px] text-muted">
              {fmt(days[0].day)}
            </text>
            <text
              x={W - PAD.right}
              y={H - 6}
              textAnchor="end"
              className="fill-current text-[9px] text-muted"
            >
              {fmt(days[days.length - 1].day)}
            </text>
          </>
        )}
      </svg>

      <p className="font-display m-0 mt-3 text-[12px] uppercase tracking-[0.14em] text-muted">
        {label} &middot; {total} total
      </p>

      {note && <p className="mt-3 max-w-3xl text-[13px] leading-relaxed text-muted">{note}</p>}
    </div>
  );
}
