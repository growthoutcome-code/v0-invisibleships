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
import { useEffect, useState } from "react";
import Link from "next/link";
import { ACCOUNTS_READY } from "@/lib/flags";
import { DisclaimerDialog, SafetyDialog } from "@/components/LegalDialogs";
import { DATA_SECTIONS } from "@/lib/routes";

type NavTab = "journal" | "data" | "concepts" | "glossary" | "documents" | "author";

const COLUMNS: {
  heading: string;
  links: { t?: NavTab; href: string; label: string }[];
  blurb?: string;
  /** Renders the live count from /api/insights/summary beneath the links. */
  live?: boolean;
}[] = [
  {
    heading: "The record",
    links: [
      { t: "journal", href: "/journal", label: "Journal" },
      { t: "glossary", href: "/glossary", label: "Glossary" },
      { t: "documents", href: "/documents", label: "Documents" },
      { href: "/api/corpus?from=footer", label: "Corpus for AI" },
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
      ...(ACCOUNTS_READY ? [{ href: "/contribute", label: "Contribute an account" }] : []),
    ],
  },
  {
    // Sean, 26 September: a fourth column for the measurement page, with a blurb
    // and a live count. The site asks readers to check its sourcing; this is the
    // same courtesy pointed at its own analytics.
    heading: "Insights",
    links: [{ href: "/insights", label: "What this site can see" }],
    blurb:
      "This archive is about being watched, so it publishes what it records about its own readers \u2014 and what it never records.",
    live: true,
  },
];

const legalLink =
  "text-left text-[13px] text-muted underline underline-offset-4 transition-colors hover:text-foreground";

export default function Footer({ onNav }: { onNav?: (t: NavTab) => void }) {
  return (
    <footer className="mt-16 bg-foreground/[0.035]">
      <div className="w-full px-5 py-14 sm:px-8 lg:px-[100px]">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
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
                    ) : l.href.startsWith("/api/") ? (
                      // A PLAIN ANCHOR, DELIBERATELY. next/link prefetches on hover and
                      // on entering the viewport, and a prefetch is a real request — so
                      // routing /api/corpus through <Link> meant the download counter
                      // fired every time this footer scrolled into view or the cursor
                      // passed over the link. Measured 27 Sep 2026: 18 recorded
                      // downloads, most of them prefetches, several in millisecond pairs
                      // where a prefetch and the actual click were both counted. The
                      // number was not a download count at all.
                      //
                      // prefetch={false} is not sufficient in Next 14: it disables the
                      // automatic viewport prefetch but hover still prefetches. Any href
                      // with a side effect gets a plain <a>.
                      <a
                        href={l.href}
                        className="text-[14px] text-foreground/80 transition-colors hover:text-foreground"
                      >
                        {l.label}
                      </a>
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
              {col.blurb && (
                <p className="body-copy m-0 mt-4 max-w-xs text-[13px] leading-relaxed text-muted">
                  {col.blurb}
                </p>
              )}
              {col.live && <InsightsCount />}
            </nav>
          ))}
        </div>

        {/* The legal row. Both open in place; both name the page they can also
            be read as, because a modal is not a citable address. */}
        <div className="mt-12 flex flex-col gap-4 pt-6 sm:flex-row sm:items-center">
          <p className="m-0 text-[13px] text-muted">© 2026 Sean C. Harris. All Rights Reserved.</p>
          <div className="flex flex-wrap items-center gap-5 sm:ml-auto">
            <DisclaimerDialog>
              <button type="button" className={legalLink}>
                Critical Disclaimer
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

/**
 * The live count in the footer's Insights column.
 *
 * Fetched rather than passed in: this footer is a client component mounted on
 * every page, including inside the app shell, so there is no one server boundary
 * to thread a number through. The endpoint is cached for five minutes at the
 * edge, so this costs a conditional request per page view and nothing at the
 * database.
 *
 * It renders NOTHING until it has a real answer, and says so in words when the
 * answer is zero. A footer that flashes "0 visits" on every page while it loads
 * would be both wrong and dispiriting, and a number with no state behind it is
 * how a site starts lying to itself.
 */
function InsightsCount() {
  const [data, setData] = useState<{
    visits: number;
    downloads: number;
    window: "all" | "gate";
    ok: boolean;
  } | null>(null);

  useEffect(() => {
    let live = true;
    fetch("/api/insights/summary")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (live && j && j.ok) setData(j);
      })
      .catch(() => {
        /* the footer is not the place to report an analytics outage */
      });
    return () => {
      live = false;
    };
  }, []);

  if (!data) return null;

  return (
    <p className="m-0 mt-3 text-[13px] leading-relaxed text-muted">
      {data.visits === 0 ? (
        "No visits recorded yet."
      ) : (
        <>
          <span className="font-display text-foreground">{data.visits.toLocaleString()}</span>{" "}
          {data.visits === 1 ? "visit" : "visits"}
          {data.window === "all" && " all time"}
          {data.downloads > 0 && (
            <>
              {" \u00b7 "}
              <span className="font-display text-foreground">{data.downloads.toLocaleString()}</span>{" "}
              {data.downloads === 1 ? "download" : "downloads"}
            </>
          )}
        </>
      )}{" "}
      <Link href="/insights" className="underline underline-offset-4 hover:text-foreground">
        See more
      </Link>
    </p>
  );
}
