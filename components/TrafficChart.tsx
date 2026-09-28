import type { DayPoint } from "@/lib/insights-posthog";

/**
 * Visits over time, one line per source.
 *
 * REPLACES THE DONUT. A donut answered "what proportion of traffic can be
 * believed", which was a fair question but a static one — and Sean's actual
 * question is whether anyone is arriving, which is a question about time. A ring
 * cannot show a marketing push landing; a line can.
 *
 * Inline SVG, no charting dependency, same as the tables that are their own bar
 * charts. Two series at this data volume is arithmetic, and a library would ship
 * more bytes than the whole page.
 *
 * THE TWO LINES ARE NOT COMPARABLE AND THE CAPTION SAYS SO. PostHog's line has the
 * author, previews and non-production hosts filtered out; GA's has nothing filtered
 * at all. GA will sit above PostHog more or less permanently, and the gap is mostly
 * Sean's own visits rather than a measurement dispute. Drawing them together is
 * still worth it — the shape of the two lines over time is comparable even when the
 * levels are not, and a push that lifts one should lift both.
 *
 * Days are unioned across both sources rather than taken from either, because the
 * two disagree about which days exist: GA omits zero days, PostHog includes them.
 */

type Series = { key: string; label: string; points: DayPoint[]; dashed?: boolean };

const W = 720;
const H = 200;
const PAD = { top: 12, right: 8, bottom: 22, left: 30 };

export default function TrafficChart({
  series,
  note,
}: {
  series: Series[];
  note?: string;
}) {
  const present = series.filter((s) => s.points.length > 0);
  if (present.length === 0) {
    return <p className="mt-3 text-[14px] text-muted">No daily figures available for this range.</p>;
  }

  // Union of every day either source reported, sorted. A day missing from one
  // source is a zero for that source, not a gap in the line — GA simply omits days
  // with no traffic, and a line that skipped them would imply the opposite.
  const days = Array.from(new Set(present.flatMap((s) => s.points.map((p) => p.day)))).sort();
  const at = (s: Series, day: string) => s.points.find((p) => p.day === day)?.n ?? 0;
  const max = Math.max(1, ...present.flatMap((s) => days.map((d) => at(s, d))));

  const x = (i: number) =>
    PAD.left + (days.length <= 1 ? 0 : (i / (days.length - 1)) * (W - PAD.left - PAD.right));
  const y = (n: number) => PAD.top + (1 - n / max) * (H - PAD.top - PAD.bottom);

  const path = (s: Series) =>
    days.map((d, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(at(s, d)).toFixed(1)}`).join(" ");

  const first = days[0];
  const last = days[days.length - 1];
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
        aria-label={`Visits per day. ${present
          .map((s) => `${s.label}: ${days.reduce((a, d) => a + at(s, d), 0)} total`)
          .join(". ")}`}
      >
        {/* Baseline and peak only. A full grid on a chart this small is clutter. */}
        {[0, max].map((v) => (
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

        {present.map((s) => (
          <path
            key={s.key}
            d={path(s)}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            strokeDasharray={s.dashed ? "4 3" : undefined}
            className="text-foreground"
            style={{ opacity: s.dashed ? 0.45 : 1 }}
          />
        ))}

        {days.length > 1 && (
          <>
            <text x={PAD.left} y={H - 6} className="fill-current text-[9px] text-muted">
              {fmt(first)}
            </text>
            <text
              x={W - PAD.right}
              y={H - 6}
              textAnchor="end"
              className="fill-current text-[9px] text-muted"
            >
              {fmt(last)}
            </text>
          </>
        )}
      </svg>

      <ul className="m-0 mt-3 flex list-none flex-wrap gap-x-6 gap-y-1 p-0">
        {present.map((s) => (
          <li key={s.key} className="flex items-center gap-2 text-[13px] text-foreground/85">
            <svg width="22" height="8" aria-hidden className="shrink-0">
              <line
                x1="0"
                y1="4"
                x2="22"
                y2="4"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeDasharray={s.dashed ? "4 3" : undefined}
                className="text-foreground"
                style={{ opacity: s.dashed ? 0.45 : 1 }}
              />
            </svg>
            {s.label}
            <span className="text-muted">{days.reduce((a, d) => a + at(s, d), 0)}</span>
          </li>
        ))}
      </ul>

      {note && <p className="mt-3 max-w-3xl text-[13px] leading-relaxed text-muted">{note}</p>}
    </div>
  );
}
