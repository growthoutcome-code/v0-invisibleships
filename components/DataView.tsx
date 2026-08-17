"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics";
import DataDisclaimer from "@/components/DataDisclaimer";
import GovCloudReport from "@/components/GovCloudReport";
import GovCloudSources from "@/components/GovCloudSources";

/**
 * Government Cloud research report — rendered natively in the page.
 *
 * Order: provenance notice, the report itself, then the full source list. No
 * heading of its own — the page TitleBand supplies the "Data" h1 and the report
 * supplies its stats subline.
 */
export default function DataView() {
  useEffect(() => { track("data_report_viewed"); }, []);
  return (
    <div className="w-full">
      <DataDisclaimer />
      <GovCloudReport />
      <GovCloudSources />
    </div>
  );
}
