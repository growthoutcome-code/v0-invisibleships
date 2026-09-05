"use client";
// Slim full-width header for standalone item routes — link-based (not SPA-state)
// so each nav target is a real URL. Author/Disclaimer live in the footer now.
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";

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
  { href: "/journal", label: "Journal" },
  { href: "/glossary", label: "Glossary" },
  { href: "/documents", label: "Documents" },
  { href: "/data", label: "Research" },
  { href: "/concepts", label: "Concepts" },
];

export default function ItemHeader() {
  return (
    <header className="sticky top-0 z-30 bg-background/85 backdrop-blur">
      <div className="w-full px-4 sm:px-6 h-14 flex items-center gap-3">
        <Link href="/" className="font-display font-semibold tracking-tight text-foreground shrink-0">Invisible Ships</Link>
        <nav className="hidden lg:flex items-center gap-0.5 mx-auto">
          {NAV.map((n) => (
            <Link key={n.label} href={n.href} className="px-2.5 py-1.5 text-[13px] uppercase tracking-wide text-muted hover:text-foreground">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-1.5">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
