import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { newsDate } from "@/lib/news";
import { readNewsIndex } from "@/lib/news-server";
import NewsPage from "@/components/NewsPage";

/**
 * The share address of one News item. It renders the News page with that item's
 * dialog open, so whoever follows a shared link lands on our summary first, with
 * the original one button away (Sean, 2 Oct 2026).
 */
export async function generateStaticParams() {
  return (await readNewsIndex()).map((i) => ({ slug: i.slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const it = (await readNewsIndex()).find((i) => i.slug === params.slug);
  if (!it) return {};
  return {
    title: `${it.title} — Invisible Ships News`,
    description: `${it.publisher}, ${newsDate(it)}. Summarised by Invisible Ships, with a link to the original.`,
    alternates: { canonical: `/news/${it.slug}` },
    robots: { index: false, follow: false },
  };
}

export default async function Page({ params }: { params: { slug: string } }) {
  const items = await readNewsIndex();
  if (!items.some((i) => i.slug === params.slug)) notFound();
  return <NewsPage items={items} initialSlug={params.slug} />;
}
