"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { track } from "@/lib/analytics";

// Bump the suffix to re-show the notice after the wording changes.
const KEY = "is_data_disclaimer_v1";

/**
 * Dismissable provenance notice for the Data section.
 *
 * Persisted in localStorage rather than the in-memory pattern used by lib/gate.ts:
 * the gate must re-assert itself on every load, but a disclaimer that reappears on
 * each refresh reads as broken. Nothing identifying is stored — just the flag.
 */
export default function DataDisclaimer() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try { setShow(window.localStorage.getItem(KEY) !== "1"); }
    catch { setShow(true); }
  }, []);

  const dismiss = () => {
    setShow(false);
    track("data_disclaimer_dismissed");
    try { window.localStorage.setItem(KEY, "1"); } catch { /* private mode */ }
  };

  if (!show) return null;

  return (
    <aside
      role="note"
      className="w-full flex items-start gap-6 bg-panel px-6 py-5 mb-10"
    >
      <p className="body-copy text-foreground/85 measure m-0">
        This research was compiled with AI assistance from public sources, from a
        United States vantage point. <strong>Coverage is uneven by jurisdiction</strong> —
        a low count may reflect limited public reporting rather than limited activity,
        and an absent record here is not evidence that nothing exists. Every fact
        carries an evidence tier and links to its source.
      </p>
      <button
        onClick={dismiss}
        aria-label="Dismiss notice"
        className="ml-auto shrink-0 text-muted hover:text-foreground"
      >
        <X size={20} />
      </button>
    </aside>
  );
}
