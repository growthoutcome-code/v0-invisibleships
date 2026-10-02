import Header from "@/components/Header";
import Footer from "@/components/Footer";
import NewsView from "@/components/NewsView";
import type { NewsItem } from "@/lib/news";

/** The News page frame, shared by /news and /news/<slug> (Next allows a route file only its own exports). */
export default function NewsPage({ items, initialSlug }: { items: NewsItem[]; initialSlug?: string }) {
  return (
    <>
      <Header tab="news" />
      <main className="w-full px-5 py-10 sm:px-8 lg:px-[100px]">
        <section className="flex min-h-[72px] items-end pb-0 mb-4 sm:min-h-[160px] sm:mb-8 sm:pb-6">
          <h1 className="font-display m-0 font-bold leading-none tracking-tight text-foreground text-[25px] md:text-[34px] lg:text-[42px]">News</h1>
        </section>
        <NewsView items={items} initialSlug={initialSlug} />
      </main>
      <Footer />
    </>
  );
}
