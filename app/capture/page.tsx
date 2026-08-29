import type { Metadata } from "next";
import CaptureView from "@/components/CaptureView";

/**
 * /capture — the private recording stream.
 *
 * Deliberately NOT inside GatedApp. The age gate is a consent screen for
 * readers of the published archive; this is a signed-in tool for making a
 * record, and putting a gate between someone and a record button while
 * something is happening to them would be indefensible.
 *
 * noindex: nothing here is published, and the page should not appear in a
 * search result next to the public archive.
 */
export const metadata: Metadata = {
  title: "Capture — Invisible Ships",
  robots: { index: false, follow: false },
  alternates: { canonical: "/capture" },
};

export default function Page() {
  return (
    <>
      {/* Not the site header — that one is bound to the journal shell's tab
          state and would drag the whole browser in. This is the minimum a
          person needs: what site they are on, and a way back to it. Landing
          here from a link with no route out was the first thing wrong with
          this page. */}
      <header className="w-full px-5 sm:px-8 h-[72px] flex items-center gap-4 border-b border-edge">
        <a href="/" className="font-display font-semibold tracking-tight text-foreground text-lg">
          Invisible Ships
        </a>
        <a href="/journal"
           className="ml-auto text-[13px] uppercase tracking-wide text-muted hover:text-foreground">
          The archive
        </a>
      </header>
      <main className="mx-auto max-w-3xl px-5 sm:px-8 py-10">
        <CaptureView />
      </main>
    </>
  );
}
