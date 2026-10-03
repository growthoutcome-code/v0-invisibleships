import { CONCEPTS } from "@/lib/concepts";
import type { MetadataRoute } from "next";
import { allJournalParams, allGlossaryParams } from "@/lib/server-corpus";
import { RESEARCH_SECTIONS, RESEARCH_VIEWS } from "@/lib/routes";
import { readFileSync } from "node:fs";
import path from "node:path";

/**
 * Sitemap covering every addressable page.
 *
 * Built from the same corpus helpers the item routes use for
 * generateStaticParams, so the sitemap cannot drift out of step with what is
 * actually prerendered — add an entry to the corpus and it appears here.
 *
 * Priorities reflect what the site is for: the journal feed and the research are
 * the destinations; author and disclaimer are supporting pages.
 */

const BASE = "https://www.invisibleships.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const sections: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${BASE}/journal`, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${BASE}/concepts`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    // The four Research sections, each its own page under /research (30 Sep
    // 2026). The old /data addresses redirect here and are not listed.
    ...RESEARCH_SECTIONS.map((sec, i) => ({
      url: `${BASE}/research/${sec.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: i === 0 ? 0.9 : 0.85,
    })),
    // Each section's other views (its first view is the section address above).
    ...RESEARCH_SECTIONS.flatMap((sec) => (RESEARCH_VIEWS[sec.sub] ?? []).slice(1).map((v) => ({
      url: `${BASE}/research/${sec.slug}/${v.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }))),
    { url: `${BASE}/news`, lastModified: now, changeFrequency: "weekly", priority: 0.85 },
    { url: `${BASE}/glossary`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/documents`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/author`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: `${BASE}/disclaimer`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    // Added when the age gate was replaced by a dismissible warning: the safety
    // note and the crisis line it carries are now a page, and a safety page
    // nobody can find is not a safety note.
    { url: `${BASE}/safety`, lastModified: now, changeFrequency: "yearly", priority: 0.5 },
    { url: `${BASE}/why`, lastModified: now, changeFrequency: "yearly", priority: 0.5 },
    { url: `${BASE}/contribute`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
  ];

  const journal: MetadataRoute.Sitemap = allJournalParams().map(({ id }) => ({
    url: `${BASE}/journal/${id}`,
    lastModified: now,
    changeFrequency: "yearly",
    priority: 0.8,
  }));

  const glossary: MetadataRoute.Sitemap = allGlossaryParams().map(({ slug }) => ({
    url: `${BASE}/glossary/${slug}`,
    lastModified: now,
    changeFrequency: "yearly",
    priority: 0.5,
  }));

  // One page per concept since 30 Sep 2026 (the list became tiles).
  const concepts: MetadataRoute.Sitemap = CONCEPTS.map((c) => ({
    url: `${BASE}/concepts/${c.id}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  // Every News item's share address, from the same index the page reads.
  const newsIndex = JSON.parse(readFileSync(path.join(process.cwd(), "public/data/news/index.json"), "utf-8")) as { slug: string }[];
  const news: MetadataRoute.Sitemap = newsIndex.map(({ slug }) => ({
    url: `${BASE}/news/${slug}`,
    lastModified: now,
    changeFrequency: "yearly",
    priority: 0.5,
  }));

  return [...sections, ...journal, ...glossary, ...concepts, ...news];
}
