"use client";

import { useMemo } from "react";
import { SOURCE_YEARS } from "@/lib/concepts";

/**
 * The two chart shapes the Research section uses, shared by the hero and the
 * concepts summary so neither owns the other's marks.
 *
 * Both are single-series magnitude charts: one ink, no categorical palette,
 * nothing to validate. Hand-rolled SVG and CSS in the site's own tokens, like
 * every other chart here, which is also how dark mode comes for free.
 */

/** Horizontal magnitude bars. One series, one ink. */
export function BarRows({
  rows, total, onPick, caption,
}: {
  rows: { key: string; label: string; n: number; note?: string }[];
  total: number;
  onPick?: (key: string) => void;
  caption: string;
}) {
  const max = Math.max(...rows.map((r) => r.n), 1);
  return (
    <figure className="m-0">
      <ul className="list-none p-0 m-0">
        {rows.map((r) => {
          const pct = (r.n / max) * 100;
          const row = (
            <>
              <span className="text-[15px] text-foreground w-[13rem] shrink-0 truncate">{r.label}</span>
              <span className="flex-1 min-w-0 h-[10px] bg-edge/40 rounded-[4px] overflow-hidden" aria-hidden="true">
                <span className="block h-full bg-foreground rounded-[4px]" style={{ width: `${Math.max(pct, 3)}%` }} />
              </span>
              <span className="text-[15px] text-muted tabular-nums w-[3rem] text-right shrink-0">{r.n}</span>
            </>
          );
          return (
            <li key={r.key} className="py-[3px]">
              {onPick ? (
                <button type="button" onClick={() => onPick(r.key)} title={r.note}
                  className="flex items-center gap-4 w-full text-left hover:text-accent">
                  {row}
                </button>
              ) : (
                <div className="flex items-center gap-4" title={r.note}>{row}</div>
              )}
            </li>
          );
        })}
      </ul>
      <figcaption className="text-[14px] text-muted mt-3">{caption} &middot; {total} concepts in total.</figcaption>
    </figure>
  );
}

/**
 * Evidence span. One dot per primary source on a linear year axis, stacked
 * where a year holds several. The sparse left and dense right IS the finding,
 * so the axis is not broken to flatter it.
 */
export function EvidenceSpan() {
  const dots = useMemo(() => {
    const sorted = [...SOURCE_YEARS].sort((a, b) => a.year - b.year);
    const seen = new Map<number, number>();
    return sorted.map((s) => {
      const k = seen.get(s.year) ?? 0;
      seen.set(s.year, k + 1);
      return { ...s, stack: k };
    });
  }, []);

  const W = 1000, PAD = 10, BASE = 112, MIN_Y = 1880, MAX_Y = 2030;
  const x = (y: number) => PAD + ((y - MIN_Y) / (MAX_Y - MIN_Y)) * (W - PAD * 2);
  const ticks = [1880, 1920, 1960, 2000, 2030];
  const labelled = [1888, 1976, 2007, 2020, 2024];
  const first = dots[0]?.year ?? 0;
  const last = dots[dots.length - 1]?.year ?? 0;

  return (
    <figure className="m-0">
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${W} 150`} className="w-full min-w-[520px] h-auto" role="img"
          aria-label={`Years of the ${SOURCE_YEARS.length} primary sources behind this research, from ${first} to ${last}.`}>
          <line x1={PAD} y1={BASE} x2={W - PAD} y2={BASE} className="stroke-edge" strokeWidth={2} />
          {ticks.map((t) => (
            <g key={t}>
              <line x1={x(t)} y1={BASE} x2={x(t)} y2={BASE + 6} className="stroke-edge" strokeWidth={2} />
              <text x={x(t)} y={BASE + 26} textAnchor="middle" className="fill-muted" fontSize={17}>{t}</text>
            </g>
          ))}
          {dots.map((d, i) => (
            <circle key={i} cx={x(d.year)} cy={BASE - 10 - d.stack * 13} r={5}
              className="fill-foreground stroke-background" strokeWidth={2}>
              <title>{`${d.year} — ${d.label}`}</title>
            </circle>
          ))}
          {labelled.map((yr) => {
            const d = dots.filter((z) => z.year === yr).pop();
            if (!d) return null;
            return (
              <text key={yr} x={x(yr)} y={BASE - 24 - d.stack * 13} textAnchor="middle"
                className="fill-muted" fontSize={16}>{yr}</text>
            );
          })}
        </svg>
      </div>
      <figcaption className="text-[14px] text-muted mt-2">
        One dot per primary source behind this research, by year of publication or judgment.
        Hover a dot to see the source. The record runs {first} to {last} &mdash; {last - first} years.
      </figcaption>
    </figure>
  );
}
