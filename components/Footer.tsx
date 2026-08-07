"use client";
// Global footer: copyright left, Author + Disclaimer links right (stacks on mobile).
// In the in-app browser it receives onNav to switch tabs directly; on the
// standalone routes it falls back to links that open the right view after nav.
import Link from "next/link";

type NavTab = "author" | "disclaimer";
const LINKS: { t: NavTab; label: string }[] = [
  { t: "author", label: "Author" },
  { t: "disclaimer", label: "Disclaimer" },
];

export default function Footer({ onNav }: { onNav?: (t: NavTab) => void }) {
  return (
    <footer className="mt-8">
      <div className="w-full px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted">
        <div className="order-2 sm:order-1 text-center sm:text-left">© 2026 Sean C. Harris. All Rights Reserved.</div>
        <nav className="order-1 sm:order-2 flex items-center gap-5 uppercase tracking-wide">
          {LINKS.map((l) =>
            onNav ? (
              <button key={l.t} onClick={() => onNav(l.t)} className="hover:text-foreground transition-colors">{l.label}</button>
            ) : (
              <Link key={l.t} href={`/?view=${l.t}`} className="hover:text-foreground transition-colors">{l.label}</Link>
            )
          )}
        </nav>
      </div>
    </footer>
  );
}
