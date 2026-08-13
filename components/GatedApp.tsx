"use client";
// Client wrapper: shows the AccessGate until the visitor enters, then renders
// the SPA at the requested section.
//
// Reset-to-root on hard load: a browser refresh (or any direct hit on a deep
// URL like /glossary) resets the address bar to "/" and re-shows the gate, so
// every fresh load is a clean front-door entry. In-session tab navigation is
// handled inside JournalBrowser (state + pushState) and does NOT remount this
// component, so the effect below only runs on a true page load.
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import AccessGate from "@/components/AccessGate";
import JournalBrowser from "@/components/JournalBrowser";
import type { Tab } from "@/components/Header";
import { hasEntered, markEntered } from "@/lib/gate";

export default function GatedApp({ initialTab = "journal" }: { initialTab?: Tab }) {
  const [entered, setEntered] = useState(() => hasEntered());
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // On a hard load of any non-root route while not yet entered, reset the URL
    // to "/" so every refresh starts at the front door with the gate shown.
    if (!hasEntered() && pathname !== "/") {
      router.replace("/");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!entered) return <AccessGate onEnter={() => { markEntered(); setEntered(true); }} />;
  return <JournalBrowser initialTab={initialTab} />;
}
