"use client";
// Standalone concept page body (behind the gate), in the same frame as the
// journal and glossary item pages: back link, share, the concept, previous/next.
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useEffect } from "react";
import ItemHeader from "@/components/ItemHeader";
import Footer from "@/components/Footer";
import ShareMenu from "@/components/ShareMenu";
import ConceptArticle from "@/components/ConceptArticle";
import SideNav from "@/components/SideNav";
import { useRouter } from "next/navigation";
import PageIntro from "@/components/PageIntro";
import { BASIS_LABEL, CONCEPTS, ORIGIN_LABEL, SHOW_SERIES_SIDEBAR, SHOW_SERIES_BLOCK, seriesOf, relatedConcepts, plainText } from "@/lib/concepts";
import { track } from "@/lib/analytics";
import BottomSections, { Block, ConceptCards } from "@/components/BottomSections";
import { THEMES } from "@/lib/themes";

type Nav = { id: string; title: string };

export default function ConceptItemReader({ id, n, prev, next }: { id: string; n: number; prev?: Nav; next?: Nav }) {
  const c = CONCEPTS.find((x) => x.id === id)!;
  useEffect(() => { track("concept_opened", { id, route: true }); }, [id]);
  const router = useRouter();
  // Every series this concept is in (public/data/concepts/series.json; Sean,
  // 6 Oct 2026: "a concept can exist in multiple series"), in page order.
  const inSeries = seriesOf(c.id);
  // A series as concept tiles, in reading order, built the way the bottom
  // sections build theirs (lib/home-sections.ts conceptTiles).
  const tilesOf = (ids: string[]) => ids.flatMap((sid) => {
    const k = CONCEPTS.findIndex((x) => x.id === sid);
    if (k < 0) return [];
    const s = CONCEPTS[k];
    return [{ id: s.id, n: k + 1, origin: ORIGIN_LABEL[s.origin], basis: BASIS_LABEL[s.basis], title: s.title,
      body: plainText(s.body).slice(0, 1400), topics: s.topics.slice(0, 3).map((t) => THEMES[t] ?? t) }];
  });
  const nextIn = (ids: string[]) => {
    const pos = ids.indexOf(c.id);
    const nx = CONCEPTS.find((x) => x.id === ids[(pos + 1) % ids.length]) ?? c;
    return { nx, label: nx.id === c.id ? "Start the series"
      : pos < ids.length - 1 ? `Next in the series: ${nx.title}` : `Back to the start: ${nx.title}` };
  };
  // The rail: each series' name above its own list. Entries are keyed by series, so a concept listed twice
  // is marked current in both places.
  const railSections = inSeries.flatMap((ser) => [
        { id: `group/${ser.key}`, label: ser.title, group: true },
        ...ser.ids.flatMap((sid, k) => {
          const s = CONCEPTS.find((x) => x.id === sid);
          return s ? [{ id: `${ser.key}/${sid}`, label: `${k + 1}. ${s.title}`, current: sid === c.id }] : [];
        }),
      ]);
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <ItemHeader tab="concepts" />
      <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 sm:px-6 py-6">
        {/* TITLE BAND, IDENTICAL TO THE CONCEPTS LIST PAGE (Sean, 4 Oct 2026: "it
            needs to match the height and the top margin from the header
            exactly"): the same band as JournalBrowser's TitleBand, 72px on a
            phone and 160px from 640px, H1 at its foot, same type. The back link
            sits in the eyebrow slot and Share in the actions slot, so neither
            pushes the title down. */}
        <section className="w-full min-h-[72px] sm:min-h-[160px] flex flex-wrap items-end justify-between gap-x-6 gap-y-4 mb-4 pb-0 sm:mb-8 sm:pb-6">
          <div>
            <p className="font-display text-[12px] sm:text-[13px] font-semibold uppercase tracking-[0.14em] m-0 mb-2 sm:mb-3">
              <Link href="/concepts" className="text-muted hover:text-foreground inline-flex items-center gap-1"><ChevronLeft size={14} /> Concepts</Link>
            </p>
            <h1 className="font-display font-bold tracking-tight text-foreground text-[25px] md:text-[34px] lg:text-[42px] leading-none">{c.title}</h1>
          </div>
          <ShareMenu title={`${c.title} — Invisible Ships`} align="right" />
        </section>

        {/* Number and labels under the H1, then the page description, as the
            News and Concepts pages place theirs. */}
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2 mb-5">
          <span className="text-[13px] uppercase tracking-[0.08em] font-semibold text-muted tabular-nums">
            {String(n).padStart(2, "0")}
          </span>
          {/* Origin reads first — who formed a claim before what it rests on. */}
          <span className="text-[13px] uppercase tracking-[0.08em] font-semibold text-background bg-foreground px-2.5 py-1">
            {ORIGIN_LABEL[c.origin]}
          </span>
          <span className="text-[13px] uppercase tracking-[0.08em] font-semibold text-foreground">
            {BASIS_LABEL[c.basis]}
          </span>
        </div>
        <PageIntro from="concept_page">
          An idea drawn from this archive&rsquo;s research and journal, either the author&rsquo;s own speculation or
          generated by AI, and labelled as such.
        </PageIntro>

        {/* A concept in a series gets a right-hand rail titled "Series", the same
            SideNav the Glossary and Journal use, mirrored to the right (Sean,
            4 Oct 2026: "that sidebar styling needs to match the left-hand
            sidebar for glossary… on the right-hand side… title it series").
            A concept without a series keeps its single column. Hidden for now
            by SHOW_SERIES_SIDEBAR in lib/concepts.ts (Sean, 7 Oct 2026). */}
        {SHOW_SERIES_SIDEBAR && inSeries.length ? (
          <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(15rem,25%)] lg:gap-x-16 lg:items-start">
            <div className="lg:order-2">
              <SideNav
                large
                mode="index"
                label="Series"
                sections={railSections}
                active={`${inSeries[0].key}/${c.id}`}
                onPick={(key) => { const sid = key.split("/")[1]; if (sid && sid !== c.id) router.push(`/concepts/${sid}`); }}
              />
            </div>
            <div className="min-w-0 lg:order-1"><ConceptArticle c={c} /></div>
          </div>
        ) : (
          <ConceptArticle c={c} />
        )}
        {/* SERIES, AS A BOTTOM SECTION (Sean, 4 Oct 2026: "let's use this bottom
            section immediately under the concept to run two up tiles… call it
            series… use the existing bottom section architecture"). The same
            Block and two-up concept cards as the Concepts bottom section, in
            the series' reading order. A concept with no series keeps its
            previous / next links. */}
        {SHOW_SERIES_BLOCK && inSeries.length ? (
          <div className="mt-16 space-y-16">
            {inSeries.map((ser) => {
              const { nx, label } = nextIn(ser.ids);
              return (
                <Block key={ser.key} id={`series-${ser.key}`} from="concept" eyebrow="Series" wide
                  heading={ser.title} href={`/concepts/${nx.id}`} label={label}>
                  <p className="body-copy text-foreground/85 measure m-0 mb-8">{ser.blurb}</p>
                  <ConceptCards tiles={tilesOf(ser.ids)} from={`concept-series:${ser.key}`} label={`Series: ${ser.title}`} />
                </Block>
              );
            })}
          </div>
        ) : (
          /* RELATED CONCEPTS (Sean, 7 Oct 2026, option 3), in place of the
             previous / next text links: two up, swiping through up to six,
             the same tiles and carousel as the Concepts bottom section. The
             next concept in list order stays as the block's link. */
          <div className="mt-16">
            <Block id="related" from="concept" eyebrow="Keep reading" heading="Related concepts" wide
              href={next ? `/concepts/${next.id}` : "/concepts"}
              label={next ? `Next concept: ${next.title}` : "All concepts"}>
              <ConceptCards tiles={tilesOf(relatedConcepts(c.id, 7).filter((r) => r.id !== next?.id).slice(0, 6).map((r) => r.id))} from="concept-related" label="Related concepts" />
            </Block>
          </div>
        )}
        {/* The home page's other sections, never this one (Sean, 1 Oct 2026). */}
        <BottomSections exclude={["concepts"]} from="concept" />
      </main>
      <Footer />
    </div>
  );
}
