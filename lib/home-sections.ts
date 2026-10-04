/**
 * The builders behind the home page's Journal, Concepts, Research and Glossary
 * sections — used, here, by two readers:
 *
 *   app/page.tsx                    the home page itself
 *   app/api/bottom-sections         the bottom sections under every other page
 *                                   (Sean, 1 Oct 2026: "We need to add bottom
 *                                   sections to each page of the site to
 *                                   promote engagement")
 *
 * One set of builders, so a bottom slide is built and checked exactly like a
 * home slide. The CONTENT differs: the home page uses lib/home-picks.ts and
 * lib/home-quotes.ts; the bottom sections use lib/bottom-picks.ts and show a
 * random selection (Sean, 1 Oct 2026). Server only: it reads the corpus from
 * disk.
 */
import type { Slide } from "@/components/HomeCarousel";
import type { IntlChart } from "@/components/SuicideChart";
import { BASIS_LABEL, CONCEPTS, ORIGIN_LABEL, plainText } from "@/lib/concepts";
import { THEMES } from "@/lib/themes";
import type { ConceptTileData } from "@/components/ConceptTile";
import { CONCEPT_PICKS, GLOSSARY_PICKS } from "@/lib/home-picks";
import { firstSentences } from "@/lib/glossary-format";
import { BOTTOM_CONCEPTS, BOTTOM_GLOSSARY } from "@/lib/bottom-picks";
import { bottomQuotes } from "@/lib/bottom-quotes";
import { curatedQuotes, homeGlossary, type JournalQuote } from "@/lib/server-corpus";
import { suicideChartDoc } from "@/lib/server-data";

/* THE PRONUNCIATION GOES WHERE A DICTIONARY PUTS IT — above the word, not
   beside it. splitDef has always computed it and the site had nowhere to show
   it; a slide whose title IS the term is that place. Terms without one fall
   back to the section label rather than rendering an empty line. */
export function glossarySlides(picks: string[] = GLOSSARY_PICKS): Slide[] {
  return homeGlossary(picks).map((g) => ({
    href: `/glossary/${g.slug}`,
    eyebrow: g.pron || "Glossary",
    title: g.term,
    body: g.summary,
    cta: "Full definition and every entry that uses it",
  }));
}

/* CONCEPT SLIDES, DERIVED. Same discipline as the quotations and the chart:
   an id that stops resolving fails the build rather than quietly rendering a
   four-slide carousel nobody notices is short. Bodies run 313-2,004 characters
   in the register, so they are cut for a slide — the full concept is one click
   away. */
export function conceptSlides(picks: string[] = CONCEPT_PICKS): Slide[] {
  return picks.map((id) => {
    const c = CONCEPTS.find((x) => x.id === id);
    if (!c) {
      throw new Error(
        `concepts: no concept with id ${JSON.stringify(id)} in lib/concepts.ts. ` +
          `Re-pick it in lib/home-picks.ts or lib/bottom-picks.ts.`
      );
    }
    return {
      href: `/concepts/${c.id}`,
      eyebrow: `${c.basis} · ${c.theme}`,
      title: c.title,
      // FIVE SENTENCES AT 900. Each raise here was forced by a slide stopping
      // one sentence before its point: at three, the newspapers concept ended on
      // "Local journalism in the United States has collapsed" and left the 3,500
      // closed papers behind it; at four and 520, the haunting concept stopped
      // after naming what is described and dropped the sentence saying what the
      // terror is FOR. At 840 the prevention concept lost its closing sentence by
      // thirty characters. A concept slide that asserts and then withholds its
      // own payoff is worse than no slide.
      body: firstSentences(plainText(c.body), 5, 900),
      cta: "Read the concept",
    };
  });
}

/**
 * CONCEPT TILES for the bottom sections (Sean, 1 Oct 2026: "use 2 up cards from
 * the concepts page in the concepts bottom section carousel"). The same fields
 * the Concepts page tile shows, resolved to strings here so the register itself
 * never ships to the browser. The body is cut at 400 characters only to keep
 * the payload small: the tile clamps it to what fits.
 */
export function conceptTiles(picks: string[]): ConceptTileData[] {
  return picks.map((id) => {
    const i = CONCEPTS.findIndex((x) => x.id === id);
    if (i < 0) {
      throw new Error(
        `concepts: no concept with id ${JSON.stringify(id)} in lib/concepts.ts. Re-pick it in lib/bottom-picks.ts.`
      );
    }
    const c = CONCEPTS[i];
    return {
      id: c.id,
      n: i + 1,
      origin: ORIGIN_LABEL[c.origin],
      basis: BASIS_LABEL[c.basis],
      title: c.title,
      // Enough to fill a full-width square; the tile clamps to what fits.
      body: plainText(c.body).slice(0, 1400),
      topics: c.topics.slice(0, 3).map((t) => THEMES[t] ?? t),
    };
  });
}

/** Strings only, so it crosses the network: a Slide's body may be a ReactNode. */
export type BottomSlide = Omit<Slide, "body"> & { body: string };

/**
 * THE BOTTOM SECTIONS' POOLS (Sean, 1 Oct 2026: randomise the bottom sections,
 * leave the home page exactly as it is). Built from lib/bottom-picks.ts, not
 * the home picks; the page picks at random from these when it loads. Same
 * builders as the home page, so the slides look the same and a broken pick
 * fails the build. The crime charts are not here: the page fetches the one it
 * picks from /data/crime/charts, which already serves them.
 */
export type BottomSectionsData = {
  quotes: JournalQuote[];
  concepts: ConceptTileData[];
  glossary: BottomSlide[];
  suicide: IntlChart;
};

export function bottomSectionsData(): BottomSectionsData {
  const asText = (s: Slide[]): BottomSlide[] =>
    s.map((x) => ({ ...x, body: typeof x.body === "string" ? x.body : String(x.body) }));
  return {
    // No location on a bottom slide, for the reason given in lib/home-quotes.ts:
    // every location in the corpus is a specific shelter.
    quotes: bottomQuotes(),
    concepts: conceptTiles(BOTTOM_CONCEPTS),
    glossary: asText(glossarySlides(BOTTOM_GLOSSARY)),
    suicide: suicideChartDoc() as IntlChart,
  };
}
