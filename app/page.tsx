"use client";
import { useState } from "react";
import AccessGate from "@/components/AccessGate";
import JournalBrowser from "@/components/JournalBrowser";
import { hasEntered, markEntered } from "@/lib/gate";

// Gate memory is IN-MEMORY (see lib/gate.ts): it persists across client-side
// navigation within a visit but resets on a full browser refresh, so the gate
// shows again on every refresh during the MVP.
export default function Page() {
  const [entered, setEntered] = useState(() => hasEntered());

  const handleEnter = () => {
    markEntered();
    setEntered(true);
  };

  if (!entered) return <AccessGate onEnter={handleEnter} />;
  return <JournalBrowser />;
}
