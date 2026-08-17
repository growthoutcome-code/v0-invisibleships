"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics";
import GovCloudReport from "@/components/GovCloudReport";

/**
 * Government Cloud research report — rendered natively in the page.
 *
 * Deliberately chrome-free: the page TitleBand supplies the "Data" h1 and the
 * report supplies its own stats subline, so this component adds no heading, no
 * standfirst and no action row. The unstyled standalone artifact is not served —
 * it lives in report-src/ purely as input to scripts/build_govcloud_report.py.
 */
export default function DataView() {
  useEffect(() => { track("data_report_viewed"); }, []);
  return <GovCloudReport />;
}
