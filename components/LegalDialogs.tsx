"use client";

/**
 * The disclaimer and the safety note, as modals.
 *
 * Sean, 30 August: the footer carries both, "and it loads a modal when you
 * click on either."
 *
 * WHY A MODAL IS THE RIGHT CALL HERE, having just taken a gate down: a gate
 * interrupts you on the way to something you asked for. These open only when
 * somebody clicks them, close to exactly where they were, and never stand
 * between a reader and the page. The point is that checking the terms should
 * not cost you your place in what you were reading.
 *
 * Both still exist as their own URLs — /disclaimer and /safety — because a
 * modal cannot be linked to, cited, or crawled, and the disclaimer is a
 * document seventy-five corpus files point at. The modal is the convenient
 * path, never the only one; each one ends with a link to the page itself.
 *
 * Each takes its trigger as children, so a call site decides whether it is a
 * footer link, a button, or a line in a toast.
 */
import type { ReactNode } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import CopyrightTerms from "@/components/CopyrightTerms";
import SafetyNote from "@/components/SafetyNote";
import { GATE } from "@/lib/gate-content";

function CloseButton() {
  return (
    <DialogClose className="font-display inline-flex h-10 items-center bg-foreground px-4 text-[12px] font-medium uppercase tracking-[0.14em] text-background">
      Close
    </DialogClose>
  );
}

export function DisclaimerDialog({ children }: { children: ReactNode }) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      {/* lg — the disclaimer is long prose and reads badly at chart width. */}
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-semibold">
            Disclaimer, copyright and terms
          </DialogTitle>
        </DialogHeader>
        <DialogBody>
          <CopyrightTerms variant="modal" />
        </DialogBody>
        <DialogFooter>
          <a
            href="/disclaimer"
            className="mr-auto text-[13px] text-muted underline underline-offset-4 hover:text-foreground"
          >
            Open as a page
          </a>
          <CloseButton />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function SafetyDialog({ children }: { children: ReactNode }) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-semibold">
            {GATE.safety.title}
          </DialogTitle>
        </DialogHeader>
        <DialogBody>
          <SafetyNote compact />
        </DialogBody>
        <DialogFooter>
          <a
            href="/safety"
            className="mr-auto text-[13px] text-muted underline underline-offset-4 hover:text-foreground"
          >
            Open as a page
          </a>
          <CloseButton />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
