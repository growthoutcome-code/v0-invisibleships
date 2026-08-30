import type { Metadata } from "next";
import Footer from "@/components/Footer";
import GateAnimation from "@/components/GateAnimation";
import Header from "@/components/Header";
import HomeJournalCarousel from "@/components/HomeJournalCarousel";
import { CONCEPTS, FINDINGS, NOT_ESTABLISHED, SOURCE_YEARS } from "@/lib/concepts";
import { CORPUS_SUMMARY } from "@/lib/corpus-summary";
import { homeGlossary, homeJournal, journalStats } from "@/lib/server-corpus";

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
  title: "Is the world being exposed to unconsented neurotech experimentation?",
  description:
    "Colorado has required consent to collect neural data since 2024 — the first law of its kind anywhere. This archive asks what it was written against: one resident's dated record from Denver, 120 days of entries and 298 recordings, beside a documented archive of what governments bought and what regulators found. Every figure resolves to a named source, and the archive states plainly what it does not establish.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Is the world being exposed to unconsented neurotech experimentation?",
    description:
      "A dated first-person record, and the procurement archive that says nobody would be able to check.",
    images: ["/og-default.png"],
  },
};

/**
 * THE HERO HEADLINE.
 *
 * Sean's line, tightened: "Is the world being exposed to unconsented neurotech
 * experimentation?" ("the world's population" trimmed to "the world" — the rail
 * is 30% and the headline has to hold on two or three lines.)
 *
 * WHAT MAKES A GLOBAL QUESTION SURVIVE A HOSTILE READING. On its own it would
 * not: this archive holds nothing about the world's population, and a scope
 * that large with nothing under it is the register Sean rejected outright —
 * "I don't need a hocus pocus mumbo jumbo bullshit website."
 *
 * The subheading is what carries it, and it carries it on a verified fact
 * rather than on assertion. Colorado HB24-1058, signed 17 April 2024 and in
 * force since 6 August 2024, amended the Colorado Privacy Act to classify
 * NEURAL DATA as sensitive and to require affirmative consent before it is
 * processed — the first US state comprehensive privacy law to do so, and
 * reported at the time as the first such protection anywhere. Its definition
 * does not even require that the data identify anyone; the legislature treated
 * neural data as inherently sensitive.
 *
 * That does three things at once. "Unconsented" stops being rhetoric and
 * becomes a legal term with a statute behind it. The question becomes one a
 * legislature has already decided is worth answering. And the law was passed in
 * Sean's own state — the archive's local record and its global question meet in
 * one dated, checkable fact.
 *
 * Alternates, kept so swapping costs one line:
 *   B  "Who is consenting to neurotechnology — and who would ever know?"
 *      Shortest, claims no scope at all, keeps the record-keeping clause that
 *      made the previous headline defensible.
 *   C  "Colorado made neural data require consent. Who is asking?"
 *      Leads with the statute. Most defensible of the three and the most
 *      surprising; gives up the global reach Sean is after.
 */
