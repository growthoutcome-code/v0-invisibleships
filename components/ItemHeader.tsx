"use client";
// Header for standalone item routes — link-based (not SPA-state) so each nav
// target is a real URL. Visually matches the in-app Header.
import Link from "next/link";
import { Search } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

const NAV: { href: string; label: string }[] = [
  { href: "/", label: "Journal" },
  { href: "/?view=glossary", label: "Glossary" },
  { href: "/?view=documents", label: "Documents" },
  { href: "/?view=author", label: "Author" },
  { href: "/?view=disclaimer", label: "Disclaimer" },
];

export default function ItemHeader() {
  return (
    <header className="sticky top-0 z-30 bg-background/85 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 h-14 flex items-center gap-3">
        <Link href="/" className="font-display font-semibold tracking-tight text-foreground shrink-0">Invisible Ships</Link>
        <nav className="hidden lg:flex items-center gap-0.5 mx-auto">
          {NAV.map((n) => (
            <Link key={n.label} href={n.href} className="px-2.5 py-1.5 text-[13px] uppercase tracking-wide text-muted hover:text-foreground">
              {n.label}
            </Link>
          ))}
          <Link href="/" className="px-2.5 py-1.5 text-[13px] uppercase tracking-wide text-muted hover:text-foreground inline-flex items-center gap-1.5">
            <Search size={15} /> Search
          </Link>
        </nav>
        <div className="ml-auto flex items-center gap-1.5">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
