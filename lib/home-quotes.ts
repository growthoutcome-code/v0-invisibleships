/**
 * The journal moments the home page rotates through.
 *
 * FIVE, NOT THIRTEEN (Sean, 8 September). Thirteen slides was a reading list.
 * Five is a sequence a person actually finishes, and the balance is his:
 * THREE on the harassment and the experience of the surveillance system, TWO on
 * who is present and the future.
 *
 *   1  where the record starts
 *   2  they realise they are being written down — and feel it
 *   3  the one with no innocent explanation
 *   4  the author, thanking and defending law enforcement
 *   5  the future the same voice describes, and the word consent
 *
 * EVERY SLIDE IS A COMPLETE STATEMENT. Sean, 8 September: "let's make sure
 * these are all complete sentences, and there is context if possible." So the
 * budgets below are set to a sentence boundary, not to a line count, and each
 * was verified by running the cutter rather than by eye. They render at
 * 184-343 characters — three to five lines. The old list ran from 102 to 337,
 * and its three shortest slides rendered as a single line, which is most of
 * what made the section feel thin.
 *
 * WHY 4 OPENS ON THE THANK-YOU. Sean asked for the author's own praise for law
 * enforcement, not only the defence. "Thank you for your service for anyone
 * that's shown up" sits two lines above "I refuse to believe" in the same
 * recording, so the anchor starts there and the slide reads gratitude first.
 * The filler line between them is kept because an excerpt is a contiguous
 * slice — skipping it would mean storing text here, which is the one thing the
 * anchor mechanism exists to prevent.
 *
 * WHAT WAS EXCLUDED, and it was a lot. Every candidate whose quotable portion
 * centred on suicide, self-harm or euthanasia. Anything naming a private
 * individual. Anything accusing a named company or agency of wrongdoing — the
 * archive cites adjudicated findings, it does not make claims. Roughly twenty
 * otherwise strong passages went out on those three rules.
 *
 * NO LOCATION ON THESE SLIDES, and it is not an oversight. JournalQuotes
 * renders `date · location · audio` whenever a location exists. Only 118 of the
 * 712 corpus documents carry one, and every value is a specific Denver shelter
 * — "48th Street shelter" (87), "Holly Street shelter" (18), "Denver Rescue
 * Mission" (13). None is a city. Printing those would put operational
 * specificity about a private individual on a public page, against
 * "anonymise the person, never degrade the record". None of the five carries
 * one; the section says Denver in its opening line instead.
 *
 * HOW THE TEXT IS PINNED. A slice is never stored here, only an `anchor`: a
 * phrase that must appear in that document's body. The excerpt is cut from the
 * live corpus at build time and the build FAILS if an anchor stops matching.
 * An excerpt therefore cannot drift from the entry it claims to quote, and
 * editing the journal can never leave a stale quotation on the home page.
 */

export type HomeQuotePick = {
  /** Document id in the corpus. */
  id: string;
  /** Must appear verbatim in that document's body_markdown, or the build fails. */
  anchor: string;
  /** Characters to take from the opening quotation mark. Trimmed back to the
   *  last closing mark so a slide never ends mid-sentence. */
  chars: number;
  /** Do not end the excerpt before this many characters. Without it the
   *  boundary rule stops at the first closing quote, which on a slide whose
   *  opening line is a short quotation leaves one line where two were wanted. */
  min?: number;
  /**
   * FURTHER PASSAGES FROM THE SAME DOCUMENT, joined under the first with a blank
   * line. Each is pinned by its own anchor exactly like the main one, and the
   * build fails if any of them stops matching.
   *
   * This exists because an excerpt is a single contiguous slice, and sometimes
   * the sentences that matter are not adjacent. Sean, 9 September, on the first
   * entry: "get to the meat of that statement… pull three sentences." The meat
   * of that entry sits behind a paragraph of procedural throat-clearing and a
   * line carrying his own name; quoting around them is the only way to reach it
   * without either padding the slide or rewriting the record.
   *
   * The guarantee is unchanged: no text is stored here, only anchors, and every
   * passage is cut from the live corpus at build time.
   */
  also?: { anchor: string; chars: number; min?: number }[];
  /**
   * THE OPEN QUESTION under this slide. Sean, 8 September: "let's include a
   * question under each carousel item. One question at least."
   *
   * PULLED WHERE POSSIBLE, WRITTEN WHERE NOT. He offered either. Only one of
   * the five entries mentions a questions-and-comments section at all, and what
   * follows it there is more quoted speech, not a question — so all five are
   * written. That makes them EDITORIAL, and they are labelled and styled as the
   * archive asking, never as something the record says. A question we wrote must
   * never be mistaken for testimony.
   *
   * Each one has to be genuinely open. The point of these, per the audit in
   * claude/questions-and-comments-audit.md, is that a question is what stands
   * between an entry and the accusation inside it — so a question that only
   * restates the accusation is worse than none.
   */
  question: string;
};

