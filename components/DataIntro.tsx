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

/**
 * The Concepts section's equivalent of DataNotice (Sean, 2026-08-27).
 *
 * Concepts used to open with roughly 2,400 characters before the first entry:
 * two intro paragraphs, a "what the labels mean" panel, a "what is not
 * established" heading with four lines, a basis chart and a closing note. All
 * of it true, none of it read, and the filter sat below the lot.
 *
 * So: one dismissable alert the same size and shape as DataNotice, and the
 * detail behind a single expander rather than deleted. The four standing limits
 * are the most credible thing on the page — they are what a hostile reader
 * checks for — and they stay one click away rather than being cut to hit a
 * character count.
 */
const CKEY = "is_concepts_notice_v1";

export function ConceptsNotice({
  children,
}: {
  /** The detail: standing limits, label definitions, basis composition. */
  children?: React.ReactNode;
}) {
  const [show, setShow] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try { setShow(window.localStorage.getItem(CKEY) !== "1"); }
    catch { setShow(true); }
  }, []);

  const dismiss = () => {
    setShow(false);
    track("concepts_disclaimer_dismissed");
    try { window.localStorage.setItem(CKEY, "1"); } catch { /* private mode */ }
  };

  if (!show) return null;

  return (
    <aside role="note" className="w-full bg-panel px-6 py-5 mb-10">
      <div className="flex items-start gap-6">
        <p className="body-copy text-foreground/85 measure m-0">
          <strong>About these concepts.</strong> Ideas drawn from the research, each tagged with who
          formed it and what it rests on, because they are not the same kind of claim. None of this
          establishes wrongdoing by any organisation, and nothing here is independently verified
          unless it says so.{" "}
          <button type="button" onClick={() => { setOpen((v) => !v); if (!open) track("concepts_limits_opened"); }}
            aria-expanded={open} className="text-accent underline underline-offset-4">
            {open ? "Hide the detail" : "What these do not establish"}
          </button>{" "}
          ·{" "}
          <DisclaimerLink from="concepts_notice" className="text-accent underline underline-offset-4 whitespace-nowrap">
            Read the full disclaimer →
          </DisclaimerLink>
        </p>
        <button onClick={dismiss} aria-label="Dismiss notice" className="ml-auto shrink-0 text-muted hover:text-foreground">
          <X size={20} />
        </button>
      </div>
      {open && children && <div className="mt-6 pt-6 border-t border-edge">{children}</div>}
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
