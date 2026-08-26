"use client";

import { useEffect, useMemo, useState } from "react";
import { track } from "@/lib/analytics";
import { DataNotice, DataNoteLine } from "@/components/DataIntro";
import { TimelineNarrative, TimelineHub } from "@/components/TimelineIntro";
import GovCloudReport from "@/components/GovCloudReport";
import GovCloudSources from "@/components/GovCloudSources";
import GovCloudBriefs from "@/components/GovCloudBriefs";
import HealthSignals from "@/components/HealthSignals";
import CrimeSignals from "@/components/CrimeSignals";
import ConceptsView from "@/components/ConceptsView";
import ResearchHero from "@/components/ResearchHero";
import SideNav, { useSectionNav } from "@/components/SideNav";
import { NO_FILTERS, type Filters } from "@/lib/concepts";

/**
 * Data section — three sub-tabs (Sean, 2026-08-20):
 *
 *   Timeline          — the six-track master timeline, the section's landing view
 *   Government Cloud  — the full procurement research report + source list
 *   Public Health     — suicide/health statistics with tiered sources
 *   Crime             — US crime statistics, built around the measurement problem
 *
 * Timeline and Government Cloud are two views of ONE mounted report instance:
 * the report is script-drawn, runs once per page load, and cannot survive an
 * unmount (see the memo below), so the sub-tabs drive its internal tab state
 * and CSS trims what each mode shows (.gov-timeline-only hides the internal
 * tab row; .gov-cloud-mode hides the internal Timeline button so the view
 * isn't offered twice).
 */
export type SubTab = "timeline" | "govcloud" | "health" | "crime" | "concepts";

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

/**
 * CONTROLLED by JournalBrowser since the Data/Concepts merge (Sean, 2026-08-26).
 *
 * The parent owns `sub` because the address bar depends on it: the concepts
 * vertical is addressable at /concepts, every other vertical at /data, and
 * those URLs are indexed and deep-linked. Keeping the state here would mean the
 * URL could not follow a sub-tab click.
 */
export default function DataView({
  sub, onSub,
}: {
  sub: SubTab;
  onSub: (s: SubTab) => void;
}) {
  useEffect(() => { track("data_report_viewed"); }, []);

  // The concept list's controls live here because the hero steers them: picking
  // a reader or a subject up there has to open the list down here already
  // filtered. Lifting the state is what makes that one click instead of two.
  const [conceptFilters, setConceptFilters] = useState<Filters>(NO_FILTERS);
  // Both hero sections and the report's own <h2>s, which are bare siblings
  // rather than wrapped, hence the selector.
  const nav = useSectionNav("research-root", { selector: "section, h2", heading: "h2" });

  const explore = (patch: Partial<Filters>) => {
    setConceptFilters({ ...NO_FILTERS, ...patch });
    onSub("concepts");
  };

  // Stable element identity: React bails out of this subtree on re-render,
  // which is what keeps the script-drawn charts alive across sub-tab switches.
  const report = useMemo(() => <GovCloudReport />, []);

  useEffect(() => {
    if (sub === "timeline") setInternalTab("time");
    if (sub === "govcloud") setInternalTab("adopt");
  }, [sub]);

  const pick = (s: SubTab) => {
    onSub(s);
    track("data_subtab", { tab: s });
  };

  const tabCls = (on: boolean) =>
    `font-display font-semibold text-[16px] px-1 pb-2 border-b-2 transition-colors ${
      on
        ? "text-foreground border-foreground"
        : "text-muted border-transparent hover:text-foreground"
    }`;

  // Timeline and Government Cloud share one scroll container because they share
  // the report element, which must never unmount. One outline serves both, and
  // the hook skips anything not currently rendered — so it always describes the
  // panel the reader is actually looking at.
  const ownRail = sub === "timeline" || sub === "govcloud";

  return (
    <div className="w-full">
      {/* The sub-navigation is the FIRST thing under the section heading (Sean,
          2026-08-26). It used to sit below the hero, which put the way out of a
          view halfway down it. */}
      <div role="tablist" aria-label="Research sections"
        className="flex flex-wrap gap-x-8 gap-y-2 mb-10 border-b border-edge">
        <button role="tab" aria-selected={sub === "timeline"} className={tabCls(sub === "timeline")} onClick={() => pick("timeline")}>
          Timeline
        </button>
        <button role="tab" aria-selected={sub === "govcloud"} className={tabCls(sub === "govcloud")} onClick={() => pick("govcloud")}>
          Government Cloud
        </button>
        <button role="tab" aria-selected={sub === "health"} className={tabCls(sub === "health")} onClick={() => pick("health")}>
          Public Health
        </button>
        <button role="tab" aria-selected={sub === "crime"} className={tabCls(sub === "crime")} onClick={() => pick("crime")}>
          Crime
        </button>
        <button role="tab" aria-selected={sub === "concepts"} className={tabCls(sub === "concepts")} onClick={() => pick("concepts")}>
          Concepts
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
      <div className={ownRail ? "w-full lg:grid lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-x-10 lg:items-start" : "w-full"}>
        {ownRail && (
          <SideNav mode="outline" label="On this page" sections={nav.sections} active={nav.active} />
        )}
        <div id="research-root" className="min-w-0">
          {sub === "timeline" && <ResearchHero onExplore={explore} />}

          <div className={sub === "health" || sub === "crime" || sub === "concepts" ? "hidden" : sub === "timeline" ? "gov-timeline-only" : "gov-cloud-mode"}>
            {report}
            {sub === "govcloud" && <GovCloudBriefs />}
            {sub === "govcloud" && <GovCloudSources />}
          </div>

          {sub === "timeline" && <TimelineNarrative onGo={pick} />}
          {sub === "timeline" && <TimelineHub onGo={pick} />}
        </div>
      </div>

      {sub === "health" && <HealthSignals onGoTimeline={() => pick("timeline")} />}
      {sub === "crime" && <CrimeSignals onGoTimeline={() => pick("timeline")} />}
      {sub === "concepts" && <ConceptsView filters={conceptFilters} setFilters={setConceptFilters} />}
    </div>
  );
}
