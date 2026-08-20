"use client";

import { useEffect, useMemo, useState } from "react";
import ListPager from "@/components/ListPager";
import { DataNoteLine } from "@/components/DataIntro";
import DisclaimerLink from "@/components/DisclaimerLink";
import { SkeletonChart } from "@/components/Skeleton";
import {
  useTable, useDoc, usePager, useNarrow, TierChip, SourceLink, SectionSkeleton,
  type SourceRec,
} from "@/components/DataPrimitives";
import { track } from "@/lib/analytics";

/**
 * Crime — the Data section's fourth sub-tab. United States only (Sean's scope).
 *
 * The section is built around a measurement problem rather than a number. US
 * crime is counted by three systems that disagree, and the question "is crime
 * rising?" has more than one defensible answer depending on which is cited. The
 * landing chart therefore shows TWO official homicide series side by side and
 * never reconciles them: the gap is the finding, not an error to be resolved.
 *
 * Same conventions as Public Health: tiered rows resolving to fetched sources,
 * causes attributed rather than asserted, and no claim that this dataset
 * corroborates the Government Cloud record or the journal.
 */

type Indicator = {
  indicator_id: string; geography: string; year: number; value: number;
  unit: string; tier: string; publisher?: string; source_id: string | null;
  workstream?: string; note?: string;
};
type DQ = {
  dq_id: string; geography: string; topic: string; issue: string;
  effect: string; tier: string; source_id: string | null;
};
type Trend = { topic: string; statement: string; tier: string; source_id: string | null };
type Caveat = { workstream: string; caveat: string; tier: string };
type Verdict = {
  claim: string; summary: string;
  key_figures: { figure: string; tier: string; source_id?: string | null }[];
};
type ChartSeries = {
  name: string; emphasis: boolean; basis_short: string; publisher: string;
  tier: string; points: { year: number; value: number }[]; caveats?: string[];
};
type Chart = {
  title: string; unit: string; note: string; publisher: string; tier: string;
  series: ChartSeries[];
  markers?: { year: number; label: string }[];
};

/* ---------------------------------------------------------------- chart --- */

/**
 * Two official series on one axis, deliberately unreconciled.
 *
 * Monochrome, so identity is carried by stroke weight and an end label rather
 * than colour: the emphasised series is heavy and solid, the second is lighter
 * and dashed. Ranges differ (FBI 1960-2025, CDC 1950-2023) and that is drawn
 * honestly — each line simply starts and stops where its data does.
 */
