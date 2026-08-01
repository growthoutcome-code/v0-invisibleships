"use client";
import { useEffect, useState } from "react";
import AccessGate from "@/components/AccessGate";
import JournalBrowser from "@/components/JournalBrowser";
import { hasEnteredGate } from "@/lib/gate";

export default function Page() {
  const [ready, setReady] = useState(false);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    setEntered(hasEnteredGate());
    setReady(true);
  }, []);

  if (!ready) return <main className="min-h-screen bg-background" />;
  if (!entered) return <AccessGate onEnter={() => setEntered(true)} />;
  return <JournalBrowser />;
}
