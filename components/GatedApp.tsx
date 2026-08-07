"use client";
// Client wrapper: shows the AccessGate until the visitor enters, then renders the
// SPA at the requested section. Gate memory (lib/gate.ts) is in-memory, so
// client-side navigation between section routes keeps you past the gate; only a
// full browser refresh re-shows it.
import { useState } from "react";
import AccessGate from "@/components/AccessGate";
import JournalBrowser from "@/components/JournalBrowser";
import type { Tab } from "@/components/Header";
import { hasEntered, markEntered } from "@/lib/gate";

export default function GatedApp({ initialTab = "journal" }: { initialTab?: Tab }) {
  const [entered, setEntered] = useState(() => hasEntered());
  if (!entered) return <AccessGate onEnter={() => { markEntered(); setEntered(true); }} />;
  return <JournalBrowser initialTab={initialTab} />;
}
