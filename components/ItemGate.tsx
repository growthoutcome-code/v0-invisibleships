"use client";
// Gate wrapper for standalone item routes: shows the full access gate for
// visitors who haven't entered yet, then reveals the page. Shares gate memory
// with the homepage via lib/gate so navigating between routes doesn't re-gate.
import { useEffect, useState } from "react";
import AccessGate from "@/components/AccessGate";
import { hasEnteredGate } from "@/lib/gate";

export default function ItemGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    setEntered(hasEnteredGate());
    setReady(true);
  }, []);

  if (!ready) return <main className="min-h-screen bg-background" />;
  if (!entered) return <AccessGate onEnter={() => setEntered(true)} />;
  return <>{children}</>;
}
