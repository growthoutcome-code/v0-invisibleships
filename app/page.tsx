import type { Metadata } from "next";
import Image from "next/image";
import { CONCEPTS, NOT_ESTABLISHED, SOURCE_YEARS } from "@/lib/concepts";
import { CORPUS_SUMMARY } from "@/lib/corpus-summary";

/**
 * The home page.
 *
 * WHY THIS REPLACED THE GATE AT "/"
 * ---------------------------------
 * Until now "/" mounted the journal behind a four-screen gate. Every link Sean
 * sent — and every visit to this site is direct, there are no referrals from
 * anywhere — landed a reader on "I am 18 or older" instead of the thing he was
 * pointing at. Four screens before a word of the archive. For a site
 * distributed person to person by email, that is where the readers went.
 *
 * So the root is now a page that says what this is, in public, indexable and
 * linkable. The gate still stands in front of the journal, which is where the
 * material it warns about actually lives. Nothing was deleted: the gate's four
 * screens relocate rather than disappear.
 *
 * THE PITCH IS THE RESEARCH, NOT THE EXPERIENCE
 * ---------------------------------------------
 * Sean chose this framing over the warmer alternative. It leads with what can
 * be checked — court rulings, regulator decisions, statistical agencies — and
 * lets the reassurance fall out of the evidence rather than being asserted. The
 * neurotechnology section below does that work: a reader who is frightened
 * learns from it that the documented capabilities need a surgeon or a scanner
 * and their cooperation. That is more reassuring than a comforting sentence,
 * because they can check it.
 *
 * Every number on this page is derived at render from lib/, never typed in, so
 * it cannot drift from the archive it describes.
 */

export const metadata: Metadata = {
  title: "Invisible Ships — neurotechnology, and the record of who is buying it",
  description:
    "A documented research archive: court rulings, regulator decisions, statistical agencies and published investigations. Every figure resolves to a named source, and the archive states what it does not establish.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Invisible Ships",
    description:
      "Neurotechnology, and the record of who is buying it. Every figure resolves to a named source.",
    images: ["/og-default.png"],
  },
};

const NAV = [
  { href: "/concepts", label: "Concepts" },
  { href: "/data", label: "Research" },
  { href: "/journal", label: "Journal" },
  { href: "/glossary", label: "Glossary" },
  { href: "/disclaimer", label: "Disclaimer" },
];

