"use client";
// The section router for the SPA. It used to be the gate.
//
// Sean, 30 August: "the gate is still protecting all of the other navigation
// items. You can remove that protection." So there is no gate here any more —
// this renders the requested section directly, and the site's only warning is
// the dismissible ContentWarning mounted in app/layout.tsx.
//
// The name and the seam are kept deliberately. Ten route files mount this
// component; leaving it in place meant changing one file rather than ten, and
// it is where gating would go back if a subset of the archive ever needs it.
//
// WHAT REMOVING IT ACTUALLY CHANGED, and what it did not: the gate never
// protected this material from anything except a person. robots.ts allows the
// whole site and sitemap.ts advertises all 438 journal URLs, so search engines
// were never held back — the gate stopped precisely the readers Sean was
// sending links to, and nobody else.
//
// Its four screens were not deleted. Welcome is the home page, Copyright is
// /disclaimer, the perceptual-set essay is /why, and the safety note with the
// crisis line is /safety. lib/gate-content.ts is untouched and those pages read
// from it.
import JournalBrowser from "@/components/JournalBrowser";
import type { Tab } from "@/components/Header";
import type { SubTab } from "@/components/DataView";

export default function GatedApp({
  initialTab = "journal",
  initialSub,
}: { initialTab?: Tab; initialSub?: SubTab }) {
  return <JournalBrowser initialTab={initialTab} initialSub={initialSub} />;
}
