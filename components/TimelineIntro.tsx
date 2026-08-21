"use client";

import { useEffect, useState } from "react";
import { track } from "@/lib/analytics";

/**
 * Plain-language framing for the Data section's landing view (Sean, 2026-08-20).
 *
 * Replaces the provenance string ("Prompts 1-6 · research date … · 399
 * deployments …") that used to be the first thing a reader met — written for
 * someone auditing the dataset, not someone arriving. Approach B ("three things
 * to notice") with C's closing question, chosen by Sean.
 *
 * Every item earns a link: the point of the landing view is to send readers into
 * the other two sub-tabs, so `onGo` switches sub-tab rather than navigating.
 */

type Counts = { deployments: number; regulations: number; sources: number; jurisdictions: number };
type HealthCounts = { indicators: number; sources: number; tierA: number; milestones: number };

export function TimelineNarrative({ onGo }: { onGo: (tab: "govcloud" | "health") => void }) {
  const go = (tab: "govcloud" | "health", from: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    track("timeline_crosslink", { to: tab, from });
    onGo(tab);
  };
  const linkCls = "text-accent underline underline-offset-4";

  return (
    <section className="mt-14 mb-4 measure">
      <h2 className="font-display font-semibold text-foreground text-[21px] mb-5">
        Three things this timeline shows
      </h2>

      {/* Scope, per track (Sean, 2026-08-21): the timeline is deliberately
          mixed-scope, so a blanket "US only" label would be wrong — say what
          each lane actually covers. */}
      <p className="text-muted text-[14px] measure mb-6">
        <strong className="text-foreground/80">Scope:</strong> the Legislation, Release,
        Deploy/enforcement, Litigation and Investment tracks are international &mdash; the
        procurement record spans jurisdictions. The Health track mixes United States and
        global milestones. The Crime track is United States only, except where a marker is
        explicitly labelled global.
      </p>

      <ol className="list-none p-0 m-0 space-y-6">
        <li>
          <p className="body-copy text-foreground/90 m-0">
            <strong>1. The infrastructure came first, the rules came after.</strong> Deployments
            cluster years ahead of the legislation that governs them. Of 99 regulations recorded
            here, not one specifies what a person can do if they are affected by one of these
            systems.{" "}
            <a href="#govcloud" onClick={go("govcloud", "item1")} className={linkCls}>
              See the Government Cloud record
            </a>
          </p>
        </li>
        <li>
          <p className="body-copy text-foreground/90 m-0">
            <strong>2. Health is the biggest citizen-facing use — and the least measured.</strong>{" "}
            Health is the largest service domain after general public administration: 32 systems
            across 12 countries. The record tracks how mature each one is. It has no field at all
            for what happened to anyone.{" "}
            <a href="#health" onClick={go("health", "item2")} className={linkCls}>
              See Public Health
            </a>
          </p>
        </li>
        <li>
          <p className="body-copy text-foreground/90 m-0">
            <strong>3. The two records don&rsquo;t explain each other.</strong> The health thread and
            the procurement threads both move across the same 25 years. Sitting near each other in
            time is not evidence of a relationship, and this site does not treat it as one.
          </p>
        </li>
        <li>
          <p className="body-copy text-foreground/90 m-0">
            <strong>And one question worth carrying:</strong> where is the record thin? Gaps here are
            often gaps in publishing rather than gaps in activity — and in several countries the
            health numbers are known undercounts.{" "}
            <a href="#health" onClick={go("health", "item4")} className={linkCls}>
              How much the numbers can be trusted
            </a>
          </p>
        </li>
      </ol>

      <p className="text-muted text-[15px] mt-6 mb-0">
        Reading the chart: each dot is a dated event, hollow dots are projected, and the dotted line
        marks today.
      </p>
    </section>
  );
}

/** "Where to go next" — one card per sibling sub-tab, metrics live from the JSON. */
export function TimelineHub({ onGo }: { onGo: (tab: "govcloud" | "health") => void }) {
  const [gc, setGc] = useState<Counts | null>(null);
  const [h, setH] = useState<HealthCounts | null>(null);

  useEffect(() => {
    let alive = true;
    Promise.all([
      fetch("/data/manifest.json").then((r) => r.json()).catch(() => null),
      fetch("/data/tables/geographies.json").then((r) => r.json()).catch(() => []),
      fetch("/data/health/tables/health_sources.json").then((r) => r.json()).catch(() => []),
      fetch("/data/health/tables/health_indicators.json").then((r) => r.json()).catch(() => []),
      fetch("/data/health/tables/health_milestones.json").then((r) => r.json()).catch(() => []),
    ]).then(([man, geos, hs, hi, hm]) => {
      if (!alive) return;
      const t = man?.tables || {};
      setGc({
        deployments: t.deployments ?? 399,
        regulations: t.regulations ?? 99,
        sources: t.sources ?? 660,
        jurisdictions: Array.isArray(geos) ? geos.length : 34,
      });
      setH({
        indicators: Array.isArray(hi) ? hi.length : 0,
        sources: Array.isArray(hs) ? hs.length : 0,
        tierA: Array.isArray(hs) ? hs.filter((s: any) => s.evidence_tier === "A").length : 0,
        milestones: Array.isArray(hm) ? hm.length : 0,
      });
    });
    return () => { alive = false; };
  }, []);

  const Card = ({
    id, title, metrics, children, tab,
  }: {
    id: string; title: string; metrics: string; children: React.ReactNode; tab: "govcloud" | "health";
  }) => (
    <div id={id} className="border border-edge rounded-xl p-6 scroll-mt-28">
      <h3 className="font-display font-semibold text-foreground text-[19px] mb-1">{title}</h3>
      <p className="text-muted text-[14px] m-0 mb-3 tabular-nums">{metrics}</p>
      <p className="body-copy text-foreground/85 m-0 mb-5">{children}</p>
      <button
        onClick={() => { track("timeline_hub_open", { tab }); onGo(tab); }}
        className="font-display font-semibold text-[15px] text-foreground border-b-2 border-foreground pb-0.5 hover:text-accent hover:border-accent transition-colors"
      >
        Open {title} →
      </button>
    </div>
  );

  return (
    <section className="mt-16">
      <h2 className="font-display font-semibold text-foreground text-[21px] mb-6">Where to go next</h2>
      <div className="grid gap-5 md:grid-cols-2">
        <Card
          id="govcloud"
          tab="govcloud"
          title="Government Cloud"
          metrics={gc ? `${gc.deployments} deployments · ${gc.regulations} regulations · ${gc.jurisdictions} jurisdictions · ${gc.sources} sources` : " "}
        >
          The public record of governments moving citizen services onto commercial cloud platforms:
          who bought what, where it runs, which rules apply, and where it has been challenged in
          court.
        </Card>
        <Card
          id="health"
          tab="health"
          title="Public Health"
          metrics={h ? `${h.indicators} indicators · ${h.milestones} dated milestones · ${h.sources} sources · ${h.tierA} graded Tier A` : " "}
        >
          Suicide, overdose, cancer and prescribing — what the official statistics show, what they
          miss, and the verdict on a widely repeated claim about a 30% rise in US suicide.
        </Card>
      </div>
    </section>
  );
}