const HERO = {
  question: "Is the world being exposed to unconsented neurotech experimentation?",
  answer:
    "Colorado has required consent to collect neural data since 2024 — the first law of " +
    "its kind anywhere. This archive asks what it was written against: one resident's " +
    "dated record, and the public procurement record beside it.",
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
  const entries = homeJournal(9);
  const gloss = homeGlossary([...new Set(entries.flatMap((e) => e.terms.map((t) => t.slug)))]);
  const stats = journalStats();
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
            narrower the floor takes over rather than breaking a nine-word
            question into a column of one-word lines.

            order-1 / order-2 is the gate's behaviour too — on a phone the
            animation is on top and the copy reads beneath it. */}
        <section className="flex min-h-[calc(100vh-72px)] lg:min-h-[calc(100vh-88px)] flex-col border-b border-edge md:flex-row">
          {/* Left 25% — the copy rail */}
          <div className="order-2 flex flex-col px-8 py-12 sm:px-12 md:order-1 md:w-[30%] md:min-w-[380px] lg:px-14">
            <div className="animate-fade-in flex max-w-md flex-1 flex-col justify-center">
              <h1 className="font-display text-[32px] font-bold leading-[1.12] tracking-tight text-foreground sm:text-[40px]">
                {HERO.question}
              </h1>
              <p className="mt-5 font-serif text-lg leading-snug text-foreground/80 sm:text-xl">
                {HERO.answer}
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <a
                  href="/journal"
                  className="inline-flex h-12 items-center rounded-md bg-foreground px-6 text-[15px] font-medium text-background"
                >
                  Read the journal
                </a>
                <a
                  href="/data"
                  className="inline-flex h-12 items-center rounded-md border border-edge px-6 text-[15px] hover:border-foreground"
                >
                  See the research
                </a>
              </div>
              <p className="mt-4 text-[13px] leading-relaxed text-foreground/70">
                The journal carries a content warning. Nothing here asks you to agree to
                anything before reading it.{" "}
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

          {/* Right 75% — animation panel */}
          <div className="relative order-1 min-h-[42vh] overflow-hidden bg-background md:order-2 md:min-h-[calc(100vh-72px)] lg:min-h-[calc(100vh-88px)] md:w-[70%]">
            <GateAnimation fill />
          </div>
        </section>

        {/* -------------------------------------------------------- journal */}
        <section className="border-b border-edge">
          <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
            <div className="mb-8 flex flex-wrap items-end gap-4">
              <div>
                <p className="m-0 font-display text-[12px] uppercase tracking-[0.14em] text-muted">The record</p>
                {/* Not "From the journal", which labels a topic. Under the scan
                    rule a heading has to carry its beat alone, and this beat is
                    "it is real, and it is specific". Numbers derived at render. */}
                <h2 className="font-display m-0 mt-2 text-3xl font-semibold text-foreground">
                  {stats.days} dated days, {stats.recordings} recordings, one city
                </h2>
              </div>
              <a
                href="/journal"
                className="ml-auto text-[14px] underline underline-offset-4 text-muted hover:text-foreground"
              >
                All {stats.days} days, {stats.docs} documents
              </a>
            </div>
            <p className="body-copy mb-8 max-w-2xl text-foreground/85">
              Dated entries and verbatim transcripts, with {stats.recordings} audio-linked
              recordings. Each card shows the day, where it was recorded when that was
              noted, and the glossary terms that entry uses. The entries themselves sit
              behind a content warning, which is where they belong.
            </p>

            <HomeJournalCarousel entries={entries} glossary={gloss} />
          </div>
        </section>

        {/* ------------------------------- what this does NOT establish */}
        {/* Addressable since the hero became a question about a named city:
            the limits that question is asked under must be one click from it,
            not four screens down. */}
        {/* On a home page, above everything else it might claim. Most sites
            would never do this; it is the single strongest thing here. */}
        <section id="not-established" className="scroll-mt-24 border-b border-edge">
          <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8">
            <h2 className="font-display m-0 text-3xl font-semibold text-foreground">
              What this does not establish
            </h2>
            <p className="body-copy mt-4 text-foreground/85">
              These four limits stand over every concept, chart and table in this archive.
              They are the conditions under which all of it was written.
            </p>
            <ol className="m-0 mt-6 list-none space-y-4 p-0">
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
        <section className="border-b border-edge">
          <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8">
            <p className="m-0 font-display text-[12px] uppercase tracking-[0.14em] text-muted">
              Testimony · verified by nobody
            </p>
            <h2 className="font-display m-0 mt-2 text-3xl font-semibold text-foreground">
              Cities keep being named. None of them are verified.
            </h2>
            <p className="body-copy mt-4 text-foreground/85">
              Denver is where this record was kept. Other cities appear in the transcripts
              &mdash; Seattle, Portland, Los Angeles, Houston, Kansas City, Cincinnati,
              Cleveland &mdash; and the archive records that they were named. It makes no
              finding that anything has happened in any of them.
            </p>

            <div className="mt-8 space-y-6">
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
            <div className="mt-8 border border-edge p-6">
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
        <section className="border-b border-edge">
          <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8">
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
            <p className="body-copy mt-4 text-[17px] text-foreground/85">
              What the documented record actually shows a machine can do to a person, and
              under what conditions. The conditions are the part that lets you rule
              something in or out &mdash; and every capability below needed a surgeon, a
              scanner, or hours of the person&rsquo;s own cooperation.
            </p>

            <div className="mt-8 space-y-8">
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
        <section className="border-b border-edge">
          <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
            <div className="mb-8 flex flex-wrap items-end gap-4">
              <div>
                <p className="m-0 font-display text-[12px] uppercase tracking-[0.14em] text-muted">The research</p>
                <h2 className="font-display m-0 mt-2 text-3xl font-semibold text-foreground">
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

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {FINDINGS.map((f, n) => (
                <a
                  key={`${f.id}-${n}`}
                  href={`/concepts#${f.id}`}
                  className="block rounded-lg border border-edge p-5 transition-colors hover:border-foreground"
                >
                  <span className="font-display block text-3xl font-semibold text-foreground">
                    {f.stat}
                  </span>
                  <span className="body-copy mt-2 block text-[15px] text-foreground/80">
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
        <section className="border-b border-edge">
          <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
            <div className="mb-8 flex flex-wrap items-end gap-4">
              <div>
                <p className="m-0 font-display text-[12px] uppercase tracking-[0.14em] text-muted">
                  The questions
                </p>
                <h2 className="font-display m-0 mt-2 text-3xl font-semibold text-foreground">
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
                <li key={c.id} className="border-t border-edge pt-4">
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

        {/* ----------------------------------------------------- the ask */}
        {/* Beat five. Every section above earns the right to make it, and it is
            the last thing on the page for the same reason a pitch ends on the
            ask rather than on a fact. */}
        <section className="border-b border-edge">
          <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8">
            <p className="m-0 font-display text-[12px] uppercase tracking-[0.14em] text-muted">
              What you can do
            </p>
            <h2 className="font-display m-0 mt-2 text-3xl font-semibold text-foreground">
              Add your own account
            </h2>
            <p className="body-copy mt-4 text-[17px] text-foreground/85">
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
                className="inline-flex h-12 items-center rounded-md border border-edge px-6 text-[15px] hover:border-foreground"
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
