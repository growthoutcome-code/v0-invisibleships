"use client";

import { useEffect, useMemo, useRef } from "react";
import { track } from "@/lib/analytics";
import { DataNoteLine } from "@/components/DataIntro";
import { TimelineNarrative, TimelineHub } from "@/components/TimelineIntro";
import GovCloudReport from "@/components/GovCloudReport";
import GovCloudSources from "@/components/GovCloudSources";
import GovCloudBriefs from "@/components/GovCloudBriefs";
import HealthSignals from "@/components/HealthSignals";
import CrimeSignals from "@/components/CrimeSignals";
import ConceptsView from "@/components/ConceptsView";
import ResearchHero from "@/components/ResearchHero";
import TimelineHead from "@/components/TimelineHead";
import SideNav from "@/components/SideNav";
import { viewsFor } from "@/lib/routes";
import { NO_FILTERS, type Filters, type ConceptSort } from "@/lib/concepts";

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
function setInternalTab(t: string) {
  let tries = 0;
  const attempt = () => {
    const btn = document.querySelector<HTMLButtonElement>(`.gov-report .tab[data-t="${t}"]`);
    const active = btn?.classList.contains("on");
    if (btn && !active) btn.click();
    if (!active && ++tries < 12) setTimeout(attempt, 300);
  };
  attempt();
}

/** The Government Cloud views that are panels of the script-drawn report. */
const GOV_PANELS = ["adopt", "proc", "invest", "lit", "cap"];

/**
 * CONTROLLED by JournalBrowser since the Data/Concepts merge (Sean, 2026-08-26).
 *
 * The parent owns `sub` because the address bar depends on it: the concepts
 * vertical is addressable at /concepts, every other vertical at /data, and
 * those URLs are indexed and deep-linked. Keeping the state here would mean the
 * URL could not follow a sub-tab click.
 */
