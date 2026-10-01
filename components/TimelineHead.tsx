"use client";

import { useEffect, useState } from "react";
import { H2_CLASS, SUB_CLASS } from "@/components/SectionHead";
import { track } from "@/lib/analytics";

/**
 * The Timeline tab's head, in the same shape as the other Research tabs (Sean,
 * 30 Sep 2026: "a h2 or h3 title with the filter floating right at the top of the
 * tab content"): heading left, the timeline's Domain picker right, then the chart.
 *
 * The master timeline is drawn by public/reports/gov-cloud-report.js, which owns
 * its own heading and Domain <select> (#domSel). In Timeline mode those are
 * hidden by CSS (app/globals.css, .gov-timeline-only) and this mirrors the
 * picker: choosing here sets #domSel and fires its change event, so the script
 * redraws exactly as before.
 */
export default function TimelineHead() {
  const [opts, setOpts] = useState<string[]>([]);
  const [val, setVal] = useState("");

  useEffect(() => {
    let tries = 0;
    const id = window.setInterval(() => {
      const sel = document.getElementById("domSel") as HTMLSelectElement | null;
      if (sel && sel.options.length > 1) {
        setOpts(Array.from(sel.options).map((o) => o.value).filter(Boolean));
        setVal(sel.value);
        window.clearInterval(id);
      } else if (++tries > 50) window.clearInterval(id);
    }, 100);
    return () => window.clearInterval(id);
  }, []);

  const pick = (v: string) => {
    setVal(v);
    const sel = document.getElementById("domSel") as HTMLSelectElement | null;
    if (!sel) return;
    sel.value = v;
    sel.dispatchEvent(new Event("change", { bubbles: true }));
    track("timeline_domain", { domain: v || "all" });
  };

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <h2 className={H2_CLASS}>Master timeline &mdash; all threads</h2>
        {opts.length > 0 && (
          <label className="inline-flex items-center gap-2 text-[15px] text-muted shrink-0 mb-4 sm:mb-0 sm:-mt-1">
            Domain
            <select value={val} onChange={(e) => pick(e.target.value)} aria-label="Timeline domain"
              className="h-10 px-3 border border-edge bg-background text-foreground text-[15px] hover:border-foreground">
              <option value="">All domains</option>
              {opts.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </label>
        )}
      </div>
      <p className={SUB_CLASS}>
        Legislation, releases, deployments, litigation, investment, health and crime on one axis; hollow
        points are projected.
      </p>
    </>
  );
}
