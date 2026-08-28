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
    <main className="mx-auto max-w-6xl px-5 sm:px-8 py-10">
      <CaptureView />
    </main>
  );
}
