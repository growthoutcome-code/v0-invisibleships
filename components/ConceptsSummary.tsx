"use client";

import { useMemo } from "react";
import { track } from "@/lib/analytics";
import DisclaimerLink from "@/components/DisclaimerLink";
import {
  CONCEPTS,
  SOURCE_YEARS,
  BASIS_LABEL,
  BASIS_NOTE,
  THEME_LABEL,
  THEME_NOTE,
  AUDIENCE_LABEL,
  AUDIENCE_NOTE,
  type Basis,
  type Theme,
  type Audience,
  type Filters,
} from "@/lib/concepts";
import { NO_FILTERS } from "@/lib/concepts";

/**
 * The three summaries a reader meets before the concept list (Sean, 2026-08-26).
 *
 *   1. What this found        the headline numbers, and how far back the record goes
 *   2. Where to start         by subject, and by who the reader is
 *   3. What is not settled    the boundary, gathered in one place
 *
 * Everything countable is COUNTED FROM `CONCEPTS` at render, never typed in, so
 * the summary cannot drift from the list beneath it. The one exception is
 * SOURCE_YEARS, hand-maintained because a citation's year cannot be parsed out
 * of a prose evidence line.
 *
 * Charts are hand-rolled SVG in the site's own tokens, like the rest of the
 * charts here. Each is a single series, so there is no categorical palette and
 * nothing to validate: one ink, magnitude only.
 */

const THEME_ORDER: Theme[] = [
  "record", "procurement", "surveillance", "neurotech", "coercion", "health", "experience",
];
const AUDIENCE_ORDER: Audience[] = [
  "household", "investigators", "policy", "clinicians", "press",
];
const BASIS_ORDER: Basis[] = ["documented", "structural", "testimony", "pattern"];

/** Eight findings, each a number a reader can check against a named source. */
const FINDINGS: { stat: string; line: string; id: string }[] = [
  { stat: "€90.5m", line: "in fines against one facial-recognition company across four European regulators. Over the same period US Immigration and Customs Enforcement paid it $12.75m.", id: "fined-in-europe-hired-in-america" },
  { stat: "190m", line: "people had their records exposed in the 2024 Change Healthcare breach, at a clearing house no patient chose or had heard of.", id: "how-protected-is-your-medical-record" },
  { stat: "420", line: "schoolchildren were placed on a Florida sheriff's list of likely future criminals. Having been a victim of abuse was one of the things that could put a child on it.", id: "what-children-are-subject-to" },
  { stat: "3,500", line: "American newspapers have closed since 2005, and 213 counties now have no local news source at all. That is why an absence of coverage proves very little.", id: "why-isnt-this-in-the-news" },
  { stat: "$300", line: "bought Reuters a human cervical spine. The trade is lawful in most states, and the donating family was never told.", id: "who-profits-from-a-body" },
  { stat: "40%", line: "rise in the United States suicide rate between 2000 and 2021, while the world's fell 27% on the same measure.", id: "us-rose-against-the-trend" },
  { stat: "3", line: "constitutional amendments a Florida sheriff's office admitted violating, in writing, to settle a case four residents refused to drop.", id: "what-children-are-subject-to" },
  { stat: "1 in 3", line: "healthy participants felt somebody standing behind them, touching them, when a robot delayed their own movement by half a second. Nobody was there.", id: "what-produces-the-feeling" },
];

/* ------------------------------------------------------------------ charts */

/** Horizontal magnitude bars. One series, one ink. */
function BarRows({
  rows, total, onPick, caption,
}: {
  rows: { key: string; label: string; n: number; note?: string }[];
  total: number;
  onPick?: (key: string) => void;
  caption: string;
}) {
  const max = Math.max(...rows.map((r) => r.n), 1);
  return (
    <figure className="m-0">
      <ul className="list-none p-0 m-0">
        {rows.map((r) => {
          const pct = (r.n / max) * 100;
          const row = (
            <>
              <span className="text-[15px] text-foreground w-[13rem] shrink-0 truncate">{r.label}</span>
              <span className="flex-1 min-w-0 h-[10px] bg-edge/40 rounded-[4px] overflow-hidden" aria-hidden="true">
                <span className="block h-full bg-foreground rounded-[4px]" style={{ width: `${Math.max(pct, 3)}%` }} />
              </span>
              <span className="text-[15px] text-muted tabular-nums w-[3rem] text-right shrink-0">{r.n}</span>
            </>
          );
          return (
            <li key={r.key} className="py-[3px]">
              {onPick ? (
                <button type="button" onClick={() => onPick(r.key)} title={r.note}
                  className="flex items-center gap-4 w-full text-left hover:text-accent">
                  {row}
                </button>
              ) : (
                <div className="flex items-center gap-4" title={r.note}>{row}</div>
              )}
            </li>
          );
        })}
      </ul>
      <figcaption className="text-[14px] text-muted mt-3">{caption} &middot; {total} concepts in total.</figcaption>
    </figure>
  );
}

