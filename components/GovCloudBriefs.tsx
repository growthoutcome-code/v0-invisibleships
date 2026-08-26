"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { track } from "@/lib/analytics";

/**
 * The eight Government Cloud research briefs, on the site at last.
 *
 * 8,080 words — the longest prose in this archive — shipped inside the corpus
 * download since August and were never rendered here. Nothing lost them;
 * nothing ever routed to them. A reader could reach them only by downloading a
 * 3MB zip and opening a folder.
 *
 * Nothing on this page is summarised. Each brief opens with its OWN standfirst,
 * the bold line carrying its counts, and its own section headings; the build
 * script extracts those verbatim. A summary written for this component would be
 * the one part of the Government Cloud section with no source behind it.
 *
 * Closed by default: eight briefs opened at once is 8,000 words between the
 * reader and the charts below.
 */

type Brief = {
  id: string; file: string; title: string; short: string;
  standfirst: string; sections: string[]; words: number; body: string;
};

/** The briefs are Markdown and this site has no Markdown renderer. Rather than
 *  add a dependency for eight documents, render the block structure that is
 *  actually present: headings, bold ledes, list items, and paragraphs. */
function Body({ md }: { md: string }) {
  const blocks = md.split(/\n{2,}/).filter((b) => b.trim() && !b.startsWith("# "));
  return (
    <div className="measure">
      {blocks.map((b, i) => {
        const t = b.trim();
        if (t.startsWith("### ")) {
          return <h5 key={i} className="font-display font-semibold text-foreground text-[16px] mt-6 mb-2">{t.slice(4)}</h5>;
        }
        if (t.startsWith("## ")) {
          return <h4 key={i} className="font-display font-semibold text-foreground text-[18px] mt-8 mb-2">{t.slice(3)}</h4>;
        }
        if (/^[-*] /m.test(t)) {
          return (
            <ul key={i} className="list-none p-0 m-0 mb-4">
              {t.split("\n").filter((l) => /^[-*] /.test(l.trim())).map((l, j) => (
                <li key={j} className="text-[16px] text-foreground/85 py-1 pl-5 relative">
                  <span aria-hidden className="absolute left-0 top-1 text-foreground">&mdash;</span>
                  {l.trim().replace(/^[-*] /, "").replace(/\*\*/g, "")}
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p key={i} className="body-copy text-foreground/85 mb-4">
            {t.replace(/\*\*/g, "").replace(/^\*(.*)\*$/s, "$1")}
          </p>
        );
      })}
    </div>
  );
}

export default function GovCloudBriefs() {
  const [data, setData] = useState<{ briefs: Brief[]; words: number } | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    fetch("/data/government-cloud/briefs.json")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData({ briefs: [], words: 0 }));
  }, []);

  if (!data) return null;
  if (!data.briefs.length) return null;

  return (
    <section className="mb-16">
      <h2 className="font-display font-semibold text-foreground text-[21px] mb-3">
        The research behind this section
      </h2>
      <p className="body-copy text-foreground/85 measure mb-2">
        Eight briefs, {data.words.toLocaleString()} words, written as the research was done. The
        charts above are drawn from the same tables these describe. Each opens with its own count
        of what it covers.
      </p>
      <p className="text-[15px] text-muted measure mb-8">
        AI-assisted research from public records, author-directed. Every brief states what it could
        not verify, and those sections are kept rather than trimmed.
      </p>

      <ul className="list-none p-0 m-0">
        {data.briefs.map((b) => {
          const isOpen = open === b.id;
          return (
            <li key={b.id} className="border-t border-edge">
              <button
                type="button"
                onClick={() => {
                  setOpen(isOpen ? null : b.id);
                  if (!isOpen) track("govcloud_brief_opened", { id: b.id });
                }}
                aria-expanded={isOpen}
                className="w-full text-left py-5 flex items-start gap-4 group"
              >
                <span className="flex-1 min-w-0">
                  <span className="block font-display font-semibold text-foreground text-[18px] mb-1 group-hover:text-accent">
                    {b.short}
                  </span>
                  {b.standfirst && (
                    <span className="block text-[15px] text-muted measure">{b.standfirst}</span>
                  )}
                  <span className="block text-[14px] text-muted mt-2 tabular-nums">
                    {b.words.toLocaleString()} words &middot; {b.sections.length} sections
                    {b.sections.length > 0 && (
                      <span className="text-muted"> &middot; {b.sections.slice(0, 3).join(" · ")}
                        {b.sections.length > 3 ? " …" : ""}
                      </span>
                    )}
                  </span>
                </span>
                <ChevronDown size={18} aria-hidden
                  className={`shrink-0 mt-1 text-muted transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </button>
              {isOpen && (
                <div className="pb-8">
                  <Body md={b.body} />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
