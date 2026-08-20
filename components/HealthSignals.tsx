"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ListPager from "@/components/ListPager";
import { DataNoteLine } from "@/components/DataIntro";
import DisclaimerLink from "@/components/DisclaimerLink";
import { Skeleton, SkeletonRows, SkeletonChart } from "@/components/Skeleton";
import { Input } from "@/components/ui/input";
import { track } from "@/lib/analytics";

/**
 * Public Health Signals — the Data section's second sub-tab.
 *
 * A separate dataset from the Government Cloud research, kept visibly separate on
 * purpose: neither corpus corroborates the other, and the standing note says so.
 * Conventions match the rest of the section — every fact row resolves to a tiered
 * source, Tier C renders distinct, causes are reported as attributed, and the
 * healthcare↔govcloud register is structural/pattern observation only.
 *
 * Charts are single-series monochrome SVG lines (site tokens, 2px strokes, hover
 * targets larger than the marks, provisional points hollow). The full indicator
 * table sits directly below each chart, so a table view always exists.
 */

type Indicator = {
  indicator_id: string; geography: string; year: number; value: number;
  unit: string; tier: string; publisher: string; source_id: string | null;
  note?: string; provisional?: boolean;
};
type Milestone = {
  milestone_id: string; category: string; occurred_on: string; title: string;
  description: string; tier: string; source_id: string | null; geo?: string;
};
type Claim = {
  claim_id: string; topic: string; cause_attributed: string; attributed_by: string;
  document: string; doc_date: string; supporting_line?: string; tier: string;
  contested_by?: string | null; source_id: string | null;
};
type DQ = {
  dq_id: string; issue: string; geography: string; documented_by: string;
  document: string; quantification: string; tier: string; source_id: string | null;
};
type Overlap = {
  overlap_id: string; health_signal: string; govcloud_fact: string;
  overlap_type: string; basis: string; observation: string;
  non_causal_note: string; tier: string;
};
type Trend = { topic: string; statement: string; tier: string; source_id: string | null };
type Source = {
  source_id: string; url: string; publisher?: string; title?: string;
  evidence_tier?: string; accessed?: string; archived_url?: string | null;
};
type IntlChart = {
  title: string; unit: string; note: string; publisher: string; tier: string;
  source_url: string;
  series: { country: string; emphasis: boolean; kind?: string; change_pct: number; points: { year: number; value: number }[] }[];
};
type Verdict = {
  claim: string; mapping: string; recent_spike: boolean; summary: string;
  key_figures: { figure: string; tier: string; source_id?: string | null }[];
};

function useTable<T>(name: string): T[] | null {
  const [rows, setRows] = useState<T[] | null>(null);
  useEffect(() => {
    let alive = true;
    fetch(`/data/health/tables/${name}.json`)
      .then((r) => r.json())
      .then((d: T[]) => { if (alive) setRows(d); })
      .catch(() => { if (alive) setRows([]); });
    return () => { alive = false; };
  }, [name]);
  return rows;
}

function TierChip({ t }: { t?: string }) {
  return (
    <span
      className={`shrink-0 text-[12px] uppercase tracking-wide border border-edge rounded-full px-2 py-[1px] ${
        t === "C" ? "border-dashed text-muted" : "text-foreground/70"
      }`}
      title={t === "A" ? "Documented" : t === "B" ? "Corroborated" : "Claimed"}
    >
      {t}
    </span>
  );
}

function SourceLink({ id, sources }: { id?: string | null; sources: Source[] }) {
  const s = id ? sources.find((x) => x.source_id === id) : undefined;
  if (!s) return null;
  return (
    <a
      href={s.url}
      target="_blank"
      rel="noreferrer noopener"
      onClick={() => track("health_source_opened", { id: s.source_id })}
      className="text-foreground/70 underline underline-offset-4 hover:text-accent text-[14px]"
    >
      source
    </a>
  );
}

/** Loading placeholder for a register section (heading + rows). */
function SectionSkeleton({ title }: { title: string }) {
  return (
    <section className="mb-16" aria-busy="true">
      <h2 className="font-display font-semibold text-foreground text-[21px] mb-2">{title}</h2>
      <SkeletonRows n={5} />
    </section>
  );
}

/** Journal-style pagination state for a register list. */
function usePager<T>(items: T[] | null | undefined, size: number) {
  const [page, setPage] = useState(1);
  const ref = useRef<HTMLElement | null>(null);
  const list = items || [];
  const totalPages = Math.max(1, Math.ceil(list.length / size));
  const safePage = Math.min(page, totalPages);
  return {
    page: safePage, setPage, totalPages,
    slice: list.slice((safePage - 1) * size, safePage * size),
    ref,
    scrollTo: () => ref.current?.scrollIntoView({ block: "start" }),
  };
}

/* ---------------------------------------------------------------- chart --- */

