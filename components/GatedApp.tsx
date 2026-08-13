"use client";
// Client wrapper: shows the AccessGate until the visitor enters, then renders
// the SPA at the requested section. Gate memory (lib/gate.ts) is persisted in
// sessionStorage, so client-side navigation AND a browser refresh both keep you
// past the gate; a new tab/session re-shows it.
import { useState, useEffect } from "react";
import AccessGate from "@/components/AccessGate";
import JournalBrowser from "@/components/JournalBrowser";
import type { Tab } from "@/components/Header";
import { hasEntered, markEntered } from "@/lib/gate";

export default function GatedApp({ initialTab = "journal" }: { initialTab?: Tab }) {
  // Start false so server and first client render match (no hydration mismatch),
  // then adopt the persisted value on mount.
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    if (hasEntered()) setEntered(true);
  }, []);
  if (!entered) return <AccessGate onEnter={() => { markEntered(); setEntered(true); }} />;
  return <JournalBrowser initialTab={initialTab} />;
}
