"use client";
import { useState } from "react";
import { Menu, X, Search, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

type Tab = "journal" | "glossary";
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
  const navBtn = (t: Tab, label: string) => (
    <button
      onClick={() => { onTab(t); setOpen(false); }}
      className={`px-3 py-1.5 rounded-md text-sm ${tab === t ? "bg-accent/20 text-accent" : "text-muted hover:text-white"}`}
    >
      {label}
    </button>
  );
  return (
    <header className="sticky top-0 z-30 border-b border-edge bg-panel/80 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 h-14 flex items-center gap-4">
        <button onClick={onHome} className="font-semibold text-white shrink-0">Invisible Ships</button>

        {/* desktop nav */}
        <nav className="hidden md:flex items-center gap-1 mx-auto">
          {navBtn("journal", "Journal")}
          {navBtn("glossary", "Glossary")}
          <button onClick={onSearch} className="px-3 py-1.5 rounded-md text-sm text-muted hover:text-white inline-flex items-center gap-1.5">
            <Search size={15} /> Search
          </button>
        </nav>

        <div className="hidden md:block ml-auto">
          <Button variant="outline" size="sm" onClick={onExport}><Download size={15} /> Export</Button>
        </div>

        {/* mobile toggle */}
        <button className="md:hidden ml-auto text-muted hover:text-white" onClick={() => setOpen((v) => !v)} aria-label="Menu">
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* mobile menu */}
      {open && (
        <div className="md:hidden border-t border-edge bg-panel px-4 py-3 flex flex-col gap-1">
          {navBtn("journal", "Journal")}
          {navBtn("glossary", "Glossary")}
          <button onClick={() => { onSearch(); setOpen(false); }} className="text-left px-3 py-1.5 rounded-md text-sm text-muted hover:text-white inline-flex items-center gap-1.5">
            <Search size={15} /> Search
          </button>
          <button onClick={() => { onExport(); setOpen(false); }} className="text-left px-3 py-1.5 rounded-md text-sm text-muted hover:text-white inline-flex items-center gap-1.5">
            <Download size={15} /> Export
          </button>
        </div>
      )}
    </header>
  );
}
