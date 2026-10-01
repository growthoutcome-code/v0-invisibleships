import type { Metadata } from "next";
import { notFound } from "next/navigation";
import GatedApp from "@/components/GatedApp";
import { RESEARCH_SECTIONS, RESEARCH_VIEWS, subFromSlug } from "@/lib/routes";

/**
 * /research/<section>/<view>, e.g. /research/crime/homicide (Sean, 30 Sep 2026).
 * Each Research section shows one view at a time; every view has an address so a
 * link opens on it and a refresh keeps the reader's place. The first view is also
 * served at /research/<section> itself (../page.tsx). Built from lib/routes.ts.
 */
export function generateStaticParams() {
  return RESEARCH_SECTIONS.flatMap((s) =>
    (RESEARCH_VIEWS[s.sub] ?? []).slice(1).map((v) => ({ section: s.slug, view: v.slug })),
  );
}

export function generateMetadata({ params }: { params: { section: string; view: string } }): Metadata {
  const sec = RESEARCH_SECTIONS.find((s) => s.slug === params.section);
  const view = sec && (RESEARCH_VIEWS[sec.sub] ?? []).find((v) => v.slug === params.view);
  if (!sec || !view) return {};
  return {
    title: `${view.label} — ${sec.title} — Invisible Ships`,
    description: sec.blurb,
    alternates: { canonical: `/research/${sec.slug}/${view.slug}` },
    openGraph: { title: `${view.label} — Invisible Ships`, description: sec.blurb },
  };
}

export default function Page({ params }: { params: { section: string; view: string } }) {
  const sub = subFromSlug(params.section);
  const view = sub ? (RESEARCH_VIEWS[sub] ?? []).find((v) => v.slug === params.view) : null;
  if (!sub || !view) notFound();
  return <GatedApp initialTab="data" initialSub={sub} initialView={view.id} />;
}
