"use client";

/**
 * The bottom sections: the way on from every page except the home page.
 *
 * Sean, 1 Oct 2026: "We need to add bottom sections to each page of the site to
 * promote engagement. Let's pick the following sections from the homepage as a
 * starting point. Journal, Concepts, Research/Suicide Chart, Glossary."
 * His rules, kept here because they are the whole design:
 *
 *   1. Never a bottom section that repeats the page it sits on — no Journal
 *      block under the journal. Each page passes `exclude`.
 *   2. The home sections' extra copy is not carried. Each block is the home
 *      section's eyebrow and question, its visual, and one way in. No count
 *      line, no lead paragraph, no related-link lists, no disclaimer trigger.
 *   3. They replace the "From the glossary" / "From the journal" peeks that
 *      used to sit under the journal and glossary lists.
 *
 * RANDOM, FROM A VETTED POOL (Sean, 1 Oct 2026: "Let's randomize the content
 * that shows in the bottom sections… I don't want this work to impact the
 * sections on the home page"). The pools are in lib/bottom-picks.ts and share
 * little with the home page. Each time this mounts it shows the whole of each
 * pool in a random order, and one research chart of three.
 * The slides are built by the same code as the home page's (lib/home-sections.ts,
 * served by /api/bottom-sections), so they look and are checked the same way.
 *
 * One exception to rule 2, by design: the suicide chart keeps its support line.
 * That is safety information, not disclaimer copy, and the Public Health page
 * carries it directly under the same chart.
 *
 * NOTHING LOADS UNTIL IT IS NEEDED. The data (quotations, slides and a 33 KB
 * chart) is fetched when the reader comes within a screen of the bottom, once
 * per visit, so the page above loads no slower for it.
 *
 * MOTIFS (Sean, 1 Oct 2026: "apply the background motifs to these bottom
 * sections journal and glossary"). Each takes its home-page motif, placed as the
 * home page places it: `carry` directly behind the journal quotations (Sean,
 * 5 September: "these motifs to be directly behind the journal entry"), and
 * `recede` behind the whole glossary block. The page-level motif on the journal
 * and glossary pages stops at the top of these sections, and neither page shows
 * its own block, so two motions never meet.
 */
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import HomeCarousel from "@/components/HomeCarousel";
import JournalQuotes from "@/components/JournalQuotes";
import { MultiLineChart } from "@/components/SuicideChart";
import { track } from "@/lib/analytics";
import SectionMotif, { MotifStage } from "@/components/SectionMotif";
import IntlLineChart, { type IntlChartDoc } from "@/components/IntlLineChart";
import ConceptTile from "@/components/ConceptTile";
import {
  Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi,
} from "@/components/ui/carousel";
import type { BottomSectionsData } from "@/lib/home-sections";
import { BOTTOM_CHARTS, type BottomChart } from "@/lib/bottom-picks";
import ContributeColumns from "@/components/ContributeColumns";
import ExportButton from "@/components/ExportButton";
import { SafetyDialog } from "@/components/LegalDialogs";

export type BottomBlock = "journal" | "concepts" | "research" | "glossary" | "contribute";
/**
 * CONTRIBUTE IS LAST, AND ON EVERY PAGE (Sean, 2 Oct 2026: "it may be very
 * important to include the contribute bottom section on every single page").
 * It is no page's own section, so no `exclude` ever removes it; the home page
 * has its own Contribute section and carries no bottom sections.
 */
const ORDER: BottomBlock[] = ["journal", "concepts", "research", "glossary", "contribute"];
/**
 * PAUSED (Sean, 1 Oct 2026: "Remove the research bottom section from all
 * pages until we pick the charts. Do not remove the chart from the home
 * page."). The block's code stays below; delete "research" from this list to
 * bring it back. The home page's own chart is a separate component and is
 * not affected.
 */
const PAUSED: BottomBlock[] = ["research"];

let cache: Promise<BottomSectionsData> | null = null;
function load(): Promise<BottomSectionsData> {
  if (!cache) {
    cache = fetch("/api/bottom-sections").then((r) => {
      if (!r.ok) throw new Error(`bottom sections: ${r.status}`);
      return r.json();
    });
    cache.catch(() => { cache = null; }); // a failed fetch can be retried on the next page
  }
  return cache;
}

