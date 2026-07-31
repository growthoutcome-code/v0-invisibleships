"use client";
import { useEffect, useState } from "react";
import AccessGate from "@/components/AccessGate";
import JournalBrowser from "@/components/JournalBrowser";

const REMEMBER_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export default function Page() {
  const [ready, setReady] = useState(false);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    try {
      const ts = Number(localStorage.getItem("is_gate_ok") || 0);
      if (ts && Date.now() - ts < REMEMBER_MS) setEntered(true);
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  if (!ready) return <main className="min-h-screen bg-background" />;
  if (!entered) return <AccessGate onEnter={() => setEntered(true)} />;
  return <JournalBrowser />;
}
