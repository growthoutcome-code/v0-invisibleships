import type { Metadata } from "next";
import { notFound } from "next/navigation";
import GatedApp from "@/components/GatedApp";
import { DATA_SECTIONS, subFromSlug } from "@/lib/routes";

/**
 * /data/government-cloud, /data/public-health, /data/crime.
 *
 * Three bodies of work that had no address. They were reachable by clicking a
 * tab inside Research and by nothing else: not linkable, not refreshable, not
 * in the sitemap, invisible to search. Concepts had /concepts, and Concepts is
 * the one people shared — that is the whole argument.
 *
 * Prerendered from lib/routes.ts, which is also what the app writes to the
 * address bar and what the sitemap lists, so the three cannot disagree.
 */
export function generateStaticParams() {
  return DATA_SECTIONS.map((s) => ({ section: s.slug }));
}

export function generateMetadata({ params }: { params: { section: string } }): Metadata {
  const hit = DATA_SECTIONS.find((s) => s.slug === params.section);
  if (!hit) return {};
  return {
    // Each vertical gets its own title and description rather than inheriting
    // Research's. A search result for the crime data should say what it is.
    title: `${hit.label} — Invisible Ships`,
    description: hit.blurb,
    alternates: { canonical: `/data/${hit.slug}` },
    openGraph: { title: `${hit.label} — Invisible Ships`, description: hit.blurb },
  };
}

export default function Page({ params }: { params: { section: string } }) {
  const sub = subFromSlug(params.section);
  if (!sub) notFound();
  return <GatedApp initialTab="data" initialSub={sub} />;
}
