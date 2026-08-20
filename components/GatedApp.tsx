"use client";
// Client wrapper: shows the AccessGate until the visitor enters, then renders
// the SPA at the requested section.
//
// Gate passage persists for the browser session (lib/gate.ts, sessionStorage),
// so a refresh or a deep link no longer replays the gate within a session.
// The reset-to-root behaviour now applies ONLY to visitors who have not yet
// entered: their first hard load of any deep URL still starts at the front
// door. Entered visitors keep the URL they asked for.
//
// The entered check reads sessionStorage, which does not exist during SSR, so
// it runs in an effect after mount: `null` renders one blank frame instead of
// flashing the gate at returning visitors.
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import AccessGate from "@/components/AccessGate";
import JournalBrowser from "@/components/JournalBrowser";
import type { Tab } from "@/components/Header";
import { hasEntered, markEntered } from "@/lib/gate";

export default function GatedApp({ initialTab = "journal" }: { initialTab?: Tab }) {
  const [entered, setEntered] = useState<boolean | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const ok = hasEntered();
    if (!ok && pathname !== "/") router.replace("/");
    setEntered(ok);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (entered === null) return null;
  if (!entered) return <AccessGate onEnter={() => { markEntered(); setEntered(true); }} />;
  return <JournalBrowser initialTab={initialTab} />;
}
