// Verbatim "Copyright & Terms of Use" from the Invisible Ships series front matter.
export default function CopyrightTerms() {
  return (
    <div className="space-y-5 font-serif text-[24px] leading-[1.6] text-foreground/90">
      <div>
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

      <div className="bg-panel p-4">
        <div className="font-display text-foreground font-semibold">Critical Disclaimer on Transcripts and Accusations</div>
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

      <div>
        <div className="font-display text-foreground font-semibold">How to Contact the Author</div>
        <p className="mt-1">
          All inquiries and permission requests are welcome and should be directed to:
          <br />Sean C. Harris
          <br />+1 (303) 901-2150, growthoutcome@gmail.com
        </p>
      </div>
    </div>
  );
}