function LineChart({
  title, points, unit, yFmt,
}: {
  title: string;
  points: { year: number; value: number; provisional?: boolean; label?: string }[];
  unit: string;
  yFmt?: (v: number) => string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  if (points.length < 2) return null;
  const W = 720, H = 260, padL = 56, padR = 24, padT = 18, padB = 34;
  const xs = points.map((p) => p.year);
  const vs = points.map((p) => p.value);
  const x0 = Math.min(...xs), x1 = Math.max(...xs);
  const vMax = Math.max(...vs), vMin = Math.min(...vs);
  const v0 = vMin - (vMax - vMin) * 0.15, v1 = vMax + (vMax - vMin) * 0.1;
  const X = (y: number) => padL + ((y - x0) / (x1 - x0)) * (W - padL - padR);
  const Y = (v: number) => padT + (1 - (v - v0) / (v1 - v0)) * (H - padT - padB);
  const fmt = yFmt || ((v: number) => String(v));
  const path = points.map((p, i) => `${i ? "L" : "M"}${X(p.year).toFixed(1)},${Y(p.value).toFixed(1)}`).join(" ");
  const ticks = 4;
  const yTicks = Array.from({ length: ticks + 1 }, (_, i) => v0 + ((v1 - v0) * i) / ticks);
  // Anchor x ticks on the most recent year and step backwards, so the latest
  // year is always labelled (the recent end is what readers check first).
  const xStep = Math.max(1, Math.ceil((x1 - x0) / 8));
  const xTicks: number[] = [];
  for (let y = x1; y >= x0; y -= xStep) xTicks.push(y);
  const h = hover !== null ? points[hover] : null;
  // Endpoint label: below the point when the series is falling into it,
  // above when rising — keeps the label out of the data path.
  const last = points[points.length - 1];
  const prev = points[points.length - 2];
  const labelBelow = prev && last.value < prev.value;

  return (
    <figure className="m-0 mb-12">
      <figcaption className="font-display font-semibold text-foreground text-[17px] mb-1">{title}</figcaption>
      <p className="text-muted text-[13px] m-0 mb-2">{unit}. Hollow points are provisional or preliminary.</p>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        role="img"
        aria-label={title}
        onMouseLeave={() => setHover(null)}
        style={{ fontFamily: "inherit" }}
      >
        {yTicks.map((t, i) => (
          <g key={i}>
            <line x1={padL} y1={Y(t)} x2={W - padR} y2={Y(t)} stroke="rgb(var(--edge))" strokeWidth="1" />
            <text x={padL - 8} y={Y(t) + 4} fontSize="11" fill="rgb(var(--muted))" textAnchor="end">{fmt(t)}</text>
          </g>
        ))}
        {xTicks.map((y) => (
          <text key={y} x={X(y)} y={H - 10} fontSize="11" fill="rgb(var(--muted))" textAnchor="middle">{y}</text>
        ))}
        <path d={path} fill="none" stroke="rgb(var(--foreground))" strokeWidth="2" />
        {points.map((p, i) => (
          <g key={i}>
            <circle
              cx={X(p.year)} cy={Y(p.value)} r={hover === i ? 5.5 : 3.5}
              fill={p.provisional ? "rgb(var(--background))" : "rgb(var(--foreground))"}
              stroke="rgb(var(--foreground))" strokeWidth="1.5"
            />
            {/* hit target larger than the mark */}
            <circle
              cx={X(p.year)} cy={Y(p.value)} r={12} fill="transparent"
              onMouseEnter={() => setHover(i)}
              style={{ cursor: "pointer" }}
            />
          </g>
        ))}
        {h && (
          <g pointerEvents="none">
            <line x1={X(h.year)} y1={padT} x2={X(h.year)} y2={H - padB} stroke="rgb(var(--muted))" strokeDasharray="3 3" />
            <text
              x={Math.min(Math.max(X(h.year), padL + 60), W - padR - 60)} y={padT - 4}
              fontSize="12" fill="rgb(var(--foreground))" textAnchor="middle" fontWeight="600"
            >
              {h.year}: {fmt(h.value)}{h.provisional ? " (provisional)" : ""}
            </text>
          </g>
        )}
        {/* selective direct label on the last point, kept out of the data path */}
        <text
          x={X(last.year) - 8}
          y={Y(last.value) + (labelBelow ? 20 : -12)}
          fontSize="12" fill="rgb(var(--foreground))" textAnchor="end" fontWeight="600"
        >
          {fmt(last.value)}
        </text>
      </svg>
    </figure>
  );
}

/**
 * Multi-series line chart. The site is monochrome, so colour cannot carry
 * identity: every line is labelled at its right end (labels de-collide by
 * pushing apart to a minimum spacing), one series is emphasised with a heavier
 * solid stroke, and the rest are recessive. The full table below the charts is
 * the table view.
 */
/** True on phone-width screens, where twelve end-labels cannot render legibly. */
function useNarrow() {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 700px)");
    const on = () => setNarrow(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return narrow;
}

function MultiLineChart({ chart }: { chart: IntlChart }) {
  const [hoverYear, setHoverYear] = useState<number | null>(null);
  const narrow = useNarrow();
  // Two views of the same twelve series. "rate" answers "how high?"; "change"
  // answers "by how much?" — which is the question the ~30% claim is actually
  // about, and which a levels chart cannot show (Sean, 2026-08-20).
  const [mode, setMode] = useState<"rate" | "change">("rate");
  const indexed = mode === "change";
  // Window: the full two-decade record, or the pandemic era. Comparable
  // international estimates stop at 2021 — see the note under the chart.
  const [win, setWin] = useState<"full" | "covid">("full");
  const winFrom = win === "covid" ? 2017 : 0;
  const W = 760, H = 440, padL = 44, padT = 18, padB = 34;
  // On a phone the SVG scales to ~47%, which would render 11.5px labels at ~5px.
  // Label only the US and the world there, at a size that survives the scale;
  // every country's numbers are in the ranked table directly below.
  const padR = narrow ? 96 : 128;
  const view = chart.series.map((s) => ({ ...s, points: s.points.filter((p) => p.year >= winFrom) }));
  const base = new Map(view.map((s) => [s.country, s.points[0]?.value ?? 1]));
  const val = (s: { country: string }, v: number) =>
    indexed ? (v / (base.get(s.country) || 1)) * 100 : v;
  const all = view.flatMap((s) => s.points.map((p) => ({ ...p, value: val(s, p.value) })));
  if (!all.length) return null;
  const x0 = Math.min(...all.map((p) => p.year)), x1 = Math.max(...all.map((p) => p.year));
  const vMax = Math.max(...all.map((p) => p.value));
  const v0 = 0, v1 = vMax * 1.08;
  const winChange = (c: string) => {
    const ser = view.find((x) => x.country === c);
    if (!ser || ser.points.length < 2) return 0;
    const a = ser.points[0].value, b = ser.points[ser.points.length - 1].value;
    return ((b - a) / a) * 100;
  };
  const fmtEnd = (s: { country: string }, v: number) => {
    if (!indexed) return v.toFixed(1);
    const c = winChange(s.country);
    return `${c > 0 ? "+" : ""}${c.toFixed(0)}%`;
  };
  const X = (y: number) => padL + ((y - x0) / (x1 - x0)) * (W - padL - padR);
  const Y = (v: number) => padT + (1 - (v - v0) / (v1 - v0)) * (H - padT - padB);

  // End labels: sort by value and enforce a minimum vertical gap so eight
  // countries remain readable where their 2021 values sit close together.
  const MIN_GAP = 14;
  const ends = view
    .map((s) => {
      const raw = s.points[s.points.length - 1];
      return { s, last: { year: raw.year, value: val(s, raw.value), raw: raw.value } };
    })
    .sort((a, b) => a.last.value - b.last.value);
  // Walk top-to-bottom (highest value first) and push each label down only as
  // far as it must go to clear the one above it. Seeded at -Infinity so the
  // first label keeps its true position.
  let prevY = -Infinity;
  const placed = ends
    .slice()
    .reverse()
    .map((e) => {
      const y = Math.max(Y(e.last.value), prevY + MIN_GAP);
      prevY = y;
      return { ...e, labelY: y };
    });

  const yTicks = (indexed ? [0, 50, 100, 150, 200] : [0, 10, 20, 30, 40, 50]).filter((t) => t <= v1);
  const xTicks = (win === "covid" ? [2017, 2018, 2019, 2020, 2021] : [2000, 2005, 2010, 2015, 2021]).filter((y) => y >= x0 && y <= x1);

  return (
    <figure className="m-0 mb-6">
      <figcaption className="mb-1">
        <span className="block font-display font-semibold text-foreground text-[19px]">
          {win === "covid"
            ? (indexed
                ? "Suicide rates through the pandemic: change from 2017 to 2021"
                : "Suicide rate through the pandemic, 2017–2021")
            : (indexed
                ? "Suicide rates, 2000–2021: the US rose 40% while the world fell 27%"
                : "Suicide rate, 2000–2021: the US against ten countries and the world")}
        </span>
        <span className="block text-foreground/75 text-[15px] mt-1">
          {indexed
            ? `Each line starts at its own ${win === "covid" ? 2017 : 2000} suicide rate. Above the middle line means more suicide deaths per person than then; below means fewer.`
            : "Suicide deaths per 100,000 people per year — for the US, 15.6 per 100,000 is roughly 52,000 deaths in a year. Rates are adjusted so countries with older or younger populations can be compared."}
        </span>
      </figcaption>
      <p className="text-muted text-[13px] m-0 mb-3">
        Bold line = United States · dashed line = world average ·{" "}
        {narrow ? "every country's figures are in the table below" : "hover any year to read all twelve"}.
      </p>
      <div className="flex flex-wrap gap-x-6 gap-y-2 mb-3">
      <div role="group" aria-label="Chart period" className="flex gap-1">
        {([["full", "2000–2021"], ["covid", "2017–2021 (pandemic)"]] as const).map(([w, label]) => (
          <button key={w} type="button" onClick={() => { setWin(w); track("health_chart_window", { win: w }); }}
            aria-pressed={win === w}
            className={`text-[13px] px-3 py-1 border transition-colors ${
              win === w ? "border-foreground text-foreground font-semibold" : "border-edge text-muted hover:text-foreground"
            }`}>
            {label}
          </button>
        ))}
      </div>
      <div role="group" aria-label="Chart view" className="flex gap-1">
        {([["rate", "Rate per 100,000"], ["change", "Change over period"]] as const).map(([m, label]) => (
          <button key={m} type="button" onClick={() => { setMode(m); track("health_chart_mode", { mode: m }); }}
            aria-pressed={mode === m}
            className={`text-[13px] px-3 py-1 border transition-colors ${
              mode === m ? "border-foreground text-foreground font-semibold" : "border-edge text-muted hover:text-foreground"
            }`}>
            {label}
          </button>
        ))}
      </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={chart.title}
        onMouseLeave={() => setHoverYear(null)} style={{ fontFamily: "inherit" }}>
        {yTicks.map((t) => (
          <g key={t}>
            <line x1={padL} y1={Y(t)} x2={W - padR} y2={Y(t)} stroke="rgb(var(--edge))" strokeWidth="1" />
            <text x={padL - 8} y={Y(t) + 4} fontSize={narrow ? 18 : 11} fill="rgb(var(--muted))" textAnchor="end">
              {indexed ? (t === 100 ? "same" : `${t > 100 ? "+" : "−"}${Math.abs(t - 100)}%`) : t}
            </text>
          </g>
        ))}
        {xTicks.map((y) => (
          <text key={y} x={X(y)} y={H - 8} fontSize={narrow ? 18 : 11} fill="rgb(var(--muted))" textAnchor="middle">{y}</text>
        ))}
        {x1 >= 2020 && x0 <= 2020 && (
          <>
            <rect x={X(2020)} y={padT} width={Math.max(0, X(x1) - X(2020))} height={H - padT - padB}
              fill="rgb(var(--foreground))" opacity="0.05" />
            <line x1={X(2020)} y1={padT} x2={X(2020)} y2={H - padB}
              stroke="rgb(var(--muted))" strokeWidth="1" />
            <text x={X(2020) + 5} y={padT + (narrow ? 16 : 11)} fontSize={narrow ? 16 : 10.5} fill="rgb(var(--muted))">
              COVID-19
            </text>
          </>
        )}
        {indexed && (
          <>
            <line x1={padL} y1={Y(100)} x2={W - padR} y2={Y(100)}
              stroke="rgb(var(--foreground))" strokeWidth="1" opacity="0.45" />
            <text x={padL + 4} y={Y(100) - 5} fontSize={narrow ? 16 : 10.5} fill="rgb(var(--muted))">
              same as {x0}
            </text>
          </>
        )}
        {hoverYear !== null && (
          <line x1={X(hoverYear)} y1={padT} x2={X(hoverYear)} y2={H - padB}
            stroke="rgb(var(--muted))" strokeDasharray="3 3" pointerEvents="none" />
        )}
        {view.map((s) => (
          <path key={s.country}
            d={s.points.map((p, i) => `${i ? "L" : "M"}${X(p.year).toFixed(1)},${Y(val(s, p.value)).toFixed(1)}`).join(" ")}
            fill="none"
            stroke={s.emphasis ? "rgb(var(--foreground))" : "rgb(var(--muted))"}
            strokeWidth={s.emphasis ? 3 : s.kind === "world" ? 1.5 : 1.1}
            strokeDasharray={s.kind === "world" ? "5 4" : undefined}
            opacity={s.emphasis ? 1 : s.kind === "world" ? 0.9 : 0.6} />
        ))}
        {placed
          .filter(({ s }) => !narrow || s.emphasis || s.kind === "world")
          .map(({ s, last, labelY }) => (
          <g key={s.country}>
            <line x1={X(last.year)} y1={Y(last.value)} x2={W - padR + 6} y2={labelY}
              stroke="rgb(var(--edge))" strokeWidth="1" />
            <text x={W - padR + 10} y={labelY + 4} fontSize={narrow ? 22 : s.emphasis ? 13 : 11.5}
              fill={s.emphasis ? "rgb(var(--foreground))" : "rgb(var(--muted))"}
              fontWeight={s.emphasis || s.kind === "world" ? 700 : 400}>
              {s.country}{" "}
              {hoverYear === null
                ? fmtEnd(s, last.value)
                : (() => {
                    const p = s.points.find((q) => q.year === hoverYear);
                    if (!p) return "—";
                    return indexed
                      ? `${p.value >= (base.get(s.country) || 0) ? "+" : ""}${(((p.value / (base.get(s.country) || 1)) - 1) * 100).toFixed(0)}%`
                      : p.value.toFixed(1);
                  })()}
            </text>
          </g>
        ))}
        {/* Hover columns: one hit target per year, so every line reads at once. */}
        {Array.from({ length: x1 - x0 + 1 }, (_, i) => x0 + i).map((y) => (
          <rect key={y} x={X(y) - (W - padL - padR) / (x1 - x0) / 2} y={padT}
            width={(W - padL - padR) / (x1 - x0)} height={H - padT - padB}
            fill="transparent" onMouseEnter={() => setHoverYear(y)} />
        ))}
        {hoverYear !== null && (
          <text x={X(hoverYear)} y={padT - 2} fontSize={narrow ? 18 : 12} fontWeight="600"
            fill="rgb(var(--foreground))" textAnchor="middle" pointerEvents="none">
            {hoverYear}{narrow ? "" : indexed ? " — change since start" : " — deaths per 100,000"}
          </text>
        )}
      </svg>
    </figure>
  );
}

/* ------------------------------------------------------------ component --- */

export default function HealthSignals() {
  const indicators = useTable<Indicator>("health_indicators");
  const milestones = useTable<Milestone>("health_milestones");
  const claims = useTable<Claim>("health_claims");
  const dq = useTable<DQ>("health_data_quality");
  const overlaps = useTable<Overlap>("health_overlaps");
  const trends = useTable<Trend>("health_trends");
  const sources = useTable<Source>("health_sources");
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [intl, setIntl] = useState<IntlChart | null>(null);
  const [q, setQ] = useState("");
  const [srcPage, setSrcPage] = useState(1);
  const srcRef = useRef<HTMLElement | null>(null);
  const SRC_PAGE_SIZE = 25;

  useEffect(() => {
    track("health_signals_viewed");
    let alive = true;
    fetch("/data/health/tables/health_verdict.json")
      .then((r) => r.json())
      .then((d: Verdict) => { if (alive) setVerdict(d); })
      .catch(() => {});
    fetch("/data/health/charts/suicide_international.json")
      .then((r) => r.json())
      .then((d: IntlChart) => { if (alive) setIntl(d); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  const srcs = sources || [];

  const suicideSeries = useMemo(() => {
    return (indicators || [])
      .filter((r) => r.indicator_id === "suicide_rate_asr" && r.geography === "US")
      .sort((a, b) => a.year - b.year)
      .map((r) => ({ year: r.year, value: r.value, provisional: !!r.provisional }));
  }, [indicators]);

  const overdoseSeries = useMemo(() => {
    return (indicators || [])
      .filter((r) => (r.indicator_id === "drug_overdose_deaths" || r.indicator_id === "drug_overdose_deaths_provisional") && r.geography === "US")
      .sort((a, b) => a.year - b.year)
      .map((r) => ({ year: r.year, value: r.value, provisional: r.indicator_id.endsWith("provisional") || !!r.provisional }));
  }, [indicators]);

  const filteredIndicators = useMemo(() => {
    const all = indicators || [];
    const s = q.trim().toLowerCase();
    const f = s
      ? all.filter((r) =>
          r.indicator_id.toLowerCase().includes(s) ||
          r.geography.toLowerCase().includes(s) ||
          (r.publisher || "").toLowerCase().includes(s) ||
          String(r.year).includes(s))
      : all;
    return [...f].sort((a, b) =>
      a.indicator_id.localeCompare(b.indicator_id) ||
      a.geography.localeCompare(b.geography) || a.year - b.year);
  }, [indicators, q]);

  const sortedSources = useMemo(
    () => [...srcs].sort((a, b) => (a.publisher || "").localeCompare(b.publisher || "")),
    [srcs],
  );
  const srcTotalPages = Math.max(1, Math.ceil(sortedSources.length / SRC_PAGE_SIZE));
  const srcPageItems = useMemo(
    () => sortedSources.slice((srcPage - 1) * SRC_PAGE_SIZE, srcPage * SRC_PAGE_SIZE),
    [sortedSources, srcPage],
  );

  const trendsP = usePager(trends, 5);
  const dqP = usePager(dq, 5);
  const claimsP = usePager(claims, 5);
  const overlapsP = usePager(overlaps, 5);
  const milestonesP = usePager(milestones, 5);

  const tierCounts = useMemo(() => {
    const c: Record<string, number> = { A: 0, B: 0, C: 0 };
    srcs.forEach((s) => { c[s.evidence_tier || "C"] = (c[s.evidence_tier || "C"] || 0) + 1; });
    return c;
  }, [srcs]);

  return (
    <div className="w-full">
      {/* Secondary disclaimer: one line + link. The crisis-resources sentence is
          SAFETY information, not disclaimer language, and stays visible. */}
      <DataNoteLine from="health">
        Official statistics, independently re-checked · causes shown only as attributed by their
        source · under-reporting documented rather than hidden ·
      </DataNoteLine>
      <p className="text-muted text-[15px] max-w-[80ch] -mt-6 mb-10">
        This page reports suicide and overdose statistics — rates and counts only. If you or someone
        you know needs support: in the US, call or text{" "}
        <a href="https://988lifeline.org" target="_blank" rel="noreferrer noopener" className="underline underline-offset-4">988</a>;
        elsewhere, <a href="https://findahelpline.com" target="_blank" rel="noreferrer noopener" className="underline underline-offset-4">findahelpline.com</a>.
      </p>

      {/* Stat tiles + tier legend */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
        {([
          [indicators?.length ?? null, "indicator rows"],
          [milestones?.length ?? null, "timeline milestones"],
          [claims && dq && overlaps ? claims.length + dq.length + overlaps.length : null, "register rows"],
          [sources ? sources.length : null, "sources"],
        ] as [number | null, string][]).map(([n, l]) => (
          <div key={l} className="border border-edge rounded-xl px-4 py-3">
            {n === null
              ? <Skeleton className="h-[34px] w-14 my-[3px]" />
              : <div className="font-display font-semibold text-[28px] text-foreground">{n}</div>}
            <div className="text-muted text-[13px]">{l}</div>
          </div>
        ))}
      </div>
      <p className="text-muted text-[14px] mb-12">
        Evidence tiers: <strong className="text-foreground/80">A documented</strong> ({tierCounts.A}) ·{" "}
        <strong className="text-foreground/80">B corroborated</strong> ({tierCounts.B}) ·{" "}
        <strong className="text-foreground/80">C claimed</strong> ({tierCounts.C}). Tier C renders dashed.
      </p>

      {/* ONE suicide chart, top of page, US in focus (Sean, 2026-08-20). */}
      <section className="mb-14">
        {intl === null ? <SkeletonChart /> : <MultiLineChart chart={intl} />}
        {intl && (
          <>
            <h3 className="font-display font-semibold text-foreground text-[17px] mb-2 mt-2">
              What the chart shows
            </h3>
            <p className="body-copy text-foreground/90 max-w-[80ch] mb-4">
              Twelve lines, one way of counting. Over these two decades the world&rsquo;s suicide
              rate fell 27%, and most countries fell with it. The United States went the other way:
              up 40%, in a steady climb with no reversal. Only three other lines rise at all — and
              South Korea, the steepest, peaked around 2011 and has fallen since. Switch the chart
              to <strong>Change since 2000</strong> to read every country against its own starting
              point.
            </p>

            {/* Every country's change, ranked — the chart shows levels, so the
                figure behind the claim needs to be legible as a number too. */}
            <div className="max-w-[80ch] mb-4 border border-edge rounded-xl overflow-hidden">
              <table className="w-full text-[15px]">
                <caption className="sr-only">Change in suicide rate by country, 2000 to 2021</caption>
                <thead>
                  <tr className="text-left text-muted text-[13px] uppercase tracking-wide">
                    <th className="py-2 px-4 font-medium">Country</th>
                    <th className="py-2 px-4 font-medium text-right">2000</th>
                    <th className="py-2 px-4 font-medium text-right">2021</th>
                    <th className="py-2 px-4 font-medium text-right">Change</th>
                  </tr>
                </thead>
                <tbody>
                  {[...intl.series]
                    .sort((a, b) => b.change_pct - a.change_pct)
                    .map((s) => (
                      <tr key={s.country}
                        className={`border-t border-edge/60 ${s.emphasis ? "font-semibold text-foreground bg-panel" : "text-foreground/85"}`}>
                        <td className="py-2 px-4">{s.country}</td>
                        <td className="py-2 px-4 text-right tabular-nums">{s.points[0].value.toFixed(1)}</td>
                        <td className="py-2 px-4 text-right tabular-nums">{s.points[s.points.length - 1].value.toFixed(1)}</td>
                        <td className="py-2 px-4 text-right tabular-nums">
                          {s.change_pct > 0 ? "+" : ""}{s.change_pct.toFixed(0)}%
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            <p className="body-copy text-foreground/90 max-w-[80ch] mb-3">
              <strong>Why this chart stops at 2021.</strong> That is where the comparable
              international estimates end — WHO has not yet published figures on this basis for 2022
              onward, so no country-against-country view can reach the present. The pandemic window
              above shows what is available: rates were broadly flat or falling into 2020, the first
              pandemic year. For the United States alone, national figures do continue — 14.2 in
              2022 (the highest rate since 1941), 14.1 in 2023, and 13.7 in 2024 — and those are
              listed with their sources directly below.
            </p>
            <p className="body-copy text-foreground/90 max-w-[80ch] mb-3">
              <strong>Why 40% here and &ldquo;~30%&rdquo; below?</strong> Both are the United States
              and both are correct — they count from different years and adjust for age differently.
              This chart runs 2000–2021 on WHO&rsquo;s world standard population. The ~30% figure
              comes from the CDC&rsquo;s own vital statistics on the US 2000 standard population,
              measured 1999–2016. Compare like with like and the answer is the same either way: a
              rise of roughly a third or more, sustained across two decades.
            </p>
            <p className="body-copy text-foreground/90 max-w-[80ch] mb-3">
              What makes the US unusual here is less the direction than the shape — a rise that kept
              going while the global trend ran the other way. What the chart does <em>not</em> show
              is why. Explanations put forward by agencies and researchers — economic distress, the
              drug supply, firearm access, social isolation, gaps in treatment — are recorded
              separately, each with the name of whoever made it, because this site reports
              attributed causes rather than asserting its own.{" "}
              <a href="#causes" onClick={(e) => { e.preventDefault(); claimsP.scrollTo(); }}
                className="text-accent underline underline-offset-4">
                Causes, as attributed
              </a>
            </p>
            <p className="text-muted text-[15px] max-w-[80ch] mb-3">
              <strong className="text-foreground/80">None of this is privileged information.</strong>{" "}
              The figures are WHO estimates published through the World Bank&rsquo;s open API; they
              were gathered with AI assistance and checked against the source, and anyone with the
              same public tools can rebuild this chart and check it.{" "}
              <DisclaimerLink from="health_chart">How this research was gathered</DisclaimerLink>
            </p>
            <p className="text-muted text-[14px] max-w-[80ch]">
              {intl.note}{" "}
              <a href={intl.source_url} target="_blank" rel="noreferrer noopener"
                className="underline underline-offset-4 hover:text-foreground">
                {intl.publisher}
              </a>{" "}
              · Tier {intl.tier}
            </p>
          </>
        )}
      </section>

      {/* Verdict */}
      {!verdict && (
        <section className="mb-16" aria-busy="true">
          <h2 className="font-display font-semibold text-foreground text-[21px] mb-3">
            Has suicide increased by ~30%?
          </h2>
          <Skeleton className="h-4 w-full max-w-[80ch] mb-2" />
          <Skeleton className="h-4 w-5/6 max-w-[74ch] mb-6" />
          <SkeletonRows n={4} />
        </section>
      )}
      {verdict && (
        <section className="mb-16">
          <h2 className="font-display font-semibold text-foreground text-[21px] mb-3">
            Has suicide increased by ~30%?
          </h2>
          <p className="body-copy text-foreground/90 max-w-[80ch]">{verdict.summary}</p>
          <ul className="list-none p-0 m-0 mt-4">
            {verdict.key_figures.map((f, i) => (
              <li key={i} className="flex items-baseline gap-3 py-2 border-b border-edge/60 text-[16px] text-foreground/85">
                <TierChip t={f.tier} />
                <span>{f.figure}</span>
                <span className="ml-auto"><SourceLink id={f.source_id} sources={srcs} /></span>
              </li>
            ))}
          </ul>
        </section>
      )}



      {/* Overdose */}
      <section className="mb-16">
        <h2 className="font-display font-semibold text-foreground text-[21px] mb-6">
          The other curve: overdose deaths
        </h2>
        {indicators === null && <SkeletonChart />}
        {overdoseSeries.length > 1 && (
          <LineChart
            title="United States — drug overdose deaths, 2022–2025"
            points={overdoseSeries}
            unit="Deaths per year (CDC/NCHS; 2025 provisional)"
            yFmt={(v) => `${Math.round(v / 1000)}k`}
          />
        )}
        <p className="text-muted text-[14px] max-w-[80ch]">
          Overdose deaths fell 26.2% in 2024 — the largest one-year drop on record — and kept
          falling in 2025. Both directions are part of the record.
        </p>
      </section>

      {/* Trends */}
      {trends === null && <SectionSkeleton title="What the series show" />}
      {!!trends?.length && (
        <section ref={trendsP.ref} className="mb-16">
          <h2 className="font-display font-semibold text-foreground text-[21px] mb-2">What the series show</h2>
          <ul className="list-none p-0 m-0">
            {trendsP.slice.map((t, i) => (
              <li key={i} className="flex items-baseline gap-3 py-3 border-b border-edge/60 text-[16px] text-foreground/85">
                <TierChip t={t.tier} />
                <span className="max-w-[85ch]">{t.statement}</span>
                <span className="ml-auto"><SourceLink id={t.source_id} sources={srcs} /></span>
              </li>
            ))}
          </ul>
          <ListPager page={trendsP.page} totalPages={trendsP.totalPages} setPage={trendsP.setPage} scrollTo={trendsP.scrollTo} />
        </section>
      )}

      {/* Data quality register */}
      {dq === null && <SectionSkeleton title="How much the numbers can be trusted" />}
      {!!dq?.length && (
        <section ref={dqP.ref} className="mb-16">
          <h2 className="font-display font-semibold text-foreground text-[21px] mb-2">How much the numbers can be trusted</h2>
          <p className="text-muted text-[15px] mb-6 max-w-[80ch]">
            No country was excluded for having weak data — the weakness is the record.
          </p>
          <ul className="list-none p-0 m-0">
            {dqP.slice.map((d) => (
              <li key={d.dq_id} className="py-4 border-b border-edge/60">
                <div className="flex items-baseline gap-3">
                  <TierChip t={d.tier} />
                  <span className="text-foreground text-[16px] font-medium">{d.geography}</span>
                  <span className="text-foreground/85 text-[16px] max-w-[75ch]">{d.issue}</span>
                  <span className="ml-auto"><SourceLink id={d.source_id} sources={srcs} /></span>
                </div>
                <p className="text-muted text-[14px] mt-2 mb-0 max-w-[85ch]">{d.quantification} — {d.documented_by}, {d.document}</p>
              </li>
            ))}
          </ul>
          <ListPager page={dqP.page} totalPages={dqP.totalPages} setPage={dqP.setPage} scrollTo={dqP.scrollTo} />
        </section>
      )}

      {/* Claims register */}
      {claims === null && <SectionSkeleton title="Causes, as attributed" />}
      {!!claims?.length && (
        <section ref={claimsP.ref} id="causes" className="mb-16 scroll-mt-28">
          <h2 className="font-display font-semibold text-foreground text-[21px] mb-2">Causes, as attributed</h2>
          <p className="text-muted text-[15px] mb-6 max-w-[80ch]">
            Who attributes what, in which document. Counter-attributions listed on the same terms.
          </p>
          <ul className="list-none p-0 m-0">
            {claimsP.slice.map((c) => (
              <li key={c.claim_id} className="py-4 border-b border-edge/60">
                <div className="flex items-baseline gap-3">
                  <TierChip t={c.tier} />
                  <span className="text-foreground/85 text-[16px] max-w-[80ch]">{c.cause_attributed}</span>
                  <span className="ml-auto"><SourceLink id={c.source_id} sources={srcs} /></span>
                </div>
                <p className="text-muted text-[14px] mt-2 mb-0 max-w-[85ch]">
                  — {c.attributed_by}, <em>{c.document}</em>{c.doc_date ? ` (${c.doc_date})` : ""}
                  {c.contested_by ? ` · contested by ${c.contested_by}` : ""}
                </p>
              </li>
            ))}
          </ul>
          <ListPager page={claimsP.page} totalPages={claimsP.totalPages} setPage={claimsP.setPage} scrollTo={claimsP.scrollTo} />
        </section>
      )}

      {/* Overlaps */}
      {overlaps === null && <SectionSkeleton title="Overlaps with the Government Cloud record" />}
      {!!overlaps?.length && (
        <section ref={overlapsP.ref} className="mb-16">
          <h2 className="font-display font-semibold text-foreground text-[21px] mb-2">Overlaps with the Government Cloud record</h2>
          <p className="text-muted text-[15px] mb-6 max-w-[80ch]">
            Co-occurrence in time or place is not evidence of a relationship. Each row says what it
            does <em>not</em> show.
          </p>
          <ul className="list-none p-0 m-0">
            {overlapsP.slice.map((o) => (
              <li key={o.overlap_id} className="py-4 border-b border-edge/60">
                <div className="flex items-baseline gap-3">
                  <TierChip t={o.tier} />
                  <span className="text-[12px] uppercase tracking-wide text-muted shrink-0">{o.basis}</span>
                  <span className="text-foreground/85 text-[16px] max-w-[80ch]">{o.observation}</span>
                </div>
                <p className="text-muted text-[14px] mt-2 mb-0 max-w-[85ch]">Does not show: {o.non_causal_note}</p>
              </li>
            ))}
          </ul>
          <ListPager page={overlapsP.page} totalPages={overlapsP.totalPages} setPage={overlapsP.setPage} scrollTo={overlapsP.scrollTo} />
        </section>
      )}

      {/* Milestones */}
      {milestones === null && <SectionSkeleton title="Dated milestones" />}
      {!!milestones?.length && (
        <section ref={milestonesP.ref} className="mb-16">
          <h2 className="font-display font-semibold text-foreground text-[21px] mb-2">Dated milestones</h2>
          <p className="body-copy text-foreground/75 mb-6 max-w-[80ch]">
            These feed track F (&ldquo;Health&rdquo;) on the Government Cloud master
            timeline; entries before 2015 appear only here.
          </p>
          <ul className="list-none p-0 m-0">
            {milestonesP.slice.map((m) => (
              <li key={m.milestone_id} className="flex items-baseline gap-4 py-3 border-b border-edge/60 text-[16px]">
                <span className="text-muted tabular-nums shrink-0 w-[92px]">{m.occurred_on}</span>
                <TierChip t={m.tier} />
                <span className="text-[12px] uppercase tracking-wide text-muted shrink-0 w-[86px]">{m.category}</span>
                <span className="text-foreground/85">{m.title}</span>
                <span className="ml-auto"><SourceLink id={m.source_id} sources={srcs} /></span>
              </li>
            ))}
          </ul>
          <ListPager page={milestonesP.page} totalPages={milestonesP.totalPages} setPage={milestonesP.setPage} scrollTo={milestonesP.scrollTo} />
        </section>
      )}

      {/* Indicator table */}
      <section className="mb-16">
        <h2 className="font-display font-semibold text-foreground text-[21px] mb-2">All indicators</h2>
        <p className="body-copy text-foreground/75 mb-6 max-w-[80ch]">
          {indicators?.length ?? 0} rows across the United States, OECD peers, and the
          unrestricted international set (Global, China, Russia, India). Provisional
          and preliminary values are marked.
        </p>
        <Input
          value={q}
          onChange={(e: any) => setQ(e.target.value)}
          placeholder="Filter by indicator, geography, year or publisher"
          aria-label="Filter indicators"
          className="mb-6 max-w-[420px]"
        />
        {indicators === null && <SkeletonRows n={8} />}
        <div className="overflow-x-auto">
          <table className="w-full text-[14px]">
            <thead>
              <tr className="text-left text-muted">
                <th className="py-2 pr-4 font-medium">Indicator</th>
                <th className="py-2 pr-4 font-medium">Geography</th>
                <th className="py-2 pr-4 font-medium">Year</th>
                <th className="py-2 pr-4 font-medium text-right">Value</th>
                <th className="py-2 pr-4 font-medium">Unit</th>
                <th className="py-2 pr-4 font-medium">Tier</th>
                <th className="py-2 font-medium">Source</th>
              </tr>
            </thead>
            <tbody>
              {filteredIndicators.map((r, i) => (
                <tr key={i} className="border-t border-edge/60 text-foreground/85">
                  <td className="py-2 pr-4">{r.indicator_id}</td>
                  <td className="py-2 pr-4">{r.geography}</td>
                  <td className="py-2 pr-4 tabular-nums">{r.year}{r.provisional ? "*" : ""}</td>
                  <td className="py-2 pr-4 tabular-nums text-right">{r.value.toLocaleString()}</td>
                  <td className="py-2 pr-4 text-muted">{r.unit}</td>
                  <td className="py-2 pr-4"><TierChip t={r.tier} /></td>
                  <td className="py-2"><SourceLink id={r.source_id} sources={srcs} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!filteredIndicators.length && <p className="body-copy text-muted">No rows match that filter.</p>}
        <p className="text-muted text-[13px] mt-3">* provisional or preliminary, subject to revision.</p>
      </section>

      {/* Sources */}
      <section ref={srcRef} className="mb-8">
        <h2 className="font-display font-semibold text-foreground text-[21px] mb-2">Sources</h2>
        <p className="body-copy text-foreground/75 mb-8 max-w-[70ch]">
          {srcs.length} sources ({tierCounts.A} A · {tierCounts.B} B · {tierCounts.C} C), accessed
          2026-08-19.
          {srcTotalPages > 1 && <span className="text-muted"> Page {srcPage} of {srcTotalPages}.</span>}
        </p>
        {sources === null && <SkeletonRows n={8} />}
        <ol className="list-none p-0 m-0">
          {srcPageItems.map((s) => (
            <li key={s.source_id} className="flex flex-wrap items-baseline gap-x-5 gap-y-1 py-3">
              <a
                href={s.url}
                target="_blank"
                rel="noreferrer noopener"
                onClick={() => track("health_source_opened", { id: s.source_id })}
                className="text-foreground underline underline-offset-4 hover:text-accent text-[16px]"
              >
                {s.title || s.url}
              </a>
              <span className="text-muted text-[14px]">{s.publisher}</span>
              <span className="text-muted text-[13px] uppercase tracking-wide ml-auto">Tier {s.evidence_tier}</span>
            </li>
          ))}
        </ol>
        <ListPager
          page={srcPage}
          totalPages={srcTotalPages}
          setPage={setSrcPage}
          scrollTo={() => srcRef.current?.scrollIntoView({ block: "start" })}
        />
      </section>
    </div>
  );
}
