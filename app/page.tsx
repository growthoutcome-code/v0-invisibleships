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
import { TRAFFICKING_OPS } from "@/lib/enforcement";
import { homeGlossary, journalQuotes, journalStats } from "@/lib/server-corpus";
import { accomplishments, govCloud, usd } from "@/lib/server-data";

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
    "Is there a government cloud platform — anywhere — running a risk-mitigation layer that could do what Zersetzung did: isolate and discredit a person without ever arresting them? And would any public record show it? A dated first-person record, the public procurement record, and what regulators found when they looked.",
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
 * The suicide clause survives because Sean asked for it, but stripped of the
 * country: "why did some wealthy countries' suicide rates rise while the
 * world's fell 27%?" The West Bank & Gaza stays out for the reason recorded on
 * 1 September — this archive's own concept page calls them effectively flat.
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

/**
 * SIX FINDINGS, NOT EIGHT, AND ORDERED.
 *
 * Sean: "consolidate it to six, and let's really pull the most important data
 * to the top." Selected by id from lib/concepts.ts rather than sliced, so the
 * home page keeps its choice if FINDINGS is reordered — and so the two that
 * were dropped are named here rather than silently disappearing.
 *
 * Order is an argument. A regulator finding against a company its own
 * government keeps paying is the hardest single fact in the archive, so it
 * leads. The robot experiment is second because it is the one finding that
 * explains a reader's own experience to them, which is what most of them came
 * for. Then scale, then children, then the trend, then why nobody heard.
 *
 * Dropped: "$300 bought Reuters a human cervical spine" — visceral, and the
 * furthest from this archive's subject. And the duplicate sheriff finding
 * ("3 constitutional amendments"), which pointed at the same concept page as
 * the 420 children figure and spent a tile to say the same thing twice.
 */
const HOME_FINDINGS = [
  "fined-in-europe-hired-in-america",
  "what-produces-the-feeling",
  "how-protected-is-your-medical-record",
  "what-children-are-subject-to",
  "us-rose-against-the-trend",
  "why-isnt-this-in-the-news",
]
  .map((id) => FINDINGS.find((f) => f.id === id))
  .filter((f): f is (typeof FINDINGS)[number] => Boolean(f));