function TwoSeriesChart({ chart, onPick }: { chart: Chart; onPick: (s: ChartSeries) => void }) {
  const narrow = useNarrow();
  const [hoverYear, setHoverYear] = useState<number | null>(null);
  const [showMarkers, setShowMarkers] = useState(true);

  const all = chart.series.flatMap((s) => s.points);
  if (all.length < 2) return null;

  // 900-wide viewBox on a 390px screen is a 0.43x scale, so these are sized to
  // clear the 9px floor the test suite asserts (measured 10.4px at 390px).
  const fsTick = narrow ? 24 : 11;
  const fsLabel = narrow ? 24 : 12.5;
  const W = 900, H = 340;
  const padL = narrow ? 78 : 54;
  const padR = narrow ? 24 : 180;
  const padT = narrow ? 30 : 26;
  const padB = narrow ? 52 : 38;

  const years = all.map((p) => p.year);
  const vals = all.map((p) => p.value);
  const x0 = Math.min(...years), x1 = Math.max(...years);
  const v1 = Math.max(...vals) * 1.12;
  const X = (y: number) => padL + ((y - x0) / (x1 - x0)) * (W - padL - padR);
  const Y = (v: number) => padT + (1 - v / v1) * (H - padT - padB);

  const yTicks = Array.from({ length: 5 }, (_, i) => (v1 * i) / 4);
  const xStep = narrow ? 20 : 10;
  const xTicks: number[] = [];
  for (let y = Math.ceil(x0 / xStep) * xStep; y <= x1; y += xStep) xTicks.push(y);

  /** True when a series has any gap wider than one year between points. */
  const sparse = (s: ChartSeries) =>
    s.points.some((p, i) => i > 0 && p.year - s.points[i - 1].year > 1);

  const hovered = hoverYear === null ? null : chart.series.map((s) => ({
    s, p: s.points.find((p) => p.year === hoverYear),
  })).filter((h) => h.p);

  return (
    <figure className="m-0 mb-6">
      <figcaption className="font-display font-semibold text-foreground text-[19px] mb-1">
        {chart.title}
      </figcaption>
      <p className="text-muted text-[13px] m-0 mb-3">{chart.unit}</p>

      <svg
        viewBox={`0 0 ${W} ${H}`} width="100%" role="img"
        aria-label={`${chart.title}. ${chart.unit}.`}
        onMouseLeave={() => setHoverYear(null)}
        style={{ fontFamily: "inherit", overflow: "visible" }}
      >
        {yTicks.map((t, i) => (
          <g key={i}>
            <line x1={padL} y1={Y(t)} x2={W - padR} y2={Y(t)} stroke="rgb(var(--edge))" strokeWidth="1" />
            <text x={padL - 8} y={Y(t) + 4} fontSize={fsTick} fill="rgb(var(--muted))" textAnchor="end">
              {t.toFixed(0)}
            </text>
          </g>
        ))}
        {xTicks.map((y) => (
          <text key={y} x={X(y)} y={H - (narrow ? 22 : 12)} fontSize={fsTick} fill="rgb(var(--muted))" textAnchor="middle">
            {y}
          </text>
        ))}

        {/* Dated context markers — toggleable so the default view stays clean. */}
        {showMarkers && chart.markers?.map((m, mi) => {
          // Adjacent marker years (2020 and 2021) collide once rotated, so each
          // label steps down from the last when its neighbour is within 3 years.
          const prev = chart.markers![mi - 1];
          const step = prev && m.year - prev.year <= 3 ? 46 : 0;
          const ly = padT + 4 + step;
          return (
            <g key={m.year} opacity={0.55}>
              <line x1={X(m.year)} y1={padT} x2={X(m.year)} y2={H - padB}
                stroke="rgb(var(--muted))" strokeDasharray="2 4" strokeWidth="1" />
              {!narrow && (
                <text x={X(m.year) - 5} y={ly} fontSize="10.5" fill="rgb(var(--muted))"
                  textAnchor="end" transform={`rotate(-90 ${X(m.year) - 5} ${ly})`}>
                  {m.year}
                </text>
              )}
            </g>
          );
        })}

        {chart.series.map((s, i) => {
          const d = s.points
            .map((p, j) => `${j ? "L" : "M"}${X(p.year).toFixed(1)},${Y(p.value).toFixed(1)}`)
            .join(" ");
          const last = s.points[s.points.length - 1];
          return (
            <g key={i} onClick={() => onPick(s)} style={{ cursor: "pointer" }}>
              <path
                d={d} fill="none" stroke="rgb(var(--foreground))"
                strokeWidth={s.emphasis ? (narrow ? 3.5 : 2.4) : (narrow ? 2.4 : 1.5)}
                strokeDasharray={s.emphasis ? undefined : "5 4"}
                opacity={s.emphasis ? 1 : 0.75}
              />
              {/* fat invisible hit target so the line is clickable on touch */}
              <path d={d} fill="none" stroke="transparent" strokeWidth={narrow ? 26 : 16} />
              {/* A series sampled at intervals (the CDC run is decadal before 2003)
                  must show WHERE it was sampled: a smooth line across a ten-year
                  gap implies values that were never published. */}
              {sparse(s) && s.points.map((pt) => (
                <circle key={pt.year} cx={X(pt.year)} cy={Y(pt.value)} r={narrow ? 4 : 2.8}
                  fill="rgb(var(--background))" stroke="rgb(var(--foreground))"
                  strokeWidth={narrow ? 2 : 1.4} opacity={0.85} />
              ))}
              {!narrow && (
                <text
                  x={X(last.year) + 8} y={Y(last.value) + 4} fontSize={fsLabel}
                  fill="rgb(var(--foreground))" fontWeight={s.emphasis ? 700 : 500}
                  opacity={s.emphasis ? 1 : 0.8}
                >
                  {s.name.split("—")[0].trim()}
                </text>
              )}
            </g>
          );
        })}

        {/* hover columns */}
        {Array.from({ length: x1 - x0 + 1 }, (_, i) => x0 + i).map((y) => (
          <rect key={y} x={X(y) - (W - padL - padR) / (x1 - x0) / 2} y={padT}
            width={Math.max(3, (W - padL - padR) / (x1 - x0))} height={H - padT - padB}
            fill="transparent" onMouseEnter={() => setHoverYear(y)} />
        ))}
        {hoverYear !== null && hovered && hovered.length > 0 && (
          <g pointerEvents="none">
            <line x1={X(hoverYear)} y1={padT} x2={X(hoverYear)} y2={H - padB}
              stroke="rgb(var(--muted))" strokeDasharray="3 3" />
            {hovered.map((h, i) => (
              <circle key={i} cx={X(hoverYear)} cy={Y(h.p!.value)} r={narrow ? 6 : 4.5}
                fill="rgb(var(--background))" stroke="rgb(var(--foreground))" strokeWidth="2" />
            ))}
            <text x={Math.min(Math.max(X(hoverYear), padL + 70), W - padR - 20)} y={padT - 8}
              fontSize={fsLabel} fill="rgb(var(--foreground))" textAnchor="middle" fontWeight="600">
              {hoverYear}: {hovered.map((h) => h.p!.value.toFixed(1)).join(" / ")}
            </text>
          </g>
        )}
      </svg>

      <div className="flex flex-wrap items-center gap-4 mt-3">
        <button
          type="button"
          onClick={() => { setShowMarkers((v) => !v); track("crime_markers_toggled"); }}
          aria-pressed={showMarkers}
          className="text-[14px] text-muted hover:text-foreground underline underline-offset-4"
        >
          {showMarkers ? "Hide" : "Show"} dated markers
        </button>
        <span className="text-muted text-[14px]">Click either line for its method and sources.</span>
      </div>

      {/* On phones the end labels are dropped, so the key carries identity. */}
      {narrow && (
        <ul className="list-none p-0 mt-3 mb-0">
          {chart.series.map((s, i) => (
            <li key={i} className="text-[15px] text-foreground/85 py-1">
              <span className="font-semibold">{s.emphasis ? "———" : "– – –"}</span> {s.name}
            </li>
          ))}
        </ul>
      )}
    </figure>
  );
}

