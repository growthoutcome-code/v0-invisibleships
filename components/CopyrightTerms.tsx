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
            <li><a href="#research" className="underline underline-offset-4 hover:text-foreground">How the research data was gathered</a></li>
            <li><a href="#copyright" className="underline underline-offset-4 hover:text-foreground">Copyright &amp; sharing</a></li>
            <li><a href="#contact" className="underline underline-offset-4 hover:text-foreground">Contact &amp; corrections</a></li>
          </ul>
        </nav>
      )}

      {/* The most important thing on the page reads first. */}
      <div id="critical" className="scroll-mt-28">
        <div className="font-display text-foreground font-semibold text-lg">Critical Disclaimer on Transcripts and Accusations</div>
        <p className="mt-1">
          The author explicitly states that the content of the transcripts and &lsquo;suggestions&rsquo;
          recorded in this document are <em>external communications</em> and DO NOT represent the
          author&rsquo;s personal beliefs, views, or intent. The author denies any affiliation with or
          belief in the content of these messages, especially those promoting illegal activity, narcotic
          use, or violence.
        </p>
        <p className="mt-2">
          This report does NOT accuse, blame, or allege malfeasance by any specific corporation,
          technology company (e.g., Neuralink, Google, Microsoft), or government/law enforcement entity
          (e.g., Denver Police, FBI). All such organizations are mentioned only in the context of the
          external suggestions or as part of the author&rsquo;s high-level technical speculation and
          research into potential methodologies.
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

      <div id="copyright" className="scroll-mt-28">
        <div className="font-display text-foreground font-semibold text-lg">Copyright</div>
        <p className="mt-1">An Unpublished Report by Sean C. Harris</p>
        <p>Copyright © 2026 by Sean C. Harris | All Rights Reserved</p>
      </div>

      <div>
        <div className="font-display text-foreground font-semibold">A Note from the Author</div>
        <p className="mt-1">
          This report is a product of my personal research and lived experience. My goal in sharing it
          is to offer a unique perspective and contribute to the conversation.
        </p>
      </div>

      <div>
        <div className="font-display text-foreground font-semibold">How You Can Share This Work</div>
        <p className="mt-1">
          I encourage you to share this report with others who may find it valuable. You may distribute
          this document in its complete, original digital format.
        </p>
      </div>

      <div>
        <div className="font-display text-foreground font-semibold">Protecting This Work</div>
        <p className="mt-1">
          The insights and narrative within are my proprietary work. While you are free to share the
          report itself, you are not permitted to reproduce its contents. This means you may not:
        </p>
        <ul className="mt-2 list-disc pl-5 space-y-1">
          <li>Copy and paste sections of text for use in other materials.</li>
          <li>Republish any part of this report on websites, blogs, or social media.</li>
          <li>Create modified or derivative versions of this work.</li>
          <li>Use the contents for commercial purposes without explicit permission.</li>
        </ul>
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