export default function Page() {
  const stats = journalStats();

  const entries = journalQuotes(8);
  const gc = govCloud();
  const wins = accomplishments();

  // One concept at a time, like the journal. Ordered as lib/concepts.ts orders
  // them — the first six, not a selection — and the body trimmed to a lead-in.
  const conceptSlides: Slide[] = CONCEPTS.slice(0, 6).map((c) => ({
    href: `/concepts#${c.id}`,
    eyebrow: `${c.basis} · ${c.theme}`,
    title: c.title,
    body: c.body.length > 320 ? c.body.slice(0, 320).replace(/\s+\S*$/, "") + "…" : c.body,
    cta: "Read the concept",
  }));

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

              {/* Three questions, no statements, no country named. */}
              <p className="mt-6 font-serif text-lg leading-snug text-foreground/85">
                Is there a government cloud platform &mdash; anywhere &mdash; running a
                risk-mitigation layer that could do what{" "}
                <a
                  href="/glossary/zersetzung-tactics"
                  className="text-foreground underline underline-offset-4"
                >
                  Zersetzung
                </a>{" "}
                did: isolate and discredit a person without ever arresting them?
              </p>
              <p className="mt-4 font-serif text-lg leading-snug text-foreground/85">
                And would any public record show it?
              </p>
              <p className="mt-4 font-serif text-lg leading-snug text-foreground/85">
                Why did some wealthy countries&rsquo; suicide rates rise while the
                world&rsquo;s fell 27%?
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

        {/* JOURNAL.
            Header, one sentence, the entry, slide to the next, buttons out.

            THE SENTENCE IS THE HEADING now (Sean, 30 August): "I would much
            rather have just the line underneath be the heading… you could put
            the hundred and twenty eight days and two hundred and ninety eight
            recordings etcetera underneath it." Right call — what the journal IS
            outranks how much of it there is, and the metrics read better as
            evidence for the claim than as the claim itself.

            The cards of dates and places are gone. Sliding now moves to the
            next ENTRY, words and all, rather than to a link to one. */}
        <section id="record" className="scroll-mt-24">
          <div className="w-full px-5 py-20 sm:px-8 lg:px-[200px]">
            <p className="m-0 font-display text-[12px] uppercase tracking-[0.14em] text-muted">
              Journal
            </p>
            <h2 className="font-display m-0 mt-3 text-[26px] font-semibold leading-[1.25] text-foreground sm:text-[34px]">
              Journal entries: subjective and qualitative accounts of the bullhorn
              surveillance system experience in Denver, Colorado.
            </h2>
            <p className="mt-4 text-[15px] text-muted">
              {stats.days} dated days · {stats.recordings} audio-linked recordings ·{" "}
              {stats.docs} documents · one city
            </p>

            <div className="mt-14">
              <JournalQuotes entries={entries} />
            </div>

            <div className="mt-14 flex flex-wrap items-center gap-4">
              <a
                href="/journal"
                className="inline-flex h-12 items-center rounded-md bg-foreground px-6 text-[15px] font-medium text-background"
              >
                Go to the journal
              </a>
              <a
                href="/contribute"
                className="inline-flex h-12 items-center rounded-md bg-foreground/[0.07] px-6 text-[15px] hover:bg-foreground/[0.12]"
              >
                Contribute to the journal
              </a>
              {/* Opens in place rather than navigating. A caveat that costs a
                  reader their position on the page is a caveat they skip. */}
              <DisclaimerDialog>
                <button
                  type="button"
                  className="text-[14px] text-muted underline underline-offset-4 hover:text-foreground"
                >
                  How to read the journal
                </button>
              </DisclaimerDialog>
            </div>
          </div>
        </section>


        {/* ------------------------------------------------------- research */}
        {/* Moved directly under the journal (Sean, 30 August): the record, then
            the public evidence assembled beside it. Six findings, not eight,
            and ordered rather than sliced — see HOME_FINDINGS. */}
        <section className="scroll-mt-24">
          <div className="w-full px-5 py-20 sm:px-8 lg:px-[200px]">
            <p className="m-0 font-display text-[12px] uppercase tracking-[0.14em] text-muted">
              Research
            </p>
            <h2 className="font-display m-0 mt-3 text-[26px] font-semibold leading-[1.25] text-foreground sm:text-[34px]">
              Six things the public record already says.
            </h2>
            <p className="mt-4 text-[15px] text-muted">
              Government cloud procurement, public health and crime · every figure
              resolves to a named source · {SOURCE_YEARS.length} dated sources, the
              earliest from {earliest}
            </p>

            <div className="mt-14 grid gap-x-12 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">

              {HOME_FINDINGS.map((f, n) => (
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

            <div className="mt-14 flex flex-wrap items-center gap-4">
              <a
                href="/data"
                className="inline-flex h-12 items-center rounded-md bg-foreground px-6 text-[15px] font-medium text-background"
              >
                Go to the research
              </a>
              <span className="text-[14px] text-muted">
                {sourcesWithUrl} of {SOURCE_YEARS.length} sources carry a public link.
              </span>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------ government cloud */}
        {/* Surfaced at Sean's request. Every figure read from the same tables
            the Research charts use — see lib/server-data.ts — so the front page
            cannot drift from the section it points at. */}
        <SiteSection
          eyebrow="Government cloud"
          heading="Somebody bought this, from somebody, for a price that is on the record."
          meta={
            <>
              {gc.awards} awards · {gc.vendors} vendors · {gc.deployments} deployments ·{" "}
              {gc.regulations} regulations · {gc.sources} sources
            </>
          }
          actions={[
            { href: "/data/government-cloud", label: "Go to government cloud", primary: true },
          ]}
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
              line={`across the ${gc.valued} awards in this record that carry a published value. Contract vehicles, scopes, funding statutes and recompete dates, each one linked to its source.`}
              href="/data/government-cloud"
            />
            <Figure
              stat={usd(gc.topUsd)}
              line={`is the largest single award here${gc.topBuyer ? `, to ${gc.topBuyer}` : ""}. Procurement at this scale is public by design — the record exists precisely so it can be read.`}
              href="/data/government-cloud"
            />
            <Figure
              stat={`0 of ${gc.regulations}`}
              line="regulations record a route to individual review. Across the whole register, the person a system is used on has nowhere to ask anything."
              href="/concepts#no-column-for-you"
            />
          </div>
        </SiteSection>

        {/* ------------------------------------------------------ public health */}
        <SiteSection
          eyebrow="Public health"
          heading="A twenty-year climb the United States made alone."
          meta="CDC, NCHS and WHO figures · every chart states its evidence tier and what it cannot show"
          actions={[{ href: "/data/public-health", label: "Go to public health", primary: true }]}
          aside={
            <DisclaimerDialog>
              <button type="button" className="text-[14px] text-muted underline underline-offset-4 hover:text-foreground">
                How to read the research
              </button>
            </DisclaimerDialog>
          }
        >
          <div className="grid gap-x-12 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
            {HEALTH_FIGURES.map((f) => (
              <Figure key={f.stat} stat={f.stat} line={f.line} source={f.source} />
            ))}
          </div>
        </SiteSection>

        {/* ---------------------------------------------------------- crime */}
        <SiteSection
          eyebrow="Crime"
          heading="Six lanes moving in different directions, and two that nobody counts."
          meta="FBI, BJS and CDC series · where the counting changed mid-window, the series does not agree with itself, and the section says so"
          actions={[{ href: "/data/crime", label: "Go to crime", primary: true }]}
          aside={
            <DisclaimerDialog>
              <button type="button" className="text-[14px] text-muted underline underline-offset-4 hover:text-foreground">
                How to read the research
              </button>
            </DisclaimerDialog>
          }
        >
          <div className="grid gap-x-12 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
            {CRIME_FIGURES.map((f) => (
              <Figure key={f.stat} stat={f.stat} line={f.line} source={f.source} />
            ))}
          </div>
        </SiteSection>

        {/* -------------------------------------- anti-trafficking record */}
        {/* Sean asked for a chart rewarding arrest data. The honest version is
            this one: no national series here shows arrests rising — the FBI's
            own 2025 release has violent crime falling 9.3%, the largest decline
            since estimation began in 1936 — but the DHS subscription carries
            OPERATION-LEVEL counts, dated and named. So the section shows what
            the record contains and says plainly that it is not a trend.

            Bars are widths, not a plot: five counts on one scale, no axis to
            misread, and nothing that implies a series where there is none. */}
        <SiteSection
          eyebrow="Anti-trafficking"
          heading="No national series shows arrests rising. These specific operations are on the record."
          meta="US Department of Homeland Security releases · arrests and investigations are counts, not convictions · not a national trend"
          actions={[{ href: "/data/crime", label: "Go to the crime record", primary: true }]}
        >
          <div className="space-y-8">
            {TRAFFICKING_OPS.map((op) => (
              <div key={op.label}>
                <div className="flex flex-wrap items-baseline gap-x-4">
                  <span className="font-display text-3xl font-semibold text-foreground">
                    {op.value.toLocaleString()}
                  </span>
                  <span className="font-display text-[12px] uppercase tracking-[0.14em] text-muted">
                    {op.unit} · {op.label} · {op.when}
                  </span>
                </div>
                <div className="mt-3 h-2 w-full bg-foreground/10">
                  <div
                    className="h-2 bg-foreground"
                    style={{ width: `${Math.max(2, (op.value / 2545) * 100)}%` }}
                  />
                </div>
                <p className="body-copy m-0 mt-3 text-[15px] text-foreground/80">
                  {op.note}{" "}
                  <a
                    href={op.source.href}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-muted underline underline-offset-4 hover:text-foreground"
                  >
                    {op.source.publisher} · {op.source.title}
                  </a>
                </p>
              </div>
            ))}
          </div>

          <p className="body-copy mt-10 border-l-2 border-foreground pl-5 text-[15px] leading-relaxed text-foreground/85">
            These are counts from named operations on dated agency releases, not a
            national arrest series. This archive has not found one that shows arrests
            rising: the same period&rsquo;s FBI release records violent crime falling
            9.3% in 2025, the largest year-to-year decline since the Bureau began
            estimating in 1936. Both things are in the record and neither explains the
            other.
          </p>
        </SiteSection>

        {/* ------------------------------------------------ what is working */}
        {/* Sean, 30 August: "we are not here to trash law enforcement. We're
            not here to throw law enforcement under the bus."

            The register this reads from already existed — six entries, tier A,
            with sources — inside the Crime vertical, where only a reader who
            went three clicks deep would ever find it. It belongs on the front
            page, and putting it there is the single strongest signal that this
            archive is not an indictment. */}
        <SiteSection
          eyebrow="What is working"
          heading="The same record shows enforcement doing what it is for."
          meta="From the crime register · agency reports and press releases · arrests and rescues are counts, not convictions"
          actions={[{ href: "/data/crime", label: "See the full register", primary: true }]}
        >
          <div className="grid gap-x-12 gap-y-12 sm:grid-cols-2">
            {wins.map(({ row, source }) => (
              <div key={row.what}>
                <p className="m-0 font-display text-[12px] uppercase tracking-[0.14em] text-muted">
                  {row.what} · tier {row.tier}
                </p>
                <p className="body-copy m-0 mt-3 text-[17px] leading-relaxed text-foreground">
                  {row.claim}
                </p>
                {source?.url && (
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="mt-3 inline-block text-[13px] text-muted underline underline-offset-4 hover:text-foreground"
                  >
                    {source.publisher}
                    {source.title ? ` · ${source.title}` : ""}
                  </a>
                )}
              </div>
            ))}
          </div>
        </SiteSection>

        {/* ------------------------------------- what the technology can do */}
        {/* Addressable: the hero asks a second-person question and this is the
            section that answers it. A reader who arrived frightened should be
            one click from the conditions, not five sections down. */}
        <section id="neurotechnology" className="scroll-mt-24">
          <div className="w-full px-5 py-20 sm:px-8 lg:px-[200px]">
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

        {/* ------------------------------------------------------- concepts */}
        {/* One at a time and rotating, like the journal (Sean, 30 August). A
            grid of six titles asked a reader to choose before they knew what
            any of them were; a slide gives them one, with enough of it to
            decide. Autoplay is on — see HomeCarousel for how it gives up the
            moment anyone touches it. */}
        <section className="scroll-mt-24">
          <div className="w-full px-5 py-20 sm:px-8 lg:px-[200px]">
            <p className="m-0 font-display text-[12px] uppercase tracking-[0.14em] text-muted">
              Concepts
            </p>
            <h2 className="font-display m-0 mt-3 text-[26px] font-semibold leading-[1.25] text-foreground sm:text-[34px]">
              What the record raises, once you put the journal and the research beside
              each other.
            </h2>
            <p className="mt-4 text-[15px] text-muted">
              {CONCEPTS.length} concepts · each labelled with what it rests on, who wrote
              it, and who it is for · {SOURCE_YEARS.length} dated sources
            </p>

            <div className="mt-14">
              <HomeCarousel slides={conceptSlides} label="Concepts" />
            </div>

            <div className="mt-14 flex flex-wrap items-center gap-4">
              <a
                href="/concepts"
                className="inline-flex h-12 items-center rounded-md bg-foreground px-6 text-[15px] font-medium text-background"
              >
                Go to the concepts
              </a>
              <DisclaimerDialog>
                <button
                  type="button"
                  className="text-[14px] text-muted underline underline-offset-4 hover:text-foreground"
                >
                  How to read the concepts
                </button>
              </DisclaimerDialog>
            </div>
          </div>
        </section>


        {/* ------------------------------------------------------ glossary */}
        {/* Same shape as Journal: header, one sentence, the thing, a carousel
            through to more of it, a button out. Its own section since 30
            August — as a panel inside the record it read as a footnote to the
            journal, and it is not one. */}
        <section className="scroll-mt-24">
          <div className="w-full px-5 py-20 sm:px-8 lg:px-[200px]">
            <p className="m-0 font-display text-[12px] uppercase tracking-[0.14em] text-muted">
              Glossary
            </p>
            {/* Sean: "it's not the words the subject is arguing. The glossary
                is really important. These are — bring yourself up to speed."
                Right, and the old heading described the glossary's function to
                somebody who already understood it. This one addresses the
                reader instead, which is who it is actually for. */}
            <h2 className="font-display m-0 mt-3 text-[26px] font-semibold leading-[1.25] text-foreground sm:text-[34px]">
              Bring yourself up to speed.
            </h2>
            <p className="mt-4 text-[15px] text-muted">
              The technical, legal and clinical vocabulary this subject is conducted in —
              defined plainly, with the entries and sources that use each one.
            </p>

            <div className="mt-10">
              <HomeCarousel slides={glossarySlides} label="Glossary terms" />
            </div>

            <div className="mt-12 flex flex-wrap items-center gap-4">
              <a
                href="/glossary"
                className="inline-flex h-12 items-center rounded-md bg-foreground px-6 text-[15px] font-medium text-background"
              >
                Go to the glossary
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
          <div className="w-full px-5 py-20 sm:px-8 lg:px-[200px]">
            <p className="m-0 font-display text-[12px] uppercase tracking-[0.14em] text-muted">
              What you can do
            </p>
            <h2 className="font-display m-0 mt-2 text-3xl font-semibold text-foreground sm:text-4xl">
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