/** A random `n` of `xs`, in random order (Fisher–Yates on a copy). */
function sample<T>(xs: T[], n: number): T[] {
  const a = xs.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, n);
}

/** The two crime charts the research block can show. Each is a chart the Crime
 *  pages already publish; the heading is its plain finding and the line under
 *  it is the one caveat the chart needs. Text from the chart's own "What the
 *  chart shows" list in public/data/crime/charts. */
const CRIME_CHARTS: Record<Exclude<BottomChart, "suicide">, {
  src: string; heading: string; line: string; href: string; label: string;
}> = {
  homicide: {
    src: "/data/crime/charts/homicide_international.json",
    heading: "The United States’ homicide rate is several times that of comparable countries",
    line: "In 2023 it was 5.8 per 100,000, against the UK’s 1.1, Germany’s 0.9, South Korea’s 0.5 and Japan’s 0.2. The 2020 spike was an American event; the world line barely moved.",
    href: "/research/crime/homicide",
    label: "Go to homicide",
  },
  breakins: {
    src: "/data/crime/charts/burglary_international.json",
    heading: "Police-recorded burglary in the United States has fallen since 2000",
    line: "Fewer US burglaries reach the police at all: 59% were reported in 2010, 41% in 2024, so some of the fall is fewer reports. The US lines are dashed because they count all premises on a different system; compare their direction, not their height.",
    href: "/research/crime/break-ins",
    label: "Go to break-ins",
  },
};

/** One crime chart, fetched only when it is the one picked. */
function CrimeChart({ src, href }: { src: string; href: string }) {
  const [doc, setDoc] = useState<IntlChartDoc | null>(null);
  useEffect(() => {
    let alive = true;
    fetch(src).then((r) => (r.ok ? r.json() : null)).then((d) => { if (alive) setDoc(d); }).catch(() => {});
    return () => { alive = false; };
  }, [src]);
  if (!doc) return <div className="min-h-[360px]" aria-hidden />;
  // Picking a line opens its detail on the Crime page, where the detail lives.
  return <IntlLineChart chart={doc} lead onPick={() => { window.location.href = href; }} />;
}

/**
 * THE CONCEPTS PAGE'S OWN TILES, TWO ACROSS (Sean, 1 Oct 2026: "use 2 up cards
 * from the concepts page in the concepts bottom section carousel. We could make
 * the cards square and include some top and bottom negative space").
 *
 * A 3:2 card (480px tall on a phone) with the text filling it. One across on
 * a phone. The arrows move a whole pair, and the dots and count are pairs
 * ("1 / 2"), not cards. Never rotates on its own: the journal and glossary
 * carousels do, and two moving carousels never share a screen.
 */
function ConceptCards({ tiles, from }: { tiles: BottomSectionsData["concepts"]; from: string }) {
  const [api, setApi] = useState<CarouselApi>();
  const [i, setI] = useState(0);
  const [pages, setPages] = useState(0);
  useEffect(() => {
    if (!api) return;
    // Pages change with the breakpoint (pairs on desktop, single cards on a
    // phone), so they are re-read whenever embla re-initialises.
    const on = () => { setPages(api.scrollSnapList().length); setI(api.selectedScrollSnap()); };
    on();
    api.on("select", on);
    api.on("reInit", on);
    return () => { api.off("select", on); api.off("reInit", on); };
  }, [api]);
  return (
    <Carousel setApi={setApi} aria-label="Concepts" className="relative"
      opts={{ align: "start", loop: true, breakpoints: { "(min-width: 768px)": { slidesToScroll: 2 } } }}>
      <CarouselContent>
        {tiles.map((c) => (
          <CarouselItem key={c.id} className="basis-full md:basis-1/2">
            <ConceptTile c={c} from={`bottom:${from}`} square />
          </CarouselItem>
        ))}
      </CarouselContent>
      {/* Same controls as HomeCarousel: in normal flow, 44px arrows, a dot per page. */}
      <div className="mt-6 flex flex-wrap items-center gap-1.5">
        <CarouselPrevious className="static mr-1 h-11 w-11 translate-y-0" />
        <CarouselNext className="static mr-2 h-11 w-11 translate-y-0" />
        {Array.from({ length: pages }, (_, n) => (
          <button key={n} type="button" onClick={() => api?.scrollTo(n)}
            aria-label={`Show ${n + 1} of ${pages}`} aria-current={n === i} className="px-1 py-3">
            <span className={`block h-1.5 transition-all ${n === i ? "w-7 bg-foreground" : "w-2.5 bg-foreground/20"}`} />
          </button>
        ))}
        {pages > 0 && <span className="ml-2 text-[15px] text-muted">{i + 1} / {pages}</span>}
      </div>
    </Carousel>
  );
}

