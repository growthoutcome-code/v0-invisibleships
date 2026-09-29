"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { track } from "@/lib/analytics";

// Bump the suffix to re-show the notice after the wording changes.
const KEY = "is_insights_disclaimer_v4";

/**
 * Dismissable notice for /insights.
 *
 * SAME SHELL AS DataNotice in components/DataIntro.tsx, deliberately and to the
 * class: aside/role=note, bg-panel, the same padding and margin, the same
 * measure on the paragraph, the same lucide X in the same position, the same
 * localStorage-with-a-version-suffix, the same track() on dismiss. Sean,
 * 29 September: "use the same styling as the dismissible disclaimer on the
 * research page." A second notice that is nearly the same reads as a mistake.
 *
 * NOT a new UI primitive: this is the site's existing notice pattern, which
 * DataNotice and ConceptsNotice already share. shadcn's Alert is not installed
 * here, and installing it would mean restyling those two as well — a change to
 * the research page that was not asked for.
 *
 * WHAT IT SAYS, and why this wording. The first version described counting error in
 * the abstract — estimates not a headcount, some people counted twice. Sean, 29
 * September: "this sounds strange to me." It was: it explained a statistical property
 * without saying anything a reader of a measurement page actually wants to know first.
 *
 * The replacement opened by naming Google Analytics and PostHog. That went too, and
 * for a good reason — Sean: "it's redundant with the tabs present." The tab row sits
 * directly beneath this notice and says GOOGLE and POSTHOG in as many words; a
 * sentence repeating them is a sentence a reader has to get through twice.
 *
 * Three concepts were drafted and this is the third, chosen 29 September. It covers
 * the instrumentation, the undercount from blocked counting, and the VPN distortion,
 * and then does the thing the other two did not: it says how much weight a reader
 * should put on any one number. That last clause is the point of the notice. A page
 * of figures invites quoting a figure, and the honest answer here is that the shape
 * over time survives the measurement error and a single total does not.
 *
 * The author's own visits are deliberately not mentioned, per Sean. That caveat lives
 * on the captions of the Google tiles that carry it, where somebody reading those
 * figures will meet it.
 *
 * The KEY carries a version. Rewording without bumping it would leave this text
 * invisible to everyone who dismissed the previous one.
 */
export default function InsightsDisclaimer() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try { setShow(window.localStorage.getItem(KEY) !== "1"); }
    catch { setShow(true); }
  }, []);

  const dismiss = () => {
    setShow(false);
    track("insights_disclaimer_dismissed");
    try { window.localStorage.setItem(KEY, "1"); } catch { /* private mode */ }
  };

  if (!show) return null;

  return (
    <aside role="note" className="w-full flex items-start gap-6 bg-panel px-6 py-5 mb-10">
      <p className="body-copy text-foreground/85 measure m-0">
        <strong>About these figures.</strong> They depend on how this site was instrumented,
        they miss anyone who blocks counting, and they read location from a network address
        &mdash; which a VPN replaces with its own. Reliable enough to show direction over
        time, and unreliable enough that no single figure should be quoted on its own.
      </p>
      <button onClick={dismiss} aria-label="Dismiss notice" className="ml-auto shrink-0 text-muted hover:text-foreground">
        <X size={20} />
      </button>
    </aside>
  );
}
