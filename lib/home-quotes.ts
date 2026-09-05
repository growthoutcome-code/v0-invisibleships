/**
 * The four journal moments the home page rotates through.
 *
 * Sean, 4 September: "include some of the raunchiest or most interesting
 * journal entries. An example, the journal entry where someone notices that
 * I'm typing what they're saying."
 *
 * WHY THESE FOUR, AND WHY THEY ARE ALL THE SAME KIND OF MOMENT. A survey of
 * all 438 journal documents found 332 instances across ~60 documents of a
 * speaker noticing they were being written down or recorded. It is the single
 * dominant motif in the corpus. It is also the only motif that needs no
 * context whatsoever: a stranger who knows nothing about this archive
 * understands "stop typing what we say" immediately, and understands what it
 * implies about the speaker without being told.
 *
 * The previous carousel showed the five most recent entries, which is an
 * arbitrary selection that happened to be whatever was written last.
 *
 * NOT CHOSEN FOR SHOCK. Every candidate whose quotable portion centred on
 * suicide, self-harm, euthanasia or graphic violence was excluded — this page
 * is ungated and carries no warning before the fold. So was anything naming a
 * private individual or making an accusation against a named company. Fifteen
 * otherwise strong candidates went out on those two rules.
 *
 * HOW THE TEXT IS PINNED. A slice is never stored here, only an `anchor`: a
 * short phrase that must appear in the document's body. The excerpt is cut
 * from the live corpus at build time and the build FAILS if an anchor stops
 * matching. So an excerpt cannot silently drift from the entry it claims to
 * quote, and editing the journal can never leave a stale quotation on the
 * home page.
 */

export type HomeQuotePick = {
  /** Document id in the corpus. */
  id: string;
  /** Must appear verbatim in body_markdown, or the build fails. */
  anchor: string;
  /** How much to take, from the start of the anchor's line. Trimmed back to
   *  the last closing quotation mark so a slide never ends mid-sentence. */
  chars: number;
};

export const HOME_QUOTES: HomeQuotePick[] = [
  {
    // The earliest instance of the beat: the pivot from taunting to pleading
    // inside one sentence.
    id: "IS-J01-20250304-ENTRY",
    anchor: "is he actually writing something",
    chars: 110,
  },
  {
    // The strongest line in the corpus. A demand to stop, a description of the
    // activity, and an expression of guilt, in one breath. It names the author
    // and no one else.
    id: "IS-J01-20250529-ENTRY",
    anchor: "Stop typing what we say",
    chars: 200,
  },
  {
    // The politeness against the content is funny, and the last clause is a
    // speaker losing confidence in their own cover story.
    id: "IS-J01-20250611-2-ENTRY",
    anchor: "Please stop writing what we",
    chars: 150,
  },
  {
    // Method, stated by the speakers: they ran projections, and they bet on
    // stigma keeping people quiet.
    id: "IS-J01-20250711-R01",
    anchor: "believe this person is just recording us",
    chars: 300,
  },
];
