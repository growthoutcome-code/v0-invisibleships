"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { track } from "@/lib/analytics";

// Bump the suffix to re-show the notice after the wording changes.
const KEY = "is_insights_disclaimer_v2";

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
 * without saying where the numbers came from, which is the first thing a reader of a
 * measurement page wants to know. This version names the two tools, concedes that the
 * figures are only as good as the instrumentation behind them, and then spends its
 * remaining words on the one distortion that is large and specific here rather than
 * generic — VPN exits standing in for readers' locations.
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
        <strong>About these figures.</strong> They come from Google Analytics and PostHog, and
        they are only as accurate as the way this site was set up to collect them. Locations
        are read from network addresses, and a visit arriving through a VPN reports the exit
        point rather than the reader &mdash; so a city on this page is where a connection
        surfaced, not where somebody is.
      </p>
      <button onClick={dismiss} aria-label="Dismiss notice" className="ml-auto shrink-0 text-muted hover:text-foreground">
        <X size={20} />
      </button>
    </aside>
  );
}
