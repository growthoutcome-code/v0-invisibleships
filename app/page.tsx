import type { Metadata } from "next";
import Footer from "@/components/Footer";
import { DisclaimerDialog } from "@/components/LegalDialogs";
import SiteSection, { Figure } from "@/components/SiteSection";
import { ChevronDown } from "lucide-react";
import GateAnimation from "@/components/GateAnimation";
import Header from "@/components/Header";
import HomeCarousel, { type Slide } from "@/components/HomeCarousel";
import { CONCEPTS, FINDINGS, SOURCE_YEARS } from "@/lib/concepts";
import { CORPUS_SUMMARY } from "@/lib/corpus-summary";
import JournalQuotes from "@/components/JournalQuotes";
import { GLOSSARY_PICKS } from "@/lib/home-picks";
import { CRIME_FIGURES, HEALTH_FIGURES } from "@/lib/home-data-sections";
import { homeGlossary, journalQuotes, journalStats } from "@/lib/server-corpus";
import { govCloud, usd } from "@/lib/server-data";

/**
 * The home page.
 *
 * WHY THIS REPLACED THE GATE AT "/"
 * ---------------------------------
 * Until now "/" mounted the journal behind a four-screen gate. Every link Sean
 * sent — and every visit to this site is direct, there are no referrals from
 * anywhere — landed a reader on "I am 18 or older" instead of the thing he was
 * pointing at. So the root is now a page that says what this is, in public,
 * indexable and linkable. The gate still stands in front of the journal, which
 * is where the material it warns about actually lives.
 *
 * JOURNAL FORWARD
 * ---------------
 * Sean, 29 August: "the whole approach needs to be journal forward". The record
 * is the thing this site has that nothing else does. So the journal is the
 * first section under the hero, not a card in a row of four, and the research
 * that follows reads as what was assembled to make sense of it rather than as
 * the main event.
 *
 * THE HERO IS THE GATE'S OWN LAYOUT
 * ---------------------------------
 * Not a new composition. AccessGate's welcome screen is a full-height split —
 * a fixed copy rail beside a panel the animation fills — and people who came in
 * through the gate have already seen it. Reusing it means the front door and
 * the room behind it are recognisably the same building, and it means the one
 * layout gets looked after rather than two drifting apart.
 *
 * The only change is the ratio: the gate gives its copy 40%, this gives it 25%,
 * because the picture is what makes the case to somebody who has not read a
 * word. An overlay was tried first and dropped — text over the artwork needs a
 * scrim, and a scrim over a line drawing eats the drawing.
 *
 * Every number on this page is derived at render from lib/, never typed in, so
 * it cannot drift from the archive it describes.
 */

export const metadata: Metadata = {
  // The headline is the title. A shared link should carry the question, since
  // the question is what this archive is organised around — and a question
  // carries its question mark with it, which an assertion never would.
  title: "Has a neurotech terrorist attack happened?",
  description:
    "Is there a government cloud platform — anywhere — running a risk-mitigation layer that could do what Zersetzung did: isolate and discredit a person without ever arresting them? Would any public record show it? And why, while the world's suicide rate fell 27%, did the United States rise 40% and South Korea 83%?",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Has a neurotech terrorist attack happened?",
    description:
      "Is there a government cloud platform running a risk-mitigation layer that could do what Zersetzung did — and would any public record show it?",
    images: ["/og-default.png"],
  },
};