function Block({ id, eyebrow, heading, children, href, label, from, motif, wide = false, actions }: {
  id: BottomBlock; eyebrow: string; heading: ReactNode; children: ReactNode;
  href?: string; label?: string; from: string;
  /** In place of the one link, for a block whose way on is not a page (Contribute). */
  actions?: ReactNode;
  /** The full width of the page: Concepts (Sean, 1 Oct 2026) and Contribute, whose
   *  three columns were squeezed into 1,040px (Sean, 2 Oct 2026). */
  wide?: boolean;
  /** A motif behind the whole block, as SiteSection does on the home page. */
  motif?: "recede" | "room";
}) {
  return (
    <section aria-labelledby={`bottom-${id}`}
      className={motif ? "relative isolate overflow-hidden border-t border-edge py-14 sm:py-16" : "border-t border-edge py-14 sm:py-16"}
      // One event for any link in the block, so PostHog shows which bottom
      // sections are actually used, and from which page.
      onClickCapture={(e) => {
        const a = (e.target as HTMLElement).closest("a");
        if (a) track("bottom_section_click", { from, block: id, href: a.getAttribute("href") });
      }}>
      {motif && <SectionMotif name={motif} />}
      <div className={motif ? "relative z-10" : undefined}>
      {/* Same eyebrow treatment as the home sections (SiteSection): accent bar
          and the section name. */}
      <div className="flex items-center gap-3">
        <span className="h-1.5 w-6 shrink-0 bg-accent" aria-hidden />
        <p className="m-0 font-display text-[16px] sm:text-[18px] font-semibold uppercase tracking-[0.14em] text-foreground">
          {eyebrow}
        </p>
      </div>
      <h2 id={`bottom-${id}`} className="font-display m-0 mt-3 text-[24px] font-semibold leading-[1.25] text-foreground sm:text-[30px]">
        {heading}
      </h2>
      {/* Capped near the home sections' own measure (about 966px at 1366 wide):
          inside a full-width page column the chart's end labels ran off the
          screen and the quotations ran to 1,300px lines. */}
      <div className={wide ? "mt-10" : "mt-10 max-w-[1040px]"}>{children}</div>
      <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-4">
        {actions ?? (
          <a href={href}
            className="inline-flex h-12 items-center rounded-md bg-foreground px-6 text-[17px] font-medium text-background">
            {label}
          </a>
        )}
      </div>
      </div>
    </section>
  );
}

