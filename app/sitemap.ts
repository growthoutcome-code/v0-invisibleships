import type { MetadataRoute } from "next";
import { allJournalParams, allGlossaryParams } from "@/lib/server-corpus";

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
    // Two URLs, one section. /data is the Research landing; /concepts opens the
    // same section on its Concepts vertical. Both were indexed before the merge
    // and both still resolve, so neither is dropped from the sitemap — removing
    // /concepts would strand 35 anchors that have been shared.
    { url: `${BASE}/data`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/concepts`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
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

  return [...sections, ...journal, ...glossary];
}