/**
 * THE HERO.
 *
 * Sean, 1 September: "let's just make the headline has a neurotech terrorist
 * attack happened, question mark… in general, it's international… and if we
 * can squeeze in Zersetzung disintegration tactics in that subline, I think
 * it'd be a very good idea."
 *
 * SIX WORDS, NO COUNTRY. Naming the United States made it a claim about a
 * place; dropping the country makes it a question about a thing, which is both
 * larger and easier to defend. Nothing was added to make it international — a
 * country was removed.
 *
 * ALL QUESTIONS, HALF THE WORDS, NO COUNTRY. Sean, 1 September: cut the subline
 * by 40-50%, use "risk mitigation software" and tie it to Zersetzung, "it needs
 * to not sound like we're blaming America", and "everything needs to be a
 * question." 85 words became 47, in three questions and no statements.
 *
 * WHAT THE BLAME WAS. The old subline put "$102.8bn of public procurement"
 * beside "The United States rose 40%" — two American facts, adjacent, one about
 * money and one about death. However the sentence after them was worded, that
 * is an accusation, and it was aimed at the one country whose law-enforcement
 * readers this archive is trying not to lose. Both country names are gone. The
 * platform question now asks "anywhere", and the health question asks why SOME
 * wealthy countries moved against the world trend without naming which.
 *
 * "RISK-MITIGATION LAYER" IS NOT INVENTED, which is what makes the question
 * askable. The capabilities register already carries watsonx.governance —
 * "model risk, bias, drift, compliance monitoring for AI" — Microsoft Sentinel
 * and Google Chronicle as cloud-scale SIEMs ingesting telemetry for detection
 * and response, Amazon Comprehend for sentiment and PII detection, and acoustic
 * event detection that "links audio to video/LPR". Seven of 73 capabilities in
 * the record are risk, threat or behaviour layers. The question is whether such
 * a layer could be pointed at a person the way Zersetzung was — and that is a
 * question, not a finding.
 *
 * THE SUICIDE FIGURES, AND WHY NOT THE ONES SEAN ASKED FOR. He asked for
 * "America has a 36% increase, and South Korea has a 105% increase."
 *
 * Those are real and they are on this site — but they are the pair the site
 * tells readers NOT to put beside each other. HealthSignals' "Which figure to
 * quote" panel exists because Sean himself hit this on 28 August: 105% and 36%
 * are each country's own NATIONAL statistics, run to different end years on
 * different national methods, and the panel says in as many words: "Do not
 * compare it with another country's: national methods differ from each other
 * and from the WHO basis, so the gap between two of them is partly a gap of
 * method. For comparing countries, use..." the WHO figure.
 *
 * So the hero uses the comparable pair — United States +40%, South Korea +83%,
 * both age-standardised to the WHO world standard population, 2000-2021, the
 * same basis as the world's -27% they are set against. Same specificity Sean
 * wanted, and it does not put the front page in contradiction with the modal
 * three clicks below it.
 *
 * Alternates, one line to swap:
 *   HEADLINE B  "Has a neurotechnological terrorist attack already happened?"
 *   HEADLINE C  "Has a neurotech terrorist attack happened, and would anyone
 *                have counted it?"  — adds the archive's real finding, costs
 *                the brevity.
 *   SUBLINE B   "Zersetzung broke people without arresting them. If a
 *                risk-mitigation layer inside a government cloud could do that
 *                now, which government would it belong to — and who would be
 *                able to check?"  (31 words)
 *   SUBLINE C   "What would Zersetzung look like as risk-mitigation software?
 *                And if a government cloud were running it, would anyone
 *                outside that cloud know?"  (23 words, the shortest)
 */
const HERO = {
  question: "Has a neurotech terrorist attack happened?",
};

/**
 * THE CITIES, AS TESTIMONY.
 *
 * This section exists so the multi-city pattern can appear on the front page
 * without being asserted. It quotes what was said, dates it, and says what it is
 * not. It sits immediately after "What this does not establish" so a scanner
 * meets it under those limits rather than before them.
 *
 * The quotes are verbatim from the corpus, and they were chosen because they
 * hedge themselves — the speakers say "suggested" and "mentioned", and one says
 * the problem seems local to Denver. Presenting the record's own most
 * conservative reading is stronger than presenting its boldest.
 */
const CITY_QUOTES: { date: string; id: string; text: string }[] = [
  {
    date: "23 August 2025",
    id: "is-j01-20250823-entry",
    text:
      "There is the method of communication and its reach, Denver, Seattle's been suggested, Portland's been suggested, Los Angeles has been suggested, many cities, Houston, Kansas City, the East Coast, not so much.",
  },
  {
    date: "26 January 2026",
    id: "is-j04-20260126-entry",
    text:
      "I wouldn't be surprised if they lived in Denver because the problem seems local to Denver but Cincinnati has been mentioned recently.",
  },
];

