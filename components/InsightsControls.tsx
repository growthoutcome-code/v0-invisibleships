"use client";

import { useRouter } from "next/navigation";
import { RANGES, type RangeKey } from "@/lib/insights-posthog";

/**
 * One row: which tool on the left, which window on the right.
 *
 * BOTH ARE URL STATE, not component state. /insights?source=ga&range=30d is a link
 * Sean can bookmark, send, or paste back to me when a number looks wrong — which on
 * this project has happened often enough to be worth designing for. It also keeps the
 * page a server component: the server reads the params and queries the right window,
 * instead of shipping the data to the browser and filtering it there.
 *
 * The tabs are ANCHORS rather than buttons, so they work with JavaScript off, open in
 * a new tab on a middle click, and are crawlable. Only the range needs a client
 * component at all, because a native <select> has to push the URL on change.
 */

/**
 * Both first and by default. Sean: "we can open with both being selected, and then
 * someone can drop down to just GA data or PostHog data." Both is also the honest
 * default for this page — the interesting fact about these two tools is that they
 * disagree, and showing one alone hides it.
 */
const SOURCES = [
  { key: "both", label: "Both" },
  { key: "posthog", label: "PostHog" },
  { key: "ga", label: "Google Analytics" },
] as const;

export type SourceKey = (typeof SOURCES)[number]["key"];

export default function InsightsControls({
  source,
  range,
}: {
  source: SourceKey;
  range: RangeKey;
}) {
  const router = useRouter();
  const href = (s: SourceKey, r: RangeKey) =>
    `/insights${s === "both" ? "" : `?source=${s}`}${r === "all" ? "" : `${s === "both" ? "?" : "&"}range=${r}`}`;

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
