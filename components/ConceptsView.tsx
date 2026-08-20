"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { track } from "@/lib/analytics";
import DisclaimerLink from "@/components/DisclaimerLink";
import ConceptsNav, { type Filters } from "@/components/ConceptsNav";
import { CONCEPTS, BASIS_LABEL, BASIS_NOTE, ORIGIN_LABEL, ORIGIN_NOTE, VERIFICATION_LABEL, type Basis, type Origin } from "@/lib/concepts";

const BASIS_ORDER: Basis[] = ["documented", "structural", "pattern"];
const ORIGIN_ORDER: Origin[] = ["ai", "author"];

/**
 * Core concepts, each showing the basis it rests on.
 *
 * The labels are the whole point: a reader who rejects every Pattern can still
 * rely on every Documented entry. Presented inline rather than fenced off, so
 * each claim is weighed on its own basis instead of by its neighbours.
 */
export default function ConceptsView() {
  const [filters, setFilters] = useState<Filters>({ origin: "all", basis: "all" });

  useEffect(() => { track("concepts_viewed"); }, []);

  // A shared anchor must always resolve, even if the target is filtered out —
  // so an incoming hash clears the filters before the browser scrolls.
  useEffect(() => {
    if (typeof window === "undefined" || !window.location.hash) return;
    setFilters({ origin: "all", basis: "all" });
    const id = window.location.hash.slice(1);
    const t = window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 60);
    return () => window.clearTimeout(t);
  }, []);

  const visible = useMemo(
    () => CONCEPTS.filter(
      (c) =>
        (filters.origin === "all" || c.origin === filters.origin) &&
        (filters.basis === "all" || c.basis === filters.basis)
    ),
    [filters]
  );

  const [labelsOpen, setLabelsOpen] = useState(false);

  return (
    <div className="w-full">
      <p className="body-copy text-foreground/85 max-w-[70ch] mb-4">
        Ideas drawn from the research. Each one is tagged with who formed it and what it rests on,
        because they are not the same kind of claim: some follow from a document, some from what the
        record is missing, some from the author&rsquo;s own experience.
      </p>
      <p className="text-muted text-[15px] max-w-[70ch] mb-10">
        None of this establishes wrongdoing by any organisation, and nothing here is independently
        verified unless it says so.{" "}
        <DisclaimerLink from="concepts">Read the full disclaimer</DisclaimerLink>{" "}
        ·{" "}
        <button
          type="button"
          onClick={() => setLabelsOpen((v) => !v)}
          className="underline underline-offset-4 hover:text-foreground"
          aria-expanded={labelsOpen}
        >
          {labelsOpen ? "Hide" : "What the labels mean"}
        </button>
      </p>

      {labelsOpen && (
      <div className="mb-16 max-w-[70ch] grid gap-10 md:grid-cols-2">
        <div>
          <h2 className="text-[13px] uppercase tracking-[0.08em] font-semibold text-foreground mb-3">
            Who formed it
          </h2>
          <dl className="m-0">
            {ORIGIN_ORDER.map((o) => (
              <div key={o} className="py-1.5">
                <dt className="text-[16px] font-semibold text-foreground">{ORIGIN_LABEL[o]}</dt>
                <dd className="text-[16px] text-muted m-0">{ORIGIN_NOTE[o]}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div>
          <h2 className="text-[13px] uppercase tracking-[0.08em] font-semibold text-foreground mb-3">
            What it rests on
          </h2>
          <dl className="m-0">
            {BASIS_ORDER.map((b) => (
              <div key={b} className="py-1.5">
                <dt className="text-[16px] font-semibold text-foreground">{BASIS_LABEL[b]}</dt>
                <dd className="text-[16px] text-muted m-0">{BASIS_NOTE[b]}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
      )}

      <ConceptsNav filters={filters} setFilters={setFilters} shown={visible.length} />

      <ol className="list-none p-0 m-0">
        {visible.map((c) => (
          <li key={c.id} id={c.id} className="mb-20 scroll-mt-28">
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2 mb-3">
              <span className="text-[13px] uppercase tracking-[0.08em] font-semibold text-muted tabular-nums">
                {String(CONCEPTS.indexOf(c) + 1).padStart(2, "0")}
              </span>
              {/* Origin reads first — a reader should know who formed a claim before
                  they weigh what it rests on. */}
              <span className="text-[13px] uppercase tracking-[0.08em] font-semibold text-background bg-foreground px-2.5 py-1">
                {ORIGIN_LABEL[c.origin]}
              </span>
              <span className="text-[13px] uppercase tracking-[0.08em] font-semibold text-foreground">
                {BASIS_LABEL[c.basis]}
              </span>
            </div>

            <h3 className="font-display font-semibold text-foreground text-[26px] md:text-[30px] leading-tight mb-4 max-w-[46ch]">
              {c.title}
            </h3>

            <p className="body-copy text-foreground/85 max-w-[70ch] mb-6">{c.body}</p>

            {c.evidence && (
              <ul className="list-none p-0 m-0 max-w-[70ch] mb-6">
                {c.evidence.map((e) => (
                  <li key={e} className="text-[16px] text-muted py-1.5 pl-5 relative">
                    <span aria-hidden className="absolute left-0 top-1.5 text-foreground">—</span>
                    {e}
                  </li>
                ))}
              </ul>
            )}

            {/* Open questions are published deliberately: a concept that names what
                would settle it is more credible than one that only asserts. */}
            {c.questions && (
              <div className="max-w-[70ch] mb-6">
                <h4 className="text-[13px] uppercase tracking-[0.08em] font-semibold text-foreground mb-2">
                  Open questions
                </h4>
                <ul className="list-none p-0 m-0">
                  {c.questions.map((q) => (
                    <li key={q} className="body-copy text-foreground/75 py-2 pl-5 relative">
                      <span aria-hidden className="absolute left-0 top-2 text-foreground">?</span>
                      {q}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {c.references && (
              <div className="max-w-[70ch] mb-6">
                <h4 className="text-[13px] uppercase tracking-[0.08em] font-semibold text-foreground mb-2">
                  References
                </h4>
                <ul className="list-none p-0 m-0">
                  {c.references.map((r) => (
                    <li key={r.href} className="py-1.5">
                      <a
                        href={r.href}
                        target={r.href.startsWith("http") ? "_blank" : undefined}
                        rel={r.href.startsWith("http") ? "noreferrer noopener" : undefined}
                        onClick={() => track("concept_reference_opened", { concept: c.id, href: r.href })}
                        className="text-[17px] text-foreground underline underline-offset-4 hover:text-accent"
                      >
                        {r.label}
                      </a>
                    </li>
                  ))}
                </ul>
                {/* Without this note a contextual link reads as corroboration. */}
                {c.referencesNote && (
                  <p className="text-[16px] text-muted mt-3 m-0">{c.referencesNote}</p>
                )}
              </div>
            )}

            {/* Verification state is information, not boilerplate, so it stays as a
                chip. The long per-concept disclaimer is gone: the standing line at
                the top of the section points at /disclaimer instead. The one
                exception is a concept whose scope limit is specific to it — it
                carries `disclaimer`, and that is deliberately preserved. */}
            {(c.verification && c.verification !== "verified") || c.disclaimer ? (
              <div className="max-w-[70ch] border-l-2 border-edge pl-5 py-1">
                {c.verification && c.verification !== "verified" && (
                  <p className="text-[13px] uppercase tracking-[0.08em] font-semibold text-foreground m-0">
                    {VERIFICATION_LABEL[c.verification]}
                  </p>
                )}
                {c.disclaimer && (
                  <p className="text-[16px] text-muted m-0 mt-2">{c.disclaimer}</p>
                )}
              </div>
            ) : null}
          </li>
        ))}
      </ol>

      {!visible.length && (
        <p className="body-copy text-muted max-w-[70ch] mb-16">
          No concepts match that combination. Clear a filter to see the rest.
        </p>
      )}

      <p className="body-copy text-muted max-w-[70ch]">
        Every figure cited here is drawn from the research in the{" "}
        <Link href="/data" className="text-accent underline underline-offset-4">Data</Link>{" "}
        section, where each fact links to its own source.
      </p>
    </div>
  );
}
