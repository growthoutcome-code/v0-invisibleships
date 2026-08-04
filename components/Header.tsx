"use client";
import { useState } from "react";
import { Menu, X, Search, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/ThemeToggle";

export type Tab = "journal" | "glossary" | "documents" | "author" | "disclaimer";
const NAV: { t: Tab; label: string }[] = [
  { t: "journal", label: "Journal" },
  { t: "glossary", label: "Glossary" },
  { t: "documents", label: "Documents" },
  { t: "author", label: "Author" },
  { t: "disclaimer", label: "Disclaimer" },
];

// Search temporarily hidden while it's broken. Flip to true to restore it.
const SHOW_SEARCH = false;

export default function Header({
  tab, onTab, onSearch, onExport, onHome,
}: {
  tab: Tab;
  onTab: (t: Tab) => void;
  onSearch: () => void;
  onExport: () => void;
  onHome: () => void;
}) {
  const [open, setOpen] = useState(false);
  const btn = (t: Tab, label: string, extra = "") => (
    <button onClick={() => { onTab(t); setOpen(false); }}
      className={`px-2.5 py-1.5 text-[13px] uppercase tracking-wide ${tab === t ? "text-foreground" : "text-muted hover:text-foreground"} ${extra}`}>
      {label}
    </button>
  );
  return (
    <header className="sticky top-0 z-30 bg-background/85 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 h-14 flex items-center gap-3">
        <button onClick={onHome} className="font-display font-semibold tracking-tight text-foreground shrink-0">Invisible Ships</button>

        <nav className="hidden lg:flex items-center gap-0.5 mx-auto">
          {NAV.map((n) => btn(n.t, n.label))}
          {SHOW_SEARCH && (
            <button onClick={onSearch} className="px-2.5 py-1.5 text-[13px] uppercase tracking-wide text-muted hover:text-foreground inline-flex items-center gap-1.5">
              <Search size={15} /> Search
            </button>
          )}
        </nav>

        <div className="hidden lg:flex items-center gap-1.5 ml-auto">
          <ThemeToggle />
          <Button variant="outline" size="sm" onClick={onExport} className="uppercase tracking-wide text-[13px]"><Download size={15} /> Export</Button>
        </div>

        <div className="lg:hidden ml-auto flex items-center gap-1">
          <ThemeToggle />
          <button className="text-muted hover:text-foreground" onClick={() => setOpen((v) => !v)} aria-label="Menu">
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden bg-panel px-4 py-3 flex flex-col gap-1">
          {NAV.map((n) => btn(n.t, n.label, "text-left"))}
          {SHOW_SEARCH && (
            <button onClick={() => { onSearch(); setOpen(false); }} className="text-left px-2.5 py-1.5 text-[13px] uppercase tracking-wide text-muted hover:text-foreground inline-flex items-center gap-1.5"><Search size={15} /> Search</button>
          )}
          <button onClick={() => { onExport(); setOpen(false); }} className="text-left px-2.5 py-1.5 text-[13px] uppercase tracking-wide text-muted hover:text-foreground inline-flex items-center gap-1.5"><Download size={15} /> Export</button>
        </div>
      )}
    </header>
  );
}