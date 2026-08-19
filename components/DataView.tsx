"use client";

import { useEffect, useState } from "react";
import { track } from "@/lib/analytics";
import DataDisclaimer from "@/components/DataDisclaimer";
import GovCloudReport from "@/components/GovCloudReport";
import GovCloudSources from "@/components/GovCloudSources";
import HealthSignals from "@/components/HealthSignals";

/**
 * Data section — two sub-tabs, two datasets, deliberately separate:
 *
 *   Government Cloud       — the procurement research report (native render)
 *   Public Health Signals  — suicide/health statistics with tiered sources
 *
 * Neither dataset corroborates the other; each carries its own standing note.
 * The page TitleBand supplies the "Data" h1; the sub-tab row sits directly
 * under it, styled to match the report's own internal tabs.
 */
type SubTab = "govcloud" | "health";

export default function DataView() {
  const [sub, setSub] = useState<SubTab>("govcloud");

  useEffect(() => { track("data_report_viewed"); }, []);

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
        <button role="tab" aria-selected={sub === "govcloud"} className={tabCls(sub === "govcloud")} onClick={() => pick("govcloud")}>
          Government Cloud
        </button>
        <button role="tab" aria-selected={sub === "health"} className={tabCls(sub === "health")} onClick={() => pick("health")}>
          Public Health Signals
        </button>
      </div>

      {sub === "govcloud" ? (
        <>
          <DataDisclaimer />
          <GovCloudReport />
          <GovCloudSources />
        </>
      ) : (
        <HealthSignals />
      )}
    </div>
  );
}
