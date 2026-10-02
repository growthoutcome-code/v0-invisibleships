import type { Metadata } from "next";
import NewsPage from "@/components/NewsPage";
import { readNewsIndex } from "@/lib/news-server";

export const metadata: Metadata = {
  title: "News — Invisible Ships",
  description: "Official releases and outside reporting on neurotechnology, biotechnology, artificial intelligence and government cloud, each summarised and linked to the original.",
  alternates: { canonical: "/news" },
  // Unlisted until the summaries are written (Sean, 2 Oct 2026).
  robots: { index: false, follow: false },
};

export default async function Page() {
  const items = await readNewsIndex();
  return <NewsPage items={items} />;
}

