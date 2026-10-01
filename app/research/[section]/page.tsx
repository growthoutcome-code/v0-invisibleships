import type { Metadata } from "next";
import { notFound } from "next/navigation";
import GatedApp from "@/components/GatedApp";
import { RESEARCH_SECTIONS, subFromSlug } from "@/lib/routes";

/**
 * /research/timeline, /research/government-cloud, /research/public-health,
 * /research/crime (Sean, 30 Sep 2026).
 *
 * Each Research section is a page of its own: a sub-item of Research in the main
 * menu, its own H1, its own sidebar. The pre-30-Sep addresses (/data and
 * /data/<slug>) redirect here in next.config.mjs.
 *
 * Prerendered from lib/routes.ts, which is also what the app writes to the
 * address bar, what the menu and footer list and what the sitemap carries, so
 * none of them can disagree.
 */
export function generateStaticParams() {
  return RESEARCH_SECTIONS.map((s) => ({ section: s.slug }));
}

export function generateMetadata({ params }: { params: { section: string } }): Metadata {
  const hit = RESEARCH_SECTIONS.find((s) => s.slug === params.section);
  if (!hit) return {};
  return {
    title: `${hit.title} — Research — Invisible Ships`,
    description: hit.blurb,
    alternates: { canonical: `/research/${hit.slug}` },
    openGraph: { title: `${hit.title} — Invisible Ships`, description: hit.blurb },
  };
}

export default function Page({ params }: { params: { section: string } }) {
  const sub = subFromSlug(params.section);
  if (!sub) notFound();
  return <GatedApp initialTab="data" initialSub={sub} />;
}
