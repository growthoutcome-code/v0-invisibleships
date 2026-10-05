"use client";

import type React from "react";

import { track } from "@/lib/analytics";
import { BASIS_LABEL, ORIGIN_LABEL, VERIFICATION_LABEL, type Concept } from "@/lib/concepts";
import { THEMES } from "@/lib/themes";
import ConceptBody, { renderConceptInline } from "@/components/ConceptBody";

/**
 * One concept in full, on its own page (/concepts/<id>, Sean 30 Sep 2026).
 * Moved here from ConceptsView, which now shows tiles; the wording, the labels
 * and every attribution note are unchanged.
 */
export default function ConceptArticle({ c, n, intro }: { c: Concept; n: number; intro?: React.ReactNode }) {
  return (
    <article>
      {/* H1 first, then the meta under it, then the page description (Sean,
          4 Oct 2026: "let's make the H1 the top thing and put the meta
          underneath", as the News page does). */}
      <h1 className="font-display font-semibold text-foreground text-[28px] md:text-[36px] leading-tight mb-3 max-w-[40ch]">
        {c.title}
      </h1>

      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2 mb-5">
        <span className="text-[13px] uppercase tracking-[0.08em] font-semibold text-muted tabular-nums">
          {String(n).padStart(2, "0")}
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

      {intro}

      {/* Plain prose renders exactly as before (one paragraph per blank line);
          a body may also use the small markdown subset in ConceptBody (4 Oct 2026). */}
      <ConceptBody md={c.body} />

      {c.evidence && (
        <ul className="list-none p-0 m-0 measure mb-6">
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
        <div className="measure mb-6">
          <h4 className="text-[13px] uppercase tracking-[0.08em] font-semibold text-foreground mb-2">
            Open questions
          </h4>
          <ul className="list-none p-0 m-0">
            {c.questions.map((q) => (
              <li key={q} className="body-copy text-foreground/75 py-2 pl-5 relative">
                <span aria-hidden className="absolute left-0 top-2 text-foreground">?</span>
                {renderConceptInline(q, q.slice(0, 24))}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Claim and counter-claim, attributed, on the same page. Each half
          renders independently — an assessment can answer the concept body
          itself, with no separate author statement above it. Neither half is
          ever edited to agree with the other; see lib/concepts.ts. */}
      {c.authorStatement && (
        <div className="measure mb-6 border-l-2 border-foreground pl-5 py-1">
          <h4 className="text-[13px] uppercase tracking-[0.08em] font-semibold text-foreground mb-2">
            The author states
          </h4>
          {c.authorStatement.map((m) => (
            <p key={m} className="body-copy text-foreground/85 m-0 mb-2 last:mb-0">{m}</p>
          ))}
          <p className="text-[14px] text-muted mt-3 m-0">
            The author&rsquo;s own words, printed as given. Unverified, and not a finding of this research.
          </p>
        </div>
      )}

      {c.aiAssessment && (
        <div className="measure mb-6 border-l-2 border-accent pl-5 py-1">
          <h4 className="text-[13px] uppercase tracking-[0.08em] font-semibold text-foreground mb-2">
            AI assessment
          </h4>
          {c.aiAssessment.map((m) => (
            <p key={m} className="body-copy text-foreground/85 m-0 mb-2 last:mb-0">{m}</p>
          ))}
          <p className="text-[14px] text-muted mt-3 m-0">
            Written by an AI model at the author&rsquo;s request. Published unedited by the author,
            and not independent verification.
          </p>
        </div>
      )}

      {/* The author's own voice, fenced off from the sourced material.
          Labelled so a reader never mistakes commentary for a finding. */}
      {c.comments && (
        <div className="measure mb-6 border-l-2 border-accent/40 pl-5">
          <h4 className="text-[13px] uppercase tracking-[0.08em] font-semibold text-foreground mb-2">
            Author&rsquo;s note
          </h4>
          {c.comments.map((m) => (
            <p key={m} className="body-copy text-foreground/75 m-0 mb-3 last:mb-0">{renderConceptInline(m, m.slice(0, 24))}</p>
          ))}
          <p className="text-[14px] text-muted mt-3 m-0">
            Commentary by the author. Not evidence, and not a finding of this research.
          </p>
        </div>
      )}

      {c.references && (
        <div className="measure mb-6">
          <h4 className="text-[13px] uppercase tracking-[0.08em] font-semibold text-foreground mb-2">
            References
          </h4>
          <ul className="list-none p-0 m-0">
            {c.references.map((r) => (
              <li key={r.href} className="py-1.5">
                <a
                  href={r.href.replace(/^\/concepts#/, "/concepts/")}
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
        <div className="measure border-l-2 border-edge pl-5 py-1">
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
      {c.topics.length > 0 && (
        <p className="measure mt-8 text-[13px] uppercase tracking-[0.08em] text-muted">
          Topics: {c.topics.map((t) => THEMES[t]).filter(Boolean).join(" · ")}
        </p>
      )}
    </article>
  );
}
