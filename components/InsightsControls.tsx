"use client";

import { useRouter } from "next/navigation";
import { RANGES, type RangeKey } from "@/lib/insights-posthog";
import { SOURCES, DEFAULT_SOURCE, type SourceKey } from "@/lib/insights-source";

// Re-exported so existing imports of the type keep working. Only the TYPE crosses
// this boundary; the runtime helpers stay in lib/insights-source.ts, because a
// "use client" module cannot hand a callable function to a server component.
export type { SourceKey };

/**
 * One row: which tool on the left, which window on the right.
 *
 * BOTH ARE URL STATE, not component state. /insights?source=posthog&range=30d is a
 * link Sean can bookmark, send, or paste back to me when a number looks wrong — which
 * on this project has happened often enough to be worth designing for. It also keeps
 * the page a server component: the server reads the params and queries the right
 * window, instead of shipping the data to the browser and filtering it there.
 *
 * The tabs are ANCHORS rather than buttons, so they work with JavaScript off, open in
 * a new tab on a middle click, and are crawlable. Only the range needs a client
 * component at all, because a native <select> has to push the URL on change.
 */

export default function InsightsControls({
  source,
  range,
}: {
  source: SourceKey;
  range: RangeKey;
}) {
  const router = useRouter();

  // Built with URLSearchParams rather than string concatenation. The previous version
  // worked out "?" versus "&" from whether the source was the default, which is the
  // kind of thing that silently produces /insights?range=30d&range=30d the moment a
  // third param appears.
  const href = (s: SourceKey, r: RangeKey) => {
    const q = new URLSearchParams();
    if (s !== DEFAULT_SOURCE) q.set("source", s);
    if (r !== "all") q.set("range", r);
    const qs = q.toString();
    return `/insights${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="mt-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-edge pb-3">
      <div role="tablist" aria-label="Analytics source" className="flex items-center gap-1">
        {SOURCES.map((s) => {
          const active = s.key === source;
          return (
            <a
              key={s.key}
              href={href(s.key, range)}
              role="tab"
              aria-selected={active}
              className={
                active
                  ? "font-display border-b-2 border-foreground px-3 py-2 text-[12px] font-medium uppercase tracking-[0.14em] text-foreground"
                  : "font-display border-b-2 border-transparent px-3 py-2 text-[12px] font-medium uppercase tracking-[0.14em] text-muted transition-colors hover:text-foreground"
              }
            >
              {s.label}
            </a>
          );
        })}
      </div>

      <label className="flex items-center gap-2">
        <span className="sr-only">Date range</span>
        <select
          value={range}
          onChange={(e) => router.push(href(source, e.target.value as RangeKey))}
          className="font-display cursor-pointer border border-edge bg-transparent px-3 py-2 text-[12px] uppercase tracking-[0.14em] text-foreground transition-colors hover:border-foreground focus:outline-none focus:ring-1 focus:ring-foreground"
        >
          {(Object.keys(RANGES) as RangeKey[]).map((k) => (
            <option key={k} value={k}>
              {RANGES[k].label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
