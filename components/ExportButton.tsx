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
 * ONE WORD, BECAUSE THE ICON CARRIES THE VERB. "Download the corpus" said the
 * verb twice — once as a glyph and once as a word — and "corpus" is a word a
 * first-time reader has to translate. The arrow means download. What is left to
 * say is what comes down, and the answer a reader actually wants is the
 * transcripts.
 *
 * ACCURACY, AND WHY THE DIALOG IS NOT OPTIONAL. The download is the whole
 * archive, not only transcripts — 448 of its 828 Markdown files are journal
 * entries and recordings. A one-word button naming the headline content is fair
 * only because clicking it opens a dialog that states the full contents BEFORE
 * anything is fetched. Wire this button to a bare href and the label starts
 * under-describing what the reader gets.
 */
export const EXPORT_LABEL = "Transcripts";

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
