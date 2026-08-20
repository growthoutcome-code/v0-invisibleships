"use client";

import { useEffect, useMemo, useState } from "react";
import { track } from "@/lib/analytics";
import { DataNotice, DataNoteLine } from "@/components/DataIntro";
import { TimelineNarrative, TimelineHub } from "@/components/TimelineIntro";
import GovCloudReport from "@/components/GovCloudReport";
import GovCloudSources from "@/components/GovCloudSources";
import HealthSignals from "@/components/HealthSignals";

/**
 * Data section — three sub-tabs (Sean, 2026-08-20):
 *
 *   Timeline          — the six-track master timeline, the section's landing view
 *   Government Cloud  — the full procurement research report + source list
 *   Public Health     — suicide/health statistics with tiered sources
 *
 * Timeline and Government Cloud are two views of ONE mounted report instance:
 * the report is script-drawn, runs once per page load, and cannot survive an
 * unmount (see the memo below), so the sub-tabs drive its internal tab state
 * and CSS trims what each mode shows (.gov-timeline-only hides the internal
 * tab row; .gov-cloud-mode hides the internal Timeline button so the view
 * isn't offered twice).
 */
type SubTab = "timeline" | "govcloud" | "health";

/** Keep asserting the report's internal tab until its script has wired the
 *  buttons (the 185KB drawing script loads after mount). Clicking is
 *  idempotent, so retrying is safe. */
function setInternalTab(t: "time" | "adopt") {
  let tries = 0;
  const attempt = () => {
    const btn = document.querySelector<HTMLButtonElement>(`.gov-report .tab[data-t="${t}"]`);
    const active = btn?.classList.contains("on");
    if (btn && !active) btn.click();
    if (!active && ++tries < 12) setTimeout(attempt, 300);
  };
  attempt();
}

export default function DataView() {
  const [sub, setSub] = useState<SubTab>("timeline");

  useEffect(() => { track("data_report_viewed"); }, []);

  // Stable element identity: React bails out of this subtree on re-render,
  // which is what keeps the script-drawn charts alive across sub-tab switches.
  const report = useMemo(() => <GovCloudReport />, []);

  useEffect(() => {
    if (sub === "timeline") setInternalTab("time");
    if (sub === "govcloud") setInternalTab("adopt");
  }, [sub]);

  const pick = (s: SubTab) => {
    setSub(s);
    track("data_subtab", { tab: s });
  };

  const tabCls = (on: boolean) =>
    `font-display font-semibold text-[16px] px-1 pb-2 border-b-2 transition-colors ${
      on
        ? "text-foreground border-foreground"
        : "text-muted border-transparent hover:text-foreground"
    }`;

  return (
    <div className="w-full">
      <div role="tablist" aria-label="Data sub-sections" className="flex gap-8 mb-10 border-b border-edge">
        <button role="tab" aria-selected={sub === "timeline"} className={tabCls(sub === "timeline")} onClick={() => pick("timeline")}>
          Timeline
        </button>
        <button role="tab" aria-selected={sub === "govcloud"} className={tabCls(sub === "govcloud")} onClick={() => pick("govcloud")}>
          Government Cloud
        </button>
        <button role="tab" aria-selected={sub === "health"} className={tabCls(sub === "health")} onClick={() => pick("health")}>
          Public Health
        </button>
      </div>

      {/* PRIMARY disclaimer: prominent, once, on the landing view only. */}
      {sub === "timeline" && <DataNotice />}
      {sub === "govcloud" && (
        <DataNoteLine from="govcloud">
          AI-assisted research from public records · every fact evidence-graded and linked to its
          source · names used for identification only, no wrongdoing implied ·
        </DataNoteLine>
      )}

      {/* Chart first, then what it means, then where to go (Sean, 2026-08-20):
          the reader sees the timeline, gets the summary under it, and only then
          meets the sibling sections. */}
      <div className={sub === "health" ? "hidden" : sub === "timeline" ? "gov-timeline-only" : "gov-cloud-mode"}>
        {report}
        {sub === "govcloud" && <GovCloudSources />}
      </div>

      {sub === "timeline" && <TimelineNarrative onGo={pick} />}
      {sub === "timeline" && <TimelineHub onGo={pick} />}
      {sub === "health" && <HealthSignals onGoTimeline={() => pick("timeline")} />}
    </div>
  );
}
