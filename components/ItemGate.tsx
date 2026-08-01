"use client";
// Gate wrapper for standalone item routes: shows the full access gate for
// visitors who haven't entered yet (same 30-day remember as the homepage),
// then reveals the page. Mirrors app/page.tsx's gate check.
import { useEffect, useState } from "react";
import AccessGate from "@/components/AccessGate";

const REMEMBER_MS = 30 * 24 * 60 * 60 * 1000;

export default function ItemGate({ children }: { children: React.ReactNode }) {
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
  return <>{children}</>;
}
