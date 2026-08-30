import type { Metadata } from "next";
import GateAnimation from "@/components/GateAnimation";
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
  title: "Invisible Ships — a dated record, and the research behind it",
  description:
    "A first-person journal kept day by day, and a documented research archive beside it: court rulings, regulator decisions, statistical agencies and published investigations. Every figure resolves to a named source, and the archive states what it does not establish.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Invisible Ships",
    description:
      "Your house is not haunted. A dated record, and the research behind it.",
    images: ["/og-default.png"],
  },
};

const NAV = [
  { href: "/journal", label: "Journal" },
  { href: "/concepts", label: "Concepts" },
  { href: "/data", label: "Research" },
  { href: "/glossary", label: "Glossary" },
  { href: "/disclaimer", label: "Disclaimer" },
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
      {/* ------------------------------------------------------------- nav */}
      {/* TYPOGRAPHY. The links were Inter — the body face — at 13px with
          Tailwind's default `tracking-wide`, which is what "plain" looked like:
          the navigation was set in the same voice as a paragraph.

          They are Space Grotesk now, the display face the headlines already
          use. Nothing new is downloaded; it is in the same Google Fonts request
          as the rest. Space Grotesk's letterforms are geometric and slightly
          squared, which is unremarkable at headline size and does real work in
          small caps — it reads as a plate on a cabinet rather than as body
          text, which is the register an archive wants.

          The other half is spacing. Uppercase text needs more of it than
          lowercase does, because capitals have no ascenders or descenders to
          separate them; 0.14em is enough to let the words breathe without
          drifting into a fashion-house wordmark. Dropping to 12px pays for the
          extra width so the row does not grow.

          Hover is a 1px rule under the word rather than a colour change alone.
          A colour shift on already-muted text is easy to miss; a rule is
          unambiguous and it is how the rest of the site marks a link. */}
      <header className="sticky top-0 z-30 w-full border-b border-edge bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-[64px] max-w-7xl items-center gap-6 px-5 sm:px-8">
          <a
            href="/"
            className="font-display text-lg font-semibold tracking-[-0.01em] text-foreground"
          >
            Invisible Ships
          </a>
          <nav className="ml-auto hidden items-center gap-7 lg:flex">
            {NAV.map((n) => (
              <a
                key={n.href}
                href={n.href}
                className="font-display border-b border-transparent pb-0.5 text-[12px] font-medium uppercase tracking-[0.14em] text-muted transition-colors hover:border-foreground hover:text-foreground"
              >
                {n.label}
              </a>
            ))}
          </nav>
          {/* The register call to action. It lands on what contributing costs,
              not on a sign-up form, because accounts are not open yet. */}
          <a
            href="/contribute"
            className="font-display ml-auto inline-flex h-10 items-center rounded-md bg-foreground px-4 text-[12px] font-medium uppercase tracking-[0.14em] text-background lg:ml-0"
          >
            Contribute
          </a>
        </div>
      </header>

      <main>
        {/* ------------------------------------------------------------ hero */}
        {/* THE GATE'S OWN LAYOUT, REUSED.
            AccessGate's welcome screen is a full-height two-column split: copy
            in a fixed-width left rail, GateAnimation filling the panel beside
            it. Sean asked for that same skeleton here, with the left rail
            narrowed from the gate's 40% to 25% so the animation carries more of
            the screen.

            min-w-[360px] is the floor, and it is what makes 25% safe: at 1440px
            the rail IS 25%, and on a narrower desktop the floor takes over
            rather than crushing the headline into a column of one-word lines.

            order-1 / order-2 is the gate's behaviour too — on a phone the
            animation is on top and the copy reads beneath it. */}
        <section className="flex min-h-[calc(100vh-64px)] flex-col border-b border-edge md:flex-row">
          {/* Left 25% — the copy rail */}
          <div className="order-2 flex flex-col px-8 py-12 sm:px-12 md:order-1 md:w-[25%] md:min-w-[360px] lg:px-14">
            <div className="animate-fade-in flex max-w-md flex-1 flex-col justify-center">
              <h1 className="font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                Your house is not haunted.
              </h1>
              <p className="mt-4 font-serif text-xl leading-snug text-foreground/80 sm:text-2xl">
                It may be neurotechnology &mdash; and there is a public record of who is
                building it and who is buying it.
              </p>
              <p className="mt-3 text-sm text-muted">
                A journal kept day by day, and the research assembled beside it. Every
                figure resolves to a named source.
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
              <p className="mt-4 text-[13px] text-foreground/70">
                The journal carries a content warning and sits behind it. The research
                does not.
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
          <div className="relative order-1 min-h-[42vh] overflow-hidden bg-background md:order-2 md:min-h-[calc(100vh-64px)] md:w-[75%]">
            <GateAnimation fill />
          </div>
        </section>

        {/* -------------------------------------------------------- journal */}
        <section className="border-b border-edge">
          <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
            <div className="mb-8 flex flex-wrap items-end gap-4">
              <div>
                <p className="m-0 font-display text-[12px] uppercase tracking-[0.14em] text-muted">The record</p>
                <h2 className="font-display m-0 mt-2 text-3xl font-semibold text-foreground">
                  From the journal
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

        {/* ------------------------------------- what the technology can do */}
        <section className="border-b border-edge">
          <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8">
            <p className="m-0 font-display text-[12px] uppercase tracking-[0.14em] text-muted">
              Before anything else
            </p>
            <h2 className="font-display m-0 mt-2 text-3xl font-semibold text-foreground">
              What neurotechnology can actually do
            </h2>
            <p className="body-copy mt-4 text-foreground/85">
              Precisely, with the conditions attached. The conditions are the part that
              lets you rule something in or out.
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

        {/* ------------------------------- what this does NOT establish */}
        {/* On a home page, above everything else it might claim. Most sites
            would never do this; it is the single strongest thing here. */}
        <section className="border-b border-edge">
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

        {/* --------------------------------------- corpus + why the name */}
        <section className="border-b border-edge">
          <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 lg:grid-cols-2">
            <div>
              <h2 className="font-display m-0 text-2xl font-semibold text-foreground">
                Take the whole archive
              </h2>
              <p className="body-copy mt-3 text-foreground/85">
                {CORPUS_SUMMARY.files} files, {CORPUS_SUMMARY.words.toLocaleString()} words,
                as plain Markdown and CSV. Share it, quote it with attribution, hand it to
                an AI and ask it to check the findings against the sources.
              </p>
              <p className="mt-5">
                <a
                  href="/api/corpus?from=home"
                  className="inline-flex h-11 items-center rounded-md border border-edge px-5 text-[15px] hover:border-foreground"
                >
                  Download the corpus
                </a>
              </p>
            </div>
            <div>
              <h2 className="font-display m-0 text-2xl font-semibold text-foreground">
                Why &ldquo;Invisible Ships&rdquo;
              </h2>
              <p className="body-copy mt-3 text-foreground/85">
                Perceptual set is a documented principle in cognitive psychology: our
                expectations and prior experience shape what we perceive, and can keep us
                from registering something we have no concept for. This archive is an
                attempt to describe, in plain and dated detail, something that is easy to
                look past precisely because most people have no framework for it yet.
              </p>
              <p className="mt-5">
                <a href="/why" className="text-foreground underline underline-offset-4">
                  The story the name comes from, and why it is almost certainly apocryphal
                </a>
              </p>
            </div>
          </div>
        </section>

        <footer>
          <div className="mx-auto max-w-7xl px-5 py-10 text-[14px] text-muted sm:px-8">
            <p className="m-0">
              Compiled by Sean C. Harris. Independent research from public sources, for
              information only — not legal, medical or investment advice.{" "}
              <a href="/disclaimer" className="underline underline-offset-4">
                Disclaimer, copyright and terms
              </a>
              {" · "}
              <a href="/safety" className="underline underline-offset-4">
                A note on safety
              </a>
              .
            </p>
            <p className="m-0 mt-2">© 2026 Sean C. Harris. All Rights Reserved.</p>
          </div>
        </footer>
      </main>
    </>
  );
}
