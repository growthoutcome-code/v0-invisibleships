"use client";
// ONE HEADER (Sean, 4 Oct 2026: "make sure that the main menu that exists on a
// concept detail page is consistent with the rest of the site").
//
// Standalone item routes (/concepts/[id], /journal/[id], /glossary/[slug]) used
// to render their own slimmed-down copy of the header: a different height (56px
// against 72–88px), a different menu layout that drifted right once a button
// was added, and no Corpus for AI button. Header.tsx renders plain links when it
// is given no SPA callbacks, so the item routes now use it directly, with the
// section they belong to marked as current. This file stays only so the three
// readers keep one import; it adds nothing to Header.
import Header, { type Tab } from "@/components/Header";

export default function ItemHeader({ tab }: { tab?: Tab }) {
  return <Header tab={tab} />;
}
