"use client";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { track } from "@/lib/analytics";

type Theme = "light" | "dark";

function current(): Theme {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export default function ThemeToggle({ className = "" }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  // Sync to whatever the pre-paint script already applied.
  useEffect(() => {
    setTheme(current());
    setMounted(true);
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
      {/* Render nothing meaningful until mounted to avoid a hydration mismatch */}
      {mounted && (theme === "dark" ? <Sun size={17} /> : <Moon size={17} />)}
    </button>
  );
}