/**
 * Evidence span. One dot per primary source on a linear year axis, stacked
 * where a year holds several. The sparse left and dense right IS the finding,
 * so the axis is not broken to flatter it.
 */
function EvidenceSpan() {
  const dots = useMemo(() => {
    const sorted = [...SOURCE_YEARS].sort((a, b) => a.year - b.year);
    const seen = new Map<number, number>();
    return sorted.map((s) => {
      const k = seen.get(s.year) ?? 0;
      seen.set(s.year, k + 1);
      return { ...s, stack: k };
    });
  }, []);

  const W = 1000, PAD = 10, BASE = 112, MIN_Y = 1880, MAX_Y = 2030;
  const x = (y: number) => PAD + ((y - MIN_Y) / (MAX_Y - MIN_Y)) * (W - PAD * 2);
  const ticks = [1880, 1920, 1960, 2000, 2030];
  const labelled = [1888, 1976, 2007, 2020, 2024];
  const first = dots[0]?.year ?? 0;
  const last = dots[dots.length - 1]?.year ?? 0;

  return (
    <figure className="m-0">
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${W} 150`} className="w-full min-w-[520px] h-auto" role="img"
          aria-label={`Years of the ${SOURCE_YEARS.length} primary sources behind these concepts, from ${first} to ${last}.`}>
          <line x1={PAD} y1={BASE} x2={W - PAD} y2={BASE} className="stroke-edge" strokeWidth={2} />
          {ticks.map((t) => (
            <g key={t}>
              <line x1={x(t)} y1={BASE} x2={x(t)} y2={BASE + 6} className="stroke-edge" strokeWidth={2} />
              <text x={x(t)} y={BASE + 26} textAnchor="middle" className="fill-muted" fontSize={17}>{t}</text>
            </g>
          ))}
          {dots.map((d, i) => (
            <circle key={i} cx={x(d.year)} cy={BASE - 10 - d.stack * 13} r={5}
              className="fill-foreground stroke-background" strokeWidth={2}>
              <title>{`${d.year} — ${d.label}`}</title>
            </circle>
          ))}
          {labelled.map((yr) => {
            const d = dots.filter((z) => z.year === yr).pop();
            if (!d) return null;
            return (
              <text key={yr} x={x(yr)} y={BASE - 24 - d.stack * 13} textAnchor="middle"
                className="fill-muted" fontSize={16}>{yr}</text>
            );
          })}
        </svg>
      </div>
      <figcaption className="text-[14px] text-muted mt-2">
        One dot per primary source behind the concepts below, by year of publication or judgment.
        Hover a dot to see the source. The record runs {first} to {last} &mdash; {last - first} years.
      </figcaption>
    </figure>
  );
}

/* ----------------------------------------------------------------- summary */

export default function ConceptsSummary({ setFilters }: { setFilters: (f: Filters) => void }) {
  const themeRows = useMemo(() => THEME_ORDER.map((t) => ({
    key: t, label: THEME_LABEL[t], note: THEME_NOTE[t],
    n: CONCEPTS.filter((c) => c.theme === t).length,
  })), []);

  const audienceRows = useMemo(() => AUDIENCE_ORDER.map((a) => ({
    key: a, label: AUDIENCE_LABEL[a], note: AUDIENCE_NOTE[a],
    n: CONCEPTS.filter((c) => c.audience.includes(a)).length,
  })), []);

  const basisRows = useMemo(() => BASIS_ORDER.map((b) => ({
    key: b, label: BASIS_LABEL[b], note: BASIS_NOTE[b],
    n: CONCEPTS.filter((c) => c.basis === b).length,
  })).filter((r) => r.n > 0), []);

  const jump = (patch: Partial<Filters>, evt: string, key: string) => {
    setFilters({ ...NO_FILTERS, ...patch });
    track(evt, { key });
    document.getElementById("concepts-list")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="mb-20">
      <section className="mb-16">
        <h2 className="font-display font-semibold text-foreground text-[26px] md:text-[30px] leading-tight mb-4">
          What this section found
        </h2>
        <p className="body-copy text-foreground/85 measure mb-8">
          Eight of them, each a number that can be checked against a named source. None of these
          is a claim about what is happening to anyone in particular.
        </p>

        <ul className="list-none p-0 m-0 mb-12">
          {FINDINGS.map((f) => (
            <li key={f.stat + f.id} className="flex flex-col sm:flex-row gap-x-6 gap-y-1 py-4 border-t border-edge">
              <span className="font-display font-semibold text-foreground text-[28px] leading-none tabular-nums sm:w-[7rem] shrink-0">
                {f.stat}
              </span>
              <span className="body-copy text-foreground/85 measure m-0">
                {f.line}{" "}
                <a href={`#${f.id}`} onClick={() => track("summary_finding_opened", { id: f.id })}
                  className="text-accent underline underline-offset-4 whitespace-nowrap">Read it</a>
              </span>
            </li>
          ))}
        </ul>

        <h3 className="font-display font-semibold text-foreground text-[19px] mb-3">
          How far back the record goes
        </h3>
        <EvidenceSpan />
      </section>

      <section className="mb-16">
        <h2 className="font-display font-semibold text-foreground text-[26px] md:text-[30px] leading-tight mb-4">
          Where to start
        </h2>
        <p className="body-copy text-foreground/85 measure mb-8">
          Two ways in: by subject, or by who you are. A concept can be useful to a household and
          to an investigator for entirely different reasons. Picking a subject filters the list below.
        </p>

        <h3 className="font-display font-semibold text-foreground text-[19px] mb-3">By subject</h3>
        <div className="mb-10">
          <BarRows rows={themeRows} total={CONCEPTS.length}
            onPick={(k) => jump({ theme: k as Theme }, "summary_theme_picked", k)}
            caption="Concepts by subject. Hover a row for what it covers" />
        </div>

        <h3 className="font-display font-semibold text-foreground text-[19px] mb-3">By who you are</h3>
        <ul className="list-none p-0 m-0">
          {audienceRows.map((a) => (
            <li key={a.key} className="py-4 border-t border-edge">
              <p className="text-[13px] uppercase tracking-[0.08em] font-semibold text-foreground m-0 mb-1">
                {a.label} <span className="text-muted tabular-nums font-normal">&middot; {a.n}</span>
              </p>
              <p className="body-copy text-foreground/75 measure m-0">{a.note}</p>
            </li>
          ))}
        </ul>
        <p className="text-[14px] text-muted mt-3">
          Counted from the concepts themselves. A concept appears under every reader it serves, so
          these do not sum to {CONCEPTS.length}.
        </p>
      </section>

      <section className="mb-4">
        <h2 className="font-display font-semibold text-foreground text-[26px] md:text-[30px] leading-tight mb-4">
          What is not established
        </h2>
        <p className="body-copy text-foreground/85 measure mb-6">
          This is the part most collections leave out, and it is the reason to trust the rest. Every
          concept below states what it does <em>not</em> answer, in its own words, on its own page.
          Four things are true of the whole section.
        </p>
        <ul className="list-none p-0 m-0 measure mb-10">
          {[
            "Nothing here establishes that any specific thing has been done to any specific person, including the author.",
            "No capability is documented that reads a person's perception, or that reaches them at a distance without their participation. Where a concept touches on that, it says so on its own page.",
            "An absence of evidence is recorded as an absence of evidence. It is never presented as proof that nothing happened, and never as proof that something did.",
            "Sources are cited for their own findings. Two sources sitting beside each other do not corroborate one another, and the section says so wherever they appear together.",
          ].map((t) => (
            <li key={t} className="body-copy text-foreground/85 py-2 pl-5 relative">
              <span aria-hidden className="absolute left-0 top-2 text-foreground">&mdash;</span>{t}
            </li>
          ))}
        </ul>

        <h3 className="font-display font-semibold text-foreground text-[19px] mb-3">
          What these concepts rest on
        </h3>
        <BarRows rows={basisRows} total={CONCEPTS.length}
          onPick={(k) => jump({ basis: k as Basis }, "summary_basis_picked", k)}
          caption="Concepts by basis. A reader who rejects every testimony entry can still rely on every documented one" />

        <p className="text-[15px] text-muted measure mt-6">
          The distribution is honest rather than flattering: this archive is documented-heavy because
          that is what has been written into it, not because everything in it is proven.{" "}
          <DisclaimerLink from="concepts_summary">Read the full disclaimer</DisclaimerLink>.
        </p>
      </section>
    </div>
  );
}
