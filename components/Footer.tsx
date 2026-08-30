"use client";

/**
 * The site footer. One footer, everywhere.
 *
 * Sean, 30 August: "we can remove disclaimer from the main navigation. We want
 * to use the footer that was already established that includes the disclaimer
 * in it. Let's have a strong footer that includes disclaimer and the full
 * safety note, and it loads a modal when you click on either."
 *
 * WHY THE DISCLAIMER MOVED DOWN HERE. The top nav should be the things a reader
 * came for; the disclaimer is what they check before quoting something. Putting
 * it in the header spent a nav slot on a document almost nobody clicks first,
 * and it made the row longer than it needed to be. Down here it is where the
 * convention says to look for it, and it is one click either way.
 *
 * This replaces a two-link strip. It was already the established footer — the
 * SPA mounts it via JournalBrowser — so upgrading it rather than writing a
 * second one for the standalone pages keeps one footer being looked after.
 *
 * `onNav` is preserved. Inside the SPA the section links switch tabs without a
 * page load; on the standalone routes they fall back to hrefs. The two legal
 * links never use it: they open modals in both places, so a reader never loses
 * their position in the archive to read the terms.
 */
import Link from "next/link";
import { DisclaimerDialog, SafetyDialog } from "@/components/LegalDialogs";
import { DATA_SECTIONS } from "@/lib/routes";

type NavTab = "journal" | "data" | "concepts" | "glossary" | "documents" | "author";

const COLUMNS: { heading: string; links: { t?: NavTab; href: string; label: string }[] }[] = [
  {
    heading: "The record",
    links: [
      { t: "journal", href: "/journal", label: "Journal" },
      { t: "glossary", href: "/glossary", label: "Glossary" },
      { t: "documents", href: "/documents", label: "Documents" },
      { href: "/api/corpus?from=footer", label: "Download the corpus" },
    ],
  },
  {
    heading: "The research",
    links: [
      { t: "data", href: "/data", label: "Timeline" },
      // Built from lib/routes.ts, so a new vertical appears in the footer, in
      // the sitemap and in the address bar together or not at all. These carry
      // no `t`: they are real routes, and inside the app a plain link is what
      // gets a reader to a vertical the tab state alone cannot address.
      ...DATA_SECTIONS.map((sec) => ({ href: `/data/${sec.slug}`, label: sec.label })),
      { t: "concepts", href: "/concepts", label: "Concepts" },
    ],
  },
  {
    heading: "About",
    links: [
      { t: "author", href: "/author", label: "The author" },
      { href: "/why", label: "Why “Invisible Ships”" },
      { href: "/contribute", label: "Contribute an account" },
    ],
  },
];

const legalLink =
  "text-left text-[13px] text-muted underline underline-offset-4 transition-colors hover:text-foreground";

export default function Footer({ onNav }: { onNav?: (t: NavTab) => void }) {
  return (
    <footer className="mt-16 border-t border-edge">
      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="font-display m-0 text-lg font-semibold tracking-[-0.01em] text-foreground">
              Invisible Ships
            </p>
            <p className="body-copy m-0 mt-3 max-w-xs text-[14px] leading-relaxed text-muted">
              A dated first-person record, and research from public sources beside it.
              Every figure resolves to a named source.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <nav key={col.heading} aria-label={col.heading}>
              <p className="font-display m-0 text-[12px] uppercase tracking-[0.14em] text-muted">
                {col.heading}
              </p>
              <ul className="m-0 mt-4 list-none space-y-2.5 p-0">
                {col.links.map((l) => (
                  <li key={l.href}>
                    {onNav && l.t ? (
                      <button
                        type="button"
                        onClick={() => onNav(l.t as NavTab)}
                        className="text-left text-[14px] text-foreground/80 transition-colors hover:text-foreground"
                      >
                        {l.label}
                      </button>
                    ) : (
                      <Link
                        href={l.href}
                        className="text-[14px] text-foreground/80 transition-colors hover:text-foreground"
                      >
                        {l.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* The legal row. Both open in place; both name the page they can also
            be read as, because a modal is not a citable address. */}
        <div className="mt-12 flex flex-col gap-4 border-t border-edge pt-6 sm:flex-row sm:items-center">
          <p className="m-0 text-[13px] text-muted">© 2026 Sean C. Harris. All Rights Reserved.</p>
          <div className="flex flex-wrap items-center gap-5 sm:ml-auto">
            <DisclaimerDialog>
              <button type="button" className={legalLink}>
                Disclaimer, copyright and terms
              </button>
            </DisclaimerDialog>
            <SafetyDialog>
              <button type="button" className={legalLink}>
                A note on safety
              </button>
            </SafetyDialog>
          </div>
        </div>

        <p className="m-0 mt-6 max-w-3xl text-[13px] leading-relaxed text-muted">
          Independent research compiled from public sources, for information only — not
          legal, medical or investment advice. The Journal records communications the
          author received without consent; those transcripts document what was said to
          him and do not reflect his views.
        </p>
      </div>
    </footer>
  );
}
