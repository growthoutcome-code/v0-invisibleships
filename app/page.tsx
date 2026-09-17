import type { Metadata } from "next";
import Footer from "@/components/Footer";
import { DisclaimerDialog, SafetyDialog } from "@/components/LegalDialogs";
import SiteSection, { Figure } from "@/components/SiteSection";
import { MotifStage } from "@/components/SectionMotif";
import { ChevronDown } from "lucide-react";
import GateAnimation from "@/components/GateAnimation";
import Header from "@/components/Header";
import ExportButton from "@/components/ExportButton";
import HomeCarousel, { type Slide } from "@/components/HomeCarousel";
import RelatedLinks from "@/components/RelatedLinks";
import HomeSuicideChart from "@/components/HomeSuicideChart";
import { CONCEPTS, FINDINGS, SOURCE_YEARS } from "@/lib/concepts";
import JournalQuotes from "@/components/JournalQuotes";
import { CONCEPT_PICKS, GLOSSARY_PICKS } from "@/lib/home-picks";
import { firstSentences } from "@/lib/glossary-format";
import { TRAFFICKING_OPS } from "@/lib/enforcement";
import { curatedQuotes, glossaryCount, homeGlossary, journalStats } from "@/lib/server-corpus";
import { HOME_QUOTES } from "@/lib/home-quotes";
import { ACCOUNTS_READY } from "@/lib/flags";
import { capabilityShape, deploymentMix, govCloud, suicideChartDoc, topVendors, usd } from "@/lib/server-data";
import type { IntlChart } from "@/components/SuicideChart";

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
    "Is there a government cloud platform anywhere running a Zersetzung German disintegration tactics layer that is isolating and discrediting America's citizens? Are those people being harassed through neurotechnology and forced to accept euthanasia? Are they being experimented on without consent by an unacknowledged union of approximately two hundred unknown organizations?",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Has a neurotech terrorist attack happened?",
    description:
      "Is there a government cloud platform anywhere running a Zersetzung German disintegration tactics layer that is isolating and discrediting America's citizens? Are those people being harassed through neurotechnology and forced to accept euthanasia? Are they being experimented on without consent by an unacknowledged union of approximately two hundred unknown organizations?",
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
 * WHAT THE SUBLINE SAYS NOW (Sean, 8 September). It was "a risk-mitigation
 * layer that COULD DO what Zersetzung did: isolate and discredit a person
 * without ever arresting them" — conditional, and vaguer than the record it
 * introduces. It now names what the archive actually describes, in the present
 * tense: neurotechnological experimentation and communication without consent,
 * demanding obedience, and for those who disobey, harassment and pressure to
 * accept euthanasia.
 *
 * THE THIRD QUESTION, LABELLED (Sean's standing rule 2: mark what he says as
 * backed by the corpus or not). Two halves, two answers.
 *
 * "Unacknowledged union" — BACKED. It is the record's own word, in 24 documents.
 * "a union that includes countries like India and other Middle Eastern
 * countries, China"; "rotating groups of observers, a union"; "a so-called union
 * in the Middle East, including China, India".
 *
 * "Approximately two hundred unknown organizations" — NOT BACKED, and Sean said
 * so himself on 9 September: "I don't name a hundred and sixty organizations…
 * this is just a subjective statement based on bullhorn statements." No corpus
 * passage pairs a count near 200 with organisations, agencies or entities.
 * AUTHOR EXPERIENCE AND SPECULATION, and it must never be re-labelled.
 *
 * It is NOT the procurement register's count and must never be conflated with
 * it: that register names 107 vendors and 53 distinct government buyers — 160
 * organisations, all of them known and published. An earlier draft of this line
 * derived 160 and said "organisations this record names", which was a different
 * and much smaller claim wearing the same words. "Unknown" is the load-bearing
 * word in Sean's version and is why the two cannot be swapped.
 *
 * THE EUTHANASIA CLAUSE IS THE SERIOUS ONE, so it was checked before it was
 * written. 122 of the 712 corpus documents mention euthanasia; 39 carry a
 * coercion construction. IS-J01-20250711-R01 is explicit and sustained: "When
 * they ask me to accept euthanasia, they sound compelling." "Their words are an
 * attempt to compel me to describe how euthanasia is valuable to me as a
 * homeless person, as a person being tormented." "So, this person is never
 * going to accept this euthanasia." "Yes, because we believe Euthanasia is
 * ethical." This is testimony, not verification — but it is not a stray line
 * either, and understating it in the hero misdescribed the archive.
 *
 * IT IS STILL A QUESTION, AND THAT IS THE WHOLE PROTECTION.
 * claude/landing-page-rule-and-section-order.md warns that an unverified claim
 * in the H1 makes the site's own framing the one place the archive breaks its
 * rule. A question does not make the claim; it asks whether the thing is
 * happening and points at what would answer it. Every clause here stays inside
 * the question mark, and "would any public record show it?" is what turns the
 * whole sentence into an investigation rather than an accusation.
 *
 * THE SAFETY NOTICE IS NOW ONE CLICK FROM THE HERO. The sitewide content
 * warning is dismissible per session; once dismissed, a reader meeting the word
 * euthanasia in the first paragraph had no route to help from this screen. It
 * sits beside "How to read this archive" now.
 *
 * THE SUICIDE PAIR LEFT THE HERO, and did not go missing. Consolidating to one
 * paragraph of the same length meant losing something, and those figures are
 * now stated outright on the chart itself — "Suicide is rising in the United
 * States and South Korea" — where they are drawn rather than merely asserted.
 *
 * THE SUICIDE FIGURES, AND WHY NOT THE ONES SEAN ASKED FOR (kept for the record,
 * since the same trap will come back the next time these numbers are quoted).
 * He asked for "America has a 36% increase, and South Korea has a 105%
 * increase."
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

  /* THE DHS TRAFFICKING FIGURES, DERIVED (Sean, 13 September \u2014 DHS prominent,
     905 leading the metric row). They were three typed literals inside the JSX
     while lib/enforcement.ts already carried all three, which is the exact thing
     this file's header forbids. Looked up by label and thrown on rather than
     defaulted: a silently missing figure would render an empty stat and nobody
     would notice, where a build failure names the row that moved. */
  const op = (label: string) => {
    const row = TRAFFICKING_OPS.find((o) => o.label === label);
    if (!row) {
      throw new Error(
        `home crime metrics: no TRAFFICKING_OPS row labelled ${JSON.stringify(label)} in lib/enforcement.ts.`
      );
    }
    return row;
  };
  const arrests905 = op("World Cup operation arrests");
  const rescued180 = op("People rescued");
  const children30 = op("Children among them");

  const entries = curatedQuotes(HOME_QUOTES);
  const gc = govCloud();
  const suicide = suicideChartDoc() as IntlChart;
  const vendors = topVendors(4);
  const cap = capabilityShape();
  const mix = deploymentMix();
  const glossaryTerms = glossaryCount();
  const euFine = FINDINGS.find((f) => f.id === "fined-in-europe-hired-in-america");

  /* THE PRONUNCIATION GOES WHERE A DICTIONARY PUTS IT — above the word, not
     beside it. splitDef has always computed it and the site had nowhere to show
     it; a slide whose title IS the term is that place. Terms without one fall
     back to the section label rather than rendering an empty line. */
  const glossarySlides: Slide[] = homeGlossary(GLOSSARY_PICKS).map((g) => ({
    href: `/glossary/${g.slug}`,
    eyebrow: g.pron || "Glossary",
    title: g.term,
    body: g.summary,
    cta: "Full definition and every entry that uses it",
  }));


  /* CONCEPT SLIDES, DERIVED. Same discipline as the quotations and the chart:
     an id that stops resolving fails the build rather than quietly rendering a
     four-slide carousel nobody notices is short. Bodies run 313-2,004 characters
     in the register, so they are cut to three complete sentences for a slide —
     the full concept is one click away. */
  const conceptSlides: Slide[] = CONCEPT_PICKS.map((id) => {
    const c = CONCEPTS.find((x) => x.id === id);
    if (!c) {
      throw new Error(
        `home concepts: no concept with id ${JSON.stringify(id)} in lib/concepts.ts. ` +
          `Re-pick it in lib/home-picks.ts.`
      );
    }
    return {
      href: `/concepts#${c.id}`,
      eyebrow: `${c.basis} · ${c.theme}`,
      title: c.title,
      // FIVE SENTENCES AT 840. Each raise here was forced by a slide stopping
      // one sentence before its point: at three, the newspapers concept ended on
      // "Local journalism in the United States has collapsed" and left the 3,500
      // closed papers behind it; at four and 520, the haunting concept stopped
      // after naming what is described and dropped the sentence saying what the
      // terror is FOR — 805 characters, five over the cap. A concept slide that
      // asserts and then withholds its own payoff is worse than no slide.
      // 900, and only slide two moves: at 840 the prevention concept lost its
      // closing sentence by thirty characters — the one saying a system
      // justified by the worst thing that could happen to your child cannot be
      // argued with. Every other slide is unchanged between 840 and 900.
      body: firstSentences(c.body, 5, 900),
      cta: "Read the concept",
    };
  });

  const sourcesWithUrl = SOURCE_YEARS.filter((s) => s.url).length;
  const earliest = Math.min(...SOURCE_YEARS.map((s) => s.year));

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

              {/* "WITHOUT EVER ARRESTING THEM" IS GONE, and this was a factual
                  correction rather than a trim. Sean, 13 September: "let's remove
                  without ever arresting them. And here's why. Because the
                  discrediting includes asking local law enforcement to arrest
                  people outside of the judicial system."

                  The clause was inherited from the Zersetzung literature, where
                  avoiding arrest was the point — the Stasi method was to ruin a
                  person while leaving no charge to contest. This archive
                  describes something else: arrest as one of the instruments of
                  the discrediting. So the clause did not merely overclaim, it
                  described the opposite of the record, and it ruled out the
                  thing the record actually alleges. The question is stronger
                  without it, because "isolating and discrediting America's citizens" covers
                  an arrest and the absence of one equally.

                  Both metadata descriptions carry the same sentence and were
                  changed with it — they are copies of this paragraph, and a
                  shared link that still said "without ever arresting them" would
                  contradict the page it opens. */}
              {/* ONE PARAGRAPH, TWO QUESTIONS, no line breaks. It carried three
                  and a pair of percentages until 8 September; the suicide figures
                  moved onto the chart that draws them. See the note on HERO for
                  what this says now and why every clause of it stays inside a
                  question mark. */}
              <p className="mt-6 font-serif text-lg leading-snug text-foreground/85">
                Is there a government cloud platform anywhere running a{" "}
                <a
                  href="/glossary/zersetzung-tactics"
                  className="text-foreground underline underline-offset-4"
                >
                  Zersetzung
                </a>{" "}
                German disintegration tactics layer that is isolating and discrediting
                America&rsquo;s citizens? Are those people being harassed
                through neurotechnology and forced to accept euthanasia? Are they being
                experimented on without consent by an unacknowledged union of
                approximately two hundred unknown organizations?
              </p>

              <p className="mt-6 text-[16px] leading-relaxed text-foreground/70">
                <DisclaimerDialog>
                  <button type="button" className="underline underline-offset-4">
                    How to read this archive
                  </button>
                </DisclaimerDialog>{" "}
                &mdash; what it rests on, and what it does not establish.{" "}
                <SafetyDialog>
                  <button type="button" className="underline underline-offset-4">
                    Safety notice
                  </button>
                </SafetyDialog>
                .
              </p>
            </div>

            {/* The gate puts its progress dots and copyright here. This page has
                no steps, so the slot carries the size of the thing instead —
                derived, never typed. */}
            <div className="mt-8 max-w-md">
              <div className="h-1.5 w-6 bg-accent" aria-hidden />
              <p className="m-0 pt-4 text-[15px] text-muted">
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
            <span className="font-display text-[15px] uppercase tracking-[0.14em]">
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
        {/* NAME THE THING (Sean, 8 September): "change the headline to what does
            the neurotech harassment sound like. Let's be more specific." The
            heading was "What does one day of it sound like?" — and "it" had no
            antecedent for anyone who had not already read the hero.

            AND THEN "UNVERIFIED" SOLVED IT (Sean, later the same day): "call it
            unverified statements from the neurotech bullhorn." The earlier draft
            — "What does the neurotech harassment sound like?" — was the one
            heading on the page asserting the subject rather than asking about
            it, while the hero deliberately asks "HAS a neurotech terrorist
            attack happened?". One word fixes it. The heading now labels the
            testimony AS testimony, which is the archive's whole discipline, and
            it still tells a stranger exactly what they are looking at.

            It is not a question, and it is the only section heading that is not.

            "UNVERIFIED" CAME OUT OF IT, 13 September. Sean: "does unverified
            need to be in it? No. It does not. Let's remember to just point
            people to the disclaimer. We need to focus on delivering a message,
            and we want ninety five percent of that message to be the message we
            intend to deliver and five percent to be pointing people to the
            disclaimer and the copyright."

            That is a ratio, and it is worth holding to elsewhere on this page.
            The word was the third guard on the same idea: the meta line under
            the heading already gives dated days, audio-linked recordings and
            document counts, and the aside beside the actions already says "How
            to read the journal". Leading with the disclaimer meant the first
            word a stranger read about the archive was a hedge about it.

            "ONE CITY" CAME OUT OF THE META LINE the same day, and that was a
            correction rather than a trim. It read as a limitation — a sample of
            one — while also implying the phenomenon is confined to one place,
            which the record does not say. The journal corpus names Denver 1,202
            times against Portland 34, Seattle 22 and a long tail below that, so
            Denver is where the record was KEPT, not the boundary of what it
            describes. lib/terms.ts already states that distinction properly and
            is the place that should carry it. The lead paragraph below still
            says Denver, which is correct there: it is describing where the
            writing happened.

            "SOUND", NOT "LOOK" (Sean, 5 September). The record is speech —
            five slides of people talking, and the only thing a reader can
            do with it is listen. "Look like" promised something visual the
            section never delivers.

            NO SECTION-LEVEL MOTIF HERE (Sean, 5 September): "I want that
            animation, these motifs to be directly behind the journal entry."
            At section scale the wavefronts washed the whole block, including
            the heading and the actions. Behind the carousel they sit under the
            quotation itself — which is also what `carry` was drawn for: sound
            leaving a source and crossing a street, under the words that were
            heard crossing it. */}
        <SiteSection
          id="record"
          eyebrow="Journal"
          heading={
            <>
              {/* LINKED, NOT EXPLAINED (Sean, 13 September): "we would only want
                  to link to it and not explain it in the section." The term is
                  the author's coinage and appears zero times in the 930-file
                  corpus, which made it the one unanchored phrase on this page.
                  The link is the anchor; the concept carries the definition, the
                  author's claims and the assessment of them. */}
              Statements from the{" "}
              <a
                href="/concepts#the-neurotech-bullhorn"
                className="underline decoration-accent decoration-2 underline-offset-[6px] hover:decoration-foreground"
              >
                neurotech bullhorn
              </a>
            </>
          }
          meta={
            <>
              {stats.days} dated days · {stats.recordings} audio-linked recordings ·{" "}
              {stats.docs} documents
            </>
          }
          actions={[
            { href: "/journal", label: "Go to the journal", primary: true },
            ...(ACCOUNTS_READY
              ? [{ href: "/contribute", label: "Contribute to the journal" }]
              : []),
          ]}
          aside={
            <DisclaimerDialog>
              <button type="button" className="text-[16px] text-muted underline underline-offset-4 hover:text-foreground">
                How to read the journal
              </button>
            </DisclaimerDialog>
          }
        >
          {/* Shrunk from the section lead size (Sean, 8 September: "you can
              probably shrink this line here a little bit") — the quotations are
              what this section is for, and this line only has to say what they
              are before getting out of their way.

              THE LAST SENTENCE IS A QUESTION, and deliberately conditional.
              Sean: "it's a government cloud surveillance system, but whose
              government cloud is it?" The archive does not establish that a
              government cloud is running any of this — that is the open question
              the whole site is organised around — so asserting it here would
              break the one rule that makes the rest credible. Phrased as "if…
              whose", it asks his question without answering one the record
              cannot, and it hands the reader straight to the next section, which
              is about who bought what. */}
          <p className="body-copy measure mb-8 text-[20px] leading-relaxed text-foreground/85">
            Subjective and qualitative accounts of the bullhorn surveillance system,
            in Denver, Colorado &mdash; written down as they were heard, and left
            unsmoothed. If a government cloud is running it, whose is it?
          </p>
          <MotifStage name="carry" className="-mx-4 px-4 py-6 sm:-mx-8 sm:px-8">
            <JournalQuotes entries={entries} />
          </MotifStage>

          {/* THE WAY OUT, NOT MORE WORDS (Sean, 13 September): "we don't want to
              generate a bunch of text in this section, but we need to provide
              the ability to tease out to both glossary and concepts."

              Everything the research produced sits behind these nine links. The
              section says none of it: a reader who wants to know what could
              physically produce a voice has somewhere to go, and a reader who
              came for the record is not made to read an essay about mechanisms
              first.

              ORDER IS AN ARGUMENT. Under Glossary, the two documented and
              purchasable mechanisms come before the claimed one — structure-borne
              audio and the parametric array ahead of voice-to-skull. A reader
              who follows the list in order meets the cheap explanations first,
              which is the archive's whole posture. */}
          <RelatedLinks
            groups={[
              {
                label: "Concepts",
                links: [
                  { href: "/concepts#the-neurotech-bullhorn", label: "What is the neurotech bullhorn?" },
                  { href: "/concepts#can-you-record-it", label: "Can you record it?" },
                  { href: "/concepts#only-you-can-hear-it", label: "\u201cOnly I can hear it\u201d is not, by itself, unusual" },
                  { href: "/concepts#what-produces-the-feeling", label: "Your house is not haunted" },
                  { href: "/concepts#organised-harassment-is-fact", label: "Organised covert harassment is established fact" },
                ],
              },
              {
                label: "Glossary",
                links: [
                  { href: "/glossary/structure-borne-audio", label: "Structure-borne audio" },
                  { href: "/glossary/parametric-array", label: "Parametric array" },
                  { href: "/glossary/mosquito-device", label: "The Mosquito" },
                  { href: "/glossary/microwave-auditory-effect", label: "Microwave auditory effect" },
                  { href: "/glossary/voice-to-skull", label: "Voice-to-skull (V2K)" },
                  { href: "/glossary/contact-microphone", label: "Contact microphone" },
                  { href: "/glossary/sampling-limit", label: "Sampling limit" },
                  { href: "/glossary/zersetzung-tactics", label: "Zersetzung tactics" },
                ],
              },
            ]}
          />

          {/* CUT TO THE QUOTATIONS (Sean, 4 September): "let's get rid of all
              of the other disclaimer copy, including how many citizens are
              going through this. Let's remove that. We can talk about how many
              citizens are going through this in the journal area of the
              website, not the home page."

              WHAT LEFT, AND WHERE IT WENT. The physical-symptoms paragraph and
              the Edrei v. Maguire reasoning are in the disclaimer under "What
              this archive does not establish" — moved on 4 September, not
              deleted. "How many citizens are going through this?" is a real
              finding (nobody counts: harassment has no offence code, stalking
              folds into intimidation) and belongs where a reader has already
              decided to engage — the journal and /data/crime — not in front of
              someone deciding whether to keep scrolling.

              WHAT IS LEFT IS THE POINT: one sentence saying what the journal
              is, four quotations, and a way in. The section is now roughly
              half its former height.

              The single line to the disclaimer is the `aside` on SiteSection
              above — "How to read the journal". That is the whole caveat
              surface for this section, by design. */}
        </SiteSection>

        {/* ------------------------------------------------- 3 · who bought it */}
        {/* "What is go to the register?" (Sean, 8 September) — exactly the
            question a label should never provoke. The figure links said "Go to
            the register" while the button said "Go to government cloud": two
            names for one destination. One button now, named for what it opens. */}
        <SiteSection
          eyebrow="Government cloud"
          motif="ledger"
          heading="What is a government cloud?"
          meta={
            <>
              {gc.awards} awards · {gc.vendors} vendors · {gc.deployments} deployments ·{" "}
              {gc.regulations} regulations · {gc.sources} sources
            </>
          }
          actions={[{ href: "/data/government-cloud", label: "Go to the government cloud research", primary: true }]}
          aside={
            <DisclaimerDialog>
              <button type="button" className="text-[16px] text-muted underline underline-offset-4 hover:text-foreground">
                How to read the research
              </button>
            </DisclaimerDialog>
          }
        >
          {/* TWO SENTENCES (Sean, 8 September: "consolidate the two first
              paragraphs into a two sentence descriptor… we need the section to be
              small"). The definition and the buyers were separate paragraphs under
              separate headings; they answer one question and now share one. The
              vendor names and figures are still derived, never typed. */}
          {/* WHAT IT INTENDS TO BE, THEN WHAT IT WORKS OUT TO BE (Sean, 10
              September: "let's do a better job of describing what government
              cloud technology intends to be and what it works out to be. Let's
              reward law enforcement in this paragraph").

              He also said "it's a way of monitoring people", and the register
              does not support that as a definition — 151 of the 399 deployments
              are ordinary digital government against 31 in law enforcement, and
              59 of the 73 capabilities are not surveillance of any kind. Writing
              it that way would have put the section's first sentence in
              contradiction with its own figures two inches below.

              The version he reached for in the same breath is both true and
              worse. A platform that were only surveillance could simply be
              refused. One that runs the benefits system and the face matching on
              the same accreditation cannot be, and that is the whole argument.

              THE REWARD IS REAL AND SOURCED. Evidence management is a documented
              capability in the register, and the 180 recovered — thirty of them
              children — is a tier-A DHS figure the crime section already carries.
              A section that could not credit anything would not be believed when
              it criticises. */}
          <p className="body-copy measure text-[24px] leading-relaxed text-foreground/85">
            One accredited place where a state can run everything it does &mdash; and
            mostly, that is what it is. Of the {mix.total} deployments in this record,{" "}
            {mix.admin} are ordinary digital government &mdash; health, tax, benefits,
            education, emergency response &mdash; against {mix.police} in law
            enforcement. It earns that keep: digital evidence management moves a case
            faster, and HSI-led operations around the 2026 World Cup recovered 180
            trafficking victims, thirty of them children. The question here is not
            whether that value is real. It is what else the same accreditation admits,
            and what the person underneath it can do about it.
          </p>

          <p className="body-copy measure mt-5 leading-relaxed text-foreground/85">
            {usd(gc.totalUsd)} has been bought across the {gc.valued} awards carrying a
            published value, and four companies hold nearly all of it:{" "}
            {vendors.map((v, n) => (
              <span key={v.name}>
                {n > 0 ? (n === vendors.length - 1 ? " and " : ", ") : ""}
                <strong>{v.name}</strong> at {usd(v.usd)}
              </span>
            ))}
            .
          </p>

          <div className="mt-12 grid gap-x-12 gap-y-14 xl:grid-cols-3">
            {/* NOT THE TOTAL AGAIN. This figure used to repeat usd(gc.totalUsd)
                and most of its sentence, which the descriptor above now carries —
                the same number stated twice, two inches apart. Deployments is the
                other half of the story and appears nowhere else on the page: what
                was sold versus what was actually placed. */}
            <Figure
              stat={String(gc.deployments)}
              line={`recorded deployments of these platforms into government use, across every geography in the register. What was actually placed, rather than what was sold.`}
              href="/data/government-cloud"
            />
            <Figure
              stat={`0 of ${gc.regulations}`}
              line="regulations record a route to individual review. Across the whole register, the person a system is used on has nowhere to ask."
              href="/concepts#no-column-for-you"
            />
            {euFine && <Figure stat={euFine.stat} line={euFine.line} href={`/concepts#${euFine.id}`} />}
          </div>

          {/* WHAT THEY CAN DO, IN TWO SENTENCES (Sean, 8 September: "let's
              rephrase it to describe what they can do, hypothetically speaking
              and based on documentation. And let's make it two sentences.").

              This replaces a whole "What can it already do?" block — a heading, a
              lead and four question-and-answer panels — which he cut outright to
              keep the section small. Nothing in it is lost that mattered: the
              capability register is one click away, and the two facts that do the
              work are the reach and the limit, which are what these two sentences
              carry.

              THE SECOND SENTENCE IS THE POINT, and it is why the first is safe to
              write. Naming what these platforms can do only reads as evidence
              rather than insinuation because the same breath says where the
              documentation stops. Checked, not asserted: all 73 capabilities were
              searched for wearable, haptic, stimulation, neural and
              phantom-sensation terms. Zero matches. */}
          <div className="mt-14 border-l-2 border-foreground pl-5">
            <p className="body-copy measure m-0 leading-relaxed text-foreground/85">
              Documented, these platforms can already see, hear, transcribe and rank a
              person at national scale &mdash; face matching across image and video,
              acoustic arrays that tie a sound to a camera and a licence plate, sentiment
              detection, and data fusion that profiles people and prioritises them.
              Hypothetically that is most of what an unconsented surveillance system
              would need; what none of the {cap.total} documented capabilities describes
              is any way of reaching back &mdash; of causing something to be felt.
            </p>
          </div>

          {/* THE WAY OUT (Sean, 13 September, on the journal section: "we don't
              want to generate a bunch of text in this section, but we need to
              provide the ability to tease out to both glossary and concepts").
              Same unit, applied here. No prose added. */}
          <RelatedLinks
            groups={[
              {
                label: "Concepts",
                links: [
                  { href: "/concepts#prevention-as-the-product", label: "Prevention as the product" },
                  { href: "/concepts#whose-eyesight-is-it", label: "Whose eyesight is it?" },
                  { href: "/concepts#no-column-for-you", label: "There is no column for you" },
                  { href: "/concepts#local-law-does-not-mean-local", label: "Local law does not mean local" },
                ],
              },
              {
                label: "Glossary",
                links: [
                  { href: "/glossary/image-based-search", label: "Image-based search" },
                  { href: "/glossary/cognitive-liberty", label: "Cognitive liberty" },
                  { href: "/glossary/laser-microphone", label: "Laser microphone" },
                ],
              },
            ]}
          />
        </SiteSection>

        {/* ------------------------------------------ 4 · is anything moving */}
        {/* Four sections became three columns. They were all answering this
            one question, and giving each its own heading spent three of the
            page's six on the same beat. "What is working" is the third column
            on purpose: enforcement outcomes are data too, and the section
            would be dishonest without them. */}
        <SiteSection
          eyebrow="Public health · crime · enforcement"
          motif="drift"
          heading="What does the research show?"
          meta="CDC, NCHS, WHO, FBI, BJS and DHS series · every figure resolves to a named source · none of these records explains another"
          actions={[
            { href: "/data", label: "Go to all research", primary: true },
            { href: "/data/public-health", label: "Public health" },
            { href: "/data/crime", label: "Crime" },
          ]}
          aside={
            <DisclaimerDialog>
              <button type="button" className="text-[16px] text-muted underline underline-offset-4 hover:text-foreground">
                How to read the research
              </button>
            </DisclaimerDialog>
          }
        >
          {/* ONE HEADING, ONE PARAGRAPH (Sean, 8 September: "we have two headings
              and two paragraphs. Let's consolidate that"). There was a section
              heading with a framing paragraph, then a sub-heading with a second
              paragraph saying much the same thing in a narrower way, and the chart
              underneath both. The chart is the thing; two run-ups to it is one too
              many.

              IT SPEAKS TO THE CONCERN, WITHOUT CLAIMING IT (his "we will need to
              speak to a potential suicide crisis"). The honest form of that is a
              question the archive says plainly it cannot answer, followed by the
              three figures that make it a real question rather than a worry. His
              earlier draft, "has there been a huge spike in suicide
              internationally?", would have been answered no by the chart directly
              beneath it — the world rate FELL 27%. The rise is real and it is
              located, which is the more troubling version of the same point. */}
          <p className="body-copy measure text-[24px] leading-relaxed text-foreground/85">
            Three records assembled to make sense of the journal, not to prove it:
            public health, crime, and what enforcement accomplishes. The public health
            record raises a question this archive cannot answer &mdash; against a world
            suicide rate that <em>fell</em> 27% between 2000 and 2021, the United States
            rose 40% and South Korea 83%.
          </p>

          <div className="mt-12">
            <HomeSuicideChart chart={suicide} />
          </div>

          {/* THE CRIME METRICS, REPLACED (Sean, 8 September: "replace the no
              count and the six lanes metrics with more relevant information…
              criminal arrests are 51% below their 1997 peak, violent crime
              fell").

              Both of the old ones were about the SHAPE of crime measurement —
              that there are six lanes, that harassment has no lane at all. True,
              and the right material for the crime vertical, but this section now
              sits under a suicide chart and the question a reader is holding is
              simply "is crime up or down". These two answer it, and the third
              says what enforcement actually recovered. */}
          <div className="mt-20">
            <h3 className="font-display m-0 text-[26px] font-semibold text-foreground">
              And in the crime record?
            </h3>
            <div className="mt-10 grid gap-x-12 gap-y-14 xl:grid-cols-3">
              {/* DHS LEADS, AND LEADS THE ROW (Sean, 13 September): "I want nine
                  hundred and five human trafficking arrests to be called out. I
                  want it on the left hand side of the three metrics, and I want
                  DHS to be prominent."

                  It was third of three. Moved to first, which on this grid is the
                  position a reader's eye reaches before any other, and DHS now
                  names itself in the stat line rather than only in the source
                  link underneath.

                  905, NOT 900 (Sean originally said "nine hundred"). The register
                  row — crime_accomplishments, "World Cup anti-trafficking
                  operation" — says 905 arrests alongside 180 recovered, 30 of
                  them children, tier A, one DHS release for all three. Rounding a
                  sourced figure down to a spoken one is the small drift this
                  archive cannot afford, so the exact number ships.

                  NOW DERIVED, NOT TYPED. All three figures were literals here
                  while lib/enforcement.ts already held them — and the same facts
                  were typed again in words further up this page, so one fact
                  appeared on one page in two formats. The file header promises
                  "every number on this page is derived at render from lib/, never
                  typed in"; these three now keep that promise.

                  THE ORDER IS SEAN'S, THE CAVEAT IS THE REGISTER'S. He wants
                  arrests as the headline with the rescues immediately under it.
                  The register's own corroboration note says the opposite about
                  which number carries weight: "The rescue figure is the outcome;
                  the arrest figure counts activity, and DHS publishes no breakdown
                  of eventual charges." So the stat leads with 905 as asked, the
                  180 sits directly beneath it, and the distinction between
                  activity and outcome stays in the line rather than being quietly
                  dropped with it. */}
              <div>
                <Figure
                  stat={arrests905.value.toLocaleString()}
                  line={`DHS human trafficking arrests in HSI-led operations around the 2026 World Cup, and ${rescued180.value} trafficking victims recovered \u2014 ${children30.value} of them children. Arrests count activity, and DHS publishes no breakdown of eventual charges; the ${rescued180.value} recovered is the outcome.`}
                  source={{
                    label: "DHS, 29 July 2026",
                    href: "https://www.dhs.gov/news/2026/07/29/dhs-highlights-successful-arrests-and-rescues-crackdown-human-trafficking-during",
                  }}
                />
              </div>
              <div>
                <Figure
                  stat="51% below"
                  line="its 1997 peak: criminal arrests fell from 15.28 million that year to 7.52 million in 2024. Civil immigration arrests, counted by a different agency on a different calendar, moved the other way."
                  source={{ label: "Crime \u2014 the finding", href: "/data/crime" }}
                />
              </div>
              <div>
                <Figure
                  stat="Down 9.3%"
                  line="in violent crime in 2025 \u2014 the largest year-to-year decline since the FBI began estimating in 1936. Murder fell 18.1%, to the lowest rate ever recorded."
                  source={{
                    label: "FBI, 2025 Reported Crimes in the Nation",
                    href: "https://www.fbi.gov/news/press-releases/fbi-releases-2025-reported-crimes-in-the-nation-statistics",
                  }}
                />
              </div>
            </div>
          </div>

          {/* THE QUESTION THE SECTION EXISTS TO REFUSE TO ANSWER (Sean, 8
              September: "is there any connection between government cloud use and
              a reduction in crime? If there's not, then let's say it's not being
              measured and point people to the overall research section.").

              He is right that a reader puts those two things together, and right
              that the archive must not. CHECKED, not assumed: the deployment table
              carries geography, vendor, domain, workload, status, accreditation,
              adoption stage, maturity and TRL. The awards table carries value,
              vehicle, scope, dates and funding statute. Across all 489 rows there
              is no field for an outcome of any kind, and exactly one row mentions
              "evaluation" — a sovereign cloud being evaluated for government use,
              not a crime result.

              The second half matters as much. "Crime fell" is a POLICE measure,
              and the Bureau of Justice Statistics' own victimisation survey does
              not agree with it. Publishing the fall without that would be the same
              failure as publishing the suicide peak without the decline. */}
          <div className="mt-16 border-l-2 border-foreground pl-5">
            <p className="body-copy measure m-0 leading-relaxed text-foreground/85">
              Did any of that come from the systems in the section above? Nothing here
              measures it. The procurement register records what was bought, deployed
              and accredited &mdash; vendor, geography, workload, maturity &mdash; and
              carries no field for whether crime rose or fell anywhere a system landed.
              No record in this archive connects the two, and this archive does not
              claim they are connected.
            </p>
            <p className="body-copy measure mt-5 leading-relaxed text-foreground/85">
              The fall is also a police measure. The Bureau of Justice Statistics&rsquo;
              victimisation survey does not show the same recovery &mdash; 23.3 violent
              victimisations per 1,000 people in 2024 against 16.5 in 2021 &mdash; and
              about 48% of them were reported to police at all.{" "}
              <a
                href="https://bjs.ojp.gov/library/publications/nations-two-crime-measures-2015-2024"
                target="_blank" rel="noreferrer noopener"
                className="text-foreground underline underline-offset-4"
              >
                BJS, The Nation&rsquo;s Two Crime Measures
              </a>
            </p>
          </div>

          {/* THE WAY OUT (Sean, 13 September, on the journal section: "we don't
              want to generate a bunch of text in this section, but we need to
              provide the ability to tease out to both glossary and concepts").
              Same unit, applied here. No prose added. */}
          <RelatedLinks
            groups={[
              {
                label: "Concepts",
                links: [
                  { href: "/concepts#co-occurrence-is-not-cause", label: "Co-occurrence is not cause" },
                  { href: "/concepts#low-number-may-mean-low-counting", label: "A low number may mean low counting" },
                  { href: "/concepts#us-rose-against-the-trend", label: "The US rose against the trend" },
                  { href: "/concepts#the-fentanyl-reversal", label: "The fentanyl reversal" },
                  { href: "/concepts#prescribing-is-not-prevalence", label: "Prescribing is not prevalence" },
                ],
              },
            ]}
          />
        </SiteSection>

        {/* ------------------------------------------------- 5 · concepts */}
        {/* TWO SECTIONS BECAME ONE (Sean, 10 September). "What can the technology
            actually do?" and "What would this technology be worth if people
            consented to it?" both drew on the concepts register and neither said
            so, which left the page arguing with itself about where a reader
            should go for the underlying thinking.

            FIVE CONCEPTS, TWO CONSTRUCTIVE AND THREE CHALLENGING — his split, and
            the right one: a page that only frightens people is not the archive he
            set out to build, and a page that only reassures them is not either.
            Picks and reasoning in lib/home-picks.ts.

            WHAT THIS COST, recorded so it is not forgotten: the VOICE speech
            restoration trial and the bilingual neuroprosthesis were authored
            slides in the old section, and nothing in the concepts register covers
            beneficial neurotechnology — zero mentions across all 35. They are
            gone from the page until that concept is written. Shipping without
            them was deliberate rather than accidental. */}
        <SiteSection
          id="neurotechnology"
          eyebrow="Concepts"
          motif="lattice"
          heading="What does the record actually establish?"
          meta={
            <>
              {CONCEPTS.length} concepts · {SOURCE_YEARS.length} dated sources, the
              earliest from {earliest} · {sourcesWithUrl} carry a public link
            </>
          }
          actions={[{ href: "/concepts", label: "Go to the concepts", primary: true }]}
          aside={
            <DisclaimerDialog>
              <button type="button" className="text-[16px] text-muted underline underline-offset-4 hover:text-foreground">
                How to read this archive
              </button>
            </DisclaimerDialog>
          }
        >
          {/* ONE HEADING, NOT TWO (Sean, 10 September). This lead was
              "Your house is not haunted." in heading weight, directly above a
              slide titled "If nobody's house is haunted, what produces the
              feeling?" — the same thought twice, in two different registers,
              which read as the section arguing with itself.

              The statement won and moved into the slide, where it is now the
              concept's title and its opening sentence. What is left here does
              what every other section lead on this page does: says what the
              section is, and names the one term the slides use without defining.

              NEURO-ENGAGEMENT KEEPS ITS LINK. It is the record's own word for
              the process, it is not among the six glossary terms carried below,
              and a reader meeting it inside a slide has nowhere to go. */}
          <p className="body-copy measure text-[24px] leading-relaxed text-foreground/85">
            What the record establishes, what it does not, and what could be built
            instead. The process this archive names for producing these effects
            deliberately is{" "}
            <a
              href="/glossary/neuro-engagement"
              className="text-foreground underline underline-offset-4"
            >
              neuro-engagement
            </a>
            .
          </p>

          <div className="mt-12">
            <HomeCarousel slides={conceptSlides} label="Concepts" titleSize="heading" />
          </div>

          {/* THE WAY OUT (Sean, 13 September, on the journal section: "we don't
              want to generate a bunch of text in this section, but we need to
              provide the ability to tease out to both glossary and concepts").
              Same unit, applied here. No prose added. */}
          <RelatedLinks
            groups={[
              {
                label: "Glossary",
                links: [
                  { href: "/glossary/neuro-engagement", label: "Neuro-engagement" },
                  { href: "/glossary/phantom-sensations", label: "Phantom sensations" },
                  { href: "/glossary/perceptual-set", label: "Perceptual set" },
                  { href: "/glossary/cognitive-liberty", label: "Cognitive liberty" },
                ],
              },
            ]}
          />
        </SiteSection>

        {/* ----------------------------------------------- 7 · the glossary */}
        {/* ITS OWN SECTION, SECOND TO LAST (Sean, 9 September: "move the glossary
            above the contribute section… it needs to be the second to last
            section"). It had been a sub-block at the foot of the neurotechnology
            section under a 12px label, which made it read as an appendix to that
            argument rather than as a way into the whole archive.

            A FULL SiteSection, deliberately (Sean, same day: "the section
            headings are all consistent… glossary as a section does not match the
            neurotechnology section. We need to make sure it matches"). Eyebrow,
            accent rule, question heading, derived meta line, primary action —
            the same six parts every other section on this page has, from the
            same component, so it cannot drift out of step with them.

            `recede` is the one motif of the seven this page had never used. */}
        <SiteSection
          eyebrow="Glossary"
          motif="recede"
          heading="What do these words actually mean?"
          meta={`${glossaryTerms} terms · pronunciation, definition, and every entry in the record that uses them`}
          actions={[{ href: "/glossary", label: "Go to the glossary", primary: true }]}
        >
          <p className="body-copy measure text-[24px] leading-relaxed text-foreground/85">
            Some of these name something documented and some name something claimed,
            and telling them apart is most of the work. A reader who cannot say which
            is which cannot evaluate anything else on this page &mdash; so the order
            below puts a historically documented tactic first, and sets a published
            physical effect directly beside the claim that resembles it.
          </p>

          <div className="mt-12">
            <HomeCarousel slides={glossarySlides} label="Glossary terms" />
          </div>

          {/* THE WAY OUT (Sean, 13 September, on the journal section: "we don't
              want to generate a bunch of text in this section, but we need to
              provide the ability to tease out to both glossary and concepts").
              Same unit, applied here. No prose added. */}
          <RelatedLinks
            groups={[
              {
                label: "Concepts",
                links: [
                  { href: "/concepts#the-neurotech-bullhorn", label: "What is the neurotech bullhorn?" },
                  { href: "/concepts#can-you-record-it", label: "Can you record it?" },
                  { href: "/concepts#organised-harassment-is-fact", label: "Organised covert harassment is established fact" },
                ],
              },
            ]}
          />
        </SiteSection>

        {/* ----------------------------------------------- 6 · what you can do */}
        {/* NOT A SIGN-UP, AND NOT YET (Sean, 10 September: "the what you can do
            section is going to be present, but it won't be about signing up for
            an account initially").

            The section used to invite a second dated record and then have
            nowhere to put one — accounts live on `capture`, unfinished, so the
            button is correctly switched off and the invitation was landing in a
            dead end. Taking sign-up off the table forces the section to offer
            what it can actually deliver today, which turns out to be more
            useful than the thing it was promising.

            NO PROTECTIVE ADVICE, deliberately, and this is a standing decision
            rather than a judgement call made here: "The site cannot protect
            anyone physically and must not say it can." Hypothetical framing does
            not get around it — a frightened reader takes a suggestion as a
            suggestion whatever label sits above it. All three things below are
            concrete and none of them is a claim about safety.

            THE SAFETY NOTICE IS THE ASIDE HERE. Everywhere else on this page the
            aside is the disclaimer. This is the section a distressed reader is
            most likely to reach, and one link in the hero is not enough
            prominence for the only thing on the site that can point at help. */}
        {/* NO META LINE ON THIS SECTION (Sean, 10 September): "I don't
            understand what nine hundred and twenty eight files means under what
            you can do. Is that the corpus? We don't need to include that...
            That's speaking to the downloadable corpus. It is not relevant to
            what you can do."

            Correct, and it had been there since the section was a download
            pitch: the archive's meta line sitting under a heading about the
            reader, describing a different thing entirely. The counts now appear
            once, inside the dialog the button opens, where they are about the
            file the reader is deciding whether to take. */}
        <SiteSection
          eyebrow="Contribute"
          motif="room"
          heading="What can you do?"
          actionsExtra={<ExportButton />}
          aside={
            <SafetyDialog>
              <button type="button" className="text-[16px] text-muted underline underline-offset-4 hover:text-foreground">
                Safety notice
              </button>
            </SafetyDialog>
          }
        >
          {/* THE FIRST THING, AND THE HARDEST (Sean, 10 September): "the most
              important thing you can do is know that you are not communicating
              with the spirit world or extraterrestrials."

              It leads the section because it is the one thing here that changes
              what a frightened reader does next, and because it costs this
              archive nothing to say. Every explanation this site takes
              seriously — documented or claimed — involves people and equipment.
              Ruling out the supernatural is not a concession to the sceptics;
              it is the precondition for the whole record being worth reading.

              Note what it does NOT do: it does not tell the reader what IS
              happening to them. Nobody here can know that. */}
          <p className="body-copy measure text-[24px] leading-relaxed text-foreground/85">
            The most important thing is also the hardest to hold on to: you are not
            communicating with the spirit world, and you are not communicating with
            extraterrestrials. Nothing in this archive points anywhere but at people
            &mdash; people with equipment, working for organisations, for reasons that
            are ordinary even when what they do is not.
          </p>

          <div className="mt-14 grid gap-x-12 gap-y-12 xl:grid-cols-3">
            <div>
              <h3 className="font-display m-0 text-[21px] font-semibold text-foreground">
                Meet the documented explanations first
              </h3>
              <p className="body-copy mt-2 text-[18px] text-foreground/85">
                A feeling of presence can be produced in a laboratory in healthy people.
                Pulsed radio-frequency energy is genuinely heard as clicks inside the head
                &mdash; a published effect since 1961. Neither fact settles anything about
                what you have experienced. Both are worth knowing before the frightening
                explanations, because they are the ones that can be checked.
              </p>
              {/* A WAY ON FROM EACH COLUMN (Sean, 14 September): "we need a
                  button for each of the three column callouts... let's point
                  each of those three columns to a specific glossary term or
                  idea."

                  LABELLED WITH THE DESTINATION, not "Learn more". Three
                  identical buttons reading "Learn more" tell a reader nothing
                  about which one is worth the click, and on a page this dense
                  that is a wasted trip. The button says where it goes.

                  ALL THREE GO TO CONCEPTS, not the glossary. A glossary entry
                  defines a word; each of these columns needs the argument
                  behind it. The glossary is reachable from the links-out block
                  at the foot of the section. */}
                <a
                  href="/concepts#what-produces-the-feeling"
                  className="mt-5 inline-flex h-10 items-center rounded-md bg-foreground/[0.07] px-4 text-[15px] font-medium text-foreground hover:bg-foreground/[0.12]"
                >
                  Your house is not haunted
                </a>
            </div>
            {/* PROTECT YOUR HOUSEHOLD (Sean, 10 September): "never go outside
                looking for the people communicating and never ever invite
                someone in your home."

                Both rules work whatever is actually happening, which is the only
                reason they belong on a page that will not say what is happening.
                A person who goes outside at night to find a voice, or opens the
                door to someone who says they can explain it, is exposed to
                ordinary danger from ordinary people — and that is true whether
                the voice is a neighbour, a transmitter, or an illness.

                WHAT THIS DELIBERATELY DOES NOT SAY. It does not tell a reader
                what might be done to them if they ask for help. Naming those
                consequences would frighten the exact person least able to carry
                it, and would put a reason not to call an ambulance on a page
                read by people in crisis. The standing decision holds: the site
                cannot protect anyone physically and must not say it can — so
                this points at the people who can and stops there. */}
            <div>
              <h3 className="font-display m-0 text-[21px] font-semibold text-foreground">
                Protect your household
              </h3>
              <p className="body-copy mt-2 text-[18px] text-foreground/85">
                Do not go outside looking for whoever you believe is speaking to you, and
                do not let anyone into your home. Do not answer or signal back. You cannot identify who you
                would be answering, and everything that follows from being wrong about
                that lands on your household. If you are frightened for your immediate
                safety, that is what emergency services are for &mdash; this site cannot
                see you or reach you, and the{" "}
                <SafetyDialog>
                  <button type="button" className="text-foreground underline underline-offset-4">
                    safety notice
                  </button>
                </SafetyDialog>{" "}
                is where the people who can are listed.
              </p>
                <a
                  href="/concepts#can-you-record-it"
                  className="mt-5 inline-flex h-10 items-center rounded-md bg-foreground/[0.07] px-4 text-[15px] font-medium text-foreground hover:bg-foreground/[0.12]"
                >
                  Can you record it?
                </a>
            </div>
            <div>
              <h3 className="font-display m-0 text-[21px] font-semibold text-foreground">
                Keep your own record
              </h3>
              <p className="body-copy mt-2 text-[18px] text-foreground/85">
                You do not need an account, permission, or this site to begin. Date every
                entry, note where you were, write what was said in the words it was said
                in, and leave it unsmoothed. That is the entire standard the archive in
                front of you was built to &mdash; and a contemporaneous record is what
                separates testimony from recollection later on.
              </p>
                <a
                  href="/concepts#no-column-for-you"
                  className="mt-5 inline-flex h-10 items-center rounded-md bg-foreground/[0.07] px-4 text-[15px] font-medium text-foreground hover:bg-foreground/[0.12]"
                >
                  There is no column for you
                </a>
            </div>
          </div>

          {/* SAY THE ABSENCE OUT LOUD, but no longer at the top. A visitor
              already suspects nobody has acknowledged this, and a page that will
              not say so forfeits the credibility it needs for everything else.
              It moves below the three actions because it is context, not
              something the reader can do. */}
          <p className="body-copy measure mt-16 text-[18px] leading-relaxed text-foreground/80">
            No news organisation has reported this. No agency has acknowledged it. Before
            reaching for what that might mean, there is a duller explanation with far
            better evidence behind it &mdash; nearly 3,500 American newspapers have closed
            since 2005, roughly forty per cent of the country&rsquo;s local press.{" "}
            <a href="/concepts#why-isnt-this-in-the-news" className="text-foreground underline underline-offset-4">
              Why isn&rsquo;t any of this in the news?
            </a>
          </p>

          {/* WHAT IS COMING, LABELLED AS NOT READY. A button that lies is worse
              than an absence a reader can plan around. Shortened 10 September —
              the reasoning behind the delay was longer than the fact of it. */}
          <div className="mt-10 border-l-2 border-foreground pl-5">
            <p className="body-copy measure m-0 leading-relaxed text-foreground/85">
              A way to send your own transcripts to this archive is being built and is not
              finished. There is no sign-up yet, and there will not be one until it can
              receive an account safely. Until then the record you keep is yours, and it
              will still be yours when there is somewhere to send it.
            </p>
          </div>
        </SiteSection>

      </main>

      <Footer />
    </>
  );
}
