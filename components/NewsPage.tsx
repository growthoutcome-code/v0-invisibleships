import Header from "@/components/Header";
import Footer from "@/components/Footer";
import NewsView from "@/components/NewsView";
import BottomSections from "@/components/BottomSections";
import type { NewsItem } from "@/lib/news";

/** The News page frame, shared by /news and /news/<slug> (Next allows a route file only its own exports). */
export default function NewsPage({ items, initialSlug }: { items: NewsItem[]; initialSlug?: string }) {
  return (
    <>
      <Header tab="news" />
      <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 sm:px-6 py-6">
        <section className="flex min-h-[72px] items-end pb-0 mb-4 sm:min-h-[160px] sm:mb-8 sm:pb-6">
          <h1 className="font-display m-0 font-bold leading-none tracking-tight text-foreground text-[25px] md:text-[34px] lg:text-[42px]">News</h1>
        </section>
        <NewsView items={items} initialSlug={initialSlug} />
        {/* Journal, Concepts, Glossary and Contribute (Sean, 2 Oct 2026). Research
            is paused site-wide in BottomSections; excluded here too, so News
            stays at these four when research comes back unless Sean adds it. */}
        <BottomSections exclude={["research"]} from="news" />
      </main>
      <Footer />
    </>
  );
}
