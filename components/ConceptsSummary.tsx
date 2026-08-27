"use client";

import { useMemo } from "react";
import { BarRows } from "@/components/ResearchCharts";
import { track } from "@/lib/analytics";
import {
  CONCEPTS, NOT_ESTABLISHED,
  BASIS_LABEL, BASIS_NOTE, ORIGIN_LABEL, ORIGIN_NOTE,
  type Basis, type Origin, type Filters,
} from "@/lib/concepts";

/**
 * The detail behind the Concepts notice (Sean, 2026-08-27).
 *
 * This was 2,400 characters standing between the reader and the first concept.
 * It is the same content — the standing limits, what the labels mean, what the
 * entries rest on — moved inside ConceptsNotice's expander. Nothing was cut to
 * hit the character budget; it is one click instead of a wall.
 */

const BASIS_ORDER: Basis[] = ["documented", "structural", "testimony", "pattern"];
const ORIGIN_ORDER: Origin[] = ["ai", "author"];

export default function ConceptsSummary({ setFilters }: { setFilters: (f: Filters) => void }) {
  const basisRows = useMemo(() => BASIS_ORDER.map((b) => ({
    key: b, label: BASIS_LABEL[b], note: BASIS_NOTE[b],
    n: CONCEPTS.filter((c) => c.basis === b).length,
  })).filter((r) => r.n > 0), []);

  return (
    <div>
      <h3 className="text-[13px] uppercase tracking-[0.08em] font-semibold text-foreground mb-3">
        What these do not establish
      </h3>
      <ul className="list-none p-0 m-0 measure mb-8">
        {NOT_ESTABLISHED.map((t) => (
          <li key={t} className="text-[16px] text-foreground/85 py-1.5 pl-5 relative">
            <span aria-hidden className="absolute left-0 top-1.5 text-foreground">&mdash;</span>{t}
          </li>
        ))}
      </ul>

      <h3 className="text-[13px] uppercase tracking-[0.08em] font-semibold text-foreground mb-3">
        What the labels mean
      </h3>
      <div className="grid gap-x-10 gap-y-6 md:grid-cols-2 measure mb-8">
        <dl className="m-0">
          {ORIGIN_ORDER.map((o) => (
            <div key={o} className="py-1">
              <dt className="text-[15px] font-semibold text-foreground">{ORIGIN_LABEL[o]}</dt>
              <dd className="text-[15px] text-muted m-0">{ORIGIN_NOTE[o]}</dd>
            </div>
          ))}
        </dl>
        <dl className="m-0">
          {BASIS_ORDER.map((b) => (
            <div key={b} className="py-1">
              <dt className="text-[15px] font-semibold text-foreground">{BASIS_LABEL[b]}</dt>
              <dd className="text-[15px] text-muted m-0">{BASIS_NOTE[b]}</dd>
            </div>
          ))}
        </dl>
      </div>

      <h3 className="text-[13px] uppercase tracking-[0.08em] font-semibold text-foreground mb-3">
        What these concepts rest on
      </h3>
      <BarRows rows={basisRows} total={CONCEPTS.length}
        onPick={(k) => { track("summary_basis_picked", { key: k }); setFilters({ q: "", origin: "all", theme: "all", audience: "all", basis: k as Basis }); }}
        caption="Concepts by basis. A reader who rejects every testimony entry can still rely on every documented one" />
      <p className="text-[15px] text-muted measure mt-4 mb-0">
        The distribution is honest rather than flattering: this archive is documented-heavy because
        that is what has been written into it, not because everything in it is proven.
      </p>
    </div>
  );
}
