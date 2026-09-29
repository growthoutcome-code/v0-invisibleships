"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogBody, DialogTitle } from "@/components/ui/dialog";
import { track } from "@/lib/analytics";
import type { PagePreview } from "@/lib/page-preview";

/**
 * "Pages viewed", with a panel behind every row.
 *
 * The table listed raw paths, which say how much a thing was read and nothing about
 * what it was — "/journal/is-j01-20250227-entry" is not a title. Sean, 29 September:
 * "can we provide a modal that previews and links to the pages in the insights?"
 *
 * Previews are resolved on the SERVER and passed in as plain data. The alternative was
 * fetching a page's metadata from the browser when a row is clicked, which would mean
 * the transparency page quietly making requests to its own routes and counting them as
 * traffic — a measurement page inflating the numbers it reports.
 *
 * Same Dialog and the same track() call as TrafficChart, so the two panels on this page
 * behave identically.
 */

const nf = new Intl.NumberFormat("en-US");

export type PageRow = { label: string; n: number; preview: PagePreview };

export default function PagesTable({
  title,
  rows,
  unit,
  note,
  source,
}: {
  title: string;
  rows: PageRow[];
  unit: string;
  note?: string;
  /** "Google" or "PostHog", for the interaction event only. */
  source: string;
}) {
  const [open, setOpen] = useState<PageRow | null>(null);
  const max = Math.max(...rows.map((r) => r.n), 1);

  return (
    <section className="mt-10">
      <div className="flex items-baseline justify-between gap-4 border-b border-edge pb-2">
        <h2 className="font-display m-0 text-[12px] uppercase tracking-[0.14em] text-muted">{title}</h2>
        <span className="font-display text-[11px] uppercase tracking-[0.14em] text-muted">{unit}</span>
      </div>

      {rows.length === 0 ? (
        <p className="mt-3 text-[14px] text-muted">Nothing recorded yet.</p>
      ) : (
        <ul className="m-0 list-none p-0">
          {rows.map((r) => (
            <li key={r.label} className="border-b border-edge last:border-b-0">
              {/* The whole row is the control. A small "details" affordance beside a
                  path would be a second thing to aim at on a phone, and the row is
                  already the natural target. */}
              <button
                type="button"
                onClick={() => {
                  setOpen(r);
                  track("insights_page_opened", { source, path: r.preview.path, views: r.n });
                }}
                className="w-full cursor-pointer border-0 bg-transparent px-0 py-2.5 text-left transition-colors hover:bg-foreground/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="flex items-baseline justify-between gap-4">
                  <span className="text-[15px] text-foreground">
                    {r.preview.title}
                    <span className="font-display ml-2 align-middle text-[10px] uppercase tracking-[0.12em] text-muted">
                      {r.preview.warning ? "not a page" : r.preview.kind}
                    </span>
                  </span>
                  <span className="font-display text-[15px] tabular-nums text-foreground">{nf.format(r.n)}</span>
                </div>
                {/* The path stays visible under the title. It is the thing Sean
                    recognises when a number looks wrong, and the title alone would
                    make two different journal entries look interchangeable. */}
                <div className="mt-0.5 truncate text-[12px] text-muted">{r.preview.path}</div>
                <div className="mt-1.5 h-[3px] w-full bg-edge">
                  <div className="h-full bg-foreground" style={{ width: `${Math.round((r.n / max) * 100)}%` }} />
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      {note && <p className="mt-3 max-w-3xl text-[13px] leading-relaxed text-muted">{note}</p>}

      <Dialog open={open !== null} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent size="md">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">{open?.preview.title}</DialogTitle>
          </DialogHeader>
          <DialogBody>
            {open && (
              <>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="font-display text-[11px] uppercase tracking-[0.14em] text-muted">
                    {open.preview.kind}
                  </span>
                  <span className="font-display text-[11px] uppercase tracking-[0.14em] text-muted">
                    {nf.format(open.n)} {open.n === 1 ? "view" : "views"}
                  </span>
                </div>

                <p className="mt-4 text-[15px] leading-relaxed text-foreground/85">{open.preview.blurb}</p>

                {open.preview.facts.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {open.preview.facts.map((f) => (
                      <span key={f} className="border border-edge px-2.5 py-1 text-[12px] text-muted">
                        {f}
                      </span>
                    ))}
                  </div>
                )}

                {open.preview.warning && (
                  <p className="mt-4 border-l-2 border-edge pl-4 text-[13px] leading-relaxed text-muted">
                    {open.preview.warning}
                  </p>
                )}

                <p className="mt-5 border-t border-edge pt-4 font-mono text-[12px] text-muted">
                  {open.preview.path}
                </p>

                {open.preview.href ? (
                  <a
                    href={open.preview.href}
                    className="font-display mt-4 inline-block border border-foreground px-4 py-2 text-[12px] font-medium uppercase tracking-[0.14em] text-foreground transition-colors hover:bg-foreground hover:text-background"
                  >
                    Open this page
                  </a>
                ) : (
                  // No dead link. A button that 404s is worse than no button, and on
                  // this page in particular: the reason the row is here at all is that
                  // something requested a path the site does not serve.
                  <p className="mt-4 text-[13px] text-muted">There is no page to open.</p>
                )}
              </>
            )}
          </DialogBody>
        </DialogContent>
      </Dialog>
    </section>
  );
}
