"use client";
// Gate wrapper for standalone item routes. Shares the session-persistent gate
// memory (lib/gate.ts): once entered, item pages open directly — including on
// refresh — for the rest of the browser session. The check runs in an effect
// because sessionStorage does not exist during SSR.
import { useState, useEffect } from "react";
import AccessGate from "@/components/AccessGate";
import { hasEntered, markEntered } from "@/lib/gate";

export default function ItemGate({ children }: { children: React.ReactNode }) {
  const [entered, setEntered] = useState<boolean | null>(null);

  useEffect(() => { setEntered(hasEntered()); }, []);

  if (entered === null) return null;
  if (!entered)
    return (
      <AccessGate
        onEnter={() => {
          markEntered();
          setEntered(true);
        }}
      />
    );
  return <>{children}</>;
}