export default function BottomSections({ exclude = [], from }: {
  /** The page's own section(s). Never shown under themselves. */
  exclude?: BottomBlock[];
  /** Where the reader is, for analytics: "journal", "concept", "research/crime"… */
  from: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<BottomSectionsData | null>(null);
  const [failed, setFailed] = useState(false);
  const blocks = ORDER.filter((b) => !exclude.includes(b) && !PAUSED.includes(b));

  // Picked once, when the data arrives, so a re-render never reshuffles what
  // the reader is looking at. Client-only (the data is fetched in the browser),
  // so there is no server render to disagree with.
  const pick = useMemo(() => data && {
    // All eight, in a random order, one at a time (Sean, 1 Oct 2026).
    quotes: sample(data.quotes, data.quotes.length),
    // All twenty, two up, in a random order: ten pages (Sean, 1 Oct 2026).
    concepts: sample(data.concepts, data.concepts.length),
    // All twelve, in a random order (Sean, 1 Oct 2026).
    glossary: sample(data.glossary, data.glossary.length),
    chart: sample(BOTTOM_CHARTS, 1)[0],
  }, [data]);

  useEffect(() => {
    const el = ref.current;
    if (!el || data) return;
    let alive = true;
    const go = () => load().then((d) => { if (alive) setData(d); }).catch(() => { if (alive) setFailed(true); });
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { io.disconnect(); go(); }
    }, { rootMargin: "100% 0px" });
    io.observe(el);
    return () => { alive = false; io.disconnect(); };
  }, [data]);

  if (!blocks.length || failed) return null;

  return (
    <div ref={ref} className="mt-16" data-bottom-sections={blocks.join(" ")}>
      {!data || !pick ? (
        // Holds roughly the space the blocks will take, so the footer does not
        // jump when they arrive.
        <div className="min-h-[60vh]" aria-hidden />
      ) : blocks.map((b) => {
        if (b === "journal") return (
          <Block key={b} id={b} from={from} eyebrow="Journal"
            heading={<>Statements from the{" "}
              <a href="/concepts/the-neurotech-bullhorn"
                className="underline decoration-accent decoration-2 underline-offset-[6px] hover:decoration-foreground">
                neurotech bullhorn</a></>}
            href="/journal" label="Go to the journal">
            <MotifStage name="carry" className="-mx-4 px-4 py-6 sm:-mx-8 sm:px-8">
              <JournalQuotes entries={pick.quotes} limit={1200} disclaimerFrom={`bottom:${from}`} />
            </MotifStage>
          </Block>
        );
        if (b === "concepts") return (
          <Block key={b} id={b} from={from} eyebrow="Concepts" wide
            heading="What might the record suggest?"
            href="/concepts" label="Go to the concepts">
            <ConceptCards tiles={pick.concepts} from={from} />
          </Block>
        );
        if (b === "research" && pick.chart !== "suicide") {
          const c = CRIME_CHARTS[pick.chart];
          return (
            <Block key={b} id={b} from={from} eyebrow="Research" heading={c.heading}
              href={c.href} label={c.label}>
              <CrimeChart src={c.src} href={c.href} />
              <p className="body-copy measure mt-5 mb-0 text-[17px] leading-relaxed text-foreground/85">{c.line}</p>
            </Block>
          );
        }
        if (b === "research") return (
          <Block key={b} id={b} from={from} eyebrow="Research"
            // The finding is the heading here, not "What does the research
            // show?": under it the home chart stacked three titles saying the
            // same thing (the redundancy removed from the Crime pages on 1 Oct).
            // The world's fall stays in the heading — without it, "rising" is a
            // claim this data does not make about the world at large.
            heading="Suicide is rising in the United States and South Korea, while the world’s rate fell 27%"
            href="/research/public-health" label="Go to public health">
            <MultiLineChart chart={data.suicide} captionBelow />
            {/* The one fact the chart's axis cannot carry, kept from the home
                section: the WHO basis stops at the US peak, and the US has fallen
                since. Publishing the peak and withholding the fall is what this
                archive exists not to do. */}
            <p className="body-copy measure mt-5 mb-0 text-[17px] leading-relaxed text-foreground/85">
              The comparable WHO basis ends at 2021; the United States&rsquo; own figures fall
              after the 2022 peak, to 13.7 per 100,000 in 2024.
            </p>
            <p className="text-muted text-[15px] measure mt-4 mb-0">
              If you or someone you know needs support: in the US, call or text{" "}
              <a href="https://988lifeline.org" target="_blank" rel="noreferrer noopener" className="underline underline-offset-4">988</a>;
              elsewhere, <a href="https://findahelpline.com" target="_blank" rel="noreferrer noopener" className="underline underline-offset-4">findahelpline.com</a>.
            </p>
          </Block>
        );
        // The home page's Contribute section, as rule 2 cuts it: eyebrow, question,
        // the three columns, the way on. The lead paragraph and the notes below the
        // columns stay on the home page. The safety notice is kept, as the suicide
        // chart keeps its support line: it is safety information, not disclaimer copy.
        if (b === "contribute") return (
          <Block key={b} id={b} from={from} eyebrow="Contribute" motif="room" wide
            heading="What can you do?"
            actions={<>
              <ExportButton />
              <SafetyDialog>
                <button type="button" className="text-[16px] text-muted underline underline-offset-4 hover:text-foreground">
                  Safety notice
                </button>
              </SafetyDialog>
            </>}>
            <ContributeColumns />
          </Block>
        );
        return (
          <Block key={b} id={b} from={from} eyebrow="Glossary" motif="recede"
            heading="What do these words actually mean?"
            href="/glossary" label="Go to the glossary">
            <HomeCarousel slides={pick.glossary} label="Glossary terms" />
          </Block>
        );
      })}
    </div>
  );
}