export default function DataView({
  sub, onSub, view, onView, conceptFilters, setConceptFilters, conceptSort, setConceptSort,
}: {
  sub: SubTab;
  onSub: (s: SubTab) => void;
  /** The view showing within the section (lib/routes.ts RESEARCH_VIEWS). */
  view: string;
  onView: (v: string) => void;
  conceptFilters: Filters;
  setConceptFilters: (f: Filters) => void;
  conceptSort: ConceptSort;
  setConceptSort: (s: ConceptSort) => void;
}) {
  useEffect(() => { track("data_report_viewed"); }, []);

  // The concept list's controls live here because the hero steers them: picking
  // a reader or a subject up there has to open the list down here already
  // filtered. Lifting the state is what makes that one click instead of two.
  // Held by JournalBrowser since 30 Sep 2026: the Sort and Filter buttons sit
  // beside the page title, which that component renders.
  // Both hero sections and the report's own <h2>s, which are bare siblings
  // rather than wrapped, hence the selector.

  const explore = (patch: Partial<Filters>) => {
    setConceptFilters({ ...NO_FILTERS, ...patch });
    onSub("concepts");
  };

  // Stable element identity: React bails out of this subtree on re-render,
  // which is what keeps the script-drawn charts alive across sub-tab switches.
  const report = useMemo(() => <GovCloudReport />, []);

  // ONE VIEW AT A TIME, in every section (Sean, 30 Sep 2026: "mirror the
  // Government Cloud section's separate pages instead of long scrolling pages").
  // The sidebar lists the section's views; each has its own address. Government
  // Cloud's chart views are the report's own panels, opened by pressing the
  // report's (hidden) tab buttons, so the script draws exactly as before.
  const views = viewsFor(sub);
  const pickView = (id: string) => { onView(id); track("research_view", { section: sub, view: id }); };
  useEffect(() => {
    if (sub === "timeline") setInternalTab("time");
    if (sub === "govcloud" && GOV_PANELS.includes(view)) setInternalTab(view);
  }, [sub, view]);
  // A short fade on each view switch: the views are pages, but switching between
  // them is instant (the four-second loader plays on arriving at a section).
  const viewRoot = useRef<HTMLDivElement | null>(null);
  const firstView = useRef(true);
  useEffect(() => {
    if (firstView.current) { firstView.current = false; return; }
    viewRoot.current?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: "ease-out" });
  }, [view, sub]);
  const reportShown =
    (sub === "timeline" && (view === "master" || view === "law")) ||
    (sub === "govcloud" && GOV_PANELS.includes(view));

  const pick = (s: SubTab) => {
    onSub(s);
    track("data_subtab", { tab: s });
  };

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
      {/* Concepts has its own top-level nav entry (Sean, 2026-08-27), so it is
          not offered here as well: a reader who arrived at Concepts from the
          main menu should not be shown Research's vertical tabs, which would
          read as though Concepts were a sub-view of something else. The state
          still exists — the hero routes into it and /concepts resolves to it —
          it simply has no button and no tab row of its own. */}
      {/* PRIMARY disclaimer, ABOVE the tabs. Sean, 29 September: "move the
          disclaimer on the research page to the top of the page above the tabs."
          It still shows on the landing view only — it is the Timeline's notice,
          and the other verticals carry their own one-line version below. */}
      {/* The Research sentence under the title replaced the dismissible "About
          this data" panel (Sean, 30 Sep 2026); it is rendered with the title by
          JournalBrowser (PageIntro). */}

      {/* No section tabs (Sean, 30 Sep 2026: "get rid of the tabs within the research
          section they are redundant"): the four sections are in the main menu under
          Research, each with its own address and H1. */}


      {/* Chart first, then what it means, then where to go (Sean, 2026-08-20):
          the reader sees the timeline, gets the summary under it, and only then
          meets the sibling sections. */}
      <div ref={viewRoot}>
      <div className={ownRail ? "w-full lg:grid lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-x-10 lg:items-start" : "w-full"}>
        {ownRail && (
          <SideNav mode="index" label={sub === "timeline" ? "Timeline" : "Government Cloud"}
            sections={views.map((v) => ({ id: v.id, label: v.label }))}
            active={view} onPick={pickView} />
        )}
        <div id="research-root" className="min-w-0">
          {/* Every view opens the same way: an H2 and a subline, then the chart;
              descriptive copy follows the charts (Sean, 30 Sep 2026). */}
          {sub === "timeline" && view === "master" && <TimelineHead />}

          <div className={!reportShown ? "hidden" : sub === "timeline" ? `gov-timeline-only tl-view-${view}` : "gov-cloud-mode"}>
            {report}
            {sub === "govcloud" && (
              <div className="mt-10">
                <DataNoteLine from="govcloud">
                  AI-assisted research from public records · every fact evidence-graded and linked to its
                  source · names used for identification only, no wrongdoing implied ·
                </DataNoteLine>
              </div>
            )}
          </div>
          {sub === "govcloud" && view === "briefs" && <GovCloudBriefs />}
          {sub === "govcloud" && view === "sources" && <GovCloudSources />}

          {/* Timeline: the chart views first, then the findings, then the notes. */}
          {sub === "timeline" && view === "master" && <TimelineNarrative onGo={pick} />}
          {sub === "timeline" && view === "findings" && <ResearchHero onExplore={explore} part="found" />}
          {sub === "timeline" && view === "about" && <ResearchHero onExplore={explore} part="about" />}
          {sub === "timeline" && view === "about" && <TimelineHub onGo={pick} />}
        </div>
      </div>

      {sub === "health" && <HealthSignals onGoTimeline={() => pick("timeline")} view={view} onView={pickView} />}
      {sub === "crime" && <CrimeSignals onGoTimeline={() => pick("timeline")} view={view} onView={pickView} />}
      </div>
      {sub === "concepts" && <ConceptsView filters={conceptFilters} setFilters={setConceptFilters} sort={conceptSort} setSort={setConceptSort} />}
    </div>
  );
}
