"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { track } from "@/lib/analytics";
import ConceptsNav, { type Filters } from "@/components/ConceptsNav";
import { CONCEPTS, BASIS_LABEL, BASIS_NOTE, ORIGIN_LABEL, ORIGIN_NOTE, VERIFICATION_LABEL, SOURCE_ORIGIN_LABEL, type Basis, type Origin } from "@/lib/concepts";

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

  return (
    <div className="w-full">
      <p className="body-copy text-foreground/85 max-w-[70ch] mb-8">
        Each concept below shows who formed it and what it rests on. Some are supported
        directly by a court ruling or official document. Some follow from what the
        research does and does not contain. Some are observations drawn from experience.
        They are not the same kind of claim, so they are not presented as though they were.
      </p>

      {/* Standing notice. Deliberately not dismissable: most concepts on this page
          are unverified, and a reader arriving mid-page from a shared anchor must
          still meet this framing. */}
      <aside role="note" className="max-w-[70ch] border-l-2 border-foreground pl-6 py-1 mb-14">
        <p className="text-[13px] uppercase tracking-[0.08em] font-semibold text-foreground m-0 mb-3">
          Please read this first
        </p>
        <p className="body-copy text-foreground/85 m-0 mb-3">
          <strong>The author acknowledges that most of the material on this page is
          unverified.</strong> Concepts marked <em>Author&rsquo;s observation</em> record
          reported experience. Concepts marked <em>Pattern</em> rest on observation rather
          than documentation. Neither establishes a cause, a technology, a responsible
          party, or a coordinated campaign, and none of it has been independently tested
          or corroborated.
        </p>
        <p className="body-copy text-foreground/85 m-0">
          Each concept carries its own scope limit, and every one of them should be read
          alongside the site&rsquo;s full{" "}
          <Link href="/disclaimer" className="text-accent underline underline-offset-4">
            Disclaimer
          </Link>
          . Please do not draw conclusions from this page without it.
        </p>
      </aside>

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
              {c.sourceOrigin && (
                <span className="text-[13px] uppercase tracking-[0.08em] text-muted">
                  {SOURCE_ORIGIN_LABEL[c.sourceOrigin]}
                </span>
              )}
              {c.taxonomy && (
                <span className="text-[13px] uppercase tracking-[0.08em] text-muted">
                  {c.taxonomy}
                </span>
              )}
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

            {/* Each sub-hypothesis is unverified in its own right; numbering them
                keeps them individually addressable rather than one blurred claim. */}
            {c.hypotheses && (
              <ol className="list-none p-0 m-0 max-w-[70ch] mb-6">
                {c.hypotheses.map((h) => (
                  <li key={h.id} className="border-l-2 border-edge pl-5 py-2 mb-3">
                    <p className="text-[13px] uppercase tracking-[0.08em] font-semibold text-foreground m-0 mb-1">
                      {h.title} — unverified
                    </p>
                    <p className="body-copy text-foreground/80 m-0">{h.text}</p>
                  </li>
                ))}
              </ol>
            )}

            {c.glossaryReferences && (
              <p className="text-[16px] text-muted max-w-[70ch] mb-6">
                Site glossary:{" "}
                {c.glossaryReferences.map((g, gi) => (
                  <span key={g.href}>
                    {gi > 0 && " · "}
                    <Link
                      href={g.href}
                      onClick={() => track("concept_glossary_opened", { concept: c.id, term: g.term })}
                      className="text-foreground underline underline-offset-4 hover:text-accent"
                    >
                      {g.term}
                    </Link>
                  </span>
                ))}
                {" "}— site-specific terms, not independent evidence.
              </p>
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

            {(c.verification && c.verification !== "verified") || c.disclaimer ? (
              <div className="max-w-[70ch] border-l-2 border-edge pl-5 py-1">
                {c.verification && c.verification !== "verified" && (
                  <p className="text-[13px] uppercase tracking-[0.08em] font-semibold text-foreground m-0 mb-2">
                    {VERIFICATION_LABEL[c.verification]}
                  </p>
                )}
                {c.disclaimer && (
                  <p className="body-copy text-foreground/75 m-0">
                    {c.disclaimer}{" "}
                    <Link href="/disclaimer" className="text-accent underline underline-offset-4">
                      See the full Disclaimer
                    </Link>
                    .
                  </p>
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
