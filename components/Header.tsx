"use client";

/**
 * The site header. ONE header, on every page.
 *
 * Sean, 30 August: "We need a consistent navigation bar on the home page and
 * the rest of the site. Right now we've got the navigation centered for the
 * majority of the site, and then we have call-to-action buttons aligned right
 * and logo aligned left. Let's make sure that that is true for the home page."
 *
 * It was not true, because the home page had grown a second header of its own —
 * logo left, nav pushed right, one button. Two headers is how a site starts
 * looking like two sites, and it is the same drift that gave this project two
 * footers and two split-screen layouts. So this component now serves both, and
 * the home page's own header is gone.
 *
 * TWO MODES, ONE MARKUP. Inside the SPA the section links are buttons that
 * switch tabs without a page load (`onTab`). On the standalone routes — home,
 * /contribute, /why, /safety — there is no tab state, so the same links render
 * as anchors to the same addresses. Nothing about the appearance changes; only
 * how the click is handled.
 *
 * TRUE CENTRING. The nav is centred on the PAGE, not in the space left over
 * after the logo. That is what `flex-1` on both outer groups buys: they take
 * equal width whatever they contain, so adding a second button on the right
 * does not shove the nav off-centre.
 *
 * WHY THE RIGHT-HAND BUTTONS ARE THESE TWO. Export is the corpus — the thing
 * this archive most wants a serious reader to take away — and it opens the
 * dialog that explains what is in it rather than firing a bare download.
 * Contribute is the sign-up: see the note on its label below.
 */
import { useState } from "react";
import { Menu, X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import ExportModal from "@/components/ExportModal";
import ThemeToggle from "@/components/ThemeToggle";

export type Tab = "journal" | "glossary" | "documents" | "data" | "concepts" | "author" | "disclaimer";

const NAV: { t: Tab; href: string; label: string }[] = [
  { t: "journal", href: "/journal", label: "Journal" },
  { t: "glossary", href: "/glossary", label: "Glossary" },
  { t: "documents", href: "/documents", label: "Documents" },
  // Data and Concepts merged on 26 Aug into one Research section with five
  // verticals. Concepts keeps its own top-level entry anyway (Sean, same day):
  // it is the part of this archive a reader is most likely to have been sent a
  // link to, and burying it one click inside Research cost more than the tidier
  // nav was worth. Both entries land in the same section — Research on its
  // landing view, Concepts on its vertical — and both addresses already resolve.
  { t: "data", href: "/data", label: "Research" },
  { t: "concepts", href: "/concepts", label: "Concepts" },
];

const linkCls = (active: boolean) =>
  `font-display px-2.5 py-1.5 text-[12px] font-medium uppercase tracking-[0.14em] border-b border-transparent transition-colors ${
    active ? "text-foreground border-foreground" : "text-muted hover:text-foreground hover:border-foreground"
  }`;

export default function Header({
  tab, onTab, onHome,
}: {
  /** Current section, when the header is inside the SPA. Omitted elsewhere. */
  tab?: Tab;
  /** Provided by the SPA to switch tabs in place. Absent = render plain links. */
  onTab?: (t: Tab) => void;
  onHome?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  const item = (n: (typeof NAV)[number], extra = "") =>
    onTab ? (
      <button
        key={n.t}
        onClick={() => { onTab(n.t); setOpen(false); }}
        className={`${linkCls(tab === n.t)} ${extra}`}
      >
        {n.label}
      </button>
    ) : (
      <a key={n.t} href={n.href} className={`${linkCls(tab === n.t)} ${extra}`}>
        {n.label}
      </a>
    );

  return (
    <header className="sticky top-0 z-30 border-b border-edge bg-background/90 backdrop-blur">
      <div className="flex h-[72px] w-full items-center gap-3 px-5 sm:px-8 lg:h-[88px] lg:px-[100px]">
        {/* Left group */}
        <div className="flex min-w-0 flex-1 items-center">
          {onHome ? (
            <button
              onClick={onHome}
              className="font-display truncate text-lg font-semibold tracking-[-0.01em] text-foreground"
            >
              Invisible Ships
            </button>
          ) : (
            <a
              href="/"
              className="font-display truncate text-lg font-semibold tracking-[-0.01em] text-foreground"
            >
              Invisible Ships
            </a>
          )}
        </div>

        {/* Centre group */}
        <nav className="hidden shrink-0 items-center gap-0.5 lg:flex">{NAV.map((n) => item(n))}</nav>

        {/* Right group */}
        <div className="flex flex-1 items-center justify-end gap-2">
          <div className="hidden items-center gap-2 lg:flex">
            <ThemeToggle />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExportOpen(true)}
              className="font-display text-[12px] uppercase tracking-[0.14em]"
            >
              <Download size={15} /> Export
            </Button>
            {/* CONTRIBUTE, NOT SIGN UP. It is the sign-up call to action and it
                will carry the account form the moment accounts open. The word
                stays "Contribute" because it says what the account is FOR —
                everyone knows what signing up is, nobody knows what signing up
                HERE gets them — and because the button must not promise a form
                that does not exist yet. The people this is aimed at are the
                least tolerant of a bait-and-switch there are. */}
            <a
              href="/contribute"
              className="font-display inline-flex h-9 items-center rounded-md bg-foreground px-4 text-[12px] font-medium uppercase tracking-[0.14em] text-background"
            >
              Contribute
            </a>
          </div>

          <div className="flex items-center gap-1 lg:hidden">
            <ThemeToggle />
            <button
              className="text-muted hover:text-foreground"
              onClick={() => setOpen((v) => !v)}
              aria-label="Menu"
              aria-expanded={open}
            >
              {open ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {open && (
        <div className="flex flex-col gap-1 border-t border-edge px-4 py-3 lg:hidden">
          {NAV.map((n) => item(n, "text-left"))}
          <button
            onClick={() => { setExportOpen(true); setOpen(false); }}
            className="font-display inline-flex items-center gap-1.5 px-2.5 py-1.5 text-left text-[12px] font-medium uppercase tracking-[0.14em] text-muted hover:text-foreground"
          >
            <Download size={15} /> Export
          </button>
          <a
            href="/contribute"
            className="font-display mt-2 inline-flex h-10 items-center justify-center rounded-md bg-foreground px-4 text-[12px] font-medium uppercase tracking-[0.14em] text-background"
          >
            Contribute
          </a>
        </div>
      )}

      {/* Owned by the header now, so Export works identically on every page. */}
      <ExportModal open={exportOpen} onOpenChange={setExportOpen} />
    </header>
  );
}
