"use client";
// Slim full-width header for standalone item routes — link-based (not SPA-state)
// so each nav target is a real URL. Author/Disclaimer live in the footer now.
import Link from "next/link";
import { useState } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import { ChevronDown, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import ExportModal from "@/components/ExportModal";
import { EXPORT_LABEL } from "@/components/ExportButton";
import { RESEARCH_SECTIONS } from "@/lib/routes";

// MUST MATCH components/Header.tsx (Sean, 5 September: "in one state I find
// that only journal glossary and documents are present, and it needs to be all
// five menu options"). This list had three entries while the shared header had
// five, so every standalone item route — /journal/[id] and /glossary/[slug] —
// showed a different menu from the rest of the site. "Journal" also pointed at
// "/" rather than "/journal", which on this branch lands a reader on the gate
// instead of the feed.
//
// THE REAL FIX IS ONE HEADER, NOT TWO IN STEP. Item routes render ItemHeader
// and the SPA shell renders Header, so any nav change has to be made twice and
// nothing catches it when it is not. That consolidation belongs on `homepage`,
// where Header is already the single site header. This keeps the two in step
// in the meantime.
const NAV: { href: string; label: string }[] = [
  // Same order as Header.tsx (Sean, 30 Sep 2026): the record, then what it means.
  { href: "/journal", label: "Journal" },
  { href: "/concepts", label: "Concepts" },
  { href: "/research/timeline", label: "Research" },
  { href: "/news", label: "News" },
  { href: "/documents", label: "Documents" },
  { href: "/glossary", label: "Glossary" },
];

export default function ItemHeader() {
  // The corpus download, as in Header.tsx (Sean, 4 Oct 2026: "the download
  // corpus for AI button is missing" on concept pages). Same label, same dialog.
  const [exportOpen, setExportOpen] = useState(false);
  return (
    <header className="sticky top-0 z-30 bg-background/85 backdrop-blur">
      <div className="w-full px-4 sm:px-6 h-14 flex items-center gap-3">
        <Link href="/" className="font-display font-semibold tracking-tight text-foreground shrink-0">Invisible Ships</Link>
        <nav className="hidden lg:flex items-center gap-0.5 mx-auto">
          {NAV.map((n) => n.label === "Research" ? (
            // Same Research sub-menu as Header.tsx (30 Sep 2026).
            <div key={n.label} className="relative group">
              <Link href={n.href} className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[13px] uppercase tracking-wide text-muted hover:text-foreground">
                {n.label}<ChevronDown size={12} aria-hidden />
              </Link>
              <div className="invisible opacity-0 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 transition-opacity absolute left-1/2 -translate-x-1/2 top-full pt-2 z-40">
                <div role="menu" aria-label="Research sections" className="min-w-[230px] border border-edge bg-background shadow-lg py-2 flex flex-col">
                  {RESEARCH_SECTIONS.map((sec) => (
                    <Link key={sec.slug} href={`/research/${sec.slug}`} className="px-4 py-2.5 text-[14px] text-muted hover:text-foreground hover:bg-panel">{sec.label}</Link>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <Link key={n.label} href={n.href} className="px-2.5 py-1.5 text-[13px] uppercase tracking-wide text-muted hover:text-foreground">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <Button
            size="sm"
            onClick={() => setExportOpen(true)}
            aria-label={EXPORT_LABEL}
            className="font-display text-[12px] uppercase tracking-[0.14em]"
          >
            <Download size={15} /> <span className="hidden sm:inline">{EXPORT_LABEL}</span>
          </Button>
        </div>
      </div>
      <ExportModal open={exportOpen} onOpenChange={setExportOpen} />
    </header>
  );
}