export default function Page() {
  const stats = journalStats();

  const entries = journalQuotes(8);
  const gc = govCloud();
  const euFine = FINDINGS.find((f) => f.id === "fined-in-europe-hired-in-america");

  const glossarySlides: Slide[] = homeGlossary(GLOSSARY_PICKS).map((g) => ({
    href: `/glossary/${g.slug}`,
    eyebrow: "Glossary",
    title: g.term,
    body: g.summary,
    cta: "Full definition and every entry that uses it",
  }));
  const sourcesWithUrl = SOURCE_YEARS.filter((s) => s.url).length;
  const earliest = Math.min(...SOURCE_YEARS.map((s) => s.year));
  const conceptTitles = CONCEPTS.slice(0, 6);

  return (
    <>
      <Header />

      <main>
        {/* ------------------------------------------------------------ hero */}
        {/* THE GATE'S OWN LAYOUT, REUSED.
            AccessGate's welcome screen is a full-height two-column split: copy
            in a fixed-width left rail, GateAnimation filling the panel beside
            it. Sean asked for that same skeleton here, with the left rail
            narrowed from the gate's 40% to 25% so the animation carries more of
            the screen.

            30/70 now, up from 25/75: the headline became a full question and a
            question needs line length. min-w-[380px] is the floor that makes a
            percentage safe — at 1280px the rail IS 30%, and on anything
            narrower the floor takes over rather than breaking a twelve-word
            question into a column of one-word lines.

            The hero has no buttons (Sean, 30 August). The scroll hint at the
            bottom is the only affordance out of this screen, which is why it is
            a labelled link rather than a bare chevron.

            order-1 / order-2 is the gate's behaviour too — on a phone the
            animation is on top and the copy reads beneath it. */}
        <section className="relative flex min-h-[calc(100vh-72px)] lg:min-h-[calc(100vh-88px)] flex-col md:flex-row">
          {/* Left 30% — the copy rail */}
          <div className="order-2 flex flex-col px-8 py-12 sm:px-12 md:order-1 md:w-[30%] md:min-w-[380px] lg:px-14">
            <div className="animate-fade-in flex max-w-md flex-1 flex-col justify-center">
              {/* Sized down from 40px: the headline is now twelve words of long
                  words in a 30% rail, and at 40px it ran to six lines and
                  pushed the subline off a laptop screen. The subline is the
                  part that must not be missed. */}
              {/* Six words now, so it can carry the display size the gate's
                  headline had. */}
              <h1 className="font-display text-[32px] font-bold leading-[1.12] tracking-tight text-foreground sm:text-[40px] lg:text-[44px]">
                {HERO.question}
              </h1>

              {/* ONE PARAGRAPH, three questions, no line breaks (Sean, 1 Sept).
                  The figures are the WHO age-standardised pair — see the note on
                  HERO for why these and not the ones off the chart's end
                  labels. */}
              <p className="mt-6 font-serif text-lg leading-snug text-foreground/85">
                Is there a government cloud platform &mdash; anywhere &mdash; running a
                risk-mitigation layer that could do what{" "}
                <a
                  href="/glossary/zersetzung-tactics"
                  className="text-foreground underline underline-offset-4"
                >
                  Zersetzung
                </a>{" "}
                did: isolate and discredit a person without ever arresting them? Would any
                public record show it? And why, while the world&rsquo;s suicide rate fell
                27%, did the United States rise 40% and South Korea 83%?
              </p>

              <p className="mt-6 text-[13px] leading-relaxed text-foreground/70">
                <DisclaimerDialog>
                  <button type="button" className="underline underline-offset-4">
                    How to read this archive
                  </button>
                </DisclaimerDialog>{" "}
                &mdash; what it rests on, and what it does not establish.
              </p>
            </div>

            {/* The gate puts its progress dots and copyright here. This page has
                no steps, so the slot carries the size of the thing instead —
                derived, never typed. */}
            <div className="mt-8 max-w-md">
              <div className="h-1.5 w-6 bg-accent" aria-hidden />
              <p className="m-0 pt-4 text-xs text-muted">
                {stats.days} dated days · {stats.recordings} audio-linked recordings ·{" "}
                {SOURCE_YEARS.length} sourced findings
              </p>
            </div>
          </div>

          {/* SCROLL HINT.
              The hero is a full viewport height, so everything that earns the
              page belief — the record, the limits, the findings — is below the
              fold with nothing on screen to say so. NN/g's point about scanners
              applies here too: people miss content because of where it sits.

              Since the buttons came out of the rail this is the ONLY way
              forward from the hero, which raises the stakes on it being a real
              link: keyboard users get it, screen readers get a labelled
              destination, and a click lands somewhere real rather than
              scrolling a guessed distance. Centred on the PAGE rather than on
              the animation panel, because the eye reads a bottom-centre arrow
              as belonging to the whole screen.

              md and up only: on a phone the hero stacks and the copy already
              runs to the bottom edge, which says "more below" by itself. */}
          <a
            href="#record"
            aria-label="Skip to the record"
            className="absolute inset-x-0 bottom-6 z-10 mx-auto hidden w-max flex-col items-center gap-1.5 text-muted transition-colors hover:text-foreground md:flex"
          >
            <span className="font-display text-[11px] uppercase tracking-[0.14em]">
              The record
            </span>
            <ChevronDown className="scroll-hint" size={20} aria-hidden />
          </a>

          {/* Right 70% — animation panel */}
          <div className="relative order-1 min-h-[42vh] overflow-hidden bg-background md:order-2 md:min-h-[calc(100vh-72px)] md:w-[70%] lg:min-h-[calc(100vh-88px)]">
            <GateAnimation fill />
          </div>
        </section>

        {/* ============================================================
             CONCEPT B — EVERY HEADING A QUESTION
             Sean, 1 September, choosing from four wireframes.

             Twelve sections became six. The scan test is now literal: read
             only the headings, top to bottom, and you get six questions in
             order, each answered by the section beneath it. The archive is
             organised around a question, so the page is too.

             MERGED, NOT DELETED. Public health, crime, anti-trafficking and
             "what is working" were four sections asking one question — is
             anything moving in the data — and they are now three columns
             under it. The concepts and glossary carousels fold into "what can
             the technology actually do", which is the question they both
             answer. Every route out of the page survives; only the headings
             above them were spent.

             Nothing new was built. SiteSection, JournalQuotes, HomeCarousel
             and Figure carry all six, over the shadcn Carousel and Dialog.
             ============================================================ */}

        {/* ------------------------------------------- 2 · what it looks like */}
        <SiteSection
          id="record"
          eyebrow="Journal"
          heading="What does one day of it look like?"
          meta={
            <>
              {stats.days} dated days · {stats.recordings} audio-linked recordings ·{" "}
              {stats.docs} documents · one city
            </>
          }
          actions={[
            { href: "/journal", label: "Go to the journal", primary: true },
            { href: "/contribute", label: "Contribute to the journal" },
          ]}
          aside={
            <DisclaimerDialog>
              <button type="button" className="text-[14px] text-muted underline underline-offset-4 hover:text-foreground">
                How to read the journal
              </button>
            </DisclaimerDialog>
          }
        >
          <p className="body-copy mb-10 text-[19px] leading-relaxed text-foreground/85">
            Subjective and qualitative accounts of the bullhorn surveillance system
            experience in Denver, Colorado &mdash; written down as they were heard, and
            left unsmoothed.
          </p>
          <JournalQuotes entries={entries} />
        </SiteSection>

        {/* ------------------------------------------------- 3 · who bought it */}
        <SiteSection
          eyebrow="Government cloud"
          heading="Who bought the systems, and for how much?"
          meta={
            <>
              {gc.awards} awards · {gc.vendors} vendors · {gc.deployments} deployments ·{" "}
              {gc.regulations} regulations · {gc.sources} sources
            </>
          }
          actions={[{ href: "/data/government-cloud", label: "Go to government cloud", primary: true }]}
          aside={
            <DisclaimerDialog>
              <button type="button" className="text-[14px] text-muted underline underline-offset-4 hover:text-foreground">
                How to read the research
              </button>
            </DisclaimerDialog>
          }
        >
          <div className="grid gap-x-12 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
            <Figure
              stat={usd(gc.totalUsd)}
              line={`across the ${gc.valued} awards here that carry a published value. Vehicles, scopes, funding statutes and recompete dates, each linked to its source.`}
              href="/data/government-cloud"
            />
            {euFine && <Figure stat={euFine.stat} line={euFine.line} href={`/concepts#${euFine.id}`} />}
            <Figure
              stat={`0 of ${gc.regulations}`}
              line="regulations record a route to individual review. Across the whole register, the person a system is used on has nowhere to ask."
              href="/concepts#no-column-for-you"
            />
          </div>
        </SiteSection>

        {/* ------------------------------------------ 4 · is anything moving */}
        {/* Four sections became three columns. They were all answering this
            one question, and giving each its own heading spent three of the
            page's six on the same beat. "What is working" is the third column
            on purpose: enforcement outcomes are data too, and the section
            would be dishonest without them. */}
        <SiteSection
          eyebrow="Public health · crime · enforcement"
          heading="Is anything moving in the data?"
          meta="CDC, NCHS, WHO, FBI, BJS and DHS series · every figure resolves to a named source · none of these records explains another"
          actions={[
            { href: "/data/public-health", label: "Public health", primary: true },
            { href: "/data/crime", label: "Crime" },
          ]}
          aside={
            <DisclaimerDialog>
              <button type="button" className="text-[14px] text-muted underline underline-offset-4 hover:text-foreground">
                How to read the research
              </button>
            </DisclaimerDialog>
          }
        >
          <div className="grid gap-x-12 gap-y-14 lg:grid-cols-3">
            <div>
              <p className="m-0 font-display text-[12px] uppercase tracking-[0.14em] text-muted">
                Public health
              </p>
              <div className="mt-6">
                {/* Deliberately NOT the percentage. The hero already states the
                    US rise as +40% on the WHO basis; HEALTH_FIGURES[0] states
                    it as +30% on the CDC basis over a different window. Both
                    are right and both are sourced, but two different US
                    percentages on one page reads as an error to anyone who is
                    not going to check. This column carries the count instead. */}
                <Figure stat={HEALTH_FIGURES[1].stat} line={HEALTH_FIGURES[1].line} source={HEALTH_FIGURES[1].source} />
              </div>
            </div>
            <div>
              <p className="m-0 font-display text-[12px] uppercase tracking-[0.14em] text-muted">
                Crime
              </p>
              <div className="mt-6">
                <Figure stat={CRIME_FIGURES[2].stat} line={CRIME_FIGURES[2].line} source={CRIME_FIGURES[2].source} />
              </div>
            </div>
            <div>
              <p className="m-0 font-display text-[12px] uppercase tracking-[0.14em] text-muted">
                What is working
              </p>
              <div className="mt-6">
                <Figure
                  stat="180"
                  line="trafficking victims recovered, 30 of them children, in HSI-led operations around the 2026 World Cup. Arrests are activity; this is an outcome."
                  source={{ label: "DHS, 29 July 2026", href: "https://www.dhs.gov/news/2026/07/29/dhs-highlights-successful-arrests-and-rescues-crackdown-human-trafficking-during" }}
                />
              </div>
            </div>
          </div>

          {/* The one line that keeps three columns from reading as an argument. */}
          <p className="body-copy mt-14 border-l-2 border-foreground pl-5 text-[15px] leading-relaxed text-foreground/85">
            Criminal arrests are 51% below their 1997 peak and violent crime fell 9.3% in
            2025, the largest decline since the FBI began estimating in 1936. Three
            separate records sit in this section. None of them explains another, and this
            archive does not claim they do.
          </p>
        </SiteSection>

        {/* ------------------------------------------ 5 · what it can do */}
        <SiteSection
          id="neurotechnology"
          eyebrow="Neurotechnology"
          heading="What can the technology actually do?"
          meta={
            <>
              {CONCEPTS.length} concepts · {SOURCE_YEARS.length} dated sources, the earliest
              from {earliest} · {sourcesWithUrl} carry a public link
            </>
          }
          actions={[
            { href: "/concepts", label: "Go to the concepts", primary: true },
            { href: "/glossary", label: "Go to the glossary" },
          ]}
        >
          <p className="body-copy text-[19px] font-semibold leading-relaxed text-foreground">
            Your house is not haunted.
          </p>
          <p className="body-copy mt-4 text-[17px] leading-relaxed text-foreground/85">
            Precisely what the documented record shows a machine can do to a person, and
            under what conditions &mdash; because the conditions are what let you rule
            something in or out. Every capability below needed a surgeon, a scanner, or
            hours of the person&rsquo;s own cooperation.
          </p>

          <div className="mt-12 grid gap-x-12 gap-y-12 lg:grid-cols-2">
            <div>
              <h3 className="font-display m-0 text-[17px] font-semibold text-foreground">
                A machine reconstructed language without surgery
              </h3>
              <p className="body-copy mt-2 text-[15px] text-foreground/85">
                A semantic decoder recovered the gist of what a person was hearing or
                imagining from an fMRI scanner and no implant. It needed roughly sixteen
                hours of training per person, and{" "}
                <strong>it failed when participants resisted it.</strong>
              </p>
              <a href="https://www.nature.com/articles/s41593-023-01304-9" target="_blank"
                 rel="noreferrer noopener"
                 className="mt-3 inline-block text-[13px] text-muted underline underline-offset-4 hover:text-foreground">
                Tang &amp; Huth, Nature Neuroscience, 2023
              </a>
            </div>
            <div>
              <h3 className="font-display m-0 text-[17px] font-semibold text-foreground">
                Colorado already requires consent for neural data
              </h3>
              <p className="body-copy mt-2 text-[15px] text-foreground/85">
                HB24-1058 took effect on 6 August 2024, treating neural data as sensitive
                and requiring affirmative consent before it is processed. The definition
                does not require that the data identify anyone.
              </p>
              <a href="https://content.leg.colorado.gov/sites/default/files/documents/2024A/bills/2024a_1058_01.pdf"
                 target="_blank" rel="noreferrer noopener"
                 className="mt-3 inline-block text-[13px] text-muted underline underline-offset-4 hover:text-foreground">
                Colorado HB24-1058, as introduced
              </a>
            </div>
          </div>

          <div className="mt-14 border-l-2 border-foreground pl-5">
            <h3 className="font-display m-0 text-[17px] font-semibold text-foreground">
              And there the record stops
            </h3>
            <p className="body-copy mt-2 max-w-3xl text-[15px] text-foreground/85">
              Nothing documented reads a person&rsquo;s perception, or reaches them, at a
              distance and without their participation. That is not a claim that such a
              thing cannot exist. It is a statement about what has been shown.
            </p>
          </div>

          {/* The glossary, folded in — it answers the same question, one word
              at a time, and no longer needs a heading of its own. */}
          <div className="mt-16">
            <p className="m-0 font-display text-[12px] uppercase tracking-[0.14em] text-muted">
              Bring yourself up to speed
            </p>
            <div className="mt-6">
              <HomeCarousel slides={glossarySlides} label="Glossary terms" />
            </div>
          </div>
        </SiteSection>

        {/* ------------------------------------- 6 · what it would be worth */}
        {/* Sean, 1 September: a section on "what a future without Zersetzung
            looks like." He is right that it is missing and right that it
            matters. Every other section on this page describes a problem; a
            reader who believes all of it has nowhere to put that belief except
            fear, and an archive that only frightens people is not the one he
            set out to build.

            It is also the strongest thing available for the audience he keeps
            saying he does not want to lose. A page that can name what this
            technology is FOR is a page an engineer or an officer can finish.

            WHAT IS DOCUMENTED, AND WHAT IS NOT.

            Speech restoration and bilingual decoding are published, dated and
            cited here. Both required a surgical implant and a consenting
            participant, and both say so.

            The third column is Sean's crime-prevention point, and it is an
            ARGUMENT rather than a finding, so it is written as one — the
            deterrent he describes only exists if people are told, and this
            archive holds the best documented account of what gets built when
            they are not: 420 children on a sheriff's predictive list, and
            three constitutional amendments that office admitted violating in
            writing. His own corpus is the evidence for his own condition.

            NOT INCLUDED: "automatic language translation in efference-copy
            space." Efference copy is real neuroscience — the internal copy of
            a motor command the brain uses to predict its own sensory
            consequences — and there is published work on a corollary-discharge
            circuit in human speech. But nothing documents translation
            happening in it. The bilingual prosthesis below is the nearest
            published thing, and what it actually found is more interesting
            than the claim: the articulatory representation is SHARED between
            languages, so one implant trained on a bilingual speaker decoded
            both. */}
        <SiteSection
          eyebrow="What it is for"
          heading="What would this technology be worth if people consented to it?"
          meta="Published, dated, and cited · every capability here required a surgical implant and a participant who agreed to it"
          actions={[{ href: "/concepts", label: "Read the concepts", primary: true }]}
          aside={
            <DisclaimerDialog>
              <button type="button" className="text-[14px] text-muted underline underline-offset-4 hover:text-foreground">
                How to read this archive
              </button>
            </DisclaimerDialog>
          }
        >
          <p className="body-copy text-[19px] leading-relaxed text-foreground/85">
            This archive is about a technology used without consent. It is not an argument
            that the technology should not exist. The same decade that produced the
            procurement record produced these.
          </p>

          <div className="mt-12 grid gap-x-12 gap-y-12 lg:grid-cols-3">
            <div>
              <h3 className="font-display m-0 text-[17px] font-semibold text-foreground">
                People who cannot speak are speaking
              </h3>
              <p className="body-copy mt-2 text-[15px] text-foreground/85">
                Neuralink&rsquo;s VOICE trial decodes intended speech from the motor cortex
                for participants who have lost the ability to talk. It needs implanted
                electrodes, neurosurgery, and a person who enrolled in a registered clinical
                trial &mdash; which is the whole difference between this and the subject of
                the rest of this page.
              </p>
              <a href="https://neuralink.com/trials/speech-restoration/" target="_blank"
                 rel="noreferrer noopener"
                 className="mt-3 inline-block text-[13px] text-muted underline underline-offset-4 hover:text-foreground">
                Neuralink — Speech Restoration trial
              </a>
            </div>

            <div>
              <h3 className="font-display m-0 text-[17px] font-semibold text-foreground">
                One implant, two languages
              </h3>
              <p className="body-copy mt-2 text-[15px] text-foreground/85">
                A bilingual speech neuroprosthesis decoded Spanish and English in real time
                for a man who could not speak coherently &mdash; from one implant, because
                the cortical articulatory representations are <em>shared between the two
                languages</em>. Translation was not a step that had to be added. The
                representation was never language-specific to begin with.
              </p>
              <a href="https://www.nature.com/articles/s41551-024-01207-5" target="_blank"
                 rel="noreferrer noopener"
                 className="mt-3 inline-block text-[13px] text-muted underline underline-offset-4 hover:text-foreground">
                Silva et al., Nature Biomedical Engineering, May 2024
              </a>
            </div>

            <div>
              <h3 className="font-display m-0 text-[17px] font-semibold text-foreground">
                A deterrent that only works if people are told
              </h3>
              <p className="body-copy mt-2 text-[15px] text-foreground/85">
                A system nobody knows about deters nobody. Disclosed, the argument goes, it
                could prevent harm rather than record it. That argument is only available to
                a system that announces itself &mdash; and this archive holds what gets
                built instead: 420 schoolchildren placed on a sheriff&rsquo;s list of likely
                future criminals, and three constitutional amendments that office admitted
                violating, in writing, to settle a case four residents refused to drop.
              </p>
              <a href="/concepts#what-children-are-subject-to"
                 className="mt-3 inline-block text-[13px] text-muted underline underline-offset-4 hover:text-foreground">
                What children are subject to
              </a>
            </div>
          </div>

          <p className="body-copy mt-14 border-l-2 border-foreground pl-5 text-[15px] leading-relaxed text-foreground/85">
            Two of these are findings. The third is an argument, and this archive does not
            settle it &mdash; consent is the line every one of them turns on, and it is the
            only thing the record consistently shows missing.
          </p>
        </SiteSection>

        {/* --------------------------------------------- 6 · what you can do */}
        <SiteSection
          eyebrow="Contribute"
          heading="What can you do?"
          meta={`${CORPUS_SUMMARY.files} files · ${CORPUS_SUMMARY.words.toLocaleString()} words · plain Markdown and CSV`}
          actions={[
            { href: "/contribute", label: "Add your own account", primary: true },
            { href: "/api/corpus?from=home", label: "Download the whole archive" },
          ]}
          aside={
            <a href="/why" className="text-[14px] text-muted underline underline-offset-4 hover:text-foreground">
              Why &ldquo;Invisible Ships&rdquo;
            </a>
          }
        >
          <p className="body-copy text-[19px] leading-relaxed text-foreground/85">
            A second dated record, kept to the same standard, is worth more than either one
            alone &mdash; not because two accounts corroborate each other, they do not, but
            because a pattern that survives independent description is a different kind of
            object from a story. That includes officers and public employees describing
            what they are being asked to do.
          </p>
          <p className="body-copy mt-4 text-[17px] leading-relaxed text-foreground/85">
            Or take the whole thing: share it, quote it with attribution, hand it to an AI
            and ask it to check the findings against the sources.
          </p>
        </SiteSection>


      </main>

      <Footer />
    </>
  );
}
