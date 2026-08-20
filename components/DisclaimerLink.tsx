"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import CopyrightTerms from "@/components/CopyrightTerms";
import { track } from "@/lib/analytics";

/**
 * Every in-page reference to the disclaimer (Sean, 2026-08-20).
 *
 * Opens the full disclaimer in a modal rather than navigating: a reader
 * mid-chart or mid-register should be able to check the terms and carry on
 * exactly where they were. The modal renders the SAME component as
 * /disclaimer, so the two can never drift apart.
 *
 * The standalone route still exists and is what gets shared, linked from the
 * footer, and indexed — this only changes in-page references.
 */
export default function DisclaimerLink({
  from,
  className = "",
  children = "full disclaimer",
}: {
  from: string;
  className?: string;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => { setOpen(true); track("disclaimer_opened", { from, mode: "modal" }); }}
        className={className || "underline underline-offset-4 hover:text-foreground"}
      >
        {children}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[820px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">
              Disclaimer, Copyright &amp; Terms of Use
            </DialogTitle>
          </DialogHeader>
          <div className="mt-2">
            <CopyrightTerms variant="modal" />
          </div>
          <p className="text-muted text-[14px] mt-6 mb-0">
            This is the same text published at{" "}
            <a href="/disclaimer" className="underline underline-offset-4 hover:text-foreground">
              /disclaimer
            </a>
            , where it can be linked or shared.
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}