/* ----------------------------------------------------------------- view --- */

export default function CrimeSignals({ onGoTimeline }: { onGoTimeline?: () => void }) {
  const indicators = useTable<Indicator>("/data/crime/tables/crime_indicators.json");
  const dq = useTable<DQ>("/data/crime/tables/crime_data_quality.json");
  const trends = useTable<Trend>("/data/crime/tables/crime_trends.json");
  const caveats = useTable<Caveat>("/data/crime/tables/crime_caveats.json");
  const sources = useTable<SourceRec>("/data/crime/tables/crime_sources.json");
  const verdict = useDoc<Verdict>("/data/crime/tables/crime_verdict.json");
  const chart = useDoc<Chart>("/data/crime/charts/homicide_two_measures.json");

  const srcs = sources || [];
  const [picked, setPicked] = useState<ChartSeries | null>(null);

  // Escape closes the series modal. Caught by the test suite: without this the
  // dialog traps the reader, since the backdrop and the close button were the
  // only exits and neither is reachable from the keyboard.
  useEffect(() => {
    if (!picked) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setPicked(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [picked]);

  const trendsP = usePager(trends, 5);
  const dqP = usePager(dq, 5);
  const srcP = usePager(srcs, 25);

  const clearance = useMemo(
    () => (indicators || [])
      .filter((r) => r.indicator_id === "homicide_clearance_rate")
      .sort((a, b) => a.year - b.year),
    [indicators],
  );

  return (
    <div className="w-full">
      <DataNoteLine from="crime">
        United States only · AI-assisted research from public records · every figure
        evidence-graded and linked to the source it was read from ·
      </DataNoteLine>

      {/* ---- the chart, first ---- */}
      <section className="mb-12">
        {chart === null ? <SkeletonChart /> : (
          <>
            <TwoSeriesChart chart={chart} onPick={setPicked} />
            <p className="body-copy text-foreground/90 measure">{chart.note}</p>
          </>
        )}
      </section>

      {/* ---- verdict ---- */}
      {verdict === null ? <SectionSkeleton title="Is crime rising or falling?" /> : (
        <section className="mb-16">
          <h2 className="font-display font-semibold text-foreground text-[21px] mb-3">
            {verdict.claim}
          </h2>
          <p className="body-copy text-foreground/90 measure">{verdict.summary}</p>
          <ul className="list-none p-0 m-0 mt-4">
            {verdict.key_figures.map((f, i) => (
              <li key={i} className="flex items-baseline gap-3 py-2 border-b border-edge/60 text-[16px] text-foreground/85">
                <TierChip t={f.tier} />
                <span className="measure">{f.figure}</span>
                <span className="ml-auto"><SourceLink id={f.source_id} sources={srcs} /></span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ---- clearance ---- */}
      {!!clearance.length && (
        <section className="mb-16">
          <h2 className="font-display font-semibold text-foreground text-[21px] mb-2">
            How many homicides are cleared
          </h2>
          <p className="text-muted text-[15px] mb-6 measure">
            &ldquo;Cleared&rdquo; means closed by arrest or by exceptional means &mdash; which
            includes cases where the suspect died or could not be extradited. It is not a
            conviction rate, and it is not a solve rate, though it is reported as both.
            These are selected years: no continuous national annual series is published.
          </p>
          <ul className="list-none p-0 m-0">
            {clearance.map((r) => (
              <li key={r.year} className="flex items-baseline gap-3 py-3 border-b border-edge/60 text-[16px] text-foreground/85">
                <TierChip t={r.tier} />
                <span className="font-semibold text-foreground w-16 shrink-0">{r.year}</span>
                <span>{r.value}%</span>
                <span className="ml-auto"><SourceLink id={r.source_id} sources={srcs} /></span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ---- trends ---- */}
      {trends === null ? <SectionSkeleton title="What the series show" /> : !!trends.length && (
        <section ref={trendsP.ref} className="mb-16">
          <h2 className="font-display font-semibold text-foreground text-[21px] mb-2">What the series show</h2>
          <ul className="list-none p-0 m-0">
            {trendsP.slice.map((t, i) => (
              <li key={i} className="flex items-baseline gap-3 py-3 border-b border-edge/60 text-[16px] text-foreground/85">
                <TierChip t={t.tier} />
                <span className="measure">{t.statement}</span>
                <span className="ml-auto"><SourceLink id={t.source_id} sources={srcs} /></span>
              </li>
            ))}
          </ul>
          <ListPager page={trendsP.page} totalPages={trendsP.totalPages} setPage={trendsP.setPage} scrollTo={trendsP.scrollTo} />
        </section>
      )}

      {/* ---- data quality: the spine ---- */}
      {dq === null ? <SectionSkeleton title="How much the numbers can be trusted" /> : !!dq.length && (
        <section ref={dqP.ref} className="mb-16">
          <h2 className="font-display font-semibold text-foreground text-[21px] mb-2">
            How much the numbers can be trusted
          </h2>
          <p className="text-muted text-[15px] mb-6 measure">
            This register is the section, not a footnote to it. Where the counting is the
            problem, the counting is the finding.
          </p>
          <ul className="list-none p-0 m-0">
            {dqP.slice.map((d) => (
              <li key={d.dq_id} className="py-4 border-b border-edge/60">
                <div className="flex items-baseline gap-3">
                  <TierChip t={d.tier} />
                  <span className="text-foreground text-[16px] font-medium measure">{d.topic}</span>
                  <span className="ml-auto"><SourceLink id={d.source_id} sources={srcs} /></span>
                </div>
                <p className="body-copy text-foreground/85 measure mt-2 mb-0 text-[17px]">{d.issue}</p>
                <p className="text-muted text-[15px] measure mt-2 mb-0"><em>Effect:</em> {d.effect}</p>
              </li>
            ))}
          </ul>
          <ListPager page={dqP.page} totalPages={dqP.totalPages} setPage={dqP.setPage} scrollTo={dqP.scrollTo} />
        </section>
      )}

      {/* ---- caveats ---- */}
      {!!caveats?.length && (
        <section className="mb-16">
          <h2 className="font-display font-semibold text-foreground text-[21px] mb-2">
            Read before quoting any figure
          </h2>
          <ul className="list-none p-0 m-0">
            {caveats.map((c, i) => (
              <li key={i} className="flex items-baseline gap-3 py-3 border-b border-edge/60 text-[16px] text-foreground/85">
                <TierChip t={c.tier} />
                <span className="measure">{c.caveat}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ---- cross-link, not an overlay ---- */}
      {onGoTimeline && (
        <section className="mb-16">
          <button
            type="button"
            onClick={() => { onGoTimeline(); track("crime_to_timeline"); }}
            className="body-copy text-foreground underline underline-offset-4 hover:text-accent text-left measure"
          >
            See how this period sits against the procurement and legislation record &rarr;
          </button>
          <p className="text-muted text-[14px] measure mt-2">
            Shown side by side on one clock, never overlaid. Two things happening in the
            same year is a co-occurrence, and this record cannot establish more than that.
          </p>
        </section>
      )}

      {/* ---- sources ---- */}
      {!!srcs.length && (
        <section ref={srcP.ref} className="mb-16">
          <h2 className="font-display font-semibold text-foreground text-[21px] mb-2">Sources</h2>
          <p className="text-muted text-[15px] mb-6 measure">
            {srcs.filter((s) => s.evidence_tier === "A").length} Tier A ·{" "}
            {srcs.filter((s) => s.evidence_tier === "B").length} Tier B ·{" "}
            {srcs.filter((s) => s.evidence_tier === "C").length} Tier C. Every figure above
            resolves to one of these. See the{" "}
            <DisclaimerLink from="crime">full disclaimer</DisclaimerLink> for how this
            research was gathered.
          </p>
          <ul className="list-none p-0 m-0">
            {srcP.slice.map((s) => (
              <li key={s.source_id} className="flex items-baseline gap-3 py-3 border-b border-edge/60 text-[15px]">
                <TierChip t={s.evidence_tier} />
                <a href={s.url} target="_blank" rel="noreferrer noopener"
                  className="text-foreground/85 underline underline-offset-4 hover:text-accent measure">
                  {s.title || s.url}
                </a>
                <span className="ml-auto text-muted text-[13px] shrink-0">{s.publisher}</span>
              </li>
            ))}
          </ul>
          <ListPager page={srcP.page} totalPages={srcP.totalPages} setPage={srcP.setPage} scrollTo={srcP.scrollTo} />
        </section>
      )}

      {/* ---- per-series detail ---- */}
      {picked && (
        <div
          role="dialog" aria-modal="true" aria-label={picked.name}
          className="fixed inset-0 z-50 bg-background/85 overflow-y-auto p-4 sm:p-10"
          onClick={() => setPicked(null)}
        >
          <div
            className="max-w-[720px] mx-auto bg-background border border-edge p-6 sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4">
              <h3 className="font-display font-semibold text-foreground text-[22px] m-0">{picked.name}</h3>
              <button type="button" onClick={() => setPicked(null)}
                className="ml-auto text-muted hover:text-foreground text-[22px] leading-none" aria-label="Close">
                ×
              </button>
            </div>
            <p className="text-muted text-[15px] mt-3 mb-0">
              <strong className="text-foreground/80">Basis:</strong> {picked.basis_short} ·{" "}
              <strong className="text-foreground/80">Publisher:</strong> {picked.publisher} ·{" "}
              <TierChip t={picked.tier} />
            </p>
            {!!picked.caveats?.length && (
              <ul className="list-disc pl-5 mt-4 text-[15px] text-foreground/85">
                {picked.caveats.map((c, i) => <li key={i} className="mb-1">{c}</li>)}
              </ul>
            )}
            <h4 className="font-display font-semibold text-foreground text-[16px] mt-6 mb-2">
              Year by year ({picked.points[0].year}&ndash;{picked.points[picked.points.length - 1].year})
            </h4>
            <div className="max-h-[42vh] overflow-y-auto scroll-thin border-t border-edge">
              <table className="w-full text-[15px]">
                <tbody>
                  {picked.points.slice().reverse().map((p) => (
                    <tr key={p.year} className="border-b border-edge/50">
                      <td className="py-1.5 text-muted w-24">{p.year}</td>
                      <td className="py-1.5 text-foreground/90">{p.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
