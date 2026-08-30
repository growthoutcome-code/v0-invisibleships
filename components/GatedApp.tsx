"use client";
// Client wrapper: shows the AccessGate until the visitor enters, then renders
// the SPA at the requested section.
//
// Gate passage persists for the browser session (lib/gate.ts, sessionStorage),
// so a refresh or a deep link no longer replays the gate within a session.
//
// THE GATE OPENS IN PLACE. It used to redirect a visitor who had not entered
// back to "/", because "/" WAS the gate — sending them to the front door was
// the whole point. The home page took that URL, and the redirect silently
// became a bug: every main-navigation click bounced off the gate and landed on
// the marketing page, so the site looked like its nav was dead. Nothing failed
// and no guard noticed, because the redirect still did exactly what it said.
//
// So there is no redirect now. A visitor who has not entered gets the gate at
// the URL they asked for, and enters onto that section. The link somebody was
// sent still resolves to the thing it pointed at, which is what a deep link is
// for.
//
// The entered check reads sessionStorage, which does not exist during SSR, so
// it runs in an effect after mount: `null` renders one blank frame instead of
// flashing the gate at returning visitors.
import { useState, useEffect } from "react";
import AccessGate from "@/components/AccessGate";
import JournalBrowser from "@/components/JournalBrowser";
import type { Tab } from "@/components/Header";
import { hasEntered, markEntered } from "@/lib/gate";

export default function GatedApp({ initialTab = "journal" }: { initialTab?: Tab }) {
  const [entered, setEntered] = useState<boolean | null>(null);

  useEffect(() => {
    setEntered(hasEntered());
  }, []);

  if (entered === null) return null;
  if (!entered) return <AccessGate onEnter={() => { markEntered(); setEntered(true); }} />;
  return <JournalBrowser initialTab={initialTab} />;
}
