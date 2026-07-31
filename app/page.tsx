"use client";
import { useEffect, useState } from "react";
import AccessGate from "@/components/AccessGate";
import JournalBrowser from "@/components/JournalBrowser";

// While building the site, show the gate on every visit.
// Flip REMEMBER_ENABLED back to true to restore the 30-day "remember" behavior.
const REMEMBER_ENABLED = false;
const REMEMBER_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export default function Page() {
  const [ready, setReady] = useState(false);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    if (REMEMBER_ENABLED) {
      try {
        const ts = Number(localStorage.getItem("is_gate_ok") || 0);
        if (ts && Date.now() - ts < REMEMBER_MS) setEntered(true);
      } catch {
        /* ignore */
      }
    }
    setReady(true);
  }, []);

  if (!ready) return <main className="min-h-screen bg-background" />;
  if (!entered) return <AccessGate onEnter={() => setEntered(true)} />;
  return <JournalBrowser />;
}
