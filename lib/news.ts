/**
 * News: types, the agreed categories, and the read of the index.
 *
 * The index (public/data/news/index.json) is derived from one Markdown file per
 * item by scripts/build_news_index.py. This module only reads it. Categories and
 * their order are fixed here and in that script, which fails the build on any
 * value outside them (project/features/news.md, decision 0015).
 */

export type NewsItem = {
  slug: string;
  /** The item's Markdown file under /data/news/md/, which holds the summary. */
  file: string;
  title: string;
  /** YYYY-MM-DD, or "" when not yet confirmed. */
  date: string;
  /** "month" when the source gave only a month (the date reads as the 1st). */
  precision: string;
  publisher: string;
  sourceType: string;
  office: string;
  url: string;
  archivedUrl: string;
  industry: string[];
  event: string;
  country: string;
  stage: string;
  related: string[];
  hasSummary: boolean;
};

export const SOURCE_TYPES = ["Official", "News", "Trade press", "Research"] as const;

export const INDUSTRIES = [
  "Neurotechnology",
  "Nanotechnology",
  "Biotechnology & health",
  "Artificial intelligence",
  "Government cloud & surveillance technology",
] as const;

export const EVENTS = [
  "Espionage & foreign agents",
  "Technology theft & export control",
  "Transnational repression",
  "Murder for hire & violent plots",
  "Protests",
  "Global conflict",
  "Courts & litigation",
  "Regulation & law",
  "Contracts & deployments",
  "Research & breakthroughs",
  "Public health",
  "Reports & statistics",
] as const;

/**
 * The lines on the Over time chart. Twelve kinds of event are too many lines to
 * read, so they are drawn as six groups. The site is monochrome, so each line is
 * told apart by weight and dash, and labelled at its end.
 */
export const EVENT_GROUPS: { label: string; events: string[]; dash?: string; weight: number; opacity: number }[] = [
  { label: "Espionage & foreign agents", events: ["Espionage & foreign agents"], weight: 3, opacity: 1 },
  { label: "Technology theft & export control", events: ["Technology theft & export control"], dash: "7 4", weight: 2, opacity: 0.9 },
  { label: "Repression & violent plots", events: ["Transnational repression", "Murder for hire & violent plots"], dash: "2 4", weight: 2.5, opacity: 0.9 },
  { label: "Contracts & deployments", events: ["Contracts & deployments"], weight: 1.5, opacity: 0.55 },
  { label: "Research, breakthroughs & public health", events: ["Research & breakthroughs", "Public health", "Reports & statistics"], dash: "10 3 2 3", weight: 2, opacity: 0.75 },
  { label: "Law, courts, protests & conflict", events: ["Courts & litigation", "Regulation & law", "Protests", "Global conflict"], dash: "4 3", weight: 1.5, opacity: 0.7 },
];

export const newsHref = (slug: string) => `/news/${slug}`;

/** "15 Sep 2026", "Sep 2026" for month precision, or a plain note when undated. */
export function newsDate(it: Pick<NewsItem, "date" | "precision">): string {
  if (!it.date) return "Date to confirm";
  const d = new Date(it.date + "T12:00:00Z");
  const opts: Intl.DateTimeFormatOptions =
    it.precision === "month" ? { month: "short", year: "numeric", timeZone: "UTC" } : { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" };
  return d.toLocaleDateString("en-GB", opts);
}
