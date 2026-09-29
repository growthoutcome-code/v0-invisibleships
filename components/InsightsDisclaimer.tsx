"use client";

import { useEffect, useState } from "react";

/**
 * The caveat on the face of /insights, dismissible per device.
 *
 * A banner like this existed until 29 September and Sean had it removed; this is the
 * replacement he asked for the same day, with different words. The earlier one said
 * visits "can be missed, double-counted, or belong to the author rather than a
 * reader". The author clause is deliberately gone: he asked for it out, and it was
 * doing a job that now belongs elsewhere — the footer's own line says the count
 * includes him, and the Google tab captions each figure that does.
 *
 * What is left is the part a reader cannot work out for themselves, and it is the
 * honest half anyway: a count of visits is not a count of people, in both directions
 * at once.
 *
 * DISMISSAL IS PER DEVICE AND PER VERSION. The key carries a version so that
 * rewording the disclaimer shows it again to somebody who dismissed the last one —
 * otherwise a changed caveat is invisible to exactly the readers who already engaged
 * with it once.
 */
const KEY = "is:insights-disclaimer-v2-dismissed";

export default function InsightsDisclaimer() {
  // Starts hidden and appears after mount: the server cannot know whether this
  // browser dismissed it, and rendering it server-side would flash the banner at
  // somebody who closed it. Every storage access is wrapped, because localStorage
  // throws rather than returning null in a private window with site data blocked —
  // and a disclaimer that takes the page down with it is worse than no disclaimer.
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(KEY) !== "1") setShow(true);
    } catch {
      setShow(true);
    }
  }, []);

  if (!show) return null;

  return (
    <div
      role="note"
      className="animate-fade-in mb-8 flex items-start justify-between gap-4 border border-edge bg-foreground/[0.03] px-4 py-3"
    >
      <p className="body-copy m-0 max-w-3xl text-[13.5px] leading-relaxed text-muted">
        These figures are estimates, not a headcount. Counting misses anyone who blocks
        it, and one person can be counted more than once &mdash; a phone and a laptop, a
        cleared browser, an address that changes part-way through a visit. A visit here
        is a request that was recorded, which is not the same thing as a reader.
      </p>
      <button
        type="button"
        onClick={() => {
          setShow(false);
          try {
            window.localStorage.setItem(KEY, "1");
          } catch {
            /* dismissal simply does not persist here; the banner is not worth an error */
          }
        }}
        aria-label="Dismiss this note"
        className="font-display shrink-0 text-[11px] uppercase tracking-[0.14em] text-muted underline underline-offset-4 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        Dismiss
      </button>
    </div>
  );
}
