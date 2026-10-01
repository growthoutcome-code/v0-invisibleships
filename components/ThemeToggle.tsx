"use client";
import { useEffect, useState } from "react";
import { track } from "@/lib/analytics";

type Theme = "light" | "dark";

/**
 * One icon for both themes: a circle split edge to edge, one half filled
 * (Sean, 1 Oct 2026, replacing the moon / sun pair). Drawn to lucide's 24-unit
 * grid and 2px stroke so it sits with the header's other icons. It does not
 * change with the theme, so it can render before mount without a hydration
 * mismatch; only the label says which way the switch goes.
 */
function SplitCircle({ size = 17 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a10 10 0 0 1 0 20z" fill="currentColor" />
    </svg>
  );
}

function current(): Theme {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export default function ThemeToggle({ className = "" }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>("dark");

  // Sync to whatever the pre-paint script already applied.
  useEffect(() => {
    setTheme(current());
  }, []);

  const toggle = () => {
    const next: Theme = current() === "dark" ? "light" : "dark";
    const e = document.documentElement;
    if (next === "dark") e.classList.add("dark");
    else e.classList.remove("dark");
    e.style.colorScheme = next;
    try { localStorage.setItem("is_theme", next); } catch { /* ignore */ }
    setTheme(next);
    track("theme_toggled", { theme: next });
  };

  return (
    <button
      onClick={toggle}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
      title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
      className={`inline-flex items-center justify-center h-9 w-9 rounded-md text-muted hover:text-foreground hover:bg-accent/10 transition-colors ${className}`}
    >
      <SplitCircle size={17} />
    </button>
  );
}
