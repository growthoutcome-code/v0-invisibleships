// The site's single canonical disclaimer. Every other page points here rather
// than restating its own caution language (Sean, 2026-08-20: "one singular
// disclaimer", not 50% of the site).
//
// Two variants, because this component serves two jobs:
//   "gate" — the consent screen. Only what a visitor is agreeing to before
//            entering: copyright, the Critical Disclaimer, and sharing terms.
//            Deliberately short; a consent screen nobody finishes reading is
//            worse than a brief one.
//   "full" — the /disclaimer page. Everything, including how the research data
//            was gathered, which is what the rest of the site links to.
export default function CopyrightTerms({ variant = "full" }: { variant?: "gate" | "full" | "modal" }) {
  const full = variant !== "gate";
  const showToc = variant === "full";
  return (
    <div className="space-y-5 body-copy text-foreground/90">
      {showToc && (
        <nav aria-label="On this page" className="text-[16px] text-muted">
          <ul className="list-none p-0 m-0 flex flex-wrap gap-x-5 gap-y-1">
            <li><a href="#critical" className="underline underline-offset-4 hover:text-foreground">Critical Disclaimer</a></li>
            <li><a href="#separation" className="underline underline-offset-4 hover:text-foreground">Journal vs Research</a></li>
            <li><a href="#research" className="underline underline-offset-4 hover:text-foreground">How the research data was gathered</a></li>
            <li><a href="#copyright" className="underline underline-offset-4 hover:text-foreground">Copyright &amp; sharing</a></li>
            <li><a href="#measurement" className="underline underline-offset-4 hover:text-foreground">What this site measures</a></li>
            <li><a href="#contact" className="underline underline-offset-4 hover:text-foreground">Contact &amp; corrections</a></li>
          </ul>
        </nav>
      )}

      {/* The most important thing on the page reads first.

          Rescoped 2026-08-28. This is a JOURNAL document: it was written for the
          transcripts and carries their standard. Presenting it as a site-wide
          disclaimer made it disown the Research sections, which cite court
          rulings and regulator decisions and need no such disclaimer — a blanket
          "this accuses nobody" sitting beside an adjudicated verdict reads as
          either confusion or timidity. Sean: "the disclaimer is focused on the
          journal entries ... the findings in the concepts, the research, that's
          completely different."

          The "why accusations appear" section exists because the previous copy
          resolved a question the record cannot resolve. Saying the accusations
          ARE the attack is as much an assertion as adopting them would be. The
          archive can establish that a statement was made; it cannot establish
          who made it, why, or whether it was true — and a reader is owed that
          distinction rather than either conclusion. */}
      <div id="critical" className="scroll-mt-28">
        <div className="font-display text-foreground font-semibold text-lg">Critical Disclaimer on the Journal and its Transcripts</div>
        <p className="mt-1 italic text-muted">
          This applies to the Journal &mdash; the dated entries and verbatim transcripts. It does
          not apply to the Research or Concepts sections, which are drawn from public records and
          carry their own basis and origin labels.
        </p>
        <p className="mt-2">
          The Journal records communications the author received without consent. The transcripts
          are preserved as documentation of what was said to him. Their content is{" "}
          <em>external communication</em> and does NOT represent the author&rsquo;s beliefs, views,
          or intent. The author denies any affiliation with, or belief in, the content of those
          messages &mdash; particularly any promoting illegal activity, narcotic use, or violence.
        </p>

        <p className="mt-3 font-semibold text-foreground">Why accusations appear in this record</p>
        <p className="mt-1">
          The transcripts carry voices the author could not identify, verify, or question. Where a
          speaker names a person or an organisation, this archive records that the name was said.
          It makes no finding that the named party did anything, and a reader should draw none.
        </p>
        <p className="mt-2">
          That is not a dismissal of the speaker. This archive has no way to establish who any
          speaker was, why they spoke, or whether what they said was true, and it does not pretend
          otherwise. Some of what was said may have been coercion. Some may have been reputational
          attack used as an instrument, in the documented pattern set out under{" "}
          <em>Ruin first, then rescue</em>. And some may have been a person taking a real risk to
          say something they believed to be true. The record does not settle which. This archive
          will not resolve by assertion what it cannot resolve by evidence.
        </p>

        <p className="mt-3 font-semibold text-foreground">What would change that</p>
        <p className="mt-1">
          A statement in these transcripts is <strong>testimony</strong>: a dated first-person
          report, verified by nobody, and labelled as such wherever it appears. If any part of it is
          independently corroborated &mdash; by a document, a ruling, a public record &mdash; it
          stops being testimony and is republished in the Research section under its own citation,
          where anyone can check it. That route is open, and it is the only route. Nothing moves
          from the Journal into the record by repetition, by plausibility, or because it would
          matter if it were true.
        </p>

        <p className="mt-3 font-semibold text-foreground">On named organisations</p>
        <p className="mt-1">
          Law-enforcement agencies, government bodies and technology companies employ large numbers
          of people. A statement naming an organisation is not a statement about any individual
          within it, and this archive does not treat it as one. No agency, company or official named
          anywhere in the Journal has been shown by this archive to have done anything wrong, and
          the author asserts no such thing.
        </p>
      </div>

      {/* The separation, stated rather than left to be inferred. */}
      <div id="separation" className="scroll-mt-28">
        <div className="font-display text-foreground font-semibold text-lg">The Research and Concepts sections are a different standard</div>
        <p className="mt-1">
          They were assembled with AI assistance from public records &mdash; court rulings,
          regulator decisions, statistical agencies, published investigations &mdash; and every
          figure resolves to the document it came from. Where those sources record a finding against
          a named organisation, this site reports that finding and cites it. That is a citation of an
          adjudicated public record, not an accusation by the author. The two bodies of work are
          never blended, and neither corroborates the other.
        </p>
      </div>

      {full && (
        <div id="research" className="scroll-mt-28">
          <div className="font-display text-foreground font-semibold text-lg">How the research data was gathered</div>
          <p className="mt-1">
            The Data section of this site — the government-cloud record and the public-health
            statistics — was assembled with AI assistance. That means an AI system searched public
            sources, extracted figures, and organised them; a human directed the work and reviewed the
            results. It does not mean the figures are guesses. Every number is linked to the document
            it came from, and the headline figures were re-derived a second time from those documents
            before publication.
          </p>
          <p className="mt-3 font-semibold text-foreground">What the evidence grades mean</p>
          <p className="mt-1">
            Tier A is an official statistical agency or a peer-reviewed study that was retrieved and
            read. Tier B is reputable secondary reporting, or official data still marked provisional.
            Tier C is claimed but not verified — market-research forecasts, for example. A grade
            describes how well sourced a figure is, not how true its interpretation might be.
          </p>
          {/* Sean, 2026-08-22: bolster the disclaimer and point people to it,
              rather than repeating caveat text under every chart. Everything
              here was previously stated section by section. */}
          <p className="mt-3 font-semibold text-foreground">How to read the charts</p>
          <p className="mt-1">
            The charts use a fixed visual grammar, and it is the same everywhere on the site.
            A <strong>dotted stretch</strong> means those years are not Tier A. <strong>Hollow
            points</strong> mean the series is sampled with gaps, so the straight run between
            two distant years is not data. <strong>Points with no line</strong> are irregular
            snapshots, which would become a fiction if joined up. A <strong>gap</strong> is a
            year the publisher does not publish, left as a gap rather than bridged. A{" "}
            <strong>break with a marked year</strong> is different again: both sides are
            published, but the measurement changed between them, so the line is split rather
            than drawn through — and where that happens the summary states each half
            separately instead of quoting one percentage across two different measurements.
          </p>
          <p className="mt-1">
            Where lanes are <strong>indexed</strong>, each is set to its own first year = 100.
            That chart shows direction and relative change only, never size: two lanes at the
            same height are not two equal quantities. Where a chart offers a{" "}
            <strong>year-over-year change</strong> view, the change is computed only between
            consecutive published years, and never across a break or a gap.
          </p>
          <p className="mt-3 font-semibold text-foreground">A count of reports is not a count of events</p>
          <p className="mt-1">
            Several series on this site count what reached an institution rather than what
            happened: records entered, reports received, arrests made, screens completed. Those
            move when reporting rules change, when stigma falls, when an agency builds a new
            intake channel, or when a survey adds agencies to its universe — and the publishers
            frequently say so themselves. Where a rise is attributed by its own publisher to
            reporting rather than to events, that attribution is carried with the figure. A
            series that stops has not shown that the thing stopped; it has shown that the
            publishing stopped, and those are recorded separately.
          </p>
          <p className="mt-3 font-semibold text-foreground">What this data does not do</p>
          <p className="mt-1">
            It does not establish that any organisation did anything wrong. It does not connect any
            system, deployment, or statistic to the author&rsquo;s experience or to any
            individual&rsquo;s. Where two things appear near each other in time or place, that is a
            co-occurrence and nothing more; the site says so wherever such pairings are shown. Causes
            are reported only as <em>attributed</em> — who claimed what, in which document — never
            asserted by this site.
          </p>
          <p className="mt-3 font-semibold text-foreground">What is missing is also a finding</p>
          <p className="mt-1">
            Public records are uneven. Some countries publish little; some deaths are recorded under
            the wrong cause; some registers do not exist. Where the record is thin, that is documented
            rather than quietly skipped, and it should be read as a limit on the data, not as evidence
            of absence. Coverage is compiled from a United States vantage point, and a low count for a
            jurisdiction may reflect limited public reporting rather than limited activity.
          </p>
          <p className="mt-3 font-semibold text-foreground">Scope and use</p>
          <p className="mt-1">
            This is independent research from public sources, offered for information only. It is not
            legal or investment advice. Company and agency names are used for identification; no
            affiliation or endorsement is implied. Award and investment values mix contract ceilings,
            announced pledges and projected savings, and enforcement figures are agency-reported
            (arrests are not convictions). Tier B and Tier C entries are not established fact.
          </p>
          <p className="mt-3 font-semibold text-foreground">Health statistics</p>
          <p className="mt-1">
            The public-health data reports rates and counts only, following recognised safe-reporting
            practice. Provisional figures are marked as such and are revised later by the agencies
            that publish them. If this material is difficult for you: in the US, call or text{" "}
            <a href="https://988lifeline.org" target="_blank" rel="noreferrer noopener" className="underline underline-offset-4">988</a>;
            elsewhere,{" "}
            <a href="https://findahelpline.com" target="_blank" rel="noreferrer noopener" className="underline underline-offset-4">findahelpline.com</a>.
          </p>
        </div>
      )}

      <div>
        <div className="font-display text-foreground font-semibold">A Note from the Author</div>
        <p className="mt-1">
          This report is a product of my personal research and lived experience. My goal in sharing it
          is to offer a unique perspective and contribute to the conversation.
        </p>
      </div>

      {/* Rewritten 2026-08-28 around ATTRIBUTION rather than prohibition.
          The previous terms forbade copying any text, republishing any part, and
          all derivative versions — while the site ships a 924-file corpus whose
          own START-HERE explains how to hand it to an assistant, and whose every
          concept file says it is safe to hand over on its own. A reader following
          those instructions was violating the terms. Worse, the terms blocked the
          distribution the archive exists for: a journalist could not quote a
          finding, a legislator could not cite a figure. You cannot ask people to
          check your work and forbid them from quoting it.

          Sean's actual concern is narrower and is now the explicit violation:
          nobody claiming these findings as their own. */}
      <div id="copyright" className="scroll-mt-28">
        <div className="font-display text-foreground font-semibold text-lg">Copyright, and how you may use this work</div>
        <p className="mt-1">
          Copyright &copy; 2026 Sean C. Harris. All rights reserved. Within that, the following are
          expressly permitted:
        </p>
        <ul className="mt-2 list-disc pl-5 space-y-1">
          <li>
            <strong>Share it.</strong> The report and the downloadable corpus may be redistributed in
            their complete, original form.
          </li>
          <li>
            <strong>Quote it.</strong> Passages may be quoted for reporting, research, comment,
            teaching or criticism, with attribution to Sean C. Harris and invisibleships.com.
          </li>
          <li>
            <strong>Check it with an assistant.</strong> The corpus is built to be handed to an AI
            system, whole or file by file, to verify or interrogate the findings. That use is
            intended and permitted.
          </li>
        </ul>
        <p className="mt-3">Not permitted:</p>
        <ul className="mt-2 list-disc pl-5 space-y-1">
          <li>
            <strong>Presenting this work, or any finding in it, as your own.</strong> Attribution is
            the condition on everything above.
          </li>
          <li>
            <strong>Republishing it in altered form</strong>, or issuing a modified version that
            could be mistaken for the original.
          </li>
          <li><strong>Commercial use</strong> without written permission.</li>
        </ul>
      </div>

      {/* Added 2026-08-28. Nothing on this site had ever said it measured
          anything — not cookies, not analytics, and not session replay, which
          records how a page was used. On an archive about surveillance, read by
          people who believe they are being watched, that silence was the wrong
          default whatever the law requires. Said plainly, with a working opt-out,
          rather than behind a consent banner nobody reads. */}
      <div id="measurement" className="scroll-mt-28">
        <div className="font-display text-foreground font-semibold text-lg">What this site measures</div>
        <p className="mt-1">
          This site records usage analytics &mdash; pages opened, sections viewed, and which sources
          readers follow &mdash; using cookies, and it may record a session replay: a playback of how
          a page was used, with all typed input masked. This is processed on the author&rsquo;s behalf
          by PostHog and Google Analytics. It is never sold, and no attempt is made to identify
          individual readers.
        </p>
        <p className="mt-2">
          Given what this archive is about, that is stated plainly rather than buried. If you would
          rather not be measured at all, open any page with{" "}
          <a href="/?analytics=off" className="underline underline-offset-4">?analytics=off</a>{" "}
          &mdash; this browser then stops being recorded on this device, and stays that way.
        </p>
      </div>

      <div id="contact" className="scroll-mt-28">
        <div className="font-display text-foreground font-semibold">
          {full ? "Contact, and corrections" : "How to Contact the Author"}
        </div>
        <p className="mt-1">
          {full
            ? "If a figure here is wrong, or a source has been superseded, please write and it will be corrected. All inquiries and permission requests are welcome:"
            : "All inquiries and permission requests are welcome and should be directed to:"}
          <br />Sean C. Harris
          <br />+1 (303) 901-2150, growthoutcome@gmail.com
        </p>
      </div>
    </div>
  );
}
