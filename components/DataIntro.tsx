"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { track } from "@/lib/analytics";
import DisclaimerLink from "@/components/DisclaimerLink";

/**
 * The Data section's disclaimer tiering (Sean, 2026-08-20).
 *
 * ONE comprehensive disclaimer lives at /disclaimer. Everything here points to
 * it rather than restating it — the section used to carry six separate blocks
 * of caution language, which readers skim past.
 *
 *   <DataNotice />     PRIMARY   — Timeline only, prominent, dismissable
 *   <DataNoteLine />   SECONDARY — one muted line under a sub-tab heading
 *
 * Tertiary (registers, charts, terms, concepts) gets nothing beyond the
 * evidence-tier chip that is already part of the data.
 */

const KEY = "is_data_notice_v2"; // bump to re-show after wording changes

export function DataNotice() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try { setShow(window.localStorage.getItem(KEY) !== "1"); }
    catch { setShow(true); }
  }, []);

  const dismiss = () => {
    setShow(false);
    track("data_disclaimer_dismissed");
    try { window.localStorage.setItem(KEY, "1"); } catch { /* private mode */ }
  };

  if (!show) return null;

  return (
    <aside role="note" className="w-full flex items-start gap-6 bg-panel px-6 py-5 mb-10">
      <p className="body-copy text-foreground/85 measure m-0">
        <strong>About this data.</strong> This research was assembled with AI assistance from public
        records and published statistics, then checked against the original sources. Coverage is
        uneven — a small number here may mean little was reported, not that little happened — and
        nothing in this section connects any system to any person&rsquo;s experience. Every figure
        carries an evidence grade and a link to where it came from.{" "}
        <DisclaimerLink from="data_notice" className="text-accent underline underline-offset-4 whitespace-nowrap">
          Read the full disclaimer →
        </DisclaimerLink>
      </p>
      <button onClick={dismiss} aria-label="Dismiss notice" className="ml-auto shrink-0 text-muted hover:text-foreground">
        <X size={20} />
      </button>
    </aside>
  );
}

export function DataNoteLine({ children, from }: { children: React.ReactNode; from: string }) {
  return (
    <p className="text-muted text-[15px] mb-10 measure">
      {children} <DisclaimerLink from={from} />
    </p>
  );
}
