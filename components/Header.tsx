"use client";
// Combined full-width masthead: site title (h1) + tagline, primary nav, and the
// theme/export controls. >=200px tall on desktop, shrinks for tablet/mobile.
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
  const navBtn = (t: Tab, label: string, extra = "") => (
    <button
      key={t}
      onClick={() => { onTab(t); setOpen(false); }}
      className={`px-2.5 py-1.5 text-[13px] uppercase tracking-wide ${tab === t ? "text-foreground" : "text-muted hover:text-foreground"} ${extra}`}
    >
      {label}
    </button>
  );
  return (
    <header className="w-full border-b border-edge bg-background">
      <div className="w-full px-4 sm:px-6 lg:px-10 py-5 flex flex-col justify-between gap-4 min-h-[128px] md:min-h-[164px] lg:min-h-[200px]">
        <div className="flex items-start justify-between gap-3">
          <button onClick={onHome} className="text-left">
            <h1 className="font-display font-bold tracking-tight text-foreground text-3xl md:text-4xl lg:text-5xl leading-none">Invisible Ships</h1>
            <p className="mt-1.5 text-xs md:text-sm text-muted">A documented record of neuro-tech terrorism.</p>
          </button>
          <div className="flex items-center gap-1.5 shrink-0">
            <ThemeToggle />
            <div className="hidden lg:block">
              <Button variant="ghost" size="sm" onClick={onExport} className="uppercase tracking-wide text-[13px]"><Download size={15} /> Export</Button>
            </div>
            <button className="lg:hidden text-muted hover:text-foreground" onClick={() => setOpen((v) => !v)} aria-label="Menu">
              {open ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
        <nav className="hidden lg:flex items-center gap-1 -mx-2.5">
          {NAV.map((n) => navBtn(n.t, n.label))}
        </nav>
      </div>
      {open && (
        <div className="lg:hidden border-t border-edge px-4 py-3 flex flex-col gap-1">
          {NAV.map((n) => navBtn(n.t, n.label, "text-left"))}
          <button onClick={() => { onExport(); setOpen(false); }} className="text-left px-2.5 py-1.5 text-[13px] uppercase tracking-wide text-muted hover:text-foreground inline-flex items-center gap-1.5"><Download size={15} /> Export</button>
        </div>
      )}
    </header>
  );
}
