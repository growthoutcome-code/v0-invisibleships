/**
 * The address of every section and vertical, in one place.
 *
 * Research has five verticals and until now four of them shared a single URL.
 * /data showed the Timeline, and Government Cloud, Public Health and Crime —
 * three substantial bodies of work, each with its own charts and its own
 * sources — were reachable only by clicking, never by linking. A reader could
 * not send anyone the crime section. Refreshing dropped them back on Timeline.
 * None of it was in the sitemap, so none of it could be found by search either.
 *
 * Concepts already had /concepts and that is exactly why it was the one people
 * shared. The lesson generalises: a view without an address does not exist to
 * anyone outside the session looking at it.
 *
 * This module is the single owner of that mapping. The URL the app writes while
 * you click, the routes that answer when you refresh, and the sitemap all read
 * from here, so a fifth vertical cannot be added with an address in one place
 * and not the others — the failure this project has hit six times.
 */
import type { SubTab } from "@/components/DataView";

/**
 * The Research sections, under /research/<slug> (Sean, 30 Sep 2026: "addresses
 * under /research/"). Each is a page of its own: a sub-item of Research in the main
 * menu, its own H1 (`title`) under a small "Research" label, and its own sidebar.
 * The old /data addresses redirect here (next.config.mjs). `concepts` is
 * deliberately absent: it has its own top-level entry at /concepts.
 *
 * Order = menu order and the order of the section row under the heading.
 */
export const RESEARCH_SECTIONS: { slug: string; sub: SubTab; label: string; title: string; blurb: string }[] = [
  {
    slug: "timeline",
    sub: "timeline",
    label: "Timeline",
    title: "The record over time",
    blurb:
      "Legislation, deployments, litigation, investment, health and crime on one timeline, with what the research found.",
  },
  {
    slug: "government-cloud",
    sub: "govcloud",
    label: "Government Cloud",
    title: "The government cloud record",
    blurb:
      "Government cloud procurement: what was bought, from whom, at what cost, and when it renews. Every fact evidence-graded and linked to its source.",
  },
  {
    slug: "public-health",
    sub: "health",
    label: "Public Health",
    title: "The public health record",
    blurb:
      "Public-health indicators from statistical agencies, with each chart stating its evidence tier and what it cannot show.",
  },
  {
    slug: "crime",
    sub: "crime",
    label: "Crime",
    title: "The crime record",
    blurb:
      "The crime record: arrests, incarceration, burglary and administrative detention, drawn from published statistical sources.",
  },
];

/**
 * Each section's views, shown one at a time and picked from the sidebar (Sean,
 * 30 Sep 2026: "mirror the Government Cloud section's separate pages instead of
 * long scrolling pages"). Grouped so every view opens on a chart where the
 * section has one. Each view has an address: /research/<section>/<view>; the
 * first view is also the section's own address. `id` is what the page code uses.
 */
export type ResearchView = { slug: string; id: string; label: string };
export const RESEARCH_VIEWS: Record<string, ResearchView[]> = {
  timeline: [
    { slug: "master-timeline", id: "master", label: "The master timeline" },
    { slug: "law-and-capability", id: "law", label: "Does law follow capability?" },
    { slug: "findings", id: "findings", label: "What the research found" },
    { slug: "about", id: "about", label: "About this research" },
  ],
  govcloud: [
    { slug: "adoption-map", id: "adopt", label: "Adoption map" },
    { slug: "procurement", id: "proc", label: "Procurement" },
    { slug: "investment", id: "invest", label: "Investment" },
    { slug: "litigation", id: "lit", label: "Litigation" },
    { slug: "capabilities", id: "cap", label: "Capabilities" },
    { slug: "research-behind-it", id: "briefs", label: "The research behind this section" },
    { slug: "sources", id: "sources", label: "Sources" },
  ],
  health: [
    { slug: "suicide", id: "suicide", label: "Suicide around the world" },
    { slug: "overdose", id: "overdose", label: "Overdose deaths" },
    { slug: "reading-the-evidence", id: "evidence", label: "Reading the evidence" },
    { slug: "milestones", id: "milestones", label: "Dated milestones" },
    { slug: "indicators-and-sources", id: "indicators", label: "Indicators and sources" },
  ],
  crime: [
    { slug: "what-the-record-counts", id: "counts", label: "What the record counts" },
    { slug: "homicide", id: "homicide", label: "Homicide" },
    { slug: "break-ins", id: "breakins", label: "Break-ins" },
    { slug: "arrests", id: "arrests", label: "Arrests" },
    { slug: "who-is-held", id: "held", label: "Who is held" },
    { slug: "reports-of-the-unexplained", id: "unexplained", label: "Reports of the unexplained" },
    { slug: "method-limits-and-sources", id: "method", label: "Method, limits and sources" },
  ],
};

/** A section's views (empty for concepts). */
export const viewsFor = (sub: SubTab): ResearchView[] => RESEARCH_VIEWS[sub] ?? [];

/** The view id an address names, or the section's first view. */
export function viewFromSlug(sub: SubTab, slug?: string | null): string {
  const vs = viewsFor(sub);
  return vs.find((v) => v.slug === slug)?.id ?? vs[0]?.id ?? "";
}

/** The sections that had a /data/<slug> address before 30 Sep 2026 (redirected). */
export const LEGACY_DATA_SLUGS = ["government-cloud", "public-health", "crime"];

/** Slug -> section. Used by app/research/[section] to answer a direct hit. */
export function subFromSlug(slug: string): SubTab | null {
  return RESEARCH_SECTIONS.find((s) => s.slug === slug)?.sub ?? null;
}

/** Section (and view) -> path. The first view is the section's own address. */
export function pathForSub(sub: SubTab, view?: string | null): string {
  if (sub === "concepts") return "/concepts";
  const hit = RESEARCH_SECTIONS.find((s) => s.sub === sub);
  const base = `/research/${hit ? hit.slug : "timeline"}`;
  const vs = viewsFor(sub);
  const v = vs.find((x) => x.id === view);
  return v && v !== vs[0] ? `${base}/${v.slug}` : base;
}

/** Section -> its H1. */
export function titleForSub(sub: SubTab): string {
  return RESEARCH_SECTIONS.find((s) => s.sub === sub)?.title ?? "Research";
}
