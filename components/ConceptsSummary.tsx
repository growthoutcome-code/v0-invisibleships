"use client";

import { useMemo } from "react";
import DisclaimerLink from "@/components/DisclaimerLink";
import { BarRows } from "@/components/ResearchCharts";
import { track } from "@/lib/analytics";
import {
  CONCEPTS, NOT_ESTABLISHED, BASIS_LABEL, BASIS_NOTE,
  type Basis, type Filters,
} from "@/lib/concepts";

/**
 * What the concepts do NOT establish, above the list itself.
 *
 * The findings, the evidence-span chart and the routes in by subject and reader
 * moved up into ResearchHero when Data and Concepts merged — they describe the
 * whole section, not this vertical. What stayed is the part that belongs to the
 * concepts specifically: the standing limits, and what they rest on.
 *
 * Most collections leave this out. It is the reason to trust the rest.
 */

const BASIS_ORDER: Basis[] = ["documented", "structural", "testimony", "pattern"];

export default function ConceptsSummary({ setFilters }: { setFilters: (f: Filters) => void }) {
  const basisRows = useMemo(() => BASIS_ORDER.map((b) => ({
    key: b, label: BASIS_LABEL[b], note: BASIS_NOTE[b],
    n: CONCEPTS.filter((c) => c.basis === b).length,
  })).filter((r) => r.n > 0), []);

  return (
    <div className="mb-16">
      <h2 className="font-display font-semibold text-foreground text-[26px] md:text-[30px] leading-tight mb-4">
        What is not established
      </h2>
      <p className="body-copy text-foreground/85 measure mb-6">
        Every concept below states what it does <em>not</em> answer, in its own words, on its own
        page. Four things are true of all of them.
      </p>
      <ul className="list-none p-0 m-0 measure mb-10">
        {NOT_ESTABLISHED.map((t) => (
          <li key={t} className="body-copy text-foreground/85 py-2 pl-5 relative">
            <span aria-hidden className="absolute left-0 top-2 text-foreground">&mdash;</span>{t}
          </li>
        ))}
      </ul>

      <h3 className="font-display font-semibold text-foreground text-[19px] mb-3">
        What these concepts rest on
      </h3>
      <BarRows rows={basisRows} total={CONCEPTS.length}
        onPick={(k) => { track("summary_basis_picked", { key: k }); setFilters({ q: "", origin: "all", theme: "all", audience: "all", basis: k as Basis }); }}
        caption="Concepts by basis. A reader who rejects every testimony entry can still rely on every documented one" />

      <p className="text-[15px] text-muted measure mt-6">
        The distribution is honest rather than flattering: this archive is documented-heavy because
        that is what has been written into it, not because everything in it is proven.{" "}
        <DisclaimerLink from="concepts_summary">Read the full disclaimer</DisclaimerLink>.
      </p>
    </div>
  );
}
