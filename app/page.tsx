"use client";
import { useEffect, useState } from "react";
import AccessGate from "@/components/AccessGate";
import JournalBrowser from "@/components/JournalBrowser";

// Gate memory. During MVP we keep it SESSION-scoped so navigating/refreshing
// within a tab won't re-show the gate, but a new tab / incognito / reopened
// browser will — easy to re-test. Set REMEMBER_DAYS to e.g. 30 later to switch
// to a longer localStorage "remember".
const REMEMBER_DAYS = 0; // 0 = session-only
const KEY = "is_gate_ok";

export default function Page() {
  const [ready, setReady] = useState(false);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(KEY) === "1") {
        setEntered(true);
      } else if (REMEMBER_DAYS > 0) {
        const ts = Number(localStorage.getItem(KEY) || 0);
        if (ts && Date.now() - ts < REMEMBER_DAYS * 24 * 60 * 60 * 1000) {
          setEntered(true);
        }
      }
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  const handleEnter = () => {
    try {
      sessionStorage.setItem(KEY, "1");
      if (REMEMBER_DAYS > 0) localStorage.setItem(KEY, String(Date.now()));
    } catch {
      /* ignore */
    }
    setEntered(true);
  };

  if (!ready) return <main className="min-h-screen bg-background" />;
  if (!entered) return <AccessGate onEnter={handleEnter} />;
  return <JournalBrowser />;
}