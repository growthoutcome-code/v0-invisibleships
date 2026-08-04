"use client";
// Gate wrapper for standalone item routes. Uses the same in-memory gate memory
// as the homepage (lib/gate.ts): navigating to an item page within a visit
// keeps you past the gate, but a full browser refresh re-shows it.
import { useState } from "react";
import AccessGate from "@/components/AccessGate";
import { hasEntered, markEntered } from "@/lib/gate";

export default function ItemGate({ children }: { children: React.ReactNode }) {
  const [entered, setEntered] = useState(() => hasEntered());

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
