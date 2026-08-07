"use client";
// Slim full-width header for standalone item routes — link-based (not SPA-state)
// so each nav target is a real URL. Author/Disclaimer live in the footer now.
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";

const NAV: { href: string; label: string }[] = [
  { href: "/", label: "Journal" },
  { href: "/glossary", label: "Glossary" },
  { href: "/documents", label: "Documents" },
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
