"use client";

/**
 * The corpus download button — one identity, two places.
 *
 * Sean, 10 September: "the button, download the whole archive… we need that
 * modal to happen when they click download the whole archive, and download the
 * whole archive from a button perspective and the export button top right in
 * the main nav, they need to have some kind of alignment. Right now, export
 * might seem a bit vague."
 *
 * Two problems, one cause. The header's button opened ExportModal — the only
 * place in the product that explains what the download IS and what to do with
 * it — while the Contribute section's button fired a bare zip at the browser.
 * Same destination, two behaviours, and the section that most wants a reader
 * to understand the archive was the one that explained the least.
 *
 * And the two were called different things: "Export" up top, "Download the
 * whole archive" down the page. Export is a word you use about your own data;
 * a visitor is not exporting anything, they are taking a copy.
 *
 * So the label lives here as one constant used by both call sites, and this
 * component is the button for anywhere that is not the header — it carries its
 * own dialog state so a Server Component page can drop it in without becoming
 * a client component itself.
 *
 * THE HEADER KEEPS ITS OWN INSTANCE. It already owns dialog state (the mobile
 * menu has to close as the modal opens) and its chrome is 12px uppercase, not
 * a 48px section action. It imports EXPORT_LABEL and nothing else, which is
 * the part that has to stay in step.
 */
import { useState } from "react";
import { Download } from "lucide-react";

import ExportModal from "@/components/ExportModal";

/**
 * The one name this button has, wherever it appears.
 *
 * Sean, 10 September: "just use the download link with the button with the
 * download icon and download transcripts... It needs to be shorter, and it
 * needs to be consistent."
 *
 * THE ICON CARRIES THE VERB, so no word is spent on "download". What the label
 * has to supply is the NOUN and the REASON, and it now supplies both.
 *
 * "TRANSCRIPTS" WAS WRONG, AND THIS CORRECTS IT (Sean, 15 September: "corpus
 * means body of work... it includes concepts, it includes research"). The
 * journal folder is 448 of 840 Markdown files — 53%. A button reading
 * "Transcripts" named barely half the download and silently omitted the
 * research, the concepts, the glossary, the registers and the CSVs. On a site
 * whose credibility rests on not overstating, understating is the same failure
 * pointed the other way.
 *
 * WHY "CORPUS" SURVIVES THE JARGON TEST. It needs translating, which normally
 * costs clicks. Two things pay for it: the audience self-selects — nobody
 * downloads 942 files casually, and a reader who has decided to go deeper is
 * reassured by a precise noun rather than put off by it — and it is already the
 * site’s own word, in the footer, the dialog and START-HERE.md inside the zip.
 *
 * WHY "FOR AI" AND NOT "AI CORPUS". English reads adjective-noun compounds as
 * attribution — "police report", "weather data" — so "AI corpus" parses as a
 * corpus MADE BY or ABOUT an AI. This archive spends real effort separating
 * `origin: ai` from `origin: author` on every concept and labelling which
 * assessments a model wrote; a button implying the whole body of work is
 * AI-generated undercuts exactly that. The preposition is load-bearing: it makes
 * the AI the recipient, not the source. The cost is four characters.
 */
export const EXPORT_LABEL = "Corpus for AI";

export default function ExportButton({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      {/* Matches SiteSection's primary action exactly — this sits in that row
          and must not read as a different class of control. The icon is the
          same lucide Download at the same weight the header uses; the two
          buttons have to be recognisable as one control in two places. */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          className ??
          "inline-flex h-12 items-center gap-2.5 rounded-md bg-foreground px-6 text-[17px] font-medium text-background"
        }
      >
        <Download size={18} aria-hidden />
        {EXPORT_LABEL}
      </button>
      <ExportModal open={open} onOpenChange={setOpen} />
    </>
  );
}
