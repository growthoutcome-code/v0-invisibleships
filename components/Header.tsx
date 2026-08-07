"use client";
// Slim, full-width main navigation (~100px tall, shrinks on tablet/mobile).
// The logo is a link home — NOT the page <h1>. The page title lives in the
// TitleBand below the nav.
import { useState } from "react";
import { Menu, X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/ThemeToggle";

export type Tab = "journal" | "glossary" | "documents" | "author" | "disclaimer";
const NAV: { t: Tab; label: string }[] = [
  { t: "journal", label: "Journal" },
  { t: "glossary", label: "Glossary" },
  { t: "documents", label: "Documents" },
];

export default function Header({
  tab, onTab, onExport, onHome,
}: {
  tab: Tab;
  onTab: (t: Tab) => void;
  onSearch: () => void;
  onExport: () => void;
  onHome: () => void;
}) {
  const [open, setOpen] = useState(false);
  const btn = (t: Tab, label: string, extra = "") => (
    <button
      key={t}
      onClick={() => { onTab(t); setOpen(false); }}
      className={`px-2.5 py-1.5 text-[13px] uppercase tracking-wide ${tab === t ? "text-foreground" : "text-muted hover:text-foreground"} ${extra}`}
    >
      {label}
    </button>
  );
  return (
    <header className="sticky top-0 z-30 bg-background/85 backdrop-blur">
      {/* Equal-width left/right groups keep the centered nav at TRUE page center
          regardless of how wide the logo vs. the controls are. */}
      <div className="w-full px-4 sm:px-6 h-[72px] md:h-[88px] lg:h-[100px] flex items-center gap-3">
        <div className="flex-1 flex items-center min-w-0">
          <button onClick={onHome} className="font-display font-semibold tracking-tight text-foreground text-lg truncate">Invisible Ships</button>
        </div>
        <nav className="hidden lg:flex items-center gap-0.5 shrink-0">
          {NAV.map((n) => btn(n.t, n.label))}
        </nav>
        <div className="flex-1 flex items-center justify-end gap-1.5">
          <div className="hidden lg:flex items-center gap-1.5">
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={onExport} className="uppercase tracking-wide text-[13px]"><Download size={15} /> Export</Button>
          </div>
          <div className="lg:hidden flex items-center gap-1">
            <ThemeToggle />
            <button className="text-muted hover:text-foreground" onClick={() => setOpen((v) => !v)} aria-label="Menu">
              {open ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>
      {open && (
        <div className="lg:hidden px-4 py-3 flex flex-col gap-1">
          {NAV.map((n) => btn(n.t, n.label, "text-left"))}
          <button onClick={() => { onExport(); setOpen(false); }} className="text-left px-2.5 py-1.5 text-[13px] uppercase tracking-wide text-muted hover:text-foreground inline-flex items-center gap-1.5"><Download size={15} /> Export</button>
        </div>
      )}
    </header>
  );
}
