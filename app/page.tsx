import type { Metadata } from "next";
import Footer from "@/components/Footer";
import { ChevronDown } from "lucide-react";
import GateAnimation from "@/components/GateAnimation";
import Header from "@/components/Header";
import HomeCarousel, { type Slide } from "@/components/HomeCarousel";
import { CONCEPTS, FINDINGS, NOT_ESTABLISHED, SOURCE_YEARS } from "@/lib/concepts";
import { CORPUS_SUMMARY } from "@/lib/corpus-summary";
import EntryProse from "@/components/EntryProse";
import { GLOSSARY_PICKS } from "@/lib/home-picks";
import { homeGlossary, journalStats, latestEntry } from "@/lib/server-corpus";

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
  title: "Has an unintended neurotechnological terrorist attack happened in the United States of America?",
  description:
    "This archive does not answer that. It holds one resident's dated record from Denver — 120 days of entries, 298 recordings — the public procurement record, and what regulators found when they looked. Colorado has required consent to collect neural data since 2024, the first law of its kind anywhere. Every figure resolves to a named source, and the archive states plainly what none of it establishes.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Has an unintended neurotechnological terrorist attack happened in the United States of America?",
    description:
      "This archive does not answer that. It holds the dated record, the procurement record, and what regulators found — and what none of it establishes.",
    images: ["/og-default.png"],
  },
};

/**
 * THE HERO HEADLINE.
 *
 * Sean's sentence, as instructed:
 *   "Has an unintended neurotechnological terrorist attack happened in the
 *    United States of America?"
 *
 * THIS IS THE SERIES' OWN CLAIM, MOVED TO THE FRONT. It is not a new assertion
 * invented for a landing page. The Invisible Ships executive summary — in the
 * corpus, dated, downloadable — already describes "an unacknowledged terrorist
 * attack" and "a technology-driven phenomenon of communication targeting
 * citizens", and states that the author's role "is not to accuse any single
 * entity but to present patterns of perceived communication for further
 * investigation". A question mark is the posture those documents already take.
 *
 * WHAT THE QUESTION DOES AND DOES NOT DO. It asks whether something happened.
 * It names no perpetrator, no agency and no company, which is what keeps it
 * inside the Critical Disclaimer's own rule: the archive records that names were
 * said and makes no finding about any of them. A question about an event is a
 * different act from an accusation against a party, and this is the first.
 *
 * "UNINTENDED" IS DOING SOMETHING SPECIFIC, and it is worth not losing. The
 * series' word is "unacknowledged". "Unintended" says something else and
 * something stranger: that the harm may be real and nobody may have meant it —
 * a system with effects its operators did not choose. That is the reading most
 * protective of the law-enforcement and technology people Sean has said
 * repeatedly he does not want to accuse, and it is the reading the archive's
 * structural findings actually support: no column for the person a system is
 * used on, no route to individual review in 99 regulations. Nobody has to have
 * intended that for it to be true.
 *
 * THE SUBLINE DECLINES, as it did before, and that is what makes a question this
 * large publishable. The headline may ask; the next sentence refuses to answer,
 * and hands the reader what the archive actually holds so they can.
 *
 * Alternates, one line to swap:
 *   B  "Has an unacknowledged neurotechnological terrorist attack happened in
 *       the United States of America?" — the series' own word.
 *   C  "Are you being subjected to unconsented to neurotechnological
 *       communication and experimentation?" — the second-person version.
 *   D  "Is the world being exposed to unconsented neurotech experimentation?"
 */
