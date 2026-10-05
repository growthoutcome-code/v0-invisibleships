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
 * WHY THE RIGHT-HAND BUTTONS ARE THESE TWO. The download is the corpus — the
 * thing this archive most wants a serious reader to take away — and it opens
 * the dialog that explains what is in it rather than firing a bare zip. It was
 * labelled "Export" until 10 September; the word describes what an owner does
 * to their own data, not what a visitor does here, and it did not match the
 * button further down the page. Both now read from EXPORT_LABEL.
 * Contribute is the sign-up: see the note on its label below.
 */
import { useState } from "react";
import { Menu, X, Download, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import ExportModal from "@/components/ExportModal";
import { EXPORT_LABEL } from "@/components/ExportButton";
import ThemeToggle from "@/components/ThemeToggle";
import { ACCOUNTS_READY } from "@/lib/flags";
import { RESEARCH_SECTIONS } from "@/lib/routes";
import type { SubTab } from "@/components/DataView";

export type Tab = "journal" | "glossary" | "documents" | "data" | "concepts" | "author" | "disclaimer" | "news";

const NAV: { t: Tab; href: string; label: string }[] = [
  // Order (Sean, 30 Sep 2026): the record, then what it means. Journal first as
  // the primary record; Concepts beside it because the two share the Topic
  // filter; Research and Documents as the supporting evidence; Glossary last,
  // a reference used while reading rather than a place to start.
  // Concepts keeps its own top-level entry although it is also a Research
  // vertical (Sean, 26 Aug): it is the part of this archive a reader is most
  // likely to have been sent a link to. Both entries land in the same section.
  // Item routes use this header too (ItemHeader.tsx just passes the tab), so
  // this is the only copy of the menu.
  { t: "journal", href: "/journal", label: "Journal" },
  { t: "concepts", href: "/concepts", label: "Concepts" },
  // Research opens a sub-menu of its four sections (Sean, 30 Sep 2026: "sub-navigation
  // menu items under the research main menu item due to the sheer volume of data").
  { t: "data", href: "/research/timeline", label: "Research" },
  // News sits beside Research, the section it is closest to (Sean, 2 Oct 2026). It
  // is its own page, not a tab of the app, so it is always a real link.
  { t: "news", href: "/news", label: "News" },
  { t: "documents", href: "/documents", label: "Documents" },
  { t: "glossary", href: "/glossary", label: "Glossary" },
];

const phoneLinkCls = (active: boolean) =>
  `font-display w-full text-left px-1 py-3 text-[15px] font-medium uppercase tracking-[0.12em] border-b border-edge/60 transition-colors ${
    active ? "text-foreground" : "text-muted hover:text-foreground"
  }`;

const linkCls = (active: boolean) =>
  `font-display px-2.5 py-1.5 text-[12px] font-medium uppercase tracking-[0.14em] border-b border-transparent transition-colors ${
    active ? "text-foreground border-foreground" : "text-muted hover:text-foreground hover:border-foreground"
  }`;

export default function Header({
  tab, onTab, onHome, researchSub, onResearch,
}: {
  /** The open Research section, inside the SPA. */
  researchSub?: SubTab;
  /** Provided by the SPA to open a Research section in place. Absent = plain links. */
  onResearch?: (s: SubTab) => void;
  /** Current section, when the header is inside the SPA. Omitted elsewhere. */
  tab?: Tab;
  /** Provided by the SPA to switch tabs in place. Absent = render plain links. */
  onTab?: (t: Tab) => void;
  onHome?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  // Phone menu: Research's four sections collapse (Sean, 30 Sep 2026: "the mobile
  // sub-navigation needs to be collapsible"). Open by default only on a Research page.
  const [researchOpen, setResearchOpen] = useState(tab === "data");

  // `phone`: the menu under the hamburger, where links are larger, full-width tap
  // targets (Sean, 30 Sep 2026: "update the text size of the rest of the options").
  const item = (n: (typeof NAV)[number], extra = "", phone = false) => {
    const cls = phone ? phoneLinkCls(tab === n.t) : `${linkCls(tab === n.t)} ${extra}`;
    return onTab && n.t !== "news" ? (
      <button
        key={n.t}
        onClick={() => { onTab(n.t); setOpen(false); }}
        className={cls}
      >
        {n.label}
      </button>
    ) : (
      <a key={n.t} href={n.href} className={cls}>
        {n.label}
      </a>
    );
  };

  // A Research section link: a button in the SPA, a real link elsewhere.
  const section = (sec: (typeof RESEARCH_SECTIONS)[number], cls: string) => {
    const on = tab === "data" && researchSub === sec.sub;
    return onResearch ? (
      <button key={sec.slug} onClick={() => { onResearch(sec.sub); setOpen(false); }}
        aria-current={on ? "page" : undefined} className={`${cls} ${on ? "text-foreground font-semibold" : "text-muted"}`}>{sec.label}</button>
    ) : (
      <a key={sec.slug} href={`/research/${sec.slug}`} className={`${cls} text-muted`}>{sec.label}</a>
    );
  };

  // Desktop: Research shows its four sections on hover or keyboard focus. The
  // word itself still opens Research (the Timeline), so the menu is a shortcut,
  // never a gate.
  const researchDesktop = (n: (typeof NAV)[number]) => (
    <div key={n.t} className="relative group">
      <span className="inline-flex items-center">
        {item(n)}
        <ChevronDown size={12} aria-hidden className="-ml-1.5 text-muted transition-transform group-hover:rotate-180 group-focus-within:rotate-180" />
      </span>
      <div className="invisible opacity-0 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 transition-opacity absolute left-1/2 -translate-x-1/2 top-full pt-3 z-40">
        <div role="menu" aria-label="Research sections" className="min-w-[230px] border border-edge bg-background shadow-lg py-2 flex flex-col">
          {RESEARCH_SECTIONS.map((sec) => section(sec,
            "text-left px-4 py-2.5 text-[14px] hover:text-foreground hover:bg-panel transition-colors"))}
        </div>
      </div>
    </div>
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
        <nav className="hidden shrink-0 items-center gap-0.5 lg:flex">{NAV.map((n) => (n.t === "data" ? researchDesktop(n) : item(n)))}</nav>

        {/* Right group */}
        <div className="flex flex-1 items-center justify-end gap-2">
          <div className="hidden items-center gap-2 lg:flex">
            <ThemeToggle />
            {/* EXPORT IS THE PRIMARY ACTION NOW (Sean, 4 September). Contribute
                was the solid button and it promised an account that does not
                exist yet — accounts are unfinished on `capture`, so production
                must not advertise them. The corpus download is the one thing
                this site can actually give a visitor today, so it takes the
                primary slot beside the light/dark toggle. /contribute still
                exists as a page; nothing links to it from the chrome. */}
            <Button
              size="sm"
              onClick={() => setExportOpen(true)}
              className="font-display text-[12px] uppercase tracking-[0.14em]"
            >
              {/* ONE LABEL, TWO PLACES (Sean, 10 September): "export might seem
                  a bit vague… it needs to be shorter, and it needs to be
                  consistent." EXPORT_LABEL is the same string the Contribute
                  section's button carries, beside the same icon, so a reader who
                  saw it down the page recognises it up here. At one word it
                  needs no responsive collapse — the earlier attempt showed a
                  different label between 1024 and 1280, which is the opposite of
                  what was asked for. */}
              <Download size={15} /> {EXPORT_LABEL}
            </Button>
            {/* CONTRIBUTE, NOT SIGN UP. The word says what the account is FOR —
                everyone knows what signing up is, nobody knows what signing up
                HERE gets them. Kept in the source and switched off at
                lib/flags.ts rather than deleted, because the moment accounts
                ship this is the call to action again. */}
            {ACCOUNTS_READY && (
              <a
                href="/contribute"
                className="font-display inline-flex h-9 items-center rounded-md bg-foreground px-4 text-[12px] font-medium uppercase tracking-[0.14em] text-background"
              >
                Contribute
              </a>
            )}
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
        <div className="flex flex-col border-t border-edge px-5 pt-1 pb-5 lg:hidden">
          {NAV.map((n) => n.t === "data" ? (
            <div key={n.t} className="flex flex-col">
              {/* On phones Research is a disclosure: tapping it shows or hides the
                  four sections, and Timeline is the first of them. */}
              <button type="button" onClick={() => setResearchOpen((v) => !v)}
                aria-expanded={researchOpen} aria-controls="phone-research-sections"
                className={`${phoneLinkCls(tab === "data")} flex items-center justify-between`}>
                {n.label}
                <ChevronDown size={18} aria-hidden className={`transition-transform ${researchOpen ? "rotate-180" : ""}`} />
              </button>
              {researchOpen && (
                <div id="phone-research-sections" className="flex flex-col border-b border-edge/60 pb-2">
                  {RESEARCH_SECTIONS.map((sec) => section(sec,
                    "text-left pl-5 pr-1 py-2.5 text-[15px] hover:text-foreground"))}
                </div>
              )}
            </div>
          ) : item(n, "", true))}
          {/* Full-width button, as on desktop (Sean, 30 Sep 2026). */}
          <button
            onClick={() => { setExportOpen(true); setOpen(false); }}
            className="font-display mt-5 inline-flex h-12 w-full items-center justify-center gap-2 bg-foreground px-4 text-[14px] font-medium uppercase tracking-[0.14em] text-background"
          >
            <Download size={17} /> {EXPORT_LABEL}
          </button>
          {ACCOUNTS_READY && (
            <a
              href="/contribute"
              className="font-display mt-2 inline-flex h-10 items-center justify-center rounded-md bg-foreground px-4 text-[12px] font-medium uppercase tracking-[0.14em] text-background"
            >
              Contribute
            </a>
          )}
        </div>
      )}

      {/* Owned by the header now, so Export works identically on every page. */}
      <ExportModal open={exportOpen} onOpenChange={setExportOpen} />
    </header>
  );
}
