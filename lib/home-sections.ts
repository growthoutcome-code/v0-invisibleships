/**
 * The data behind the home page's Journal, Concepts, Research and Glossary
 * sections — built once, here, for two readers:
 *
 *   app/page.tsx                    the home page itself
 *   app/api/bottom-sections         the bottom sections under every other page
 *                                   (Sean, 1 Oct 2026: "We need to add bottom
 *                                   sections to each page of the site to
 *                                   promote engagement")
 *
 * One builder, so a bottom section can never show a different slide, quote or
 * order from the home section it was taken from. Server only: it reads the
 * corpus from disk.
 */
import type { Slide } from "@/components/HomeCarousel";
import type { IntlChart } from "@/components/SuicideChart";
import { CONCEPTS } from "@/lib/concepts";
import { CONCEPT_PICKS, GLOSSARY_PICKS } from "@/lib/home-picks";
import { firstSentences } from "@/lib/glossary-format";
import { HOME_QUOTES } from "@/lib/home-quotes";
import { curatedQuotes, homeGlossary, type JournalQuote } from "@/lib/server-corpus";
import { suicideChartDoc } from "@/lib/server-data";

/* THE PRONUNCIATION GOES WHERE A DICTIONARY PUTS IT — above the word, not
   beside it. splitDef has always computed it and the site had nowhere to show
   it; a slide whose title IS the term is that place. Terms without one fall
   back to the section label rather than rendering an empty line. */
export function glossarySlides(): Slide[] {
  return homeGlossary(GLOSSARY_PICKS).map((g) => ({
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
export function conceptSlides(): Slide[] {
  return CONCEPT_PICKS.map((id) => {
    const c = CONCEPTS.find((x) => x.id === id);
    if (!c) {
      throw new Error(
        `home concepts: no concept with id ${JSON.stringify(id)} in lib/concepts.ts. ` +
          `Re-pick it in lib/home-picks.ts.`
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
      body: firstSentences(c.body, 5, 900),
      cta: "Read the concept",
    };
  });
}

/** Strings only, so it crosses the network: a Slide's body may be a ReactNode. */
export type BottomSlide = Omit<Slide, "body"> & { body: string };

export type BottomSectionsData = {
  quotes: JournalQuote[];
  concepts: BottomSlide[];
  glossary: BottomSlide[];
  suicide: IntlChart;
};

export function bottomSectionsData(): BottomSectionsData {
  const asText = (s: Slide[]): BottomSlide[] =>
    s.map((x) => ({ ...x, body: typeof x.body === "string" ? x.body : String(x.body) }));
  return {
    quotes: curatedQuotes(HOME_QUOTES),
    concepts: asText(conceptSlides()),
    glossary: asText(glossarySlides()),
    suicide: suicideChartDoc() as IntlChart,
  };
}