const HERO = {
  question:
    "Has an unintended neurotechnological terrorist attack happened in the United States of America?",
  answer:
    "This archive does not answer that. It holds one resident's dated record from Denver, " +
    "the public procurement record, and what regulators found when they looked — and it " +
    "states plainly what none of it establishes.",
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

  // No selection: the last entry in the record, whatever it is.
  const last = latestEntry();
  const lastWhen = last
    ? new Date(`${last.date}T00:00:00Z`).toLocaleDateString("en-US", {
        weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "UTC",
      })
    : "";

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
              <h1 className="font-display text-[27px] font-bold leading-[1.15] tracking-tight text-foreground sm:text-[32px] lg:text-[34px]">
                {HERO.question}
              </h1>
              {/* The first sentence declines to answer. See the note on HERO. */}
              <p className="mt-5 font-serif text-lg leading-snug text-foreground/80">
                {HERO.answer}
              </p>
              <p className="mt-5 text-[13px] leading-relaxed text-foreground/70">
                Nothing here asks you to agree to anything before reading it.{" "}
                <a href="#not-established" className="underline underline-offset-4">
                  What this archive does not establish
                </a>
                .
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

        {/* NAMING. Journal, everywhere. The nav says Journal, the route is
            /journal, the section says Journal — a reader should never have to
            work out that three names are one place. The id stays #record only
            because the hero's scroll hint points at it.

            NO SUGGESTED ENTRIES, and no curation of any kind (Sean, 30 August).
            This is the last entry in the record, whatever it happens to be. It
            changes when the record changes and nobody chooses which face the
            archive shows — which is a stronger claim than any set of picks.

            FULLY EXPOSED, and set as the reading column rather than a card: no
            outline, no tint, no fixed height, no negative space held open
            around it. The entry is the content, not an item inside a component.
            The author's decision about his own words, with the site-wide
            content warning in front of them. */}
        <section id="record" className="scroll-mt-24">
          <div className="w-full px-5 py-20 sm:px-8 lg:px-[100px]">
            <p className="m-0 font-display text-[12px] uppercase tracking-[0.14em] text-muted">
              Journal
            </p>
            <h2 className="font-display m-0 mt-2 text-3xl font-semibold text-foreground sm:text-4xl">
              {stats.days} dated days, {stats.recordings} recordings, one city
            </h2>
            <p className="body-copy mt-5 max-w-3xl text-[19px] leading-relaxed text-foreground/85">
              Journal entries: subjective and qualitative accounts of the bullhorn
              surveillance system experience in Denver, Colorado.
            </p>

            {last && (
              <article className="mt-12 max-w-3xl">
                <p className="m-0 font-display text-[12px] uppercase tracking-[0.14em] text-muted">
                  The last entry · {lastWhen}
                  {last.location ? ` · ${last.location}` : ""}
                </p>
                {/* The reading face at reading size. This is the archive's
                    primary source and it should look like a document, not like
                    a pull quote from one. */}
                <EntryProse
                  body={last.body}
                  className="mt-6 font-serif text-[19px] leading-[1.65] text-foreground sm:text-[21px]"
                />
                <p className="mt-8">
                  <a
                    href={`/journal/${last.id}`}
                    className="text-[15px] text-foreground underline underline-offset-4"
                  >
                    Read the full entry
                  </a>
                </p>
              </article>
            )}

            <div className="mt-14 flex flex-wrap items-center gap-4">
              <a
                href="/journal"
                className="inline-flex h-12 items-center rounded-md bg-foreground px-6 text-[15px] font-medium text-background"
              >
                More journal entries
              </a>
              <span className="text-[14px] text-muted">
                All {stats.days} days and {stats.docs} documents, newest first.
              </span>
            </div>
          </div>
        </section>


        {/* ------------------------------- what this does NOT establish */}
        {/* Addressable since the hero became a question about a named city:
            the limits that question is asked under must be one click from it,
            not four screens down. */}
        {/* On a home page, above everything else it might claim. Most sites
            would never do this; it is the single strongest thing here. */}
        <section id="not-established" className="scroll-mt-24">
          <div className="w-full px-5 py-20 sm:px-8 lg:px-[100px]">
            <h2 className="font-display m-0 text-3xl font-semibold text-foreground">
              What this does not establish
            </h2>
            <p className="body-copy mt-4 max-w-2xl text-foreground/85">
              These four limits stand over every concept, chart and table in this archive.
              They are the conditions under which all of it was written.
            </p>
            <ol className="m-0 mt-6 max-w-3xl list-none space-y-4 p-0">
              {NOT_ESTABLISHED.map((limit, i) => (
                <li key={i} className="body-copy relative pl-8 text-foreground/85">
                  <span
                    aria-hidden
                    className="font-display absolute left-0 top-0 font-semibold text-foreground"
                  >
                    {i + 1}.
                  </span>
                  {limit}
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ------------------------------------------------- the cities */}
        {/* Beat four. Placed here on purpose: a scanner reaches it having just
            read the four limits, so the hedging below is read under them. */}
        <section>
          <div className="w-full px-5 py-20 sm:px-8 lg:px-[100px]">
            <p className="m-0 font-display text-[12px] uppercase tracking-[0.14em] text-muted">
              Testimony · verified by nobody
            </p>
            <h2 className="font-display m-0 mt-2 text-3xl font-semibold text-foreground sm:text-4xl">
              Cities keep being named. None of them are verified.
            </h2>
            <p className="body-copy mt-4 max-w-2xl text-foreground/85">
              Denver is where this record was kept. Other cities appear in the transcripts
              &mdash; Seattle, Portland, Los Angeles, Houston, Kansas City, Cincinnati,
              Cleveland &mdash; and the archive records that they were named. It makes no
              finding that anything has happened in any of them.
            </p>

            <div className="mt-8 max-w-3xl space-y-6">
              {CITY_QUOTES.map((q) => (
                <figure key={q.id} className="m-0 border-l-2 border-edge pl-5">
                  <blockquote className="body-copy m-0 text-[17px] leading-relaxed text-foreground/90">
                    &ldquo;{q.text}&rdquo;
                  </blockquote>
                  <figcaption className="mt-2 text-[13px] text-muted">
                    {q.date} ·{" "}
                    <a href={`/journal/${q.id}`} className="underline underline-offset-4">
                      read the entry
                    </a>
                  </figcaption>
                </figure>
              ))}
            </div>

            {/* The two facts that keep this section honest in both directions.
                It must not assert spread, and it must not deny it either. */}
            <div className="mt-10 max-w-3xl border-l-2 border-foreground pl-5">
              <p className="body-copy m-0 text-[15px] leading-relaxed text-foreground/85">
                Note the speakers&rsquo; own words: <em>suggested</em>,{" "}
                <em>mentioned recently</em>, <em>seems local to Denver</em>. The record&rsquo;s
                most cautious reading is inside the record.
              </p>
              <p className="body-copy m-0 mt-3 text-[15px] leading-relaxed text-foreground/85">
                And the transcripts are a small fraction of what was heard &mdash; a
                sample, not a census. That cuts both ways: it is why no count here
                measures how often anything was said, and why a city&rsquo;s absence from
                these pages is not evidence it was never named.
              </p>
            </div>
          </div>
        </section>

        {/* ------------------------------------- what the technology can do */}
        {/* Addressable: the hero asks a second-person question and this is the
            section that answers it. A reader who arrived frightened should be
            one click from the conditions, not five sections down. */}
        <section id="neurotechnology" className="scroll-mt-24">
          <div className="w-full px-5 py-20 sm:px-8 lg:px-[100px]">
            <p className="m-0 font-display text-[12px] uppercase tracking-[0.14em] text-muted">
              Neurotechnology
            </p>
            {/* This line was the hero headline until Sean moved it here, and it
                belongs here: it is a claim about what the technology can and
                cannot do, so it should sit on top of the evidence for that
                rather than on top of the whole archive. As a hero it asked the
                reader to take reassurance on trust. Here they can check it. */}
            <h2 className="font-display m-0 mt-2 text-4xl font-semibold text-foreground">
              Your house is not haunted.
            </h2>
            <p className="body-copy mt-4 max-w-2xl text-[17px] text-foreground/85">
              What the documented record actually shows a machine can do to a person, and
              under what conditions. The conditions are the part that lets you rule
              something in or out &mdash; and every capability below needed a surgeon, a
              scanner, or hours of the person&rsquo;s own cooperation.
            </p>

            <div className="mt-8 max-w-3xl space-y-8">
              <div>
                <h3 className="font-display m-0 text-xl font-semibold text-foreground">
                  A man with ALS is speaking again by thinking
                </h3>
                <p className="body-copy mt-2 text-foreground/85">
                  Neuralink&rsquo;s VOICE trial decodes intended speech from the motor
                  cortex. It requires implanted electrodes, neurosurgery, and a consenting
                  participant in a registered clinical trial.
                </p>
                <p className="mt-2 text-[14px] text-muted">
                  <a
                    href="https://neuralink.com/trials/speech-restoration/"
                    target="_blank"
                    rel="noreferrer noopener"
                    className="underline underline-offset-4"
                  >
                    Neuralink — Speech Restoration trial
                  </a>
                </p>
              </div>

              <div>
                <h3 className="font-display m-0 text-xl font-semibold text-foreground">
                  A machine has reconstructed language from brain activity without surgery
                </h3>
                <p className="body-copy mt-2 text-foreground/85">
                  A semantic decoder recovered the gist of what a person was hearing or
                  imagining, from an fMRI scanner and no implant at all. It needed roughly
                  sixteen hours of training data per person, and{" "}
                  <strong>it failed when participants resisted it.</strong>
                </p>
                <p className="mt-2 text-[14px] text-muted">
                  <a
                    href="https://www.nature.com/articles/s41593-023-01304-9"
                    target="_blank"
                    rel="noreferrer noopener"
                    className="underline underline-offset-4"
                  >
                    Tang &amp; Huth, Nature Neuroscience, 2023
                  </a>
                </p>
              </div>

              {/* The hero asserts this law, so the page has to resolve it to a
                  named source. Cited here rather than in the rail because the
                  rail is 30% wide and a citation does not belong in a headline.
                  TODO: this belongs in lib/concepts.ts SOURCE_YEARS as a dated
                  source so the corpus carries it too. */}
              <div>
                <h3 className="font-display m-0 text-xl font-semibold text-foreground">
                  Colorado already requires your consent to collect neural data
                </h3>
                <p className="body-copy mt-2 text-foreground/85">
                  HB24-1058 was signed on 17 April 2024 and took effect on 6 August 2024.
                  It amended the Colorado Privacy Act to treat neural data &mdash;
                  &ldquo;information generated by the measurement of the activity of an
                  individual&rsquo;s central or peripheral nervous systems&rdquo; &mdash;
                  as sensitive, requiring affirmative consent before it is processed. The
                  definition does not require that the data identify anyone. The
                  legislature treated it as inherently sensitive, and it was the first
                  state privacy law anywhere to do so.
                </p>
                <p className="mt-2 text-[14px] text-muted">
                  <a
                    href="https://content.leg.colorado.gov/sites/default/files/documents/2024A/bills/2024a_1058_01.pdf"
                    target="_blank"
                    rel="noreferrer noopener"
                    className="underline underline-offset-4"
                  >
                    Colorado HB24-1058, as introduced (General Assembly)
                  </a>
                </p>
              </div>

              <div className="border-l-2 border-foreground pl-5">
                <h3 className="font-display m-0 text-xl font-semibold text-foreground">
                  And there the record stops
                </h3>
                <p className="body-copy mt-2 text-foreground/85">
                  Nothing documented reads a person&rsquo;s perception, or reaches them,
                  at a distance and without their participation. That is not a claim that
                  such a thing cannot exist. It is a statement about what has been shown —
                  and this archive keeps the two apart everywhere.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------- research */}
        <section>
          <div className="w-full px-5 py-20 sm:px-8 lg:px-[100px]">
            <div className="mb-8 flex flex-wrap items-end gap-4">
              <div>
                <p className="m-0 font-display text-[12px] uppercase tracking-[0.14em] text-muted">The research</p>
                <h2 className="font-display m-0 mt-2 text-3xl font-semibold text-foreground sm:text-4xl">
                  Eight things the record already says
                </h2>
              </div>
              <a
                href="/data"
                className="ml-auto text-[14px] underline underline-offset-4 text-muted hover:text-foreground"
              >
                Government cloud, public health and crime
              </a>
            </div>

            <div className="grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
              {FINDINGS.map((f, n) => (
                <a
                  key={`${f.id}-${n}`}
                  href={`/concepts#${f.id}`}
                  className="group block"
                >
                  <span className="font-display block text-4xl font-semibold text-foreground">
                    {f.stat}
                  </span>
                  <span className="body-copy mt-3 block text-[15px] text-foreground/80 transition-colors group-hover:text-foreground">
                    {f.line}
                  </span>
                </a>
              ))}
            </div>

            <p className="mt-6 text-[14px] text-muted">
              {SOURCE_YEARS.length} dated sources behind the concepts, {sourcesWithUrl} with a
              public link, the earliest from {earliest}.
            </p>
          </div>
        </section>

        {/* ------------------------------------------------------- concepts */}
        <section>
          <div className="w-full px-5 py-20 sm:px-8 lg:px-[100px]">
            <div className="mb-8 flex flex-wrap items-end gap-4">
              <div>
                <p className="m-0 font-display text-[12px] uppercase tracking-[0.14em] text-muted">
                  The questions
                </p>
                <h2 className="font-display m-0 mt-2 text-3xl font-semibold text-foreground sm:text-4xl">
                  {CONCEPTS.length} concepts drawn from all of it
                </h2>
              </div>
              <a
                href="/concepts"
                className="ml-auto text-[14px] underline underline-offset-4 text-muted hover:text-foreground"
              >
                All {CONCEPTS.length}
              </a>
            </div>
            <p className="body-copy mb-8 max-w-2xl text-foreground/85">
              Each one is labelled with what it rests on, who produced it, and the readers
              it was written for &mdash; so you can weigh it before you read it.
            </p>
            <ul className="m-0 grid list-none gap-x-8 gap-y-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
              {conceptTitles.map((c) => (
                <li key={c.id} className="pt-4">
                  <a href={`/concepts#${c.id}`} className="group block">
                    <span className="font-display block text-[17px] font-semibold text-foreground group-hover:underline group-hover:underline-offset-4">
                      {c.title}
                    </span>
                    <span className="mt-1 block text-[12px] uppercase tracking-wide text-muted">
                      {c.basis} · {c.theme}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ------------------------------------------------------ glossary */}
        {/* Its own section now (Sean, 30 August). It was a panel inside the
            record, where it read as a footnote to the journal. It is not: it is
            the vocabulary this subject is argued in, and half these words are
            used against people who have no definition for them. Placed with the
            concepts, in the "what you would learn" beat, rather than beside the
            record — the two are different asks of a reader. */}
        <section>
          <div className="w-full px-5 py-20 sm:px-8 lg:px-[100px]">
            <p className="m-0 font-display text-[12px] uppercase tracking-[0.14em] text-muted">
              The glossary
            </p>
            <h2 className="font-display m-0 mt-2 text-3xl font-semibold text-foreground sm:text-4xl">
              The words this subject is argued in
            </h2>
            <p className="body-copy mt-5 max-w-2xl text-[17px] text-foreground/85">
              Some are dictionary terms used precisely. Some are technical, and a reader
              is expected to have no prior grip on them. Every one is defined here rather
              than assumed, because an argument conducted in words the reader cannot check
              is not an argument they can disagree with.
            </p>

            <div className="mt-12">
              <HomeCarousel slides={glossarySlides} label="Selected glossary terms" />
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <a
                href="/glossary"
                className="inline-flex h-12 items-center rounded-md bg-foreground px-6 text-[15px] font-medium text-background"
              >
                More glossary terms
              </a>
              <span className="text-[14px] text-muted">
                Every term, with the entries that use it.
              </span>
            </div>
          </div>
        </section>

        {/* ----------------------------------------------------- the ask */}
        {/* Beat five. Every section above earns the right to make it, and it is
            the last thing on the page for the same reason a pitch ends on the
            ask rather than on a fact. */}
        <section>
          <div className="w-full px-5 py-20 sm:px-8 lg:px-[100px]">
            <p className="m-0 font-display text-[12px] uppercase tracking-[0.14em] text-muted">
              What you can do
            </p>
            <h2 className="font-display m-0 mt-2 text-3xl font-semibold text-foreground sm:text-4xl">
              Add your own account
            </h2>
            <p className="body-copy mt-4 max-w-2xl text-[17px] text-foreground/85">
              A second dated record, kept to the same standard, is worth more than either
              one alone &mdash; not because two accounts corroborate each other, they do
              not, but because a pattern that survives independent description is a
              different kind of object from a story. That includes officers and public
              employees describing what they are being asked to do.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a
                href="/contribute"
                className="inline-flex h-12 items-center rounded-md bg-foreground px-6 text-[15px] font-medium text-background"
              >
                What contributing means
              </a>
              <a
                href="/api/corpus?from=home"
                className="inline-flex h-12 items-center rounded-md bg-foreground/[0.07] px-6 text-[15px] hover:bg-foreground/[0.12]"
              >
                Download the whole archive
              </a>
            </div>
            <p className="mt-5 text-[14px] text-muted">
              {CORPUS_SUMMARY.files} files, {CORPUS_SUMMARY.words.toLocaleString()} words,
              as plain Markdown and CSV. Share it, quote it with attribution, hand it to
              an AI and ask it to check the findings against the sources.{" "}
              <a href="/why" className="underline underline-offset-4">
                Why &ldquo;Invisible Ships&rdquo;
              </a>
              .
            </p>
          </div>
        </section>

      </main>

      <Footer />
    </>
  );
}
