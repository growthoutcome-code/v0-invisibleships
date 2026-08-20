"use client";

/**
 * Monochrome loading placeholders that hold the final layout, so content
 * landing 3-5s later doesn't shift the page. Pulse is disabled under
 * prefers-reduced-motion via Tailwind's motion-safe variant.
 */

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`motion-safe:animate-pulse bg-panel rounded ${className}`}
    />
  );
}

/** A register/list placeholder: n rows shaped like the real ones. */
export function SkeletonRows({ n = 5 }: { n?: number }) {
  return (
    <div role="status" aria-label="Loading">
      {Array.from({ length: n }, (_, i) => (
        <div key={i} className="flex items-center gap-4 py-4 border-b border-edge/60">
          <Skeleton className="h-5 w-8 rounded-full shrink-0" />
          <Skeleton className={`h-4 ${i % 2 ? "w-3/5" : "w-4/5"}`} />
          <Skeleton className="h-3 w-12 ml-auto shrink-0" />
        </div>
      ))}
      <span className="sr-only">Loading…</span>
    </div>
  );
}

/** A chart placeholder: axes frame + pulsing plot band at the final height. */
export function SkeletonChart() {
  return (
    <div role="status" aria-label="Loading chart" className="mb-12">
      <Skeleton className="h-5 w-72 mb-2" />
      <Skeleton className="h-3 w-96 mb-3" />
      <div className="relative w-full" style={{ aspectRatio: "720 / 260" }}>
        <div className="absolute inset-0 border-l border-b border-edge" />
        <Skeleton className="absolute inset-x-6 top-6 bottom-8" />
      </div>
      <span className="sr-only">Loading chart…</span>
    </div>
  );
}
