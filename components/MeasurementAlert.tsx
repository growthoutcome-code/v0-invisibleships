"use client";

import { useEffect, useState } from "react";
import MeasurementNotes from "@/components/MeasurementNotes";

/**
 * One line at the top of /insights saying the numbers are approximate, dismissible.
 *
 * WHY IT EXISTS. Every figure on that page has a caveat, and for most of today they
 * lived in a dialog behind a link most readers would never open. The page reported
 * an engaged reader in Los Angeles who was the author on a VPN, and eighteen corpus
 * downloads that were mostly a link being prefetched. A dashboard that looks precise
 * and is not should say so on its face, once, in a sentence.
 *
 * WHY DISMISSAL DOES NOT HIDE THE EXPLANATION. Sean asked to consolidate "How this
 * is measured" into this alert. Done — Learn more opens it — but the trigger is NOT
 * only here: a small permanent link sits beside the opt-out at the foot of the page.
 * Otherwise the first dismissal permanently removes the only route to the notes, and
 * a caveat a reader cannot get back to is worse than no caveat, because the page then
 * looks authoritative and offers nothing to check it against.
 *
 * WHY IT RENDERS AFTER MOUNT. The server cannot know whether this browser dismissed
 * it. Rendering it and then hiding would flash a banner at anyone who already said no;
 * rendering nothing and then fading it in costs one small shift at the top of the page
 * before anything is read. The second is the lesser sin, and the fade makes it read as
 * intentional rather than as jank.
 *
 * Storage is localStorage in a try/catch: private mode throws, cleared site data
 * forgets, and neither is a reason to fail. Forgetting means the banner returns, which
 * is the safe direction for a caveat.
 */

const DISMISSED = "is:insights-caveat-dismissed";

export default function MeasurementAlert() {
  // null = not yet known. Distinguished from false so the first paint renders nothing
  // rather than guessing.
  const [dismissed, setDismissed] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(DISMISSED) === "1");
    } catch {
      setDismissed(false);
    }
  }, []);

  if (dismissed !== false) return null;

  return (
    <div
      role="note"
      className="mb-8 flex animate-[fadeIn_300ms_ease-out] items-start gap-4 border border-edge bg-foreground/[0.03] px-4 py-3"
    >
      <p className="m-0 max-w-3xl flex-1 text-[14px] leading-relaxed text-foreground/85">
        These figures come from PostHog and are approximate &mdash; visits can be missed,
        double-counted, or belong to the author rather than a reader.{" "}
        <MeasurementNotes>
          <button
            type="button"
            className="font-display whitespace-nowrap text-[12px] uppercase tracking-[0.14em] text-muted underline underline-offset-4 transition-colors hover:text-foreground"
          >
            Learn more
          </button>
        </MeasurementNotes>
      </p>

      <button
        type="button"
        aria-label="Dismiss this notice"
        onClick={() => {
          try {
            localStorage.setItem(DISMISSED, "1");
          } catch {
            /* private mode — the banner simply returns next visit */
          }
          setDismissed(true);
        }}
        className="-mr-1 -mt-1 shrink-0 p-1 text-[18px] leading-none text-muted transition-colors hover:text-foreground"
      >
        &times;
      </button>
    </div>
  );
}