export default function Page() {
  const sourcesWithUrl = SOURCE_YEARS.filter((s) => s.url).length;
  const earliest = Math.min(...SOURCE_YEARS.map((s) => s.year));

  return (
    <>
      <header className="w-full px-5 sm:px-8 h-[72px] flex items-center gap-6 border-b border-edge">
        <span className="font-display font-semibold tracking-tight text-foreground text-lg">
          Invisible Ships
        </span>
        <nav className="ml-auto hidden md:flex items-center gap-5">
          {NAV.map((n) => (
            <a key={n.href} href={n.href}
               className="text-[13px] uppercase tracking-wide text-muted hover:text-foreground">
              {n.label}
            </a>
          ))}
        </nav>
      </header>

      <main>
        {/* ---------------------------------------------------------- hero */}
        <section className="mx-auto max-w-6xl px-5 sm:px-8 pt-12 pb-16 grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <h1 className="font-display text-4xl sm:text-5xl font-semibold text-foreground leading-[1.1] m-0">
              Neurotechnology, and the record of who is buying it.
            </h1>
            <p className="body-copy text-foreground/85 mt-6 text-[18px] leading-relaxed">
              What can actually be read from a person&rsquo;s brain today, under what
              conditions, and with whose consent? What have governments deployed, at what
              cost — and what happened when regulators found against the companies
              selling it?
            </p>
            <p className="body-copy text-foreground/85 mt-4">
              Court rulings, regulator decisions, statistical agencies and published
              investigations. Every figure resolves to a named source. Every claim states
              what it rests on — and what it does not establish.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a href="/concepts"
                 className="h-12 px-6 rounded-md bg-foreground text-background text-[15px] font-medium inline-flex items-center">
                Start with the questions
              </a>
              <a href="/data"
                 className="h-12 px-6 rounded-md border border-edge hover:border-foreground text-[15px] inline-flex items-center">
                See the research
              </a>
            </div>
          </div>

          {/* The gate's first scene, held still. A person watching a screen, with
              something in the room they have not turned to look at — the whole
              premise of the archive, before a word is read. */}
          <div className="gate-anim relative w-full aspect-[16/9] select-none" aria-hidden="true">
            <Image src="/anim/is-scene-1.webp" alt="" fill priority
                   sizes="(max-width: 1024px) 100vw, 50vw"
                   className="object-contain" />
          </div>
        </section>

        {/* ------------------------------------- what the technology can do */}
        <section className="border-t border-edge">
          <div className="mx-auto max-w-3xl px-5 sm:px-8 py-16">
            <h2 className="font-display text-3xl font-semibold text-foreground m-0">
              What neurotechnology can actually do
            </h2>
            <p className="body-copy text-foreground/85 mt-4">
              Precisely, with the conditions attached. The conditions are the part that
              lets you rule something in or out.
            </p>

            <div className="mt-8 space-y-8">
              <div>
                <h3 className="font-display text-xl font-semibold text-foreground m-0">
                  A man with ALS is speaking again by thinking
                </h3>
                <p className="body-copy text-foreground/85 mt-2">
                  Neuralink&rsquo;s VOICE trial decodes intended speech from the motor
                  cortex. It requires implanted electrodes, neurosurgery, and a consenting
                  participant in a registered clinical trial.
                </p>
                <p className="text-[14px] text-muted mt-2">
                  <a href="https://neuralink.com/trials/speech-restoration/" target="_blank"
                     rel="noreferrer noopener" className="underline underline-offset-4">
                    Neuralink — Speech Restoration trial
                  </a>
                </p>
              </div>

              <div>
                <h3 className="font-display text-xl font-semibold text-foreground m-0">
                  A machine has reconstructed language from brain activity without surgery
                </h3>
                <p className="body-copy text-foreground/85 mt-2">
                  A semantic decoder recovered the gist of what a person was hearing or
                  imagining, from an fMRI scanner and no implant at all. It needed roughly
                  sixteen hours of training data per person, and{" "}
                  <strong>it failed when participants resisted it.</strong>
                </p>
                <p className="text-[14px] text-muted mt-2">
                  <a href="https://www.nature.com/articles/s41593-023-01304-9" target="_blank"
                     rel="noreferrer noopener" className="underline underline-offset-4">
                    Tang &amp; Huth, Nature Neuroscience, 2023
                  </a>
                </p>
              </div>

              <div className="border-l-2 border-foreground pl-5">
                <h3 className="font-display text-xl font-semibold text-foreground m-0">
                  And there the record stops
                </h3>
                <p className="body-copy text-foreground/85 mt-2">
                  Nothing documented reads a person&rsquo;s perception, or reaches them,
                  at a distance and without their participation. That is not a claim that
                  such a thing cannot exist. It is a statement about what has been shown —
                  and this archive keeps the two apart everywhere.
                </p>
                <p className="text-[14px] text-muted mt-2">
                  <a href="/concepts" className="underline underline-offset-4">
                    Read the concepts this rests on
                  </a>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* --------------------------------------------- four ways in */}
        <section className="border-t border-edge">
          <div className="mx-auto max-w-6xl px-5 sm:px-8 py-16">
            <h2 className="font-display text-3xl font-semibold text-foreground m-0 mb-8">
              What is here
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <Card href="/concepts" title="Concepts" stat={`${CONCEPTS.length}`}
                    body="Questions the record raises, each labelled with what it rests on, who produced it, and the readers it was written for." />
              <Card href="/data" title="Research" stat="3 bodies"
                    body="Government cloud procurement, public health, and crime. Every chart states its evidence tier and what it cannot show." />
              <Card href="/journal" title="Journal" stat="140+ days"
                    body="The primary record — dated entries and verbatim transcripts, with 298 audio-linked recordings. Carries a content warning." />
              <Card href="/api/corpus?from=home" title="The whole archive" stat={`${CORPUS_SUMMARY.files} files`}
                    body={`${CORPUS_SUMMARY.words.toLocaleString()} words as plain files. Share it, quote it with attribution, hand it to an AI to check the findings.`} />
            </div>
            <p className="text-[14px] text-muted mt-6">
              {SOURCE_YEARS.length} dated sources behind the concepts, {sourcesWithUrl} with a
              public link, the earliest from {earliest}.
            </p>
          </div>
        </section>

        {/* ------------------------------- what this does NOT establish */}
        {/* On a home page, above everything else it might claim. Most sites
            would never do this; it is the single strongest thing here. */}
        <section className="border-t border-edge">
          <div className="mx-auto max-w-3xl px-5 sm:px-8 py-16">
            <h2 className="font-display text-3xl font-semibold text-foreground m-0">
              What this does not establish
            </h2>
            <p className="body-copy text-foreground/85 mt-4">
              These four limits stand over every concept, chart and table in this archive.
              They are the conditions under which all of it was written.
            </p>
            <ol className="mt-6 list-none p-0 m-0 space-y-4 counter-reset">
              {NOT_ESTABLISHED.map((limit, i) => (
                <li key={i} className="body-copy text-foreground/85 pl-8 relative">
                  <span aria-hidden className="absolute left-0 top-0 font-display font-semibold text-foreground">
                    {i + 1}.
                  </span>
                  {limit}
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ------------------------------------------- why the name */}
        <section className="border-t border-edge">
          <div className="mx-auto max-w-3xl px-5 sm:px-8 py-16">
            <h2 className="font-display text-3xl font-semibold text-foreground m-0">
              Why &ldquo;Invisible Ships&rdquo;
            </h2>
            <p className="body-copy text-foreground/85 mt-4">
              Perceptual set is a documented principle in cognitive psychology: our
              expectations and prior experience shape what we perceive, and can keep us
              from registering something we have no concept for. This archive is an
              attempt to describe, in plain and dated detail, something that is easy to
              look past precisely because most people have no framework for it yet.
            </p>
            <p className="mt-4">
              <a href="/why" className="underline underline-offset-4 text-foreground">
                The story the name comes from, and why it is almost certainly apocryphal
              </a>
            </p>
          </div>
        </section>

        <footer className="border-t border-edge">
          <div className="mx-auto max-w-6xl px-5 sm:px-8 py-10 text-[14px] text-muted">
            <p className="m-0">
              Compiled by Sean C. Harris. Independent research from public sources, for
              information only — not legal, medical or investment advice.{" "}
              <a href="/disclaimer" className="underline underline-offset-4">
                Disclaimer, copyright and terms
              </a>
              .
            </p>
            <p className="mt-2 m-0">© 2026 Sean C. Harris. All Rights Reserved.</p>
          </div>
        </footer>
      </main>
    </>
  );
}

function Card({ href, title, stat, body }: { href: string; title: string; stat: string; body: string }) {
  return (
    <a href={href} className="block border border-edge rounded-lg p-5 hover:border-foreground transition-colors">
      <span className="block font-display text-2xl font-semibold text-foreground">{stat}</span>
      <span className="block font-display text-[15px] uppercase tracking-wide text-muted mt-1">{title}</span>
      <span className="block body-copy text-foreground/80 text-[15px] mt-3">{body}</span>
    </a>
  );
}
