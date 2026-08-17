"use client";

import { useEffect } from "react";
import Link from "next/link";
import { track } from "@/lib/analytics";
import { CONCEPTS, BASIS_LABEL, BASIS_NOTE, type Basis } from "@/lib/concepts";

const ORDER: Basis[] = ["documented", "structural", "pattern"];

/**
 * Core concepts, each showing the basis it rests on.
 *
 * The labels are the whole point: a reader who rejects every Pattern can still
 * rely on every Documented entry. Presented inline rather than fenced off, so
 * each claim is weighed on its own basis instead of by its neighbours.
 */
export default function ConceptsView() {
  useEffect(() => { track("concepts_viewed"); }, []);

  return (
    <div className="w-full">
      <p className="body-copy text-foreground/85 max-w-[70ch] mb-10">
        Each concept below shows what it rests on. Some are supported directly by a
        court ruling or official document. Some follow from what the research does and
        does not contain. Some are observations drawn from experience. They are not
        the same kind of claim, so they are not presented as though they were.
      </p>

      <dl className="mb-16 max-w-[70ch]">
        {ORDER.map((b) => (
          <div key={b} className="flex flex-wrap items-baseline gap-x-4 gap-y-1 py-2">
            <dt className="text-[13px] uppercase tracking-[0.08em] font-semibold text-foreground min-w-[104px]">
              {BASIS_LABEL[b]}
            </dt>
            <dd className="text-[16px] text-muted m-0 flex-1">{BASIS_NOTE[b]}</dd>
          </div>
        ))}
      </dl>

      <ol className="list-none p-0 m-0">
        {CONCEPTS.map((c, i) => (
          <li key={c.id} id={c.id} className="mb-20 scroll-mt-28">
            <div className="flex items-baseline gap-4 mb-3">
              <span className="text-[13px] uppercase tracking-[0.08em] font-semibold text-muted tabular-nums">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="text-[13px] uppercase tracking-[0.08em] font-semibold text-foreground">
                {BASIS_LABEL[c.basis]}
              </span>
            </div>

            <h2 className="font-display font-semibold text-foreground text-[26px] md:text-[30px] leading-tight mb-4 max-w-[46ch]">
              {c.title}
            </h2>

            <p className="body-copy text-foreground/85 max-w-[70ch] mb-6">{c.body}</p>

            {c.evidence && (
              <ul className="list-none p-0 m-0 max-w-[70ch]">
                {c.evidence.map((e) => (
                  <li key={e} className="text-[16px] text-muted py-1.5 pl-5 relative">
                    <span aria-hidden className="absolute left-0 top-1.5 text-foreground">—</span>
                    {e}
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ol>

      <p className="body-copy text-muted max-w-[70ch]">
        Every figure cited here is drawn from the research in the{" "}
        <Link href="/data" className="text-accent underline underline-offset-4">Data</Link>{" "}
        section, where each fact links to its own source.
      </p>
    </div>
  );
}
