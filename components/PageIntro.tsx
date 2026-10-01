"use client";

import { useState } from "react";
import DisclaimerLink from "@/components/DisclaimerLink";
import { track } from "@/lib/analytics";

/**
 * One sentence under a section's page title, ending with a link that opens the
 * disclaimer modal (Sean, 30 Sep 2026: "just put one sentence of what the journal
 * is under the H1 header ... at the end of the sentence, put a link to the
 * disclaimer modal"). Same place, size and link on Journal, Concepts and Research.
 *
 * It replaced the dismissible panels ("About this data", "About these concepts"):
 * a dismissed panel was gone for good for that reader, which is the wrong
 * behaviour for the sentence that frames everything beneath it. Not dismissible.
 *
 * On phones (< 640px) the sentence drops from the 22px reading size to 17px
 * (Sean, 30 Sep 2026).
 *
 * `detail` is optional extra reading behind a small toggle, kept rather than cut
 * (Concepts: what the labels mean, what the concepts do not establish).
 */
export default function PageIntro({
  children, from, detail, detailLabel = "More",
}: {
  children: React.ReactNode;
  /** analytics source for the disclaimer link */
  from: string;
  detail?: React.ReactNode;
  detailLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="w-full mb-6 sm:mb-10">
      <p className="body-copy max-sm:text-[17px] max-sm:leading-[1.55] text-foreground/85 measure m-0">
        {children}{" "}
        <DisclaimerLink from={from} className="text-accent underline underline-offset-4 whitespace-nowrap">
          Read the disclaimer
        </DisclaimerLink>
        {detail && (
          <>
            {" "}·{" "}
            <button type="button" aria-expanded={open}
              onClick={() => { setOpen((v) => !v); if (!open) track("page_intro_detail_opened", { from }); }}
              className="text-accent underline underline-offset-4 whitespace-nowrap">
              {open ? "Hide" : detailLabel}
            </button>
          </>
        )}
      </p>
      {detail && open && <div className="mt-6 pt-6 border-t border-edge">{detail}</div>}
    </div>
  );
}
