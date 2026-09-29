"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { track } from "@/lib/analytics";

// Bump the suffix to re-show the notice after the wording changes.
const KEY = "is_insights_disclaimer_v1";

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
 * The author is deliberately not mentioned. Sean: "leave 'the author's visits'
 * out of the disclaimer." The footer's own line says the count includes him and
 * every Google tile that includes him is captioned, so this says the part a
 * reader cannot work out unaided instead.
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
        These figures are estimates, not a headcount.{" "}
        <strong>Counting misses anyone who blocks it, and counts some people twice</strong> — a
        phone and a laptop, a cleared browser, an address that changes part-way through a
        visit. A visit here is a request that was recorded, which is not the same thing as a
        reader.
      </p>
      <button onClick={dismiss} aria-label="Dismiss notice" className="ml-auto shrink-0 text-muted hover:text-foreground">
        <X size={20} />
      </button>
    </aside>
  );
}
