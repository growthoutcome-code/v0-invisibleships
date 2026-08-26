"use client";

import { useMemo } from "react";
import { track } from "@/lib/analytics";
import { EvidenceSpan, BarRows } from "@/components/ResearchCharts";
import {
  CONCEPTS, FINDINGS, RESEARCH_INTRO,
  THEME_LABEL, THEME_NOTE, AUDIENCE_LABEL, AUDIENCE_NOTE,
  type Filters, type Theme, type Audience,
} from "@/lib/concepts";

/**
 * The landing view of the merged Research section (Sean, 2026-08-26).
 *
 * Sits above the vertical tabs, so a reader meets the whole body of work before
 * choosing a part of it. Three jobs, in reading order:
 *
 *   1. what was found      eight checkable numbers, and how far back the record goes
 *   2. who it is for       five readers, each a route into the concepts tagged for them
 *   3. what it is made of  the seven subjects, as a way in
 *
 * Every count is derived from CONCEPTS at render, never typed in, so the hero
 * cannot drift from the section beneath it.
 */

const THEME_ORDER: Theme[] = [
  "record", "procurement", "surveillance", "neurotech", "coercion", "health", "experience",
];
const AUDIENCE_ORDER: Audience[] = [
  "household", "investigators", "policy", "clinicians", "press",
];

/** What each reader should look at FIRST, named so the route is concrete. */
const AUDIENCE_LEAD: Record<Audience, { id: string; label: string }> = {
  household:     { id: "what-it-would-take",        label: "What would it actually take to do this without consent?" },
  investigators: { id: "what-children-are-subject-to", label: "What are children subject to?" },
  policy:        { id: "law-for-neural-data",       label: "Why did legislatures write laws for neural data?" },
  clinicians:    { id: "what-produces-the-feeling", label: "If nobody's house is haunted, what produces the feeling?" },
  press:         { id: "why-isnt-this-in-the-news", label: "Why isn't any of this in the news?" },
};

export default function ResearchHero({
  onExplore,
}: {
  /** Switch to the Concepts vertical with these filters applied. */
  onExplore: (patch: Partial<Filters>) => void;
}) {
  const themeRows = useMemo(() => THEME_ORDER.map((t) => ({
    key: t, label: THEME_LABEL[t], note: THEME_NOTE[t],
    n: CONCEPTS.filter((c) => c.theme === t).length,
  })), []);

  const audienceRows = useMemo(() => AUDIENCE_ORDER.map((a) => ({
    key: a, n: CONCEPTS.filter((c) => c.audience.includes(a)).length,
  })), []);

  return (
    <div className="mb-14">
      <p className="body-copy text-foreground/85 measure mb-12">{RESEARCH_INTRO}</p>

      {/* ------------------------------------------------------ what was found */}
      <section className="mb-14">
        <h2 className="font-display font-semibold text-foreground text-[26px] md:text-[30px] leading-tight mb-4">
          What this research found
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
                <button type="button"
                  onClick={() => { track("hero_finding_opened", { id: f.id }); onExplore({}); location.hash = f.id; }}
                  className="text-accent underline underline-offset-4 whitespace-nowrap">Read it</button>
              </span>
            </li>
          ))}
        </ul>

        <h3 className="font-display font-semibold text-foreground text-[19px] mb-3">
          How far back the record goes
        </h3>
        <EvidenceSpan />
      </section>

      {/* --------------------------------------------------------- who it is for */}
      <section className="mb-14">
        <h2 className="font-display font-semibold text-foreground text-[26px] md:text-[30px] leading-tight mb-4">
          Who this is for
        </h2>
        <p className="body-copy text-foreground/85 measure mb-8">
          The same finding is useful to different people for different reasons. Pick a reader and
          the concepts tagged for them open below.
        </p>
        <ul className="list-none p-0 m-0 grid gap-x-10 gap-y-0 md:grid-cols-2">
          {audienceRows.map((a) => {
            const lead = AUDIENCE_LEAD[a.key];
            return (
              <li key={a.key} className="py-5 border-t border-edge">
                <p className="text-[13px] uppercase tracking-[0.08em] font-semibold text-foreground m-0 mb-1">
                  {AUDIENCE_LABEL[a.key]}{" "}
                  <span className="text-muted tabular-nums font-normal">&middot; {a.n}</span>
                </p>
                <p className="body-copy text-foreground/75 measure m-0 mb-3">{AUDIENCE_NOTE[a.key]}</p>
                <button type="button"
                  onClick={() => { track("hero_audience_picked", { audience: a.key }); onExplore({ audience: a.key }); }}
                  className="text-[16px] text-accent underline underline-offset-4 text-left">
                  Start with: {lead.label}
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {/* ------------------------------------------------------ what it is made of */}
      <section>
        <h2 className="font-display font-semibold text-foreground text-[26px] md:text-[30px] leading-tight mb-4">
          What it is made of
        </h2>
        <p className="body-copy text-foreground/85 measure mb-8">
          {CONCEPTS.length} concepts across seven subjects, drawn from the four records in this
          section. Pick a subject to open it.
        </p>
        <BarRows rows={themeRows} total={CONCEPTS.length}
          onPick={(k) => { track("hero_theme_picked", { theme: k }); onExplore({ theme: k as Theme }); }}
          caption="Concepts by subject. Hover a row for what it covers" />
      </section>
    </div>
  );
}
