import { CONFIDENCE_LABEL, type Confidence } from "@/lib/visit-trust";

/**
 * How much of the traffic can be stood behind, as a ring.
 *
 * Inline SVG on purpose. The site has no charting dependency and does not need one:
 * a four-segment ring is arithmetic, and a library would ship more bytes than the
 * whole page to draw it. The tables elsewhere are their own bar charts for the same
 * reason.
 *
 * Shades rather than colours, because the palette is monochrome and because the
 * order is meaningful — solid for what is confirmed, faint for what is not. A legend
 * carries the numbers, since a ring is good at proportion and bad at value.
 */

const ORDER: Confidence[] = ["confirmed", "probable", "relay", "automated", "unknown"];

/** Opacity of the foreground colour. Descending, so certainty reads as weight. */
const WEIGHT: Record<Confidence, number> = {
  confirmed: 1,
  probable: 0.55,
  relay: 0.28,
  automated: 0.14,
  unknown: 0.08,
};

const NOTE: Record<Confidence, string> = {
  confirmed: "clocks agree, precise address",
  probable: "clocks agree, coarse address",
  relay: "VPN or proxy — city is not the reader's",
  automated: "crawler, or a browser reporting UTC",
  unknown: "not enough signal",
};

export default function ConfidenceDonut({
  counts,
}: {
  counts: Partial<Record<Confidence, number>>;
}) {
  const present = ORDER.filter((k) => (counts[k] ?? 0) > 0);
  const total = present.reduce((sum, k) => sum + (counts[k] ?? 0), 0);

  if (total === 0) {
    return (
      <p className="mt-3 text-[14px] text-muted">
        Nothing recorded yet, so there is nothing to apportion.
      </p>
    );
  }

  // r is chosen so the circumference is a round-ish number; the exact value does not
  // matter because every offset is derived from it.
  const r = 60;
  const circumference = 2 * Math.PI * r;
  let consumed = 0;

  return (
    <div className="mt-4 flex flex-col gap-8 sm:flex-row sm:items-center">
      <svg
        viewBox="0 0 160 160"
        className="h-[160px] w-[160px] shrink-0"
        role="img"
        aria-label={`Visit confidence: ${present
          .map((k) => `${CONFIDENCE_LABEL[k]} ${counts[k]}`)
          .join(", ")}`}
      >
        {/* Track, so a single-segment ring still reads as a ring. */}
        <circle cx="80" cy="80" r={r} fill="none" stroke="currentColor" strokeWidth="16" className="text-edge" />
        {present.map((k) => {
          const n = counts[k] ?? 0;
          const length = (n / total) * circumference;
          // Negative offset walks clockwise from 12 o'clock, thanks to the rotation.
          const dashoffset = -consumed;
          consumed += length;
          return (
            <circle
              key={k}
              cx="80"
              cy="80"
              r={r}
              fill="none"
              stroke="currentColor"
              strokeWidth="16"
              strokeDasharray={`${length} ${circumference - length}`}
              strokeDashoffset={dashoffset}
              transform="rotate(-90 80 80)"
              className="text-foreground"
              style={{ opacity: WEIGHT[k] }}
            />
          );
        })}
      </svg>

      <ul className="m-0 min-w-0 flex-1 list-none p-0">
        {present.map((k) => {
          const n = counts[k] ?? 0;
          return (
            <li key={k} className="border-b border-edge py-2 last:border-b-0">
              <div className="flex items-baseline justify-between gap-4">
                <span className="flex min-w-0 items-center gap-2.5">
                  <span
                    aria-hidden
                    className="inline-block h-3 w-3 shrink-0 bg-foreground"
                    style={{ opacity: WEIGHT[k] }}
                  />
                  <span className="truncate text-[15px] text-foreground">{CONFIDENCE_LABEL[k]}</span>
                </span>
                <span className="font-display shrink-0 text-[15px] tabular-nums text-foreground">
                  {n}
                  <span className="ml-2 text-[12px] text-muted">
                    {Math.round((n / total) * 100)}%
                  </span>
                </span>
              </div>
              <p className="m-0 mt-0.5 pl-[22px] text-[12px] leading-snug text-muted">{NOTE[k]}</p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