export const HOME_QUOTES: HomeQuotePick[] = [
  // ------------------------------------------------- 1 · where it starts
  {
    // The first entry in the archive. Renders 264 characters.
    //
    // CORRECTED 8 September: this used to claim the entry "carries a Questions &
    // Comments block written specifically to sit under an accusation." It does
    // not. The whole entry is 1,166 characters and has no such block — checked
    // against the corpus. The claim came forward from an earlier session and was
    // never verified. Of the five slides, only 29 May mentions a questions-and-
    // comments section at all, and what follows it there is more quoted speech.
    // THE MEAT, IN THREE SENTENCES (Sean, 9 September: "get to the meat of that
    // statement… pull three sentences and place them under the line that says
    // received telepathically").
    //
    // The 620-character version reached them by dragging along everything in
    // between — a paragraph of procedural throat-clearing about separating
    // himself from the statement, and the line carrying his own name. Both were
    // true and neither was the point. `also` skips them: the first passage ends
    // on the Saudi Royal Family sentence, the second picks up at the CIA and
    // carries the demand that follows it.
    //
    // What a reader now gets, in order: the statement, who was heard saying it,
    // who claimed responsibility, who else claimed the method, and what they
    // said they wanted. That last line is the one that reframes the entry —
    // the claim is not about a bombing, it is about control of a channel.
    id: "IS-J01-20250227-ENTRY",
    anchor: "This is a terrorist attack on America",
    chars: 300,
    min: 240,
    also: [
      { anchor: "Additional information was suggested telepathically", chars: 300 },
    ],
    // Sean's own, 8 September, near enough verbatim.
    question:
      "Was this really the Saudi Royal Family, or someone from the Zersetzung disintegration-tactics community claiming to be from the Saudi Royal Family?",
  },

  // --------------------------------------- 2 · they notice, and they feel it
  {
    // The dominant seam in the corpus — a speaker realising they are being
    // written down — appears 332 times across ~60 documents. This is the only
    // candidate carrying the realisation, the guilt AND an admission of purpose
    // in one breath, which is why one slide now does what three used to.
    // Renders 184 characters.
    // THREE VOICES, NOT ONE (Sean, 9 September: "the second slide needs another
    // sentence or two"). It was a single 171-character quotation, the shortest
    // slide of the five by a wide margin.
    //
    // The two lines above it in the entry are stronger than anything after it,
    // so the slide now opens on them and keeps the original as its close. What
    // sits between — an exchange about whether he should stop for the day — is
    // skipped with `also`, which is what that field is for.
    //
    // It escalates: gladness that he started typing, then distress at watching
    // it happen and a plea that a newspaper intervene, then the demand to stop
    // and the guilt underneath it. Three different speakers, marked as such in
    // the record, which is why the attribution lines are left in.
    id: "IS-J01-20250529-ENTRY",
    anchor: "so glad you started typing",
    chars: 260,
    also: [{ anchor: "Stop typing what we say", chars: 200 }],
    question:
      "Is this remorse from someone taking part, or something performed for the person typing it?",
  },

  // ------------------------------------------ 3 · no innocent explanation
  {
    // Sean, 5 September: "someone opening the journal and I type what they say,
    // and they don't have an explanation for this." Every other slide can be
    // read as something a person heard. This one only parses if somebody is
    // reading the screen. Renders 325 characters.
    id: "IS-J03-20251106-ENTRY",
    anchor: "Can you zoom in a little",
    chars: 330,
    question:
      "What would explain a request to zoom in, if nobody could see the screen?",
  },

  // ----------------------------------------------- 4 · who is present
  {
    // Sean, 8 September: replace the Zersetzung slide with "one of the author's
    // solutions and praise for the law enforcement industry." Recorded at the
    // intersection of 8th and Colorado, seven months in, immediately before he
    // ended the recording. Renders 343 characters.
    id: "IS-J02-20250928-R05",
    anchor: "Thank you for your service",
    chars: 400,
    min: 300,
    question:
      "If not law enforcement, then who — and who would answer for it?",
  },

  // ----------------------------------------------------- 5 · the future
  {
    // Extended on 8 September from 188 characters to carry its second sentence.
    // That sentence names consent outright, in the record's own voice, and hands
    // off to the consent section further down the page — so a reader who stops
    // after the journal still leaves with the consent frame.
    // Renders 246 characters. Do not raise `chars` past 270 without checking:
    // the next line, "There's an incentive.", reads as an orphan.
    id: "IS-J02-20250823-R01",
    anchor: "imagine this with me for a moment",
    chars: 265,
    min: 200,
    question:
      "What would have to be true before anyone could opt into this — and who would they be trusting with it?",
  },
];
