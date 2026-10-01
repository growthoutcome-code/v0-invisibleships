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
 * The slides, quotations and chart are the home page's own, built by
 * lib/home-sections.ts and served by /api/bottom-sections, so a block can never
 * disagree with the home section it was taken from — including the glossary's
 * deliberate order (a documented tactic first).
 *
 * One exception to rule 2, by design: the suicide chart keeps its support line.
 * That is safety information, not disclaimer copy, and the Public Health page
 * carries it directly under the same chart.
 *
 * NOTHING LOADS UNTIL IT IS NEEDED. The data (quotations, slides and a 33 KB
 * chart) is fetched when the reader comes within a screen of the bottom, once
 * per visit, so the page above loads no slower for it.
 *
 * No background motif: the journal and glossary pages already run one behind
 * the whole page, and two motions on one screen compete.
 */
import { useEffect, useRef, useState, type ReactNode } from "react";
import HomeCarousel from "@/components/HomeCarousel";
import JournalQuotes from "@/components/JournalQuotes";
import { MultiLineChart } from "@/components/SuicideChart";
import { track } from "@/lib/analytics";
import type { BottomSectionsData } from "@/lib/home-sections";

export type BottomBlock = "journal" | "concepts" | "research" | "glossary";
const ORDER: BottomBlock[] = ["journal", "concepts", "research", "glossary"];

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

function Block({ id, eyebrow, heading, children, href, label, from }: {
  id: BottomBlock; eyebrow: string; heading: ReactNode; children: ReactNode;
  href: string; label: string; from: string;
}) {
  return (
    <section aria-labelledby={`bottom-${id}`} className="border-t border-edge py-14 sm:py-16"
      // One event for any link in the block, so PostHog shows which bottom
      // sections are actually used, and from which page.
      onClickCapture={(e) => {
        const a = (e.target as HTMLElement).closest("a");
        if (a) track("bottom_section_click", { from, block: id, href: a.getAttribute("href") });
      }}>
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
      <div className="mt-10 max-w-[1040px]">{children}</div>
      <div className="mt-10">
        <a href={href}
          className="inline-flex h-12 items-center rounded-md bg-foreground px-6 text-[17px] font-medium text-background">
          {label}
        </a>
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
  const blocks = ORDER.filter((b) => !exclude.includes(b));

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
      {!data ? (
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
            <JournalQuotes entries={data.quotes} />
          </Block>
        );
        if (b === "concepts") return (
          <Block key={b} id={b} from={from} eyebrow="Concepts"
            heading="What does the record actually establish?"
            href="/concepts" label="Go to the concepts">
            {/* Waits to be asked: the journal and glossary carousels rotate, and
                two moving carousels never share a screen (Sean, 8 September). */}
            <HomeCarousel slides={data.concepts} label="Concepts" titleSize="heading" autoplay={false} />
          </Block>
        );
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
        return (
          <Block key={b} id={b} from={from} eyebrow="Glossary"
            heading="What do these words actually mean?"
            href="/glossary" label="Go to the glossary">
            <HomeCarousel slides={data.glossary} label="Glossary terms" />
          </Block>
        );
      })}
    </div>
  );
}
