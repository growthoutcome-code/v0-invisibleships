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

/** The verticals that live under /data. `concepts` is deliberately absent: it
 *  has its own top-level entry at /concepts and reads as a section, not a
 *  sub-view of Research. */
export const DATA_SECTIONS: { slug: string; sub: SubTab; label: string; blurb: string }[] = [
  {
    slug: "government-cloud",
    sub: "govcloud",
    label: "Government Cloud",
    blurb:
      "Government cloud procurement: what was bought, from whom, at what cost, and when it renews. Every fact evidence-graded and linked to its source.",
  },
  {
    slug: "public-health",
    sub: "health",
    label: "Public Health",
    blurb:
      "Public-health indicators from statistical agencies, with each chart stating its evidence tier and what it cannot show.",
  },
  {
    slug: "crime",
    sub: "crime",
    label: "Crime",
    blurb:
      "The crime record: arrests, incarceration, burglary and administrative detention, drawn from published statistical sources.",
  },
];

/** Slug -> vertical. Used by app/data/[section] to answer a direct hit. */
export function subFromSlug(slug: string): SubTab | null {
  return DATA_SECTIONS.find((s) => s.slug === slug)?.sub ?? null;
}

/** Vertical -> path. The Timeline is the Research landing view and keeps /data
 *  itself, so it needs no slug of its own. */
export function pathForSub(sub: SubTab): string {
  if (sub === "concepts") return "/concepts";
  const hit = DATA_SECTIONS.find((s) => s.sub === sub);
  return hit ? `/data/${hit.slug}` : "/data";
}
